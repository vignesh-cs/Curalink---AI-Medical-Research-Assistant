// client/src/components/Chat/SourceAttribution.jsx
// Source attribution display component

import React, { useState } from 'react';

const SourceAttribution = ({ sources }) => {
    const [expandedSource, setExpandedSource] = useState(null);

    const groupSourcesByPlatform = (sources) => {
        const grouped = {};
        
        sources.forEach(source => {
            const platform = source.platform || 'other';
            if (!grouped[platform]) {
                grouped[platform] = [];
            }
            grouped[platform].push(source);
        });
        
        return grouped;
    };

    const groupedSources = groupSourcesByPlatform(sources);

    const platformNames = {
        'pubmed': 'PubMed',
        'openalex': 'OpenAlex',
        'clinicaltrials.gov': 'ClinicalTrials.gov',
        'other': 'Other Sources'
    };

    if (!sources || sources.length === 0) {
        return (
            <div className="no-sources">
                <p>No source information available for this response.</p>
            </div>
        );
    }

    return (
        <div className="source-attribution">
            <h3 className="section-title">
                Sources & References
                <span className="result-count">({sources.length})</span>
            </h3>
            
            <p className="sources-disclaimer">
                The following sources were used to generate this response. 
                All information is based on peer-reviewed research and official clinical trial data.
            </p>
            
            {Object.entries(groupedSources).map(([platform, platformSources]) => (
                <div key={platform} className="source-group">
                    <h4 className="source-platform">
                        {platformNames[platform] || platform}
                        <span className="source-count">({platformSources.length})</span>
                    </h4>
                    
                    <ul className="source-list">
                        {platformSources.map((source, index) => (
                            <li key={index} className="source-item">
                                <div className="source-header">
                                    <span className="source-title">{source.title}</span>
                                    <button
                                        className="text-button"
                                        onClick={() => setExpandedSource(
                                            expandedSource === `${platform}-${index}` ? null : `${platform}-${index}`
                                        )}
                                    >
                                        {expandedSource === `${platform}-${index}` ? 'Hide' : 'Details'}
                                    </button>
                                </div>
                                
                                <div className="source-meta">
                                    {source.authors && source.authors.length > 0 && (
                                        <span className="source-authors">
                                            {Array.isArray(source.authors) 
                                                ? source.authors.slice(0, 3).join(', ') + (source.authors.length > 3 ? ' et al.' : '')
                                                : source.authors}
                                        </span>
                                    )}
                                    {source.year && (
                                        <span className="source-year">({source.year})</span>
                                    )}
                                </div>
                                
                                {expandedSource === `${platform}-${index}` && (
                                    <div className="source-details">
                                        {source.snippet && (
                                            <p className="source-snippet">{source.snippet}</p>
                                        )}
                                        {source.url && (
                                            <a 
                                                href={source.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="source-link"
                                            >
                                                View Original Source →
                                            </a>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            
            <div className="attribution-note">
                <p>
                    <strong>Note:</strong> This information is for research purposes only. 
                    Always consult with qualified healthcare professionals for medical advice.
                </p>
            </div>
        </div>
    );
};

export default SourceAttribution;