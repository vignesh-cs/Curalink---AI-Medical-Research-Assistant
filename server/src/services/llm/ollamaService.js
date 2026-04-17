// server/src/services/llm/ollamaService.js
// FULLY FIXED FOR DEEPSEEK - COMPLETE FILE

const axios = require('axios');
const logger = require('../../config/logger');

class OllamaService {
    constructor() {
        this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'deepseek-r1:7b';
        this.maxRetries = 2;
        this.timeout = 90000;
    }

    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
            const models = response.data.models || [];
            return {
                healthy: true,
                modelAvailable: models.some(m => m.name.includes(this.model) || m.name === this.model),
                models: models.map(m => m.name)
            };
        } catch (error) {
            return { healthy: false, modelAvailable: false, error: error.message };
        }
    }

    // Extract title safely - NO TRUNCATION
    extractTitle(pub) {
        if (!pub || !pub.title) return 'No title available';
        if (typeof pub.title === 'string') return pub.title;
        if (pub.title._) return String(pub.title._);
        if (pub.title['#text']) return String(pub.title['#text']);
        if (Array.isArray(pub.title)) return pub.title.join(' ');
        return String(pub.title);
    }

    // Extract abstract safely - NO TRUNCATION
    extractAbstract(pub) {
        if (!pub || !pub.abstract) return 'No abstract available';
        if (typeof pub.abstract === 'string') return pub.abstract;
        if (pub.abstract._) return String(pub.abstract._);
        if (pub.abstract['#text']) return String(pub.abstract['#text']);
        if (Array.isArray(pub.abstract)) return pub.abstract.join(' ');
        return String(pub.abstract);
    }

    // Extract authors list
    extractAuthorsList(authors) {
        if (!authors) return 'Unknown Authors';
        if (Array.isArray(authors)) {
            const names = authors.slice(0, 3).map(a => {
                if (typeof a === 'string') return a;
                if (a?.name) return a.name;
                if (a?.display_name) return a.display_name;
                return String(a);
            });
            return names.join(', ') || 'Unknown Authors';
        }
        return String(authors);
    }

    // Extract journal
    extractJournal(pub) {
        if (!pub || !pub.journal) return 'Unknown Journal';
        if (typeof pub.journal === 'string') return pub.journal;
        if (Array.isArray(pub.journal)) return pub.journal[0] || 'Unknown Journal';
        return String(pub.journal);
    }

    // Extract phase for trials
    extractPhase(trial) {
        if (!trial || !trial.phase) return 'Not Specified';
        if (Array.isArray(trial.phase)) return trial.phase.join(', ');
        return String(trial.phase);
    }

    buildFallbackResponse(context) {
        const pubs = context.researchData?.publications || [];
        
        if (pubs.length === 0) {
            return {
                text: "No research publications were found for this query.",
                metadata: { fallback: true }
            };
        }
        
        let response = "## Research Summary\n\n";
        response += `Based on ${pubs.length} publications:\n\n`;
        
        pubs.slice(0, 6).forEach((pub, i) => {
            const title = this.extractTitle(pub);
            const authors = this.extractAuthorsList(pub.authors);
            const year = pub.year || 'N/A';
            const abstract = this.extractAbstract(pub);
            
            response += `**[${i+1}] ${title}**\n`;
            response += `*${authors} (${year})*\n`;
            response += `${abstract.substring(0, 500)}...\n\n`;
        });
        
        return {
            text: response,
            metadata: { fallback: true }
        };
    }

    buildSimplePrompt(userQuery, context) {
        const pubs = context.researchData?.publications || [];
        const trials = context.researchData?.clinicalTrials || [];
        
        let prompt = `You are a medical research assistant. Answer the user's query using ONLY the research publications provided below. Cite sources as [1], [2], etc.\n\n`;
        prompt += `USER QUERY: ${userQuery}\n\n`;
        
        if (pubs.length === 0) {
            prompt += `No research publications available.\n`;
            return prompt;
        }
        
        prompt += `=== RESEARCH PUBLICATIONS (${pubs.length} total) ===\n\n`;
        
        pubs.slice(0, 6).forEach((pub, i) => {
            const title = this.extractTitle(pub);
            const authors = this.extractAuthorsList(pub.authors);
            const year = pub.year || 'N/A';
            const journal = this.extractJournal(pub);
            const abstract = this.extractAbstract(pub);
            
            prompt += `[${i + 1}] TITLE: ${title}\n`;
            prompt += `AUTHORS: ${authors}\n`;
            prompt += `YEAR: ${year} | JOURNAL: ${journal}\n`;
            prompt += `ABSTRACT: ${abstract}\n`;
            prompt += `---\n\n`;
        });
        
        if (trials.length > 0) {
            prompt += `=== CLINICAL TRIALS (${trials.length} total) ===\n\n`;
            trials.slice(0, 3).forEach((trial, i) => {
                prompt += `[T${i + 1}] TITLE: ${this.extractTitle(trial)}\n`;
                prompt += `STATUS: ${trial.status || 'Unknown'} | PHASE: ${this.extractPhase(trial)}\n`;
                prompt += `SUMMARY: ${this.extractAbstract(trial)}\n`;
                prompt += `---\n\n`;
            });
        }
        
        prompt += `Based on the above publications, answer: ${userQuery}\n`;
        prompt += `Provide: (1) Condition Overview, (2) Key Findings with citations, (3) Clinical Implications.\n`;
        
        return prompt;
    }

    async generateMedicalResponse(userQuery, researchContext, conversationContext) {
        try {
            const pubs = researchContext?.publications || [];
            logger.info(`Generating response for: "${userQuery}" with ${pubs.length} publications`);
            
            if (pubs.length > 0) {
                logger.info(`Sample publication: ${this.extractTitle(pubs[0]).substring(0, 100)}`);
            }
            
            const context = {
                userContext: conversationContext?.userContext,
                researchData: researchContext
            };
            
            // Use fallback directly for reliability
            const useFallback = process.env.USE_FALLBACK === 'true' || pubs.length === 0;
            
            let responseText;
            let metadata = {};
            
            if (useFallback) {
                const fallback = this.buildFallbackResponse(context);
                responseText = fallback.text;
                metadata = fallback.metadata;
            } else {
                try {
                    const fullPrompt = this.buildSimplePrompt(userQuery, context);
                    
                    const requestBody = {
                        model: this.model,
                        prompt: fullPrompt,
                        stream: false,
                        options: {
                            temperature: 0.3,
                            top_p: 0.9,
                            num_predict: 2048,
                        }
                    };
                    
                    const response = await axios.post(`${this.baseURL}/api/generate`, requestBody, {
                        timeout: this.timeout,
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (response.data?.response) {
                        responseText = response.data.response;
                        responseText = responseText.replace(/<\/?think>/g, '');
                        metadata = { model: this.model };
                    } else {
                        throw new Error('No response from LLM');
                    }
                } catch (llmError) {
                    logger.warn('LLM failed, using fallback:', llmError.message);
                    const fallback = this.buildFallbackResponse(context);
                    responseText = fallback.text;
                    metadata = { fallback: true };
                }
            }
            
            // Build structured response
            const structured = {
                conditionOverview: responseText.substring(0, 500),
                researchInsights: responseText,
                clinicalTrials: '',
                limitations: ''
            };
            
            // Build sources
            const sources = (pubs || []).slice(0, 6).map(pub => ({
                title: this.extractTitle(pub),
                authors: Array.isArray(pub.authors) ? pub.authors : ['Unknown'],
                year: pub.year || null,
                platform: pub.source || 'Research Database',
                url: pub.url || '#',
                snippet: this.extractAbstract(pub).substring(0, 300) + '...'
            }));
            
            return {
                rawResponse: responseText,
                structuredResponse: structured,
                metadata: metadata,
                sources: sources
            };
            
        } catch (error) {
            logger.error('Error in generateMedicalResponse:', error);
            const fallback = this.buildFallbackResponse({ researchData: researchContext });
            return {
                rawResponse: fallback.text,
                structuredResponse: {
                    conditionOverview: 'Research Summary',
                    researchInsights: fallback.text,
                    clinicalTrials: '',
                    limitations: ''
                },
                metadata: { fallback: true },
                sources: []
            };
        }
    }

    parseStructuredResponse(text) {
        return {
            conditionOverview: text.substring(0, 500),
            researchInsights: text,
            clinicalTrials: '',
            limitations: ''
        };
    }

    async generateFollowUpResponse(followUpQuery, previousContext, newResearchData = null) {
        const context = {
            userContext: previousContext?.userContext,
            researchData: newResearchData || previousContext?.researchData
        };
        
        const prompt = this.buildSimplePrompt(followUpQuery, context);
        
        try {
            const requestBody = {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.3, num_predict: 1024 }
            };
            
            const response = await axios.post(`${this.baseURL}/api/generate`, requestBody, {
                timeout: this.timeout,
                headers: { 'Content-Type': 'application/json' }
            });
            
            let responseText = response.data?.response || 'Unable to generate response.';
            responseText = responseText.replace(/<\/?think>/g, '');
            
            return {
                rawResponse: responseText,
                structuredResponse: this.parseStructuredResponse(responseText),
                metadata: {}
            };
        } catch (error) {
            logger.error('Follow-up error:', error);
            const fallback = this.buildFallbackResponse(context);
            return {
                rawResponse: fallback.text,
                structuredResponse: this.parseStructuredResponse(fallback.text),
                metadata: { fallback: true }
            };
        }
    }
}

module.exports = new OllamaService();