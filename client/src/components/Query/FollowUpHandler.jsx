// client/src/components/Query/FollowUpHandler.jsx
// Follow-up question handler component

import React, { useState, useContext } from 'react';
import { ChatContext } from '../../contexts/ChatContext';

const FollowUpHandler = ({ onFollowUp }) => {
    const { messages, isLoading } = useContext(ChatContext);
    const [followUpInput, setFollowUpInput] = useState('');

    const suggestedFollowUps = [
        'Tell me more about treatment options',
        'What are the side effects?',
        'Are there ongoing clinical trials?',
        'What is the prognosis?',
        'Latest research developments',
        'Alternative therapies available'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (followUpInput.trim() && !isLoading) {
            onFollowUp(followUpInput.trim());
            setFollowUpInput('');
        }
    };

    const handleSuggestionClick = (suggestion) => {
        onFollowUp(suggestion);
    };

    // Only show if there are messages
    if (messages.length === 0) {
        return null;
    }

    return (
        <div className="follow-up-handler">
            <form onSubmit={handleSubmit} className="follow-up-form">
                <input
                    type="text"
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className="follow-up-input"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    className="follow-up-button"
                    disabled={!followUpInput.trim() || isLoading}
                >
                    Ask
                </button>
            </form>
            
            <div className="suggested-follow-ups">
                <span className="suggestions-label">Suggested follow-ups:</span>
                <div className="suggestions-list">
                    {suggestedFollowUps.map((suggestion, index) => (
                        <button
                            key={index}
                            className="suggestion-btn"
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FollowUpHandler;