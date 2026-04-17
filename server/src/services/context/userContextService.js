// server/src/services/context/userContextService.js
// User context management service

const logger = require('../../config/logger');

class UserContextService {
    constructor() {
        // Medical condition synonyms
        this.conditionSynonyms = {
            'diabetes': ['diabetes mellitus', 'type 1 diabetes', 'type 2 diabetes'],
            'cancer': ['malignancy', 'neoplasm', 'tumor'],
            'heart disease': ['cardiovascular disease', 'coronary artery disease'],
            'alzheimer': ['alzheimer\'s disease', 'dementia', 'cognitive decline'],
            'parkinson': ['parkinson\'s disease', 'PD', 'parkinsonism']
        };
        
        // Location mappings for clinical trials
        this.locationMappings = {
            'us': 'United States',
            'usa': 'United States',
            'uk': 'United Kingdom',
            'ca': 'Canada',
            'au': 'Australia'
        };
    }

    // Parse and normalize user context
    normalizeUserContext(rawContext) {
        const normalized = {
            patientName: rawContext.patientName || '',
            diseaseOfInterest: this.normalizeCondition(rawContext.diseaseOfInterest),
            location: this.normalizeLocation(rawContext.location),
            preferences: {
                detailLevel: rawContext.preferences?.detailLevel || 'detailed',
                language: rawContext.preferences?.language || 'en'
            }
        };
        
        return normalized;
    }

    // Normalize medical condition name
    normalizeCondition(condition) {
        if (!condition) return '';
        
        const conditionLower = condition.toLowerCase().trim();
        
        // Check synonym mappings
        for (const [key, synonyms] of Object.entries(this.conditionSynonyms)) {
            if (conditionLower.includes(key) || synonyms.some(s => conditionLower.includes(s))) {
                return key;
            }
        }
        
        return condition;
    }

    // Normalize location for clinical trials API
    normalizeLocation(location) {
        if (!location) return '';
        
        const locationLower = location.toLowerCase().trim();
        
        // Check for country codes
        if (this.locationMappings[locationLower]) {
            return this.locationMappings[locationLower];
        }
        
        // Capitalize first letter of each word
        return location.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Extract search terms from user context
    extractSearchTerms(userContext) {
        const terms = [];
        
        if (userContext.diseaseOfInterest) {
            terms.push(userContext.diseaseOfInterest);
            
            // Add synonyms if available
            const synonyms = this.conditionSynonyms[userContext.diseaseOfInterest.toLowerCase()];
            if (synonyms) {
                terms.push(...synonyms);
            }
        }
        
        return [...new Set(terms)];
    }

    // Build personalization prompt addition
    buildPersonalizationPrompt(userContext) {
        if (!userContext || Object.keys(userContext).length === 0) {
            return '';
        }
        
        let prompt = '\nUSER PERSONALIZATION:\n';
        
        if (userContext.diseaseOfInterest) {
            prompt += `- The user is interested in: ${userContext.diseaseOfInterest}\n`;
        }
        
        if (userContext.location) {
            prompt += `- The user is located in: ${userContext.location}\n`;
        }
        
        if (userContext.preferences?.detailLevel) {
            prompt += `- Preferred detail level: ${userContext.preferences.detailLevel}\n`;
        }
        
        return prompt;
    }

    // Validate user context
    validateUserContext(userContext) {
        const errors = [];
        
        if (userContext.diseaseOfInterest && userContext.diseaseOfInterest.length > 100) {
            errors.push('Disease of interest is too long (max 100 characters)');
        }
        
        if (userContext.location && userContext.location.length > 100) {
            errors.push('Location is too long (max 100 characters)');
        }
        
        if (userContext.patientName && userContext.patientName.length > 100) {
            errors.push('Patient name is too long (max 100 characters)');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Merge context updates
    mergeContextUpdates(existingContext, updates) {
        return {
            ...existingContext,
            ...updates,
            preferences: {
                ...existingContext.preferences,
                ...(updates.preferences || {})
            }
        };
    }
}

module.exports = new UserContextService();