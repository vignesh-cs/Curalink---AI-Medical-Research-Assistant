// client/src/components/Query/QueryInputForm.jsx
// Structured query input form for detailed medical context

import React, { useState, useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ChatContext } from '../../contexts/ChatContext';
import { createConversation, sendMessage } from '../../services/api';

const QueryInputForm = ({ onSessionCreated, onComplete }) => {
    const { setUserContext } = useContext(UserContext);
    const { addMessage, setLoading } = useContext(ChatContext);
    
    const [formData, setFormData] = useState({
        patientName: '',
        diseaseOfInterest: '',
        additionalQuery: '',
        location: '',
        detailLevel: 'detailed'
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const diseaseSuggestions = [
        'Parkinson\'s disease',
        'Alzheimer\'s disease',
        'Diabetes',
        'Lung cancer',
        'Heart disease',
        'Breast cancer',
        'Multiple sclerosis',
        'Rheumatoid arthritis',
        'Asthma',
        'Depression'
    ];

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.diseaseOfInterest.trim()) {
            newErrors.diseaseOfInterest = 'Disease of interest is required';
        }
        
        if (!formData.additionalQuery.trim()) {
            newErrors.additionalQuery = 'Query is required';
        } else if (formData.additionalQuery.length < 5) {
            newErrors.additionalQuery = 'Query must be at least 5 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Set user context
            setUserContext({
                patientName: formData.patientName,
                diseaseOfInterest: formData.diseaseOfInterest,
                location: formData.location,
                preferences: {
                    detailLevel: formData.detailLevel
                }
            });
            
            // Create conversation
            const conversationResponse = await createConversation({
                userContext: {
                    patientName: formData.patientName,
                    diseaseOfInterest: formData.diseaseOfInterest,
                    location: formData.location
                }
            });
            
            const sessionId = conversationResponse.sessionId;
            onSessionCreated(sessionId);
            
            // Send initial query
            setLoading(true);
            
            const messageResponse = await sendMessage(
                formData.additionalQuery,
                sessionId,
                {
                    diseaseOfInterest: formData.diseaseOfInterest,
                    location: formData.location
                }
            );
            
            // Add messages to chat
            addMessage({
                role: 'user',
                content: formData.additionalQuery,
                timestamp: new Date().toISOString()
            });
            
            addMessage({
                role: 'assistant',
                content: messageResponse.message.content,
                structuredContent: messageResponse.message.structuredContent,
                metadata: messageResponse.metadata,
                timestamp: new Date().toISOString()
            });
            
            // Complete and switch to chat view
            onComplete();
            
        } catch (error) {
            console.error('Error submitting query:', error);
            setErrors({ submit: 'Failed to process query. Please try again.' });
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    return (
        <div className="query-input-form-container">
            <h2 className="form-title">Structured Medical Query</h2>
            <p className="form-description">
                Provide detailed context for more accurate and personalized research results.
            </p>
            
            <form onSubmit={handleSubmit} className="query-form">
                <div className="form-group">
                    <label htmlFor="patientName">Patient Name (Optional)</label>
                    <input
                        type="text"
                        id="patientName"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChange}
                        placeholder="e.g., John Smith"
                        className="form-input"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="diseaseOfInterest">
                        Disease of Interest <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="diseaseOfInterest"
                        name="diseaseOfInterest"
                        value={formData.diseaseOfInterest}
                        onChange={handleChange}
                        placeholder="e.g., Parkinson's disease"
                        className={`form-input ${errors.diseaseOfInterest ? 'error' : ''}`}
                        list="disease-suggestions"
                    />
                    <datalist id="disease-suggestions">
                        {diseaseSuggestions.map(disease => (
                            <option key={disease} value={disease} />
                        ))}
                    </datalist>
                    {errors.diseaseOfInterest && (
                        <span className="error-message">{errors.diseaseOfInterest}</span>
                    )}
                </div>
                
                <div className="form-group">
                    <label htmlFor="additionalQuery">
                        Additional Query <span className="required">*</span>
                    </label>
                    <textarea
                        id="additionalQuery"
                        name="additionalQuery"
                        value={formData.additionalQuery}
                        onChange={handleChange}
                        placeholder="e.g., Deep Brain Stimulation effectiveness"
                        className={`form-textarea ${errors.additionalQuery ? 'error' : ''}`}
                        rows={3}
                    />
                    {errors.additionalQuery && (
                        <span className="error-message">{errors.additionalQuery}</span>
                    )}
                    <small className="form-hint">
                        Your query will be automatically expanded: 
                        "{formData.additionalQuery} + {formData.diseaseOfInterest || '[disease]'}"
                    </small>
                </div>
                
                <div className="form-group">
                    <label htmlFor="location">Location (Optional - for clinical trials)</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Toronto, Canada"
                        className="form-input"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="detailLevel">Response Detail Level</label>
                    <select
                        id="detailLevel"
                        name="detailLevel"
                        value={formData.detailLevel}
                        onChange={handleChange}
                        className="form-select"
                    >
                        <option value="basic">Basic - Overview only</option>
                        <option value="detailed">Detailed - With key insights</option>
                        <option value="comprehensive">Comprehensive - Full analysis</option>
                    </select>
                </div>
                
                {errors.submit && (
                    <div className="form-error">{errors.submit}</div>
                )}
                
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onComplete}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Submit Query'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QueryInputForm;