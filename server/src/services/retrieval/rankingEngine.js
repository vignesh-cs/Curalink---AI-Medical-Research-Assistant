// server/src/services/retrieval/rankingEngine.js
// FULLY FIXED - PRESERVES ALL NESTED OBJECTS

const logger = require('../../config/logger');

class RankingEngine {
    constructor() {
        this.weights = {
            relevance: 0.4,
            recency: 0.3,
            sourceCredibility: 0.2,
            citationImpact: 0.1
        };
        
        this.sourceScores = {
            pubmed: 0.95,
            openalex: 0.85,
            clinicaltrials: 0.90
        };
    }

    // Safe string converter
    safeString(value) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (value._) return String(value._);
        if (value['#text']) return String(value['#text']);
        if (Array.isArray(value)) return value.map(v => this.safeString(v)).join(' ');
        return String(value);
    }

    // Safe title extractor
    getTitle(item) {
        if (!item) return '';
        if (typeof item.title === 'string') return item.title;
        if (item.title && typeof item.title === 'object') {
            return this.safeString(item.title);
        }
        return '';
    }

    calculateRelevanceScore(text, queryTerms) {
        if (!text || !queryTerms) return 0;
        
        const textLower = this.safeString(text).toLowerCase();
        let matchCount = 0;
        let exactMatchBonus = 0;
        
        queryTerms.forEach(term => {
            const termLower = term.toLowerCase();
            const occurrences = (textLower.match(new RegExp(termLower, 'g')) || []).length;
            matchCount += occurrences;
            if (textLower.includes(` ${termLower} `)) {
                exactMatchBonus += 0.2;
            }
        });
        
        return Math.min(1, (matchCount / (queryTerms.length * 3)) + exactMatchBonus);
    }

    calculateRecencyScore(year) {
        if (!year) return 0.5;
        const currentYear = new Date().getFullYear();
        const age = currentYear - year;
        if (age <= 1) return 1.0;
        if (age <= 3) return 0.9;
        if (age <= 5) return 0.7;
        if (age <= 10) return 0.4;
        if (age <= 20) return 0.2;
        return 0.1;
    }

    calculateCitationScore(citedByCount) {
        if (!citedByCount) return 0.3;
        if (citedByCount >= 100) return 1.0;
        if (citedByCount >= 50) return 0.8;
        if (citedByCount >= 20) return 0.6;
        if (citedByCount >= 10) return 0.4;
        if (citedByCount >= 5) return 0.3;
        return 0.2;
    }

    calculateTitleSimilarity(title1, title2) {
        const str1 = this.safeString(title1).toLowerCase();
        const str2 = this.safeString(title2).toLowerCase();
        
        if (!str1 || !str2) return 0;
        
        const words1 = new Set(str1.split(/\s+/));
        const words2 = new Set(str2.split(/\s+/));
        
        const intersection = [...words1].filter(w => words2.has(w));
        const union = new Set([...words1, ...words2]);
        
        return union.size > 0 ? intersection.length / union.size : 0;
    }

    // DEEP CLONE function to preserve ALL nested objects
    deepClone(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    rankPublications(publications, query, options = {}) {
        try {
            if (!publications || publications.length === 0) {
                return [];
            }
            
            const queryTerms = this.extractQueryTerms(query);
            
            // Calculate scores WITHOUT modifying original objects
            const scored = publications.map(pub => {
                const title = this.getTitle(pub);
                const abstract = this.safeString(pub.abstract || '');
                
                const relevance = this.calculateRelevanceScore(`${title} ${abstract}`, queryTerms);
                const recency = this.calculateRecencyScore(pub.year);
                const source = this.sourceScores[pub.source] || 0.7;
                const citation = pub.citedByCount ? this.calculateCitationScore(pub.citedByCount) : 0.3;
                
                const total = (relevance * this.weights.relevance) +
                             (recency * this.weights.recency) +
                             (source * this.weights.sourceCredibility) +
                             (citation * this.weights.citationImpact);
                
                // DEEP CLONE to preserve ALL original data
                const cloned = this.deepClone(pub);
                cloned.rankingScore = total;
                
                return cloned;
            });
            
            // Sort by score
            scored.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
            
            // Deduplicate
            const deduplicated = this.deduplicateResults(scored);
            
            let filtered = deduplicated;
            if (options.minYear) {
                filtered = filtered.filter(p => p.year >= options.minYear);
            }
            
            logger.info(`Ranked ${publications.length} publications, filtered to ${filtered.length}`);
            
            // VERIFY data preserved
            if (filtered.length > 0) {
                logger.info('Ranking preserved data:', {
                    firstTitle: this.getTitle(filtered[0]),
                    hasAbstract: !!filtered[0]?.abstract
                });
            }
            
            return filtered;
        } catch (error) {
            logger.error('Error ranking publications:', error);
            return publications;
        }
    }

    deduplicateResults(results, threshold = 0.85) {
        const unique = [];
        
        for (const result of results) {
            const resultTitle = this.getTitle(result);
            
            const isDuplicate = unique.some(existing => {
                const existingTitle = this.getTitle(existing);
                return this.calculateTitleSimilarity(existingTitle, resultTitle) > threshold;
            });
            
            if (!isDuplicate) {
                unique.push(result);
            }
        }
        
        return unique;
    }

    rankClinicalTrials(trials, query, options = {}) {
        try {
            if (!trials || trials.length === 0) {
                return [];
            }
            
            const queryTerms = this.extractQueryTerms(query);
            
            const scored = trials.map(trial => {
                const title = this.getTitle(trial);
                const relevance = this.calculateRelevanceScore(
                    `${title} ${trial.briefSummary || ''}`, 
                    queryTerms
                );
                
                const statusScores = {
                    'RECRUITING': 1.0,
                    'NOT_YET_RECRUITING': 0.9,
                    'ACTIVE_NOT_RECRUITING': 0.7,
                    'COMPLETED': 0.6,
                    'ENROLLING_BY_INVITATION': 0.5,
                    'TERMINATED': 0.2,
                    'WITHDRAWN': 0.1,
                    'UNKNOWN': 0.3
                };
                
                const status = statusScores[trial.status] || 0.5;
                
                let recency = 0.5;
                if (trial.lastUpdatePosted) {
                    const year = new Date(trial.lastUpdatePosted).getFullYear();
                    recency = this.calculateRecencyScore(year);
                }
                
                const total = (relevance * 0.5) + (status * 0.3) + (recency * 0.2);
                
                // DEEP CLONE to preserve ALL original data
                const cloned = this.deepClone(trial);
                cloned.rankingScore = total;
                
                return cloned;
            });
            
            scored.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
            
            const seen = new Set();
            const unique = scored.filter(t => {
                if (seen.has(t.nctId)) return false;
                seen.add(t.nctId);
                return true;
            });
            
            logger.info(`Ranked ${trials.length} trials, filtered to ${unique.length}`);
            
            return unique;
        } catch (error) {
            logger.error('Error ranking clinical trials:', error);
            return trials;
        }
    }

    extractQueryTerms(query) {
        const stopWords = ['the', 'and', 'or', 'but', 'for', 'with', 'about', 'from', 'what', 'are', 'how', 'why', 'latest', 'treatment', 'clinical', 'trials'];
        
        return this.safeString(query)
            .toLowerCase()
            .split(/[\s,;]+/)
            .filter(t => t.length > 2 && !stopWords.includes(t));
    }

    selectTopResults(publications, trials, limits = {}) {
        return {
            publications: (publications || []).slice(0, limits.publications || 6),
            clinicalTrials: (trials || []).slice(0, limits.trials || 6)
        };
    }
}

module.exports = new RankingEngine();