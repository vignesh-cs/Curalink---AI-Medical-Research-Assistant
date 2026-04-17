// client/src/components/Results/ClinicalTrialsList.jsx
// Display component for clinical trials

import React, { useState } from 'react';

const ClinicalTrialsList = ({ trials }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [locationFilter, setLocationFilter] = useState('');

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getStatusClass = (status) => {
        const statusMap = {
            'RECRUITING': 'status-recruiting',
            'NOT_YET_RECRUITING': 'status-not-yet',
            'ACTIVE_NOT_RECRUITING': 'status-active',
            'COMPLETED': 'status-completed',
            'TERMINATED': 'status-terminated',
            'WITHDRAWN': 'status-withdrawn',
            'UNKNOWN': 'status-unknown'
        };
        return statusMap[status] || 'status-default';
    };

    const formatLocations = (locations) => {
        if (!locations || locations.length === 0) return 'No locations specified';
        
        return locations
            .map(loc => {
                const parts = [loc.facility, loc.city, loc.state, loc.country].filter(Boolean);
                return parts.join(', ');
            })
            .join('; ');
    };

    const filteredTrials = locationFilter 
        ? trials.filter(trial => 
            trial.locations?.some(loc => 
                JSON.stringify(loc).toLowerCase().includes(locationFilter.toLowerCase())
            )
          )
        : trials;

    if (!trials || trials.length === 0) {
        return (
            <div className="no-results">
                <p>No clinical trials found for this query.</p>
            </div>
        );
    }

    return (
        <div className="clinical-trials-list">
            <div className="section-header">
                <h3 className="section-title">
                    Clinical Trials
                    <span className="result-count">({trials.length})</span>
                </h3>
                
                {trials.length > 5 && (
                    <div className="location-filter">
                        <input
                            type="text"
                            placeholder="Filter by location..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="filter-input"
                        />
                    </div>
                )}
            </div>
            
            {filteredTrials.map((trial) => (
                <div key={trial.nctId} className="trial-card">
                    <div className="trial-header">
                        <span className={`trial-status ${getStatusClass(trial.status)}`}>
                            {trial.status || 'Unknown Status'}
                        </span>
                        {trial.phase && trial.phase.length > 0 && (
                            <span className="trial-phase">
                                Phase: {Array.isArray(trial.phase) ? trial.phase.join(', ') : trial.phase}
                            </span>
                        )}
                        <span className="trial-nct">
                            NCT: {trial.nctId}
                        </span>
                    </div>
                    
                    <h4 className="trial-title">{trial.title}</h4>
                    
                    {trial.conditions && trial.conditions.length > 0 && (
                        <div className="trial-conditions">
                            <strong>Conditions:</strong> {trial.conditions.join(', ')}
                        </div>
                    )}
                    
                    {trial.briefSummary && (
                        <div className="trial-summary">
                            <p>
                                {expandedId === trial.nctId 
                                    ? trial.briefSummary 
                                    : trial.briefSummary.substring(0, 200) + '...'}
                            </p>
                            {trial.briefSummary.length > 200 && (
                                <button
                                    className="text-button"
                                    onClick={() => toggleExpand(trial.nctId)}
                                >
                                    {expandedId === trial.nctId ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>
                    )}
                    
                    {expandedId === trial.nctId && (
                        <>
                            {trial.eligibilityCriteria && (
                                <div className="trial-eligibility">
                                    <strong>Eligibility:</strong>
                                    <p>{trial.eligibilityCriteria}</p>
                                </div>
                            )}
                            
                            {trial.locations && trial.locations.length > 0 && (
                                <div className="trial-locations">
                                    <strong>Locations:</strong>
                                    <ul>
                                        {trial.locations.slice(0, 5).map((loc, i) => (
                                            <li key={i}>
                                                {[loc.facility, loc.city, loc.state, loc.country]
                                                    .filter(Boolean).join(', ')}
                                            </li>
                                        ))}
                                        {trial.locations.length > 5 && (
                                            <li>...and {trial.locations.length - 5} more locations</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                            
                            {trial.contactInfo && (trial.contactInfo.name || trial.contactInfo.email) && (
                                <div className="trial-contact">
                                    <strong>Contact:</strong>
                                    {trial.contactInfo.name && <span> {trial.contactInfo.name}</span>}
                                    {trial.contactInfo.phone && <span> • {trial.contactInfo.phone}</span>}
                                    {trial.contactInfo.email && (
                                        <span> • <a href={`mailto:${trial.contactInfo.email}`}>
                                            {trial.contactInfo.email}
                                        </a></span>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    
                    <div className="trial-footer">
                        {trial.url && (
                            <a 
                                href={trial.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="trial-link"
                            >
                                View on ClinicalTrials.gov →
                            </a>
                        )}
                        {trial.lastUpdatePosted && (
                            <span className="trial-updated">
                                Updated: {new Date(trial.lastUpdatePosted).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClinicalTrialsList;