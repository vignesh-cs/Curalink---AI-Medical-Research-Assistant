// client/src/components/Common/Navbar.jsx
// Premium navbar with dark mode toggle and animations

import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ChatContext } from '../../contexts/ChatContext';

const Navbar = ({ onToggleStructuredInput, showStructuredInput }) => {
    const { userContext, clearUserContext } = useContext(UserContext);
    const { clearMessages, sessionId } = useContext(ChatContext);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem('curalink-dark-mode', !isDarkMode);
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
        const messages = JSON.parse(localStorage.getItem('curalink_messages') || '[]');
        if (messages.length === 0) {
            alert('No conversation to export');
            return;
        }
        
        const exportData = {
            sessionId,
            userContext,
            messages,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `curalink-conversation-${Date.now()}.json`;
        a.click();
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
                {userContext.diseaseOfInterest && (
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
                    href="https://github.com/your-repo/curalink" 
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