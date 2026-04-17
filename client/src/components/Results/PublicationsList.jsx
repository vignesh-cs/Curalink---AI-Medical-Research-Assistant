// client/src/components/Results/PublicationsList.jsx
// Display component for research publications

import React, { useState } from 'react';

const PublicationsList = ({ publications }) => {
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatAuthors = (authors) => {
        if (!authors || authors.length === 0) return 'Unknown Authors';
        if (authors.length <= 3) return authors.join(', ');
        return `${authors.slice(0, 3).join(', ')} et al.`;
    };

    const getSourceColor = (source) => {
        switch (source) {
            case 'pubmed':
                return 'source-pubmed';
            case 'openalex':
                return 'source-openalex';
            default:
                return 'source-default';
        }
    };

    if (!publications || publications.length === 0) {
        return (
            <div className="no-results">
                <p>No publications found for this query.</p>
            </div>
        );
    }

    return (
        <div className="publications-list">
            <h3 className="section-title">
                Research Publications 
                <span className="result-count">({publications.length})</span>
            </h3>
            
            {publications.map((pub, index) => (
                <div key={pub.id || index} className="publication-card">
                    <div className="publication-header">
                        <h4 className="publication-title">{pub.title}</h4>
                        <span className={`source-badge ${getSourceColor(pub.source)}`}>
                            {pub.source?.toUpperCase() || 'RESEARCH'}
                        </span>
                    </div>
                    
                    <div className="publication-meta">
                        <span className="publication-year">
                            {pub.year || 'Year unknown'}
                        </span>
                        <span className="publication-journal">
                            {pub.journal || 'Journal unknown'}
                        </span>
                        {pub.citedByCount > 0 && (
                            <span className="citation-count">
                                Cited by {pub.citedByCount}
                            </span>
                        )}
                    </div>
                    
                    <div className="publication-authors">
                        {formatAuthors(pub.authors)}
                    </div>
                    
                    {pub.abstract && (
                        <div className="publication-abstract">
                            <p>
                                {expandedId === pub.id 
                                    ? pub.abstract 
                                    : pub.abstract.substring(0, 250) + '...'}
                            </p>
                            {pub.abstract.length > 250 && (
                                <button
                                    className="text-button"
                                    onClick={() => toggleExpand(pub.id)}
                                >
                                    {expandedId === pub.id ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>
                    )}
                    
                    {pub.keyFindings && pub.keyFindings.length > 0 && (
                        <div className="key-findings">
                            <strong>Key Findings:</strong>
                            <ul>
                                {pub.keyFindings.map((finding, i) => (
                                    <li key={i}>{finding}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="publication-footer">
                        {pub.url && (
                            <a 
                                href={pub.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="publication-link"
                            >
                                View Full Publication →
                            </a>
                        )}
                        {pub.doi && (
                            <span className="publication-doi">
                                DOI: {pub.doi}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PublicationsList;