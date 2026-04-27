// client/src/App.jsx
// Updated routing: Landing → Auth → Chat (protected)
// Exact Claude.ai flow replica for Curalink

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import { UserProvider } from './contexts/UserContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import QueryInputForm from './components/Query/QueryInputForm';
import './styles/global.css';

/* ── Protected route: redirects to /auth if not logged in ─── */
const Protected = ({ children }) => {
  const user = localStorage.getItem('curalink_user');
  return user ? children : <Navigate to="/auth" replace />;
};

/* ── Toast ──────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      background: type === 'error' ? '#fee2e2' : '#f0fdf4',
      border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
      borderRadius: 10, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: 14, color: type === 'error' ? '#991b1b' : '#166534',
      minWidth: 240, maxWidth: 380,
      animation: 'msgFadeIn 0.3s ease',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit', padding: 0 }}>×</button>
    </div>
  );
};

/* ── Chat app wrapper ────────────────────────────────────────── */
function ChatApp({ showStructuredInput, setShowStructuredInput, sessionId, handleSessionCreated }) {
  const closeStructured = () => setShowStructuredInput(false);

  return (
    <>
      <ChatPage
        sessionId={sessionId}
        onSessionCreated={handleSessionCreated}
        onToggleStructuredInput={() => setShowStructuredInput(!showStructuredInput)}
        showStructuredInput={showStructuredInput}
      />
      {showStructuredInput && (
        <QueryInputForm
          onClose={closeStructured}
          onComplete={closeStructured}
          onSessionCreated={handleSessionCreated}
        />
      )}
    </>
  );
}

/* ── Root App ────────────────────────────────────────────────── */
function App() {
  const [showStructuredInput, setShowStructuredInput] = useState(false);
  const [sessionId, setSessionId]                     = useState(null);
  const [toast, setToast]                             = useState(null);

  useEffect(() => {
    // Restore session
    const saved = localStorage.getItem('curalink_session_id');
    if (saved) setSessionId(saved);

    // Restore dark mode
    const savedDark = localStorage.getItem('curalink-dark-mode');
    if (savedDark === 'true') document.documentElement.classList.add('dark');
  }, []);

  const handleSessionCreated = (id) => {
    setSessionId(id);
    localStorage.setItem('curalink_session_id', id);
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  return (
    <ErrorBoundary>
      <UserProvider>
        <ChatProvider sessionId={sessionId}>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/"     element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected */}
              <Route path="/chat" element={
                <Protected>
                  <ChatApp
                    showStructuredInput={showStructuredInput}
                    setShowStructuredInput={setShowStructuredInput}
                    sessionId={sessionId}
                    handleSessionCreated={handleSessionCreated}
                  />
                </Protected>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}
          </BrowserRouter>
        </ChatProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;