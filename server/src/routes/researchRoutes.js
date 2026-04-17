// server/src/routes/researchRoutes.js
// Routes for research data retrieval

const express = require('express');
const router = express.Router();
const pubmedService = require('../services/retrieval/pubmedService');
const openAlexService = require('../services/retrieval/openAlexService');
const clinicalTrialsService = require('../services/retrieval/clinicalTrialsService');
const rankingEngine = require('../services/retrieval/rankingEngine');
const logger = require('../config/logger');

// Search publications
router.post('/publications', async (req, res) => {
    try {
        const { query, maxResults = 50, sources = ['pubmed', 'openalex'] } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }
        
        const results = [];
        
        if (sources.includes('pubmed')) {
            const pubmedResults = await pubmedService.getPublications(query, Math.floor(maxResults / 2));
            results.push(...pubmedResults);
        }
        
        if (sources.includes('openalex')) {
            const openAlexResults = await openAlexService.getPublications(query, Math.floor(maxResults / 2));
            results.push(...openAlexResults);
        }
        
        const rankedResults = rankingEngine.rankPublications(results, query);
        
        res.status(200).json({
            success: true,
            data: {
                publications: rankedResults,
                total: rankedResults.length
            }
        });
    } catch (error) {
        logger.error('Publications search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Search clinical trials
router.post('/trials', async (req, res) => {
    try {
        const { condition, location, maxResults = 50 } = req.body;
        
        if (!condition) {
            return res.status(400).json({
                success: false,
                error: 'Condition is required'
            });
        }
        
        const result = await clinicalTrialsService.getTrialsByCondition(condition, {
            location,
            pageSize: maxResults
        });
        
        const rankedTrials = rankingEngine.rankClinicalTrials(
            result.studies,
            condition,
            { userLocation: location }
        );
        
        res.status(200).json({
            success: true,
            data: {
                trials: rankedTrials,
                total: result.totalCount
            }
        });
    } catch (error) {
        logger.error('Clinical trials search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get trial by NCT ID
router.get('/trial/:nctId', async (req, res) => {
    try {
        const { nctId } = req.params;
        
        const trial = await clinicalTrialsService.getTrialById(nctId);
        
        if (!trial) {
            return res.status(404).json({
                success: false,
                error: 'Trial not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: trial
        });
    } catch (error) {
        logger.error('Get trial error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;