// client/src/components/Common/Navbar.jsx
// Premium navbar with dark mode toggle and animations - FIXED EXPORT

import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ChatContext } from '../../contexts/ChatContext';

const Navbar = ({ onToggleStructuredInput, showStructuredInput }) => {
    const { userContext, clearUserContext } = useContext(UserContext);
    const { messages, clearMessages, sessionId } = useContext(ChatContext);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        // Check saved dark mode preference
        const savedDarkMode = localStorage.getItem('curalink-dark-mode');
        if (savedDarkMode === 'true') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark-mode');
        }
        
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        if (newDarkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        localStorage.setItem('curalink-dark-mode', newDarkMode);
    };

    const handleNewConversation = () => {
        if (window.confirm('Start a new conversation? Current chat will be cleared.')) {
            clearMessages();
            clearUserContext();
            localStorage.removeItem('curalink_session_id');
            window.location.reload();
        }
    };

    const handleExportConversation = () => {
        // FIXED: Use messages from ChatContext, not localStorage
        if (!messages || messages.length === 0) {
            alert('No conversation to export');
            return;
        }
        
        const exportData = {
            sessionId: sessionId || 'no-session',
            userContext: userContext || {},
            messages: messages,
            exportedAt: new Date().toISOString(),
            appVersion: '1.0.0',
            totalMessages: messages.length
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `curalink-conversation-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''} glass-nav`}>
            <div className="navbar-brand">
                <a href="/" className="navbar-logo">
                    <span className="logo-icon">🏥</span>
                    Curalink <span className="logo-accent">AI</span>
                    <span className="logo-badge">BETA</span>
                </a>
                {userContext?.diseaseOfInterest && (
                    <span className="context-badge glass-badge">
                        <span className="badge-icon">🔬</span>
                        {userContext.diseaseOfInterest}
                    </span>
                )}
                {sessionId && (
                    <span className="session-badge">
                        <span className="badge-dot"></span>
                        Session: {sessionId.slice(-8)}
                    </span>
                )}
            </div>
            
            <div className="navbar-actions">
                <button 
                    className={`navbar-button ${showStructuredInput ? 'active' : ''}`}
                    onClick={onToggleStructuredInput}
                    title={showStructuredInput ? 'Switch to Chat' : 'Structured Query'}
                    aria-label="Toggle structured input"
                >
                    <span className="btn-icon">{showStructuredInput ? '💬' : '📋'}</span>
                    <span className="btn-text">{showStructuredInput ? 'Chat Mode' : 'Structured Query'}</span>
                </button>
                
                <button 
                    className="navbar-button"
                    onClick={handleNewConversation}
                    title="New Conversation"
                    aria-label="Start new conversation"
                >
                    <span className="btn-icon">🆕</span>
                    <span className="btn-text">New</span>
                </button>
                
                <button 
                    className="navbar-button"
                    onClick={handleExportConversation}
                    title="Export Conversation"
                    aria-label="Export conversation"
                >
                    <span className="btn-icon">📥</span>
                    <span className="btn-text">Export</span>
                </button>
                
                <button 
                    className="navbar-button dark-mode-toggle"
                    onClick={toggleDarkMode}
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle dark mode"
                >
                    <span className="btn-icon">{isDarkMode ? '☀️' : '🌙'}</span>
                </button>
                
                <a 
                    href="https://github.com/vignesh-cs/Curalink---AI-Medical-Research-Assistant" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="navbar-button"
                    aria-label="Documentation"
                >
                    <span className="btn-icon">📚</span>
                    <span className="btn-text">Docs</span>
                </a>
            </div>
        </nav>
    );
};

export default Navbar;