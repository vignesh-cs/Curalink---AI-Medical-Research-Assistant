// server/src/middleware/validation.js
// Request validation middleware

const { body, validationResult } = require('express-validator');

// Validation rules for chat messages
const validateChatMessage = [
    body('message')
        .notEmpty().withMessage('Message is required')
        .isString().withMessage('Message must be a string')
        .isLength({ min: 3, max: 1000 }).withMessage('Message must be between 3 and 1000 characters'),
    
    body('sessionId')
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage('Session ID must be a string'),
    
    body('userContext')
        .optional({ nullable: true })
        .isObject().withMessage('User context must be an object'),
    
    body('userContext.diseaseOfInterest')
        .optional({ nullable: true })
        .isString().withMessage('Disease of interest must be a string')
        .isLength({ max: 100 }).withMessage('Disease of interest too long'),
    
    body('userContext.location')
        .optional({ nullable: true })
        .isString().withMessage('Location must be a string')
        .isLength({ max: 100 }).withMessage('Location too long'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation rules for follow-up messages
const validateFollowUp = [
    body('message')
        .notEmpty().withMessage('Message is required')
        .isString().withMessage('Message must be a string')
        .isLength({ min: 2, max: 500 }).withMessage('Message must be between 2 and 500 characters'),
    
    body('sessionId')
        .notEmpty().withMessage('Session ID is required')
        .isString().withMessage('Session ID must be a string'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateChatMessage,
    validateFollowUp
};