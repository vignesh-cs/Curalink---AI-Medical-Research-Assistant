// server/src/routes/queryRoutes.js
// Routes for query processing

const express = require('express');
const router = express.Router();
const queryExpander = require('../services/retrieval/queryExpander');
const logger = require('../config/logger');

// Expand query endpoint
router.post('/expand', async (req, res) => {
    try {
        const { query, diseaseContext, location } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }
        
        const expandedContext = queryExpander.buildExpandedQuery(
            query,
            diseaseContext,
            location
        );
        
        res.status(200).json({
            success: true,
            data: expandedContext
        });
    } catch (error) {
        logger.error('Query expansion error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Detect intent endpoint
router.post('/detect-intent', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }
        
        const intent = queryExpander.detectIntent(query);
        
        res.status(200).json({
            success: true,
            data: { intent }
        });
    } catch (error) {
        logger.error('Intent detection error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;