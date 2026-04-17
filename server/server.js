// server/server.js
// Updated server entry point that imports app.js

const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the configured Express app
const app = require('./src/app');
const logger = require('./src/config/logger');
const connectDB = require('./src/config/database');

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);
    
    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
        socket.join(conversationId);
        logger.info(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
        socket.to(data.conversationId).emit('user-typing', {
            userId: socket.id,
            isTyping: data.isTyping
        });
    });
    
    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
        socket.leave(conversationId);
        logger.info(`Socket ${socket.id} left conversation: ${conversationId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
        logger.info(`Socket client disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Handle errors
    socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
    });
});

// Make io accessible to routes via app
app.set('io', io);

// Store server reference in app for graceful shutdown
app.setServer(server);

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`=========================================`);
    logger.info(`🚀 Curalink Server Started`);
    logger.info(`=========================================`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Port: ${PORT}`);
    logger.info(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    logger.info(`MongoDB: ${mongoose.connection.host || 'connecting...'}`);
    logger.info(`Ollama URL: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
    logger.info(`=========================================`);
});

// Handle server errors
server.on('error', (error) => {
    logger.error('Server error:', error);
    
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Export for testing
module.exports = { app, server, io };