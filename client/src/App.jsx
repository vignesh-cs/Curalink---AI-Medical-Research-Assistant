// client/src/App.jsx
// Premium app with toast notifications and global enhancements

import React, { useState, useEffect } from 'react';
import { ChatProvider } from './contexts/ChatContext';
import { UserProvider } from './contexts/UserContext';
import Navbar from './components/Common/Navbar';
import ChatInterface from './components/Chat/ChatInterface';
import QueryInputForm from './components/Query/QueryInputForm';
import ErrorBoundary from './components/Common/ErrorBoundary';
import './styles/global.css';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type} glass-toast`}>
            <span className="toast-icon">
                {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
};

function App() {
    const [showStructuredInput, setShowStructuredInput] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [toast, setToast] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedSessionId = localStorage.getItem('curalink_session_id');
        if (savedSessionId) {
            setSessionId(savedSessionId);
        }
        
        // Check dark mode preference
        const savedDarkMode = localStorage.getItem('curalink-dark-mode');
        if (savedDarkMode === 'true') {
            document.documentElement.classList.add('dark-mode');
        }
        
        // Entrance animation
        setTimeout(() => setIsLoaded(true), 100);
        
        // Welcome toast
        setToast({ message: 'Welcome to Curalink AI Medical Assistant', type: 'success' });
    }, []);

    const handleSessionCreated = (newSessionId) => {
        setSessionId(newSessionId);
        localStorage.setItem('curalink_session_id', newSessionId);
        setToast({ message: 'New research session started', type: 'success' });
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    return (
        <ErrorBoundary>
            <UserProvider>
                <ChatProvider sessionId={sessionId}>
                    <div className={`app-container ${isLoaded ? 'app-loaded' : ''}`}>
                        {/* Animated Background */}
                        <div className="app-bg">
                            <div className="bg-gradient bg-gradient-1"></div>
                            <div className="bg-gradient bg-gradient-2"></div>
                            <div className="bg-gradient bg-gradient-3"></div>
                        </div>
                        
                        <Navbar 
                            onToggleStructuredInput={() => setShowStructuredInput(!showStructuredInput)}
                            showStructuredInput={showStructuredInput}
                        />
                        
                        <main className="main-content">
                            {showStructuredInput ? (
                                <div className="structured-input-section fade-in">
                                    <QueryInputForm 
                                        onSessionCreated={handleSessionCreated}
                                        onComplete={() => setShowStructuredInput(false)}
                                    />
                                </div>
                            ) : (
                                <ChatInterface 
                                    sessionId={sessionId}
                                    onSessionCreated={handleSessionCreated}
                                />
                            )}
                        </main>
                        
                        <footer className="app-footer glass-footer">
                            <p className="footer-text">
                                <span className="footer-logo">🏥 Curalink AI</span>
                                <span className="footer-divider">•</span>
                                Medical Research Assistant
                                <span className="footer-disclaimer">
                                    This tool provides research information only. Consult healthcare professionals for medical advice.
                                </span>
                            </p>
                        </footer>
                        
                        {/* Floating Action Button */}
                        <button 
                            className="fab glass-fab"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            aria-label="Scroll to top"
                        >
                            <span className="fab-icon">↑</span>
                        </button>
                        
                        {/* Toast Notifications */}
                        {toast && (
                            <Toast 
                                message={toast.message}
                                type={toast.type}
                                onClose={() => setToast(null)}
                            />
                        )}
                    </div>
                </ChatProvider>
            </UserProvider>
        </ErrorBoundary>
    );
}

export default App;