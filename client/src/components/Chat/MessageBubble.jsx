// client/src/components/Chat/MessageBubble.jsx
// Premium message bubble with typing animation and 3D effects

import React, { useState, useEffect } from 'react';
import StructuredResponse from './StructuredResponse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ message, isLast }) => {
    const [showStructured, setShowStructured] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const isUser = message.role === 'user';

    useEffect(() => {
        setIsVisible(true);
        
        // Typing animation for assistant messages
        if (!isUser && isLast && message.content && !message.structuredContent) {
            setIsTyping(true);
            const text = message.content;
            let index = 0;
            setDisplayText('');
            
            const interval = setInterval(() => {
                if (index < text.length) {
                    setDisplayText(prev => prev + text[index]);
                    index++;
                } else {
                    setIsTyping(false);
                    clearInterval(interval);
                }
            }, 15);
            
            return () => clearInterval(interval);
        } else {
            setDisplayText(message.content);
        }
    }, [message, isUser, isLast]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div 
            className={`message-bubble-container ${isUser ? 'user-message' : 'assistant-message'} ${isVisible ? 'message-visible' : ''}`}
            style={{ '--animation-order': isUser ? 0 : 1 }}
        >
            <div className="message-header">
                <span className="message-role">
                    <span className="role-icon">{isUser ? '👤' : '🤖'}</span>
                    {isUser ? 'You' : 'Curalink Assistant'}
                </span>
                <span className="message-time">{formatTimestamp(message.timestamp)}</span>
            </div>
            
            <div className={`message-content ${isUser ? 'user-content' : 'assistant-content'} glass-card`}>
                {isUser ? (
                    <p className="user-message-text">{message.content}</p>
                ) : (
                    <>
                        {message.structuredContent && showStructured ? (
                            <StructuredResponse 
                                content={message.structuredContent}
                                metadata={message.metadata}
                            />
                        ) : (
                            <div className="markdown-wrapper">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    className="markdown-content"
                                >
                                    {isTyping ? displayText : message.content}
                                </ReactMarkdown>
                                {isTyping && <span className="typing-cursor">|</span>}
                            </div>
                        )}
                        
                        {message.structuredContent && (
                            <div className="message-controls">
                                <button
                                    className="text-button"
                                    onClick={() => setShowStructured(!showStructured)}
                                >
                                    <span className="btn-icon">{showStructured ? '📝' : '📊'}</span>
                                    {showStructured ? 'Show Raw Response' : 'Show Structured View'}
                                </button>
                                
                                {message.metadata && (
                                    <span className="message-metadata">
                                        <span className="metadata-item">
                                            📚 {message.metadata.sourcesCount || 
                                                message.structuredContent.sources?.length || 0} sources
                                        </span>
                                        <span className="metadata-item">
                                            ⚡ {message.metadata.processingTime}ms
                                        </span>
                                    </span>
                                )}
                            </div>
                        )}
                        
                        {message.error && (
                            <div className="error-indicator glass-error">
                                <span className="error-icon">⚠️</span>
                                <span>Error processing request. Please try again.</span>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {!isUser && isLast && !message.error && (
                <div className="message-actions">
                    <button className="action-btn" title="Copy response">
                        📋
                    </button>
                    <button className="action-btn" title="Regenerate">
                        🔄
                    </button>
                    <button className="action-btn" title="Save">
                        ⭐
                    </button>
                </div>
            )}
        </div>
    );
};

export default MessageBubble;