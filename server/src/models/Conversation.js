// server/src/models/Conversation.js
// Conversation model for storing chat history and context - FIXED

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    structuredContent: {
        conditionOverview: String,
        researchInsights: String,
        clinicalTrials: [{
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
            url: String
        }],
        publications: [{
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
            source: {
                type: String,
                enum: ['pubmed', 'openalex']
            }
        }],
        sources: [{
            title: String,
            authors: [String],
            year: Number,
            platform: String,
            url: String,
            snippet: String
        }]
    },
    metadata: {
        query: String,
        expandedQuery: String,
        diseaseContext: String,
        intent: String,
        location: String,
        retrievalCount: {
            publications: Number,
            clinicalTrials: Number
        },
        processingTime: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        default: 'anonymous'
    },
    userContext: {
        patientName: String,
        diseaseOfInterest: String,
        location: String,
        preferences: {
            detailLevel: {
                type: String,
                enum: ['basic', 'detailed', 'comprehensive'],
                default: 'detailed'
            },
            language: {
                type: String,
                default: 'en'
            }
        },
        history: [{
            condition: String,
            diagnosedDate: Date,
            notes: String
        }]
    },
    messages: [messageSchema],
    contextVector: {
        lastQuery: String,
        lastIntent: String,
        lastDisease: String,
        topicChain: [String]
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        platform: String
    }
}, {
    timestamps: true,
    strict: false // Allow flexible schema
});

// Pre-save middleware to clean data before saving
conversationSchema.pre('save', function(next) {
    // Clean messages data
    if (this.messages) {
        this.messages.forEach(msg => {
            if (msg.structuredContent) {
                // Clean publications
                if (msg.structuredContent.publications) {
                    msg.structuredContent.publications.forEach(pub => {
                        // Convert array journal to string
                        if (Array.isArray(pub.journal)) {
                            pub.journal = pub.journal[0] || 'Unknown Journal';
                        }
                    });
                }
                // Clean clinical trials
                if (msg.structuredContent.clinicalTrials) {
                    msg.structuredContent.clinicalTrials.forEach(trial => {
                        // Convert array phase to string
                        if (Array.isArray(trial.phase)) {
                            trial.phase = trial.phase.join(', ') || 'Not Specified';
                        }
                    });
                }
            }
        });
    }
    next();
});

// Method to add message to conversation - FIXED
conversationSchema.methods.addMessage = async function(messageData) {
    // Clean the message data before adding
    if (messageData.structuredContent) {
        // Clean publications
        if (messageData.structuredContent.publications) {
            messageData.structuredContent.publications = messageData.structuredContent.publications.map(pub => {
                const cleaned = { ...pub };
                // Convert array journal to string
                if (Array.isArray(cleaned.journal)) {
                    cleaned.journal = cleaned.journal[0] || 'Unknown Journal';
                }
                return cleaned;
            });
        }
        // Clean clinical trials
        if (messageData.structuredContent.clinicalTrials) {
            messageData.structuredContent.clinicalTrials = messageData.structuredContent.clinicalTrials.map(trial => {
                const cleaned = { ...trial };
                // Convert array phase to string
                if (Array.isArray(cleaned.phase)) {
                    cleaned.phase = cleaned.phase.join(', ') || 'Not Specified';
                }
                return cleaned;
            });
        }
    }
    
    this.messages.push(messageData);
    
    // Update context vector
    if (messageData.role === 'user') {
        this.contextVector.lastQuery = messageData.content;
        if (messageData.metadata?.diseaseContext) {
            this.contextVector.lastDisease = messageData.metadata.diseaseContext;
            this.contextVector.topicChain.push(messageData.metadata.diseaseContext);
        }
        if (messageData.metadata?.intent) {
            this.contextVector.lastIntent = messageData.metadata.intent;
        }
    }
    
    // Keep only last 50 messages
    if (this.messages.length > 50) {
        this.messages = this.messages.slice(-50);
    }
    
    // Keep topic chain manageable
    if (this.contextVector.topicChain.length > 20) {
        this.contextVector.topicChain = this.contextVector.topicChain.slice(-20);
    }
    
    return this.save();
};

// Method to get conversation context for LLM
conversationSchema.methods.getLLMContext = function(limit = 10) {
    const recentMessages = this.messages.slice(-limit);
    
    return {
        userContext: this.userContext,
        contextVector: this.contextVector,
        recentMessages: recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata
        }))
    };
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;