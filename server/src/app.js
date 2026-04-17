// server/src/app.js
// Express application configuration and middleware setup
// FULLY CORRECTED VERSION - NO HEADER ERRORS

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();

// Import custom modules
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const chatRoutes = require('./routes/chatRoutes');
const queryRoutes = require('./routes/queryRoutes');
const researchRoutes = require('./routes/researchRoutes');

// Initialize Express app
const app = express();

// Disable ETag and X-Powered-By headers
app.disable('etag');
app.disable('x-powered-by');

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Compression middleware
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Body parsing middleware
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ 
                success: false, 
                error: 'Invalid JSON payload' 
            });
            throw new Error('Invalid JSON');
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Logging middleware
app.use(morgan('combined', { 
    stream: { 
        write: (message) => logger.info(message.trim()) 
    },
    skip: (req) => req.url === '/health' || req.url === '/ready'
}));

// Rate limiting
app.use('/api/', rateLimiter);

// Request ID middleware - COMPLETELY SAFE VERSION
app.use((req, res, next) => {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    // Don't set header here - let response handle it
    next();
});

// Response timing - Store start time only, no header manipulation
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/research', researchRoutes);

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        requestId: req.requestId,
        services: {
            mongodb: 'disconnected',
            llm: 'unknown'
        },
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    };
    
    // Check MongoDB connection
    try {
        const dbState = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        healthStatus.services.mongodb = states[dbState] || 'unknown';
    } catch (error) {
        healthStatus.services.mongodb = 'error';
        healthStatus.status = 'degraded';
    }
    
    // Check LLM service
    try {
        const ollamaService = require('./services/llm/ollamaService');
        const llmHealth = await ollamaService.checkHealth();
        healthStatus.services.llm = llmHealth.healthy ? 'connected' : 'disconnected';
        healthStatus.services.llmModel = llmHealth.modelAvailable;
    } catch (error) {
        healthStatus.services.llm = 'error';
        healthStatus.status = 'degraded';
    }
    
    // Set overall status
    if (healthStatus.services.mongodb !== 'connected' || 
        healthStatus.services.llm !== 'connected') {
        healthStatus.status = 'degraded';
    }
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    // Set headers before sending
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Response-Time', `${Date.now() - (req.startTime || Date.now())}ms`);
    
    res.status(statusCode).json(healthStatus);
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
    const isReady = mongoose.connection.readyState === 1;
    
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Response-Time', `${Date.now() - (req.startTime || Date.now())}ms`);
    
    if (isReady) {
        res.status(200).json({ 
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(503).json({ 
            status: 'not ready',
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.url} not found`,
            code: 'NOT_FOUND'
        },
        requestId: req.requestId
    });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handler
let server = null;

app.setServer = (httpServer) => {
    server = httpServer;
};

const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown...`);
    
    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');
            
            try {
                await mongoose.connection.close(false);
                logger.info('MongoDB connection closed');
            } catch (error) {
                logger.error('Error closing MongoDB connection:', error);
            }
            
            logger.info('Graceful shutdown complete');
            process.exit(0);
        });
        
        setTimeout(() => {
            logger.error('Forced shutdown due to timeout');
            process.exit(1);
        }, 30000);
    } else {
        process.exit(0);
    }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions - Log only, don't crash
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
        gracefulShutdown('UNCAUGHT_EXCEPTION_CRITICAL');
    }
});

// Handle unhandled rejections - Log only
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', { reason });
});

module.exports = app;