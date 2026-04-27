// client/src/components/Common/Navbar.jsx
// FIXED: All buttons clickable, dark mode works, proper CSS classes

import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ChatContext } from '../../contexts/ChatContext';

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FormIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
);

const Navbar = ({ onToggleStructuredInput, showStructuredInput }) => {
  const { userContext } = useContext(UserContext);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('curalink-dark-mode');
    const isDark = savedDarkMode === 'true' || document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('dark-mode', next);
    localStorage.setItem('curalink-dark-mode', String(next));
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onToggleStructuredInput === 'function') {
      onToggleStructuredInput();
    }
  };

  return (
    <nav className={`crl-navbar${isScrolled ? ' crl-navbar-scrolled' : ''}`}>
      {/* Brand */}
      <div className="crl-navbar-brand">
        <a href="/" className="crl-navbar-logo">
          <img src="/medical-logo.svg" alt="Curalink" style={{ width: 26, height: 26 }} />
          <span className="crl-navbar-name">Curalink</span>
          <span className="crl-navbar-accent">AI</span>
        </a>
        {userContext?.diseaseOfInterest && (
          <span className="crl-context-badge">{userContext.diseaseOfInterest}</span>
        )}
      </div>

      {/* Actions */}
      <div className="crl-navbar-actions">
        {/* Chat mode / Structured query toggle */}
        <button
          className={`crl-nav-btn${showStructuredInput ? ' crl-nav-btn-active' : ''}`}
          onClick={handleToggle}
          type="button"
          title={showStructuredInput ? 'Switch to Chat Mode' : 'Open Structured Query'}
        >
          {showStructuredInput ? <ChatIcon /> : <FormIcon />}
          <span>{showStructuredInput ? 'Chat Mode' : 'Structured Query'}</span>
        </button>

        {/* Theme toggle */}
        <button
          className="crl-nav-btn crl-nav-icon-btn"
          onClick={toggleDarkMode}
          type="button"
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
          <span className="crl-nav-btn-label">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;