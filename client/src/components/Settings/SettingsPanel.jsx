// client/src/components/Settings/SettingsPanel.jsx
// Curalink v2.0 - Settings Panel

import React from 'react';

const SettingsPanel = ({ isDarkMode, onToggleDarkMode }) => {
    return (
        <div className="crl-settings">
            <div className="crl-settings-container">
                <h1 className="crl-settings-title">Settings</h1>
                <p className="crl-settings-desc">Customize your Curalink experience</p>

                {/* Appearance */}
                <div className="crl-settings-section">
                    <h2 className="crl-settings-section-title">Appearance</h2>
                    
                    <div className="crl-settings-card">
                        <div className="crl-settings-row">
                            <div>
                                <span className="crl-settings-label">Theme</span>
                                <span className="crl-settings-hint">{isDarkMode ? 'Dark mode is enabled' : 'Light mode is enabled'}</span>
                            </div>
                            <button className="crl-toggle" onClick={onToggleDarkMode} data-active={isDarkMode}>
                                <span className="crl-toggle-knob"></span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Model */}
                <div className="crl-settings-section">
                    <h2 className="crl-settings-section-title">AI Model</h2>
                    
                    <div className="crl-settings-card">
                        <div className="crl-model-info">
                            <span className="crl-model-icon">🔮</span>
                            <div>
                                <span className="crl-model-name">DeepSeek R1</span>
                                <span className="crl-model-desc">Optimized for medical reasoning and research synthesis</span>
                            </div>
                            <span className="crl-model-active">Active</span>
                        </div>
                    </div>
                </div>

                {/* Data */}
                <div className="crl-settings-section">
                    <h2 className="crl-settings-section-title">Data & Privacy</h2>
                    
                    <div className="crl-settings-card">
                        <div className="crl-settings-row">
                            <div>
                                <span className="crl-settings-label">Export conversation data</span>
                                <span className="crl-settings-hint">Download your chat history as JSON</span>
                            </div>
                            <button className="crl-btn-secondary">Export</button>
                        </div>
                        <div className="crl-settings-divider"></div>
                        <div className="crl-settings-row">
                            <div>
                                <span className="crl-settings-label">Delete all conversations</span>
                                <span className="crl-settings-hint">This action cannot be undone</span>
                            </div>
                            <button className="crl-btn-danger">Delete All</button>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="crl-settings-section">
                    <h2 className="crl-settings-section-title">About</h2>
                    
                    <div className="crl-settings-card">
                        <div className="crl-about-info">
                            <div className="crl-about-row">
                                <span className="crl-about-label">Version</span>
                                <span className="crl-about-value">2.0.0</span>
                            </div>
                            <div className="crl-about-row">
                                <span className="crl-about-label">Built by</span>
                                <span className="crl-about-value">Vigneshwar R</span>
                            </div>
                            <div className="crl-about-row">
                                <span className="crl-about-label">Tech Stack</span>
                                <span className="crl-about-value">MERN + DeepSeek R1 + Ollama</span>
                            </div>
                            <div className="crl-about-row">
                                <span className="crl-about-label">GitHub</span>
                                <a href="https://github.com/vignesh-cs/Curalink---AI-Medical-Research-Assistant" 
                                   target="_blank" rel="noopener noreferrer"
                                   className="crl-about-link">
                                    View Repository →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;