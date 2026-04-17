// client/src/components/Chat/StructuredResponse.jsx
// Displays structured response with tabs for overview, insights, and trials

import React, { useState } from 'react';
import PublicationsList from '../Results/PublicationsList';
import ClinicalTrialsList from '../Results/ClinicalTrialsList';
import SourceAttribution from './SourceAttribution';

const StructuredResponse = ({ content, metadata }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', count: null },
        { id: 'insights', label: 'Research Insights', count: content.publications?.length || 0 },
        { id: 'trials', label: 'Clinical Trials', count: content.clinicalTrials?.length || 0 },
        { id: 'sources', label: 'Sources', count: content.sources?.length || 0 }
    ];

    return (
        <div className="structured-response">
            <div className="response-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.count !== null && tab.count > 0 && (
                            <span className="tab-count">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>
            
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-section">
                        {content.conditionOverview ? (
                            <div className="condition-overview">
                                <h3>Condition Overview</h3>
                                <p>{content.conditionOverview}</p>
                            </div>
                        ) : (
                            <div className="research-summary">
                                <h3>Research Summary</h3>
                                <p>{content.researchInsights || 'No overview available.'}</p>
                            </div>
                        )}
                        
                        {metadata?.researchDataStats && (
                            <div className="retrieval-stats">
                                <h4>Research Coverage</h4>
                                <ul>
                                    <li>Publications analyzed: {metadata.researchDataStats.publicationsRetrieved}</li>
                                    <li>Clinical trials reviewed: {metadata.researchDataStats.trialsRetrieved}</li>
                                    <li>Top publications displayed: {metadata.researchDataStats.publicationsDisplayed}</li>
                                    <li>Top trials displayed: {metadata.researchDataStats.trialsDisplayed}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'insights' && (
                    <div className="insights-section">
                        {content.researchInsights && (
                            <div className="key-insights">
                                <h3>Key Research Insights</h3>
                                <p>{content.researchInsights}</p>
                            </div>
                        )}
                        
                        {content.publications && content.publications.length > 0 && (
                            <PublicationsList publications={content.publications} />
                        )}
                    </div>
                )}
                
                {activeTab === 'trials' && (
                    <div className="trials-section">
                        {content.clinicalTrials && content.clinicalTrials.length > 0 ? (
                            <ClinicalTrialsList trials={content.clinicalTrials} />
                        ) : (
                            <p className="no-data-message">
                                No clinical trials found for this query.
                            </p>
                        )}
                    </div>
                )}
                
                {activeTab === 'sources' && (
                    <div className="sources-section">
                        {content.sources && content.sources.length > 0 ? (
                            <SourceAttribution sources={content.sources} />
                        ) : (
                            <p className="no-data-message">
                                No source information available.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StructuredResponse;