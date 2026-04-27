// client/src/components/Chat/ChatWindow.jsx
// Pixel-perfect Claude.ai mirror interface

import React, { useState, useRef, useEffect, useContext } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import { UserContext } from '../../contexts/UserContext';
import { sendMessage, sendFollowUp } from '../../services/api';
import MessageBubble from './MessageBubble';

const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);

const DISEASES = ['lung cancer','diabetes','alzheimer','parkinson','heart disease','breast cancer','prostate cancer','asthma','arthritis','melanoma','leukemia','bronchitis','copd','hypertension','stroke'];

const ChatWindow = ({ sessionId, onSessionCreated, sidebarOpen }) => {
    const { messages, addMessage, setLoading, isLoading } = useContext(ChatContext);
    const { userContext } = useContext(UserContext);
    const [input, setInput] = useState('');
    const [typingMsg, setTypingMsg] = useState('');
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const extractDisease = (msg) => {
        const l = msg.toLowerCase();
        for (const d of DISEASES) if (l.includes(d)) return d;
        return msg.split(' ').slice(0,3).join(' ') || 'medical research';
    };

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingMsg]);

    const simTyping = () => {
        const msgs = ['Analyzing query...','Searching PubMed...','Searching OpenAlex...','Checking ClinicalTrials.gov...','Ranking results...','Generating response...'];
        let i = 0; setTypingMsg(msgs[0]);
        const iv = setInterval(() => { i++; if (i < msgs.length) setTypingMsg(msgs[i]); else { setTypingMsg(''); clearInterval(iv); } }, 600);
        return () => clearInterval(iv);
    };

    const handleSend = async (isFollowUp = false) => {
        const msg = input.trim();
        if (!msg || isLoading) return;
        setInput('');
        addMessage({ role: 'user', content: msg, timestamp: new Date().toISOString() });
        setLoading(true);
        const stop = simTyping();
        try {
            const disease = userContext.diseaseOfInterest || extractDisease(msg);
            let resp;
            if (isFollowUp && sessionId) resp = await sendFollowUp(msg, sessionId);
            else {
                resp = await sendMessage(msg, sessionId, { diseaseOfInterest: disease, location: userContext.location || '' });
                if (resp.sessionId && !sessionId) onSessionCreated(resp.sessionId);
            }
            stop(); setTypingMsg('');
            addMessage({ role: 'assistant', content: resp.message.content, structuredContent: resp.message.structuredContent, metadata: resp.metadata, timestamp: new Date().toISOString() });
        } catch {
            stop(); setTypingMsg('');
            addMessage({ role: 'assistant', content: 'Sorry, an error occurred. Please try again.', error: true, timestamp: new Date().toISOString() });
        } finally { setLoading(false); }
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(messages.length > 0); } };

    // Claude-exact suggestion queries
    const suggestionQueries = [
        { text: 'Latest lung cancer treatments', query: 'Latest treatment for lung cancer' },
        { text: 'Diabetes clinical trials 2025', query: 'Clinical trials for diabetes 2025' },
        { text: "Alzheimer's research advances", query: "Alzheimer's disease latest research 2025" },
        { text: 'Heart disease prevention studies', query: 'Recent studies on heart disease prevention' },
    ];

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Get user's first name
    const getUserName = () => {
        const saved = localStorage.getItem('curalink_user');
        if (saved && saved.includes('@')) return saved.split('@')[0];
        if (saved) return saved;
        return '';
    };

    const userName = getUserName();
    const greeting = getGreeting();

    return (
        <div className="chatwindow">
            <div className="chat-messages">
                {messages.length === 0 ? (
                    /* ===== CLAUDE-EXACT WELCOME SCREEN ===== */
                    <div className="claude-welcome">
                        {/* Greeting */}
                        <h1 className="claude-greeting">
                            {greeting}{userName ? `, ${userName}` : ''}
                        </h1>
                        
                        {/* Center Input - Claude Style */}
                        <div className="claude-center-input">
                            <div className="claude-input-container">
                                <textarea
                                    ref={inputRef}
                                    className="claude-textarea"
                                    placeholder="Ask anything"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    rows={1}
                                    disabled={isLoading}
                                />
                                <div className="claude-input-actions">
                                    <button className="claude-input-btn" title="Attach files" disabled={isLoading}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                                        </svg>
                                    </button>
                                    <button className="claude-input-btn" title="Voice input" disabled={isLoading}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                                            <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                                            <line x1="12" y1="19" x2="12" y2="23"/>
                                            <line x1="8" y1="23" x2="16" y2="23"/>
                                        </svg>
                                    </button>
                                    {input.trim() && (
                                        <button className="claude-send-btn" onClick={() => handleSend(false)} disabled={isLoading}>
                                            <SendIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Pills - Claude Exact */}
                        <div className="claude-pills">
                            <button className="claude-pill" onClick={() => { setInput('Latest lung cancer treatments'); inputRef.current?.focus(); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                </svg>
                                <span>Create image</span>
                            </button>
                            <button className="claude-pill" onClick={() => { setInput('Analyze latest diabetes research'); inputRef.current?.focus(); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                <span>Research analysis</span>
                            </button>
                            <button className="claude-pill" onClick={() => { setInput('Clinical trials near me'); inputRef.current?.focus(); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                                <span>Look something up</span>
                            </button>
                            <button className="claude-pill" onClick={() => { setInput('Help me understand medical research'); inputRef.current?.focus(); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                <span>Get advice</span>
                            </button>
                        </div>

                        {/* Suggestion Cards */}
                        <div className="claude-suggestions">
                            <h2 className="claude-suggestions-title">Medical Research Assistant</h2>
                            <p className="claude-suggestions-desc">
                                Evidence-based answers from PubMed, OpenAlex, and ClinicalTrials.gov
                            </p>
                            <div className="claude-suggestions-grid">
                                {suggestionQueries.map((s, i) => (
                                    <button
                                        key={i}
                                        className="claude-suggestion-card"
                                        onClick={() => { setInput(s.query); setTimeout(() => handleSend(false), 50); }}
                                    >
                                        <span>{s.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== MESSAGES ===== */
                    <>
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} message={msg} />
                        ))}
                        {typingMsg && (
                            <div className="msg-row msg-bot">
                                <div className="msg-avatar msg-avatar-bot">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                                    </svg>
                                </div>
                                <div className="msg-bubble msg-bubble-bot">
                                    <span className="typing-indicator">{typingMsg}</span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Bottom Input Bar (only when messages exist) */}
            {messages.length > 0 && (
                <div className="claude-bottom-input">
                    <div className="claude-bottom-container">
                        <button className="claude-input-btn" title="Attach files" disabled={isLoading}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                            </svg>
                        </button>
                        <textarea
                            ref={inputRef}
                            className="claude-textarea claude-textarea-bottom"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Message Curalink..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <button className="claude-input-btn" title="Voice input" disabled={isLoading}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                        </button>
                        <button
                            className={`claude-send-btn-bottom ${input.trim() ? 'active' : ''}`}
                            onClick={() => handleSend(messages.length > 0)}
                            disabled={!input.trim() || isLoading}
                            title="Send message"
                        >
                            <SendIcon />
                        </button>
                    </div>
                    <p className="claude-disclaimer">
                        Curalink provides research information only. Consult healthcare professionals for medical advice.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;