// server/src/services/llm/contextBuilder.js
// Builds comprehensive context for LLM reasoning

const logger = require('../../config/logger');

class ContextBuilder {
    constructor() {
        this.maxContextLength = 8000;
        this.maxPublications = 8;
        this.maxTrials = 6;
    }

    // Build complete context for LLM
    buildContext(userQuery, researchResults, conversationHistory, userContext) {
        const context = {
            userQuery,
            researchSummary: this.summarizeResearch(researchResults),
            relevantPublications: this.selectRelevantPublications(researchResults.publications, userQuery),
            relevantTrials: this.selectRelevantTrials(researchResults.clinicalTrials, userQuery),
            conversationSummary: this.summarizeConversation(conversationHistory),
            userContext: this.formatUserContext(userContext),
            metadata: {
                totalPublications: researchResults.publications?.length || 0,
                totalTrials: researchResults.clinicalTrials?.length || 0,
                contextLength: 0
            }
        };
        
        // Calculate and trim context if needed
        context.metadata.contextLength = this.estimateContextLength(context);
        
        if (context.metadata.contextLength > this.maxContextLength) {
            this.trimContext(context);
        }
        
        return context;
    }

    // Summarize research results
    summarizeResearch(researchResults) {
        const summary = {
            publicationCount: researchResults.publications?.length || 0,
            trialCount: researchResults.clinicalTrials?.length || 0,
            keyTopics: new Set(),
            dateRange: {
                oldest: null,
                newest: null
            }
        };
        
        // Extract key topics from titles and abstracts
        if (researchResults.publications) {
            researchResults.publications.forEach(pub => {
                if (pub.year) {
                    if (!summary.dateRange.newest || pub.year > summary.dateRange.newest) {
                        summary.dateRange.newest = pub.year;
                    }
                    if (!summary.dateRange.oldest || pub.year < summary.dateRange.oldest) {
                        summary.dateRange.oldest = pub.year;
                    }
                }
                
                // Extract key terms (simplified)
                const text = `${pub.title} ${pub.abstract || ''}`.toLowerCase();
                const keywords = ['treatment', 'therapy', 'diagnosis', 'prognosis', 'mechanism'];
                keywords.forEach(kw => {
                    if (text.includes(kw)) {
                        summary.keyTopics.add(kw);
                    }
                });
            });
        }
        
        summary.keyTopics = Array.from(summary.keyTopics);
        
        return summary;
    }

    // Select most relevant publications for context
    selectRelevantPublications(publications, userQuery) {
        if (!publications || publications.length === 0) {
            return [];
        }
        
        // Sort by ranking score if available
        const sorted = [...publications].sort((a, b) => {
            const scoreA = a.rankingScore || 0;
            const scoreB = b.rankingScore || 0;
            return scoreB - scoreA;
        });
        
        // Select top publications
        const selected = sorted.slice(0, this.maxPublications);
        
        // Format for context
        return selected.map(pub => ({
            title: pub.title,
            authors: pub.authors?.slice(0, 3) || [],
            year: pub.year,
            source: pub.source,
            abstract: this.truncateAbstract(pub.abstract, 300),
            url: pub.url,
            keyFindings: this.extractKeyFindings(pub.abstract)
        }));
    }

    // Select most relevant clinical trials
    selectRelevantTrials(trials, userQuery) {
        if (!trials || trials.length === 0) {
            return [];
        }
        
        // Sort by ranking score
        const sorted = [...trials].sort((a, b) => {
            const scoreA = a.rankingScore || 0;
            const scoreB = b.rankingScore || 0;
            return scoreB - scoreA;
        });
        
        // Select top trials
        const selected = sorted.slice(0, this.maxTrials);
        
        // Format for context
        return selected.map(trial => ({
            nctId: trial.nctId,
            title: trial.title,
            status: trial.status,
            phase: trial.phase,
            summary: this.truncateAbstract(trial.briefSummary, 200),
            locations: trial.locations?.slice(0, 3) || [],
            url: trial.url
        }));
    }

    // Summarize conversation history
    summarizeConversation(conversationHistory) {
        if (!conversationHistory || conversationHistory.length === 0) {
            return null;
        }
        
        // Keep last 5 messages for context
        const recentMessages = conversationHistory.slice(-5);
        
        // Extract key information
        const summary = {
            messageCount: recentMessages.length,
            lastQuery: recentMessages[recentMessages.length - 1]?.content,
            topics: []
        };
        
        return summary;
    }

    // Format user context
    formatUserContext(userContext) {
        if (!userContext) {
            return null;
        }
        
        return {
            diseaseOfInterest: userContext.diseaseOfInterest,
            location: userContext.location,
            preferences: userContext.preferences || { detailLevel: 'detailed' }
        };
    }

    // Truncate abstract to specified length
    truncateAbstract(abstract, maxLength = 300) {
        if (!abstract) return '';
        if (abstract.length <= maxLength) return abstract;
        
        const truncated = abstract.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        return truncated.substring(0, lastSpace) + '...';
    }

    // Extract key findings from abstract (simplified)
    extractKeyFindings(abstract) {
        if (!abstract) return [];
        
        const findings = [];
        const sentences = abstract.split(/[.!?]+/);
        
        const indicatorWords = ['found', 'showed', 'demonstrated', 'revealed', 'indicated', 'suggested'];
        
        sentences.forEach(sentence => {
            const lower = sentence.toLowerCase();
            if (indicatorWords.some(word => lower.includes(word))) {
                if (sentence.length < 200) {
                    findings.push(sentence.trim());
                }
            }
        });
        
        return findings.slice(0, 2);
    }

    // Estimate context length in tokens (approximate)
    estimateContextLength(context) {
        let totalLength = 0;
        
        // User query
        totalLength += context.userQuery?.length || 0;
        
        // Publications
        if (context.relevantPublications) {
            context.relevantPublications.forEach(pub => {
                totalLength += pub.title?.length || 0;
                totalLength += pub.abstract?.length || 0;
            });
        }
        
        // Trials
        if (context.relevantTrials) {
            context.relevantTrials.forEach(trial => {
                totalLength += trial.title?.length || 0;
                totalLength += trial.summary?.length || 0;
            });
        }
        
        // Rough token estimation: 4 chars per token
        return Math.ceil(totalLength / 4);
    }

    // Trim context if it exceeds maximum length
    trimContext(context) {
        // Reduce number of publications
        if (context.relevantPublications?.length > 3) {
            context.relevantPublications = context.relevantPublications.slice(0, 3);
        }
        
        // Reduce number of trials
        if (context.relevantTrials?.length > 3) {
            context.relevantTrials = context.relevantTrials.slice(0, 3);
        }
        
        // Truncate abstracts further
        context.relevantPublications?.forEach(pub => {
            pub.abstract = this.truncateAbstract(pub.abstract, 150);
        });
        
        context.relevantTrials?.forEach(trial => {
            trial.summary = this.truncateAbstract(trial.summary, 100);
        });
        
        context.metadata.contextLength = this.estimateContextLength(context);
    }

    // Build context for follow-up question
    buildFollowUpContext(followUpQuery, previousContext, newResearchData = null) {
        const context = {
            userQuery: followUpQuery,
            isFollowUp: true,
            previousQuery: previousContext.userQuery,
            previousTopics: previousContext.researchSummary?.keyTopics || []
        };
        
        if (newResearchData) {
            context.relevantPublications = this.selectRelevantPublications(
                newResearchData.publications, 
                followUpQuery
            );
            context.relevantTrials = this.selectRelevantTrials(
                newResearchData.clinicalTrials, 
                followUpQuery
            );
        }
        
        return context;
    }
}

module.exports = new ContextBuilder();