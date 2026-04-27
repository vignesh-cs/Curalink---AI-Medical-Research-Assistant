// client/src/components/Common/LoadingSpinner.jsx
// Curalink v2.0 - Premium Loaders with Logo Animation

import React from 'react';

// Main Spinner with Curalink Logo
export const LoadingSpinner = ({ size = 'md', text = '' }) => {
    const sizes = { sm: 32, md: 48, lg: 72 };
    const px = sizes[size] || 48;

    return (
        <div className="crl-loader">
            <svg width={px} height={px} viewBox="0 0 64 64" className="crl-loader-svg">
                <defs>
                    <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9"/>
                        <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="28" fill="none" stroke="url(#loadGrad)" strokeWidth="2" opacity="0.2"/>
                <circle cx="32" cy="32" r="28" fill="none" stroke="url(#loadGrad)" strokeWidth="2.5" 
                    strokeDasharray="176" strokeDashoffset="132" className="crl-loader-circle"/>
                <path d="M20 32h24M32 20v24" stroke="url(#loadGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
            </svg>
            {text && <span className="crl-loader-text">{text}</span>}
        </div>
    );
};

// Research Progress Bar
export const ResearchProgressBar = ({ stage, progress }) => {
    const stages = [
        { id: 'query', label: 'Understanding', icon: '🔍' },
        { id: 'pubmed', label: 'PubMed', icon: '📚' },
        { id: 'openalex', label: 'OpenAlex', icon: '🔬' },
        { id: 'trials', label: 'Trials', icon: '🏥' },
        { id: 'ranking', label: 'Ranking', icon: '📊' },
        { id: 'llm', label: 'AI Analysis', icon: '🤖' },
    ];

    const currentIdx = stages.findIndex(s => s.id === stage);

    return (
        <div className="crl-progress">
            <div className="crl-progress-header">
                <span className="crl-progress-title">Research Pipeline</span>
                <span className="crl-progress-pct">{progress}%</span>
            </div>
            <div className="crl-progress-bar">
                <div className="crl-progress-fill" style={{ width: `${progress}%` }}>
                    <div className="crl-progress-glow"></div>
                </div>
            </div>
            <div className="crl-progress-stages">
                {stages.map((s, i) => (
                    <div key={s.id} className={`crl-stage ${i < currentIdx ? 'crl-stage-done' : ''} ${i === currentIdx ? 'crl-stage-active' : ''}`}>
                        <span className="crl-stage-icon">{s.icon}</span>
                        <span className="crl-stage-label">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Typing Indicator
export const TypingIndicator = () => (
    <div className="crl-typing">
        <span className="crl-typing-text">Curalink is analyzing research</span>
        <div className="crl-typing-dots">
            <span></span><span></span><span></span>
        </div>
    </div>
);

// Skeleton Loader
export const SkeletonLoader = ({ count = 3 }) => (
    <div className="crl-skeleton-list">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="crl-skeleton-card">
                <div className="crl-skeleton-header">
                    <div className="crl-skeleton-badge crl-shimmer"></div>
                    <div className="crl-skeleton-title crl-shimmer"></div>
                </div>
                <div className="crl-skeleton-line crl-shimmer"></div>
                <div className="crl-skeleton-line crl-shimmer" style={{ width: '70%' }}></div>
                <div className="crl-skeleton-line crl-shimmer" style={{ width: '90%' }}></div>
                <div className="crl-skeleton-line crl-shimmer" style={{ width: '40%' }}></div>
            </div>
        ))}
    </div>
);

export default LoadingSpinner;