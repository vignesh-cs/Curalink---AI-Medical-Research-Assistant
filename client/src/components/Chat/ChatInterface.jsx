// client/src/components/Chat/ChatInterface.jsx
// Premium chat interface with animations and progress tracking - FULLY FIXED

import React, { useState, useRef, useEffect, useContext } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import { UserContext } from '../../contexts/UserContext';
import MessageBubble from './MessageBubble';
import StructuredResponse from './StructuredResponse';
import { LoadingSpinner, ResearchProgressBar, TypingIndicator } from '../Common/LoadingSpinner';
import { sendMessage, sendFollowUp } from '../../services/api';

const ChatInterface = ({ sessionId, onSessionCreated }) => {
    const { messages, addMessage, setLoading, isLoading } = useContext(ChatContext);
    const { userContext } = useContext(UserContext);
    
    const [inputValue, setInputValue] = useState('');
    const [researchProgress, setResearchProgress] = useState({ stage: 'query', progress: 0 });
    const [showProgress, setShowProgress] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Disease patterns for extraction
    const diseasePatterns = [
        'lung cancer', 'diabetes', 'alzheimer', 'parkinson', 
        'heart disease', 'breast cancer', 'prostate cancer', 
        'colorectal cancer', 'asthma', 'arthritis', 'melanoma', 
        'leukemia', 'bronchitis', 'copd', 'hypertension', 'stroke',
        'multiple sclerosis', 'crohn\'s disease', 'ulcerative colitis',
        'psoriasis', 'eczema', 'migraine', 'epilepsy', 'fibromyalgia'
    ];

    // Extract disease from message text
    const extractDiseaseFromMessage = (message) => {
        const messageLower = message.toLowerCase();
        for (const pattern of diseasePatterns) {
            if (messageLower.includes(pattern)) {
                return pattern;
            }
        }
        // If no pattern matches, return first 3 words as fallback
        const words = message.split(' ').slice(0, 3).join(' ');
        return words || 'medical condition';
    };

    // Smooth scroll with animation
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
        setTimeout(() => {
            chatContainerRef.current?.classList.add('chat-entrance-done');
        }, 100);
    }, []);

    // Simulate progress during research (for demo/UX)
    const simulateProgress = () => {
        setShowProgress(true);
        const stages = ['query', 'pubmed', 'openalex', 'trials', 'ranking', 'llm'];
        let currentStage = 0;
        
        const interval = setInterval(() => {
            if (currentStage < stages.length) {
                setResearchProgress({
                    stage: stages[currentStage],
                    progress: Math.round(((currentStage + 1) / stages.length) * 100)
                });
                currentStage++;
            } else {
                clearInterval(interval);
                setTimeout(() => setShowProgress(false), 500);
            }
        }, 800);
        
        return () => clearInterval(interval);
    };

    const handleSendMessage = async (isFollowUp = false) => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        
        // Animate input clearing
        inputRef.current?.classList.add('input-clearing');
        setTimeout(() => inputRef.current?.classList.remove('input-clearing'), 200);

        addMessage({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });

        setLoading(true);
        const cleanupProgress = simulateProgress();

        try {
            let response;
            
            // BUILD PROPER CONTEXT - CRITICAL FIX
            const diseaseOfInterest = userContext.diseaseOfInterest || extractDiseaseFromMessage(userMessage);
            const location = userContext.location || '';
            
            const contextToSend = {
                diseaseOfInterest: diseaseOfInterest,
                location: location
            };
            
            console.log('Sending with context:', contextToSend); // Debug log
            
            if (isFollowUp && sessionId) {
                response = await sendFollowUp(userMessage, sessionId);
            } else {
                response = await sendMessage(userMessage, sessionId, contextToSend);
                if (response.sessionId && !sessionId) {
                    onSessionCreated(response.sessionId);
                }
            }

            cleanupProgress();
            setShowProgress(false);
            
            addMessage({
                role: 'assistant',
                content: response.message.content,
                structuredContent: response.message.structuredContent,
                metadata: response.metadata,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error sending message:', error);
            cleanupProgress();
            setShowProgress(false);
            
            addMessage({
                role: 'assistant',
                content: 'I apologize, but I encountered an error processing your request. Please try again.',
                error: true,
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const isFollowUp = messages.length > 0;
            handleSendMessage(isFollowUp);
        }
    };

    const handleExampleClick = (example) => {
        setInputValue(example);
        inputRef.current?.focus();
        inputRef.current?.classList.add('input-pop');
        setTimeout(() => inputRef.current?.classList.remove('input-pop'), 300);
    };

    return (
        <div className="chat-interface" ref={chatContainerRef}>
            {/* Animated Background Gradient */}
            <div className="chat-bg-gradient"></div>
            
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="welcome-screen">
                        <div className="welcome-icon">
                            <svg viewBox="0 0 100 100" className="welcome-svg">
                                <circle cx="50" cy="50" r="45" className="welcome-circle" />
                                <path d="M30 50 L45 65 L70 35" className="welcome-check" />
                            </svg>
                        </div>
                        <h2 className="welcome-title">
                            <span className="gradient-text">Curalink AI</span>
                        </h2>
                        <p className="welcome-text">
                            Your AI-powered medical research assistant. 
                            <span className="welcome-highlight"> Evidence-based • Real-time • Comprehensive</span>
                        </p>
                        
                        <div className="example-queries">
                            <h3>
                                <span className="sparkle">✨</span> Try asking:
                            </h3>
                            <div className="example-grid">
                                <button 
                                    className="example-btn"
                                    onClick={() => handleExampleClick('Latest treatment for lung cancer')}
                                >
                                    <span className="btn-icon">🫁</span>
                                    Latest treatment for lung cancer
                                </button>
                                <button 
                                    className="example-btn"
                                    onClick={() => handleExampleClick('Clinical trials for diabetes')}
                                >
                                    <span className="btn-icon">💉</span>
                                    Clinical trials for diabetes
                                </button>
                                <button 
                                    className="example-btn"
                                    onClick={() => handleExampleClick('Top researchers in Alzheimer\'s disease')}
                                >
                                    <span className="btn-icon">🧠</span>
                                    Top researchers in Alzheimer's
                                </button>
                                <button 
                                    className="example-btn"
                                    onClick={() => handleExampleClick('Recent studies on heart disease')}
                                >
                                    <span className="btn-icon">❤️</span>
                                    Recent studies on heart disease
                                </button>
                            </div>
                        </div>
                        
                        {userContext.diseaseOfInterest && (
                            <div className="context-indicator glass-card">
                                <span className="context-icon">🎯</span>
                                <span>Current context: <strong>{userContext.diseaseOfInterest}</strong></span>
                                {userContext.location && <span className="context-location">📍 {userContext.location}</span>}
                            </div>
                        )}
                        
                        <div className="welcome-stats">
                            <div className="stat-item">
                                <span className="stat-value">100+</span>
                                <span className="stat-label">Publications per search</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">50+</span>
                                <span className="stat-label">Clinical Trials</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">3</span>
                                <span className="stat-label">Research Sources</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <MessageBubble 
                            key={index} 
                            message={message} 
                            isLast={index === messages.length - 1}
                        />
                    ))
                )}
                
                {showProgress && (
                    <div className="progress-container glass-card">
                        <ResearchProgressBar 
                            stage={researchProgress.stage} 
                            progress={researchProgress.progress} 
                        />
                    </div>
                )}
                
                {isLoading && !showProgress && (
                    <div className="typing-container glass-card">
                        <TypingIndicator />
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container glass-input">
                <div className="input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            messages.length > 0 
                                ? "Ask a follow-up question..." 
                                : "Ask about medical research, treatments, or clinical trials..."
                        }
                        rows={1}
                        disabled={isLoading}
                        aria-label="Chat message input"
                    />
                    <div className="input-actions">
                        <button
                            className="send-button"
                            onClick={() => handleSendMessage(messages.length > 0)}
                            disabled={!inputValue.trim() || isLoading}
                            aria-label="Send message"
                        >
                            <span className="send-icon">
                                {messages.length > 0 ? '↩️' : '📤'}
                            </span>
                            <span className="send-text">
                                {messages.length > 0 ? 'Follow-up' : 'Send'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            
            {messages.length > 0 && (
                <div className="follow-up-hint glass-hint">
                    <span className="hint-icon">💡</span>
                    <p>Ask follow-up questions to explore this topic further</p>
                    <div className="suggested-followups">
                        <button className="suggested-btn" onClick={() => handleExampleClick('What are the side effects?')}>
                            Side effects?
                        </button>
                        <button className="suggested-btn" onClick={() => handleExampleClick('Latest clinical trials')}>
                            Latest trials
                        </button>
                        <button className="suggested-btn" onClick={() => handleExampleClick('Alternative treatments')}>
                            Alternatives
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;