// server/src/config/database.js
// MongoDB connection configuration with connection pooling and retry logic

const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curalink';
        
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        };

        await mongoose.connect(mongoURI, options);
        
        logger.info('MongoDB connected successfully');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected, attempting to reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected successfully');
        });

        // Create indexes for better query performance
        await createIndexes();
        
    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        // Retry connection after delay
        setTimeout(connectDB, 5000);
    }
};

const createIndexes = async () => {
    try {
        const Conversation = require('../models/Conversation');
        const ResearchCache = require('../models/ResearchCache');
        
        await Conversation.collection.createIndex({ userId: 1, createdAt: -1 });
        await Conversation.collection.createIndex({ sessionId: 1 }, { unique: true });
        
        await ResearchCache.collection.createIndex({ queryHash: 1 }, { unique: true });
        await ResearchCache.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
        
        logger.info('Database indexes created successfully');
    } catch (error) {
        logger.error('Error creating indexes:', error);
    }
};

module.exports = connectDB;