// server/src/services/retrieval/queryExpander.js
// Intelligent query expansion based on disease context and intent detection

const logger = require('../../config/logger');

class QueryExpander {
    constructor() {
        // Medical intent patterns for better query understanding
        this.intentPatterns = {
            treatment: ['treatment', 'therapy', 'medication', 'drug', 'intervention', 'management'],
            diagnosis: ['diagnosis', 'detect', 'symptom', 'sign', 'test', 'screen'],
            research: ['research', 'study', 'trial', 'investigation', 'latest', 'new'],
            prevention: ['prevention', 'prevent', 'risk', 'reduce', 'avoid'],
            mechanism: ['mechanism', 'pathway', 'cause', 'etiology', 'pathogenesis'],
            prognosis: ['prognosis', 'outcome', 'survival', 'mortality', 'progression']
        };

        // Disease-specific expansion terms
        this.diseaseExpansions = {
            'parkinson': ['Parkinson disease', 'Parkinson\'s disease', 'PD', 'parkinsonism'],
            'alzheimer': ['Alzheimer disease', 'Alzheimer\'s disease', 'AD', 'dementia'],
            'diabetes': ['diabetes mellitus', 'type 1 diabetes', 'type 2 diabetes', 'T1DM', 'T2DM'],
            'cancer': ['neoplasm', 'malignancy', 'tumor', 'carcinoma', 'oncology'],
            'lung cancer': ['lung neoplasm', 'pulmonary cancer', 'NSCLC', 'SCLC', 'lung carcinoma'],
            'heart disease': ['cardiovascular disease', 'CVD', 'coronary artery disease', 'CAD', 'heart failure']
        };
    }

    // Detect user intent from query
    detectIntent(query) {
        const queryLower = query.toLowerCase();
        const detectedIntents = [];
        
        for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
            for (const pattern of patterns) {
                if (queryLower.includes(pattern)) {
                    detectedIntents.push(intent);
                    break;
                }
            }
        }
        
        return detectedIntents.length > 0 ? detectedIntents : ['general'];
    }

    // Expand disease terms
    expandDiseaseContext(disease) {
        if (!disease) return [];
        
        const diseaseLower = disease.toLowerCase();
        const expansions = [];
        
        for (const [key, terms] of Object.entries(this.diseaseExpansions)) {
            if (diseaseLower.includes(key)) {
                expansions.push(...terms);
            }
        }
        
        // If no specific expansion found, return original
        return expansions.length > 0 ? [...new Set(expansions)] : [disease];
    }

    // Build expanded query - SIMPLIFIED FOR API COMPATIBILITY
    buildExpandedQuery(userQuery, diseaseContext = null, location = null) {
        logger.info('Expanding query:', { userQuery, diseaseContext, location });
        
        const intent = this.detectIntent(userQuery);
        const diseaseTerms = this.expandDiseaseContext(diseaseContext);
        
        // Simple expanded query - just the user query
        // APIs handle their own relevance ranking
        const expandedQuery = userQuery;
        
        logger.info('Expanded query result:', {
            original: userQuery,
            expanded: expandedQuery,
            intent,
            diseaseTerms
        });
        
        return {
            originalQuery: userQuery,
            expandedQuery: expandedQuery,
            userQuery: userQuery,
            intent: intent[0] || 'general',
            diseaseTerms,
            location
        };
    }

    // Generate PubMed specific query - SIMPLE FORMAT
    buildPubMedQuery(expandedContext) {
        const { userQuery, diseaseTerms } = expandedContext;
        
        // PubMed accepts simple text queries
        let query = userQuery;
        
        // Add disease terms if available
        if (diseaseTerms && diseaseTerms.length > 0) {
            // Use the first disease term
            query = `${query} AND ${diseaseTerms[0]}`;
        }
        
        return query;
    }

    // Generate OpenAlex specific query - SIMPLE FORMAT
    buildOpenAlexQuery(expandedContext) {
        const { userQuery, diseaseTerms } = expandedContext;
        
        // OpenAlex accepts simple text search
        let searchTerms = userQuery;
        
        if (diseaseTerms && diseaseTerms.length > 0) {
            searchTerms = `${searchTerms} ${diseaseTerms[0]}`;
        }
        
        return searchTerms;
    }

    // Generate ClinicalTrials.gov query - SIMPLE FORMAT
    buildClinicalTrialsQuery(expandedContext) {
        const { userQuery, diseaseTerms, location } = expandedContext;
        
        const params = {};
        
        // Use user query or disease term for condition
        if (userQuery) {
            params.cond = userQuery;
        } else if (diseaseTerms && diseaseTerms.length > 0) {
            params.cond = diseaseTerms[0];
        }
        
        if (location) {
            params.loc = location;
        }
        
        return params;
    }
}

module.exports = new QueryExpander();