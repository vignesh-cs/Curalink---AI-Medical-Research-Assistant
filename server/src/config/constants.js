// server/src/config/constants.js
// Application constants and configuration

module.exports = {
    // API Rate Limits
    API_RATE_LIMITS: {
        PUBMED: 3,
        OPENALEX: 10,
        CLINICAL_TRIALS: 5
    },

    // Retrieval Defaults
    RETRIEVAL_DEFAULTS: {
        MAX_PUBLICATIONS: 100,
        MAX_TRIALS: 50,
        DEFAULT_RESULTS: 50,
        TOP_RESULTS_PUBLICATIONS: 6,
        TOP_RESULTS_TRIALS: 6
    },

    // Cache Settings
    CACHE: {
        TTL_SECONDS: 86400,
        MAX_ENTRIES: 1000
    },

    // LLM Settings
    LLM: {
        DEFAULT_MODEL: 'llama3.1:8b',
        MAX_TOKENS: 2048,
        TEMPERATURE: 0.3,
        TIMEOUT_MS: 60000
    },

    // Query Settings
    QUERY: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 1000,
        MAX_FOLLOW_UP_LENGTH: 500
    },

    // Medical Topics
    MEDICAL_TOPICS: [
        'oncology',
        'neurology',
        'cardiology',
        'endocrinology',
        'immunology',
        'infectious disease',
        'psychiatry',
        'pediatrics',
        'geriatrics',
        'rheumatology'
    ],

    // Intent Patterns
    INTENT_PATTERNS: {
        treatment: ['treatment', 'therapy', 'medication', 'drug', 'intervention'],
        diagnosis: ['diagnosis', 'detect', 'symptom', 'sign', 'test'],
        research: ['research', 'study', 'trial', 'investigation', 'latest'],
        prevention: ['prevention', 'prevent', 'risk', 'reduce'],
        mechanism: ['mechanism', 'pathway', 'cause', 'etiology'],
        prognosis: ['prognosis', 'outcome', 'survival', 'mortality']
    }
};