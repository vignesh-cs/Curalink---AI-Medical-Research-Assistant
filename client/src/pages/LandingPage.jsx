// client/src/pages/LandingPage.jsx
// Exact Claude.ai homepage replica — Curalink branding

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CuralinkMark = ({ size = 32, dark = false }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill={dark ? '#d97706' : '#1a1a1a'} />
    <path d="M9 16L14 21L23 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    title: 'Intelligent Query Understanding',
    desc: 'Analyzes your question, identifies medical conditions, and expands queries for comprehensive retrieval.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: 'Multi-Source Research',
    desc: 'Simultaneously queries PubMed, OpenAlex, and ClinicalTrials.gov for comprehensive medical coverage.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Smart Ranking Engine',
    desc: 'Scores publications by relevance, recency, citation impact, and source credibility.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Citation-Backed Responses',
    desc: 'Every answer includes direct links to original peer-reviewed publications for full transparency.',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'));

  const handleTryFree = () => navigate('/auth');
  const handleSignIn  = () => navigate('/auth?mode=login');

  return (
    <div className={`lp-root${isDark ? ' dark' : ''}`}>
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="/" className="lp-logo">
            <div className="lp-logo-mark"><CuralinkMark size={20} /></div>
            <span className="lp-logo-text">Curalink</span>
          </a>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">How it works</a>
            <a href="#stats" className="lp-nav-link">Research</a>
            <button className="lp-nav-btn-outline" onClick={handleSignIn}>Log in</button>
            <button className="lp-nav-btn-fill" onClick={handleTryFree}>Try Curalink</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            AI-Powered Medical Research Assistant
          </div>
          <h1 className="lp-hero-h1">
            Your AI assistant for<br />
            <span className="lp-hero-h1-muted">medical research</span>
          </h1>
          <p className="lp-hero-sub">
            Curalink connects you directly to peer-reviewed evidence from PubMed,
            OpenAlex, and ClinicalTrials.gov. Ask any medical question and receive
            citation-backed, structured answers in seconds.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-cta-primary" onClick={handleTryFree}>
              Start for free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <span className="lp-cta-note">
              No credit card required ·{' '}
              <a href="/auth?mode=login">Already have an account?</a>
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="lp-features" id="features">
        <div className="lp-features-inner">
          <div className="lp-features-label">How Curalink works</div>
          <div className="lp-features-grid">
            {features.map((f) => (
              <div className="lp-feature-card" key={f.title}>
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="lp-stats" id="stats">
        <div className="lp-stats-inner">
          <div className="lp-stat">
            <span className="lp-stat-num">100+</span>
            <span className="lp-stat-lbl">Publications per search</span>
          </div>
          <div className="lp-stat-sep" />
          <div className="lp-stat">
            <span className="lp-stat-num">50+</span>
            <span className="lp-stat-lbl">Clinical trials tracked</span>
          </div>
          <div className="lp-stat-sep" />
          <div className="lp-stat">
            <span className="lp-stat-num">3</span>
            <span className="lp-stat-lbl">Research databases</span>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <CuralinkMark size={20} />
            <span className="lp-footer-brand-name">Curalink AI</span>
          </div>
          <span className="lp-footer-note">
            Research information only. Always consult a healthcare professional.
          </span>
          <div className="lp-footer-links">
            <a href="/auth?mode=login" className="lp-footer-link">Sign in</a>
            <a href="/auth" className="lp-footer-link">Sign up</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="lp-footer-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;