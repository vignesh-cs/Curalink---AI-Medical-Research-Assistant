// server/src/controllers/chatController.js
// FULLY FIXED - WITH MONGODB RECONNECTION HANDLING

const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const ResearchCache = require('../models/ResearchCache');
const queryExpander = require('../services/retrieval/queryExpander');
const pubmedService = require('../services/retrieval/pubmedService');
const openAlexService = require('../services/retrieval/openAlexService');
const clinicalTrialsService = require('../services/retrieval/clinicalTrialsService');
const rankingEngine = require('../services/retrieval/rankingEngine');
const ollamaService = require('../services/llm/ollamaService');
const logger = require('../config/logger');
const crypto = require('crypto');

class ChatController {

    // Helper: Ensure MongoDB is connected before any operation
    async ensureDbConnection() {
        if (mongoose.connection.readyState !== 1) {
            logger.warn('MongoDB disconnected, attempting reconnection...');
            try {
                const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curalink';
                await mongoose.connect(mongoURI, {
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    heartbeatFrequencyMS: 10000,
                    retryWrites: true,
                    retryReads: true
                });
                logger.info('MongoDB reconnected successfully');
            } catch (error) {
                logger.error('MongoDB reconnection failed:', error.message);
                throw new Error('Database connection unavailable. Please try again.');
            }
        }
    }
    
    async processMessage(req, res, next) {
        const startTime = Date.now();
        
        try {
            // Ensure MongoDB is connected before processing
            await this.ensureDbConnection();
            
            const { message, sessionId, userContext = {}, isFollowUp = false } = req.body;
            
            logger.info('Processing:', { sessionId, message: message.substring(0, 50) });
            
            let conversation = await this.getOrCreateConversation(sessionId, userContext);
            
            // FIXED: Update user context with preferences default
            if (Object.keys(userContext).length > 0) {
                const updatedContext = {
                    patientName: userContext.patientName || conversation.userContext?.patientName || '',
                    diseaseOfInterest: userContext.diseaseOfInterest || conversation.userContext?.diseaseOfInterest || '',
                    location: userContext.location || conversation.userContext?.location || '',
                    preferences: {
                        detailLevel: userContext.preferences?.detailLevel || conversation.userContext?.preferences?.detailLevel || 'detailed',
                        language: userContext.preferences?.language || conversation.userContext?.preferences?.language || 'en'
                    },
                    history: conversation.userContext?.history || []
                };
                conversation.userContext = updatedContext;
                await conversation.save();
            }
            
            const expandedContext = queryExpander.buildExpandedQuery(
                message,
                conversation.userContext.diseaseOfInterest,
                conversation.userContext.location
            );
            
            const queryHash = this.generateQueryHash(expandedContext.expandedQuery);
            let researchData = await this.getCachedResearch(queryHash);
            
            if (!researchData) {
                logger.info('Fetching fresh research data');
                researchData = await this.retrieveResearchData(expandedContext);
                try {
                    await this.cacheResearchData(queryHash, expandedContext, researchData);
                } catch (cacheError) {
                    logger.warn('Cache save failed (non-critical):', cacheError.message);
                }
            } else {
                logger.info('Using cached research data');
            }
            
            // VERIFY DATA INTEGRITY
            logger.info('Data check before ranking:', {
                totalPubs: researchData.publications?.length || 0,
                firstTitle: researchData.publications?.[0]?.title || 'NO TITLE',
                firstAbstract: (researchData.publications?.[0]?.abstract || 'NO ABSTRACT').substring(0, 80)
            });
            
            // Rank publications
            const rankedPublications = rankingEngine.rankPublications(
                researchData.publications || [],
                message,
                { userLocation: conversation.userContext.location }
            );
            
            // Rank trials
            const rankedTrials = rankingEngine.rankClinicalTrials(
                researchData.clinicalTrials || [],
                message,
                { userLocation: conversation.userContext.location }
            );
            
            // DIRECT SLICE - DO NOT USE selectTopResults
            const topPublications = (rankedPublications || []).slice(0, 6);
            const topTrials = (rankedTrials || []).slice(0, 6);
            
            // VERIFY TOP PUBLICATIONS
            logger.info('Top publications after slicing:', {
                count: topPublications.length,
                firstTitle: topPublications[0]?.title || 'MISSING',
                firstAbstract: (topPublications[0]?.abstract || 'MISSING').substring(0, 80)
            });
            
            const conversationContext = conversation.getLLMContext(10);
            
            // SEND VERIFIED DATA TO LLM
            const llmResponse = await ollamaService.generateMedicalResponse(
                message,
                { 
                    publications: topPublications, 
                    clinicalTrials: topTrials 
                },
                conversationContext
            );
            
            const userMessage = {
                role: 'user',
                content: message,
                metadata: {
                    query: message,
                    expandedQuery: expandedContext.expandedQuery,
                    diseaseContext: conversation.userContext.diseaseOfInterest,
                    intent: expandedContext.intent,
                    location: conversation.userContext.location,
                    processingTime: Date.now() - startTime
                }
            };
            
            const assistantMessage = {
                role: 'assistant',
                content: llmResponse.rawResponse,
                structuredContent: {
                    conditionOverview: llmResponse.structuredResponse.conditionOverview,
                    researchInsights: llmResponse.structuredResponse.researchInsights,
                    clinicalTrials: topTrials,
                    publications: topPublications,
                    sources: llmResponse.sources
                },
                metadata: {
                    processingTime: Date.now() - startTime,
                    retrievalCount: {
                        publications: researchData.publications?.length || 0,
                        clinicalTrials: researchData.clinicalTrials?.length || 0
                    }
                }
            };
            
            // Save messages with error handling
            try {
                await conversation.addMessage(userMessage);
                await conversation.addMessage(assistantMessage);
            } catch (saveError) {
                logger.warn('Failed to save conversation (non-critical):', saveError.message);
                // Continue even if save fails - response still goes to user
            }
            
            const io = req.app.get('io');
            if (io && conversation.sessionId) {
                try {
                    io.to(conversation.sessionId).emit('message-processed', {
                        sessionId: conversation.sessionId,
                        message: assistantMessage
                    });
                } catch (socketError) {
                    logger.warn('Socket emit failed:', socketError.message);
                }
            }
            
            res.status(200).json({
                success: true,
                sessionId: conversation.sessionId,
                message: assistantMessage,
                metadata: {
                    processingTime: Date.now() - startTime,
                    sourcesCount: llmResponse.sources?.length || 0,
                    researchDataStats: {
                        publicationsRetrieved: researchData.publications?.length || 0,
                        trialsRetrieved: researchData.clinicalTrials?.length || 0,
                        publicationsDisplayed: topPublications.length,
                        trialsDisplayed: topTrials.length
                    }
                }
            });
            
        } catch (error) {
            logger.error('Error processing chat message:', error);
            next(error);
        }
    }

    async processFollowUp(req, res, next) {
        const startTime = Date.now();
        try {
            await this.ensureDbConnection();
            
            const { message, sessionId } = req.body;
            const conversation = await Conversation.findOne({ sessionId });
            if (!conversation) {
                return res.status(404).json({ success: false, error: 'Conversation not found' });
            }
            
            const conversationContext = conversation.getLLMContext(10);
            let researchData = null;
            
            if (this.needsFreshData(message, conversation)) {
                const expandedContext = queryExpander.buildExpandedQuery(
                    message, conversation.userContext.diseaseOfInterest, conversation.userContext.location
                );
                researchData = await this.retrieveResearchData(expandedContext);
                if (researchData.publications) {
                    researchData.publications = rankingEngine.rankPublications(researchData.publications, message);
                }
                if (researchData.clinicalTrials) {
                    researchData.clinicalTrials = rankingEngine.rankClinicalTrials(researchData.clinicalTrials, message);
                }
            }
            
            const llmResponse = await ollamaService.generateFollowUpResponse(
                message,
                {
                    userContext: conversation.userContext,
                    researchData: researchData || this.extractPreviousResearchData(conversation),
                    recentMessages: conversationContext.recentMessages
                },
                researchData
            );
            
            const userMessage = { role: 'user', content: message, metadata: { isFollowUp: true, processingTime: Date.now() - startTime } };
            const assistantMessage = {
                role: 'assistant',
                content: llmResponse.rawResponse,
                structuredContent: {
                    conditionOverview: llmResponse.structuredResponse.conditionOverview,
                    researchInsights: llmResponse.structuredResponse.researchInsights,
                    clinicalTrials: researchData?.clinicalTrials || [],
                    publications: researchData?.publications || []
                },
                metadata: { isFollowUp: true, processingTime: Date.now() - startTime }
            };
            
            try {
                await conversation.addMessage(userMessage);
                await conversation.addMessage(assistantMessage);
            } catch (saveError) {
                logger.warn('Failed to save follow-up:', saveError.message);
            }
            
            res.status(200).json({ success: true, sessionId: conversation.sessionId, message: assistantMessage, metadata: { processingTime: Date.now() - startTime } });
        } catch (error) {
            logger.error('Follow-up error:', error);
            next(error);
        }
    }

    async getConversation(req, res, next) {
        try {
            await this.ensureDbConnection();
            
            const { sessionId } = req.params;
            const conversation = await Conversation.findOne({ sessionId });
            if (!conversation) return res.status(404).json({ success: false, error: 'Not found' });
            res.status(200).json({ success: true, conversation: {
                sessionId: conversation.sessionId,
                userContext: conversation.userContext,
                messages: conversation.messages,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }});
        } catch (error) {
            next(error);
        }
    }

    async createConversation(req, res, next) {
        try {
            await this.ensureDbConnection();
            
            const { userContext = {} } = req.body;
            const sessionId = this.generateSessionId();
            
            const contextWithDefaults = {
                patientName: userContext.patientName || '',
                diseaseOfInterest: userContext.diseaseOfInterest || '',
                location: userContext.location || '',
                preferences: {
                    detailLevel: userContext.preferences?.detailLevel || 'detailed',
                    language: userContext.preferences?.language || 'en'
                },
                history: []
            };
            
            const conversation = new Conversation({
                sessionId,
                userContext: contextWithDefaults,
                contextVector: { topicChain: contextWithDefaults.diseaseOfInterest ? [contextWithDefaults.diseaseOfInterest] : [] },
                metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
            });
            await conversation.save();
            res.status(201).json({ success: true, sessionId: conversation.sessionId, userContext: conversation.userContext });
        } catch (error) {
            next(error);
        }
    }

    async getOrCreateConversation(sessionId, userContext) {
        await this.ensureDbConnection();
        
        let conversation = null;
        if (sessionId) {
            try {
                conversation = await Conversation.findOne({ sessionId });
            } catch (error) {
                logger.warn('Error finding conversation:', error.message);
            }
        }
        
        if (!conversation) {
            const contextWithDefaults = {
                patientName: userContext?.patientName || '',
                diseaseOfInterest: userContext?.diseaseOfInterest || '',
                location: userContext?.location || '',
                preferences: {
                    detailLevel: userContext?.preferences?.detailLevel || 'detailed',
                    language: userContext?.preferences?.language || 'en'
                },
                history: []
            };
            
            conversation = new Conversation({
                sessionId: sessionId || this.generateSessionId(),
                userContext: contextWithDefaults,
                contextVector: { topicChain: contextWithDefaults.diseaseOfInterest ? [contextWithDefaults.diseaseOfInterest] : [] }
            });
            try {
                await conversation.save();
            } catch (error) {
                logger.warn('Error saving new conversation:', error.message);
            }
        }
        return conversation;
    }

    async retrieveResearchData(expandedContext) {
        const { userQuery, diseaseTerms, location } = expandedContext;
        let condition = userQuery;
        
        if (diseaseTerms?.length > 0) {
            condition = diseaseTerms[0];
        } else {
            const patterns = ['lung cancer', 'diabetes', 'alzheimer', 'parkinson', 'heart disease', 'breast cancer', 'prostate cancer', 'colorectal cancer', 'asthma', 'arthritis', 'melanoma', 'leukemia'];
            const queryLower = userQuery.toLowerCase();
            for (const p of patterns) if (queryLower.includes(p)) { condition = p; break; }
        }
        
        logger.info('Retrieving for condition:', condition);
        
        const [pubmedR, openAlexR, trialsR] = await Promise.allSettled([
            pubmedService.getPublications(condition, 50),
            openAlexService.getPublications(condition, 50),
            clinicalTrialsService.getTrialsByCondition(condition, { location, pageSize: 50 })
        ]);
        
        const publications = [...(pubmedR.status === 'fulfilled' ? pubmedR.value : []), ...(openAlexR.status === 'fulfilled' ? openAlexR.value : [])];
        const clinicalTrials = trialsR.status === 'fulfilled' ? trialsR.value.studies : [];
        
        logger.info('Retrieval complete:', { pubs: publications.length, trials: clinicalTrials.length });
        
        return { publications, clinicalTrials };
    }

    generateQueryHash(query) {
        return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
    }

    async getCachedResearch(queryHash) {
        try {
            const cached = await ResearchCache.findOne({ queryHash });
            if (cached) {
                logger.info('Cache hit - Publications:', cached.publications?.length || 0);
                if (cached.publications?.length > 0) {
                    logger.info('Cached first title:', cached.publications[0]?.title);
                }
                return {
                    publications: cached.publications || [],
                    clinicalTrials: cached.clinicalTrials || []
                };
            }
            return null;
        } catch (error) {
            logger.error('Cache fetch error:', error.message);
            return null;
        }
    }

    async cacheResearchData(queryHash, expandedContext, researchData) {
        try {
            await this.ensureDbConnection();
            
            const cacheEntry = new ResearchCache({
                queryHash,
                originalQuery: expandedContext.originalQuery || expandedContext.expandedQuery || '',
                expandedQuery: expandedContext.expandedQuery || '',
                diseaseContext: expandedContext.diseaseTerms?.[0] || '',
                publications: researchData.publications || [],
                clinicalTrials: researchData.clinicalTrials || [],
                metadata: {
                    totalPublicationsRetrieved: researchData.publications?.length || 0,
                    totalClinicalTrialsRetrieved: researchData.clinicalTrials?.length || 0,
                    sourceTimestamp: new Date()
                }
            });
            
            await cacheEntry.save();
            logger.info('Cached successfully - Publications:', researchData.publications?.length || 0);
        } catch (error) {
            logger.error('Cache error:', error.message);
            // Don't throw - caching failure shouldn't break the request
        }
    }

    needsFreshData(message, conversation) {
        if (!conversation?.messages?.length) return true;
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (lastMessage) {
            if (Date.now() - new Date(lastMessage.timestamp).getTime() > 30 * 60 * 1000) return true;
        }
        const newTopics = ['trial', 'study', 'research', 'publication', 'paper'];
        return newTopics.some(t => message.toLowerCase().includes(t));
    }

    extractPreviousResearchData(conversation) {
        const last = conversation.messages.filter(m => m.role === 'assistant').pop();
        if (last?.structuredContent) {
            return {
                publications: last.structuredContent.publications || [],
                clinicalTrials: last.structuredContent.clinicalTrials || []
            };
        }
        return { publications: [], clinicalTrials: [] };
    }

    generateSessionId() {
        return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
}

module.exports = new ChatController();