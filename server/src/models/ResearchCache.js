// server/src/models/ResearchCache.js
// Cache model for storing research results - FIXED

const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
    title: String,
    authors: [String],
    abstract: String,
    journal: {
        type: mongoose.Schema.Types.Mixed, // Can be String or Array
        default: 'Unknown Journal'
    },
    year: Number,
    doi: String,
    url: String,
    source: String,
    relevanceScore: Number
});

const clinicalTrialSchema = new mongoose.Schema({
    nctId: String,
    title: String,
    status: String,
    phase: {
        type: mongoose.Schema.Types.Mixed, // Can be String or Array
        default: 'Not Specified'
    },
    conditions: [String],
    locations: [{
        facility: String,
        city: String,
        state: String,
        country: String
    }],
    eligibilityCriteria: String,
    contactInfo: {
        name: String,
        phone: String,
        email: String
    },
    url: String,
    relevanceScore: Number
});

const researchCacheSchema = new mongoose.Schema({
    queryHash: {
        type: String,
        required: true,
        unique: true
    },
    originalQuery: {
        type: String,
        required: true
    },
    expandedQuery: String,
    diseaseContext: String,
    publications: [publicationSchema],
    clinicalTrials: [clinicalTrialSchema],
    metadata: {
        totalPublicationsRetrieved: Number,
        totalClinicalTrialsRetrieved: Number,
        filteredPublicationsCount: Number,
        filteredTrialsCount: Number,
        processingTime: Number,
        sourceTimestamp: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Auto-delete after 24 hours
    }
}, {
    strict: false // Allow flexible schema
});

// Pre-save middleware to clean data
researchCacheSchema.pre('save', function(next) {
    // Clean publications
    if (this.publications) {
        this.publications = this.publications.map(pub => {
            const cleaned = { ...pub };
            // Convert array journal to string
            if (Array.isArray(cleaned.journal)) {
                cleaned.journal = cleaned.journal[0] || 'Unknown Journal';
            }
            return cleaned;
        });
    }
    
    // Clean clinical trials
    if (this.clinicalTrials) {
        this.clinicalTrials = this.clinicalTrials.map(trial => {
            const cleaned = { ...trial };
            // Convert array phase to string
            if (Array.isArray(cleaned.phase)) {
                cleaned.phase = cleaned.phase.join(', ') || 'Not Specified';
            }
            return cleaned;
        });
    }
    
    next();
});

// Create compound index for efficient querying
researchCacheSchema.index({ queryHash: 1, createdAt: -1 });
researchCacheSchema.index({ diseaseContext: 1, createdAt: -1 });

const ResearchCache = mongoose.model('ResearchCache', researchCacheSchema);

module.exports = ResearchCache;