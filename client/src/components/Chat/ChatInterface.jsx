import React, { useState, useRef, useEffect, useContext } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import { UserContext } from '../../contexts/UserContext';
import { sendMessage, sendFollowUp } from '../../services/api';

const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);

const MicIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
);

const AttachIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
);

const DISEASES = ['lung cancer','diabetes','alzheimer','parkinson','heart disease','breast cancer','prostate cancer','asthma','arthritis','melanoma','leukemia','bronchitis','copd','hypertension','stroke'];

const ChatInterface = ({ sessionId, onSessionCreated, sidebarOpen }) => {
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
    useEffect(() => { inputRef.current?.focus(); }, []);

    const simTyping = () => {
        const msgs = ['Analyzing query...','Searching PubMed...','Searching OpenAlex...','Checking ClinicalTrials.gov...','Ranking results...','Generating response...'];
        let i = 0;
        setTypingMsg(msgs[0]);
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
            stop();
            setTypingMsg('');
            addMessage({ role: 'assistant', content: resp.message.content, structuredContent: resp.message.structuredContent, metadata: resp.metadata, timestamp: new Date().toISOString() });
        } catch {
            stop();
            setTypingMsg('');
            addMessage({ role: 'assistant', content: 'Sorry, an error occurred. Please try again.', error: true, timestamp: new Date().toISOString() });
        } finally { setLoading(false); }
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(messages.length > 0); } };

    return (
        <div className="crl-chat">
            <div className="crl-chat-messages">
                {messages.length === 0 ? (
                    /* ===== WELCOME SCREEN ===== */
                    <div className="crl-welcome">
                        <h1 className="crl-welcome-heading">What's on the agenda today?</h1>
                        
                        {/* Main Input Bar */}
                        <div className="crl-welcome-input-box">
                            <input 
                                ref={inputRef}
                                className="crl-welcome-input"
                                placeholder="Ask anything"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(false); } }}
                            />
                            <div className="crl-welcome-input-actions">
                                <button className="crl-welcome-icon-btn" title="Attach">
                                    <AttachIcon />
                                </button>
                                <button className="crl-welcome-icon-btn" title="Voice input">
                                    <MicIcon />
                                </button>
                                {input.trim() && (
                                    <button className="crl-welcome-send-btn" onClick={() => handleSend(false)}>
                                        <SendIcon />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Action Pills */}
                        <div className="crl-welcome-pills">
                            <button className="crl-pill" onClick={() => { setInput('Latest lung cancer treatments'); handleSend(false); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                Create an image
                            </button>
                            <button className="crl-pill" onClick={() => { setInput('Analyze recent studies on diabetes'); handleSend(false); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Research analysis
                            </button>
                            <button className="crl-pill" onClick={() => handleSend(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                Look something up
                            </button>
                        </div>

                        {/* Promo Section */}
                        <div className="crl-promo-section">
                            <h2 className="crl-promo-title">Medical Research Assistant</h2>
                            <p className="crl-promo-desc">Evidence-based answers from PubMed, OpenAlex, and ClinicalTrials.gov — powered by DeepSeek R1.</p>
                            <div className="crl-promo-cards">
                                <button className="crl-promo-card" onClick={() => { setInput('Latest treatment for lung cancer'); handleSend(false); }}>
                                    <span>Latest lung cancer treatments</span>
                                </button>
                                <button className="crl-promo-card" onClick={() => { setInput('Clinical trials for diabetes 2025'); handleSend(false); }}>
                                    <span>Diabetes clinical trials 2025</span>
                                </button>
                                <button className="crl-promo-card" onClick={() => { setInput("Alzheimer's disease research 2025"); handleSend(false); }}>
                                    <span>Alzheimer's research 2025</span>
                                </button>
                                <button className="crl-promo-card" onClick={() => { setInput('Heart disease prevention studies'); handleSend(false); }}>
                                    <span>Heart disease prevention</span>
                                </button>
                                <button className="crl-promo-card" onClick={() => { setInput('Immunotherapy for cancer'); handleSend(false); }}>
                                    <span>Cancer immunotherapy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== MESSAGES ===== */
                    <>
                        {messages.map((msg, i) => (
                            <div key={i} className={`crl-msg ${msg.role === 'user' ? 'crl-msg-user' : 'crl-msg-bot'}`}>
                                <div className={`crl-msg-avatar ${msg.role === 'user' ? 'crl-avatar-user' : 'crl-avatar-bot'}`}>
                                    {msg.role === 'user' ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    )}
                                </div>
                                <div className="crl-msg-body">
                                    <div className="crl-msg-text">{msg.content}</div>
                                    {msg.metadata && (
                                        <div className="crl-msg-meta">
                                            {msg.metadata.sourcesCount || 0} sources · {msg.metadata.processingTime}ms
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {typingMsg && (
                            <div className="crl-msg crl-msg-bot">
                                <div className="crl-msg-avatar crl-avatar-bot">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                </div>
                                <div className="crl-msg-body">
                                    <div className="crl-typing">{typingMsg}<span className="crl-dot-pulse"></span></div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Bottom Input (when messages exist) */}
            {messages.length > 0 && (
                <div className="crl-input-area">
                    <div className="crl-input-box">
                        <button className="crl-input-icon-btn"><AttachIcon /></button>
                        <textarea
                            ref={inputRef}
                            className="crl-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Message Curalink..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <button className="crl-input-icon-btn"><MicIcon /></button>
                        <button className={`crl-send-btn ${input.trim() ? 'crl-send-active' : ''}`} onClick={() => handleSend(messages.length > 0)} disabled={!input.trim() || isLoading}>
                            <SendIcon />
                        </button>
                    </div>
                    <p className="crl-input-footer">Curalink provides research information only. Consult healthcare professionals for medical advice.</p>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;