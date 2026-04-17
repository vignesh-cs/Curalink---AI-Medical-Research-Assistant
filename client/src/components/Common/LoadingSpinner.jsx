// client/src/components/Common/LoadingSpinner.jsx
// Premium loading components with skeleton screens and progress tracking

import React, { useState, useEffect } from 'react';

// Main Loading Spinner with enhanced animations
export const LoadingSpinner = ({ size = 'medium', text = 'Loading...', variant = 'primary' }) => {
    const sizeClasses = {
        small: 'spinner-small',
        medium: 'spinner-medium',
        large: 'spinner-large'
    };

    return (
        <div className="loading-container">
            <div className={`loading-spinner ${sizeClasses[size]} spinner-${variant}`}>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            {text && <span className="loading-text">{text}</span>}
        </div>
    );
};

// Research Progress Bar - Shows real-time fetching status
export const ResearchProgressBar = ({ stage, progress }) => {
    const stages = [
        { id: 'query', label: 'Understanding Query', icon: '🔍' },
        { id: 'pubmed', label: 'PubMed Search', icon: '📚' },
        { id: 'openalex', label: 'OpenAlex Search', icon: '🔬' },
        { id: 'trials', label: 'Clinical Trials', icon: '🏥' },
        { id: 'ranking', label: 'Ranking Results', icon: '📊' },
        { id: 'llm', label: 'AI Analysis', icon: '🤖' }
    ];

    const currentIndex = stages.findIndex(s => s.id === stage);

    return (
        <div className="research-progress">
            <div className="progress-header">
                <span className="progress-title">Research Pipeline</span>
                <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar-container">
                <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress}%` }}
                >
                    <div className="progress-glow"></div>
                </div>
            </div>
            <div className="progress-stages">
                {stages.map((s, idx) => (
                    <div 
                        key={s.id}
                        className={`progress-stage ${idx < currentIndex ? 'completed' : ''} ${idx === currentIndex ? 'active' : ''}`}
                    >
                        <span className="stage-icon">{s.icon}</span>
                        <span className="stage-label">{s.label}</span>
                        {idx === currentIndex && <span className="stage-pulse"></span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Skeleton Loader for Publications
export const PublicationSkeleton = () => {
    return (
        <div className="publication-skeleton">
            {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-header">
                        <div className="skeleton-badge shimmer"></div>
                        <div className="skeleton-title shimmer"></div>
                    </div>
                    <div className="skeleton-meta">
                        <div className="skeleton-text-small shimmer"></div>
                        <div className="skeleton-text-small shimmer"></div>
                    </div>
                    <div className="skeleton-authors shimmer"></div>
                    <div className="skeleton-abstract">
                        <div className="skeleton-line shimmer"></div>
                        <div className="skeleton-line shimmer"></div>
                        <div className="skeleton-line shimmer"></div>
                        <div className="skeleton-line-short shimmer"></div>
                    </div>
                    <div className="skeleton-footer">
                        <div className="skeleton-link shimmer"></div>
                        <div className="skeleton-doi shimmer"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Typing Indicator for LLM Response
export const TypingIndicator = () => {
    return (
        <div className="typing-indicator">
            <span className="typing-text">Curalink is analyzing research</span>
            <div className="typing-dots">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
            </div>
        </div>
    );
};

// Pulse Loader for quick operations
export const PulseLoader = ({ text }) => {
    return (
        <div className="pulse-loader">
            <div className="pulse-ring"></div>
            <span>{text || 'Processing...'}</span>
        </div>
    );
};

export default LoadingSpinner;