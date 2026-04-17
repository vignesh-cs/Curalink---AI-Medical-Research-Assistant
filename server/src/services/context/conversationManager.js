// server/src/services/context/conversationManager.js
// Conversation context management service

const Conversation = require('../../models/Conversation');
const logger = require('../../config/logger');

class ConversationManager {
    // Create new conversation
    async createConversation(sessionId, userContext = {}, metadata = {}) {
        try {
            const conversation = new Conversation({
                sessionId,
                userContext,
                contextVector: {
                    topicChain: userContext.diseaseOfInterest ? [userContext.diseaseOfInterest] : [],
                    lastQuery: null,
                    lastIntent: null,
                    lastDisease: userContext.diseaseOfInterest || null
                },
                metadata
            });
            
            await conversation.save();
            logger.info(`Created new conversation: ${sessionId}`);
            
            return conversation;
        } catch (error) {
            logger.error('Error creating conversation:', error);
            throw error;
        }
    }

    // Get conversation by session ID
    async getConversation(sessionId) {
        try {
            return await Conversation.findOne({ sessionId });
        } catch (error) {
            logger.error('Error getting conversation:', error);
            throw error;
        }
    }

    // Update user context
    async updateUserContext(sessionId, updates) {
        try {
            const conversation = await Conversation.findOne({ sessionId });
            
            if (!conversation) {
                throw new Error('Conversation not found');
            }
            
            conversation.userContext = {
                ...conversation.userContext,
                ...updates
            };
            
            if (updates.diseaseOfInterest) {
                conversation.contextVector.lastDisease = updates.diseaseOfInterest;
                conversation.contextVector.topicChain.push(updates.diseaseOfInterest);
            }
            
            await conversation.save();
            
            return conversation;
        } catch (error) {
            logger.error('Error updating user context:', error);
            throw error;
        }
    }

    // Get conversation context for LLM
    async getLLMContext(sessionId, messageLimit = 10) {
        try {
            const conversation = await Conversation.findOne({ sessionId });
            
            if (!conversation) {
                return null;
            }
            
            return conversation.getLLMContext(messageLimit);
        } catch (error) {
            logger.error('Error getting LLM context:', error);
            throw error;
        }
    }

    // Extract topics from conversation
    extractTopics(conversation) {
        const topics = new Set();
        
        conversation.messages.forEach(msg => {
            if (msg.metadata?.diseaseContext) {
                topics.add(msg.metadata.diseaseContext);
            }
            if (msg.metadata?.intent) {
                topics.add(msg.metadata.intent);
            }
        });
        
        return Array.from(topics);
    }

    // Check if follow-up needs fresh data
    needsFreshData(sessionId, newQuery) {
        // Get last assistant message
        const conversation = this.getConversation(sessionId);
        
        if (!conversation || conversation.messages.length === 0) {
            return true;
        }
        
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const timeSinceLastMessage = Date.now() - new Date(lastMessage.timestamp).getTime();
        
        // Get fresh data if more than 30 minutes old
        if (timeSinceLastMessage > 30 * 60 * 1000) {
            return true;
        }
        
        // Check for new topic indicators
        const newTopicIndicators = ['trial', 'study', 'research', 'publication', 'paper'];
        const queryLower = newQuery.toLowerCase();
        
        return newTopicIndicators.some(indicator => queryLower.includes(indicator));
    }

    // Clean up old conversations
    async cleanupOldConversations(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const result = await Conversation.deleteMany({
                updatedAt: { $lt: cutoffDate }
            });
            
            logger.info(`Cleaned up ${result.deletedCount} old conversations`);
            
            return result.deletedCount;
        } catch (error) {
            logger.error('Error cleaning up conversations:', error);
            throw error;
        }
    }
}

module.exports = new ConversationManager();