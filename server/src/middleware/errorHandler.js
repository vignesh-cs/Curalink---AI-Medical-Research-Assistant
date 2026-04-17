// server/src/middleware/errorHandler.js
// Global error handling middleware

const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    // Determine status code
    const statusCode = err.statusCode || 500;
    
    // Build error response
    const errorResponse = {
        success: false,
        error: {
            message: err.message || 'Internal server error',
            code: err.code || 'INTERNAL_ERROR'
        }
    };
    
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        errorResponse.error.message = 'Validation error';
        errorResponse.error.details = err.details;
        return res.status(400).json(errorResponse);
    }
    
    if (err.name === 'MongoError' && err.code === 11000) {
        errorResponse.error.message = 'Duplicate entry error';
        return res.status(409).json(errorResponse);
    }
    
    if (err.name === 'JsonWebTokenError') {
        errorResponse.error.message = 'Invalid token';
        return res.status(401).json(errorResponse);
    }
    
    // Default response
    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;