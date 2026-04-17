// server/src/routes/chatRoutes.js
// Routes for chat functionality

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { validateChatMessage, validateFollowUp } = require('../middleware/validation');

// Process new chat message
router.post('/message', validateChatMessage, chatController.processMessage.bind(chatController));

// Process follow-up message
router.post('/follow-up', validateFollowUp, chatController.processFollowUp.bind(chatController));

// Get conversation by session ID
router.get('/conversation/:sessionId', chatController.getConversation.bind(chatController));

// Create new conversation
router.post('/conversation', chatController.createConversation.bind(chatController));

// Clear conversation (client-side handled, but endpoint for future)
router.delete('/conversation/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const Conversation = require('../models/Conversation');
        
        await Conversation.findOneAndDelete({ sessionId });
        
        res.status(200).json({
            success: true,
            message: 'Conversation cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;