// client/src/components/Query/QueryInputForm.jsx
// v3 — minimal clean design, fixed close, no newspaper bg

import React, { useState, useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ChatContext } from '../../contexts/ChatContext';
import { createConversation, sendMessage } from '../../services/api';

const StructuredQueryModal = ({ onClose, onSessionCreated, onComplete }) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleClose = () => {
    if (typeof onClose === 'function') onClose();
    else if (typeof onComplete === 'function') onComplete();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.diseaseOfInterest.trim()) newErrors.diseaseOfInterest = 'Required';
    if (!formData.additionalQuery.trim()) newErrors.additionalQuery = 'Required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    try {
      setUserContext({
        patientName: formData.patientName,
        diseaseOfInterest: formData.diseaseOfInterest,
        location: formData.location,
        preferences: { detailLevel: formData.detailLevel }
      });

      const convResp = await createConversation({
        userContext: {
          diseaseOfInterest: formData.diseaseOfInterest,
          location: formData.location
        }
      });

      const sid = convResp.sessionId;
      onSessionCreated(sid);
      setLoading(true);

      const msgResp = await sendMessage(formData.additionalQuery, sid, {
        patientName: formData.patientName,
        diseaseOfInterest: formData.diseaseOfInterest,
        location: formData.location,
        preferences: { detailLevel: formData.detailLevel }
      });

      addMessage({ role: 'user', content: formData.additionalQuery, timestamp: new Date().toISOString() });
      addMessage({ role: 'assistant', content: msgResp.message.content, structuredContent: msgResp.message.structuredContent, metadata: msgResp.metadata, timestamp: new Date().toISOString() });
      if (typeof onComplete === 'function') onComplete();
    } catch (err) {
      setErrors({ submit: 'Failed to process query. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="sq-root" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="sq-card">
        {/* Header */}
        <div className="sq-header">
          <div className="sq-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
          </div>
          <div className="sq-header-text">
            <h2 className="sq-title">Structured Medical Query</h2>
            <p className="sq-desc">Provide context for accurate, evidence-based results</p>
          </div>
          <button className="sq-close" onClick={handleClose} type="button" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="sq-form">
          <div className="sq-row">
            <div className="sq-field">
              <label className="sq-label">Patient Name</label>
              <input type="text" name="patientName" value={formData.patientName}
                onChange={handleChange} placeholder="e.g., John Smith" className="sq-input" />
            </div>
            <div className="sq-field">
              <label className="sq-label">Location</label>
              <input type="text" name="location" value={formData.location}
                onChange={handleChange} placeholder="e.g., Chennai, India" className="sq-input" />
            </div>
          </div>

          <div className="sq-field">
            <label className="sq-label">Disease of Interest <span className="sq-req">*</span></label>
            <input type="text" name="diseaseOfInterest" value={formData.diseaseOfInterest}
              onChange={handleChange} placeholder="e.g., Lung Cancer, Type 2 Diabetes"
              className={`sq-input${errors.diseaseOfInterest ? ' sq-input-err' : ''}`} />
            {errors.diseaseOfInterest && <span className="sq-err">{errors.diseaseOfInterest}</span>}
          </div>

          <div className="sq-field">
            <label className="sq-label">Research Query <span className="sq-req">*</span></label>
            <textarea name="additionalQuery" value={formData.additionalQuery}
              onChange={handleChange}
              placeholder="e.g., What are the latest treatment protocols and clinical trial outcomes?"
              rows={4}
              className={`sq-input sq-textarea${errors.additionalQuery ? ' sq-input-err' : ''}`} />
            {errors.additionalQuery && <span className="sq-err">{errors.additionalQuery}</span>}
          </div>

          <div className="sq-field">
            <label className="sq-label">Detail Level</label>
            <div className="sq-levels">
              {['brief', 'detailed', 'comprehensive'].map(level => (
                <label key={level} className={`sq-level${formData.detailLevel === level ? ' active' : ''}`}>
                  <input type="radio" name="detailLevel" value={level}
                    checked={formData.detailLevel === level}
                    onChange={handleChange} style={{ display: 'none' }} />
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {errors.submit && <div className="sq-submit-err">{errors.submit}</div>}

          <div className="sq-actions">
            <button type="button" onClick={handleClose} className="sq-btn-cancel">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="sq-btn-submit">
              {isSubmitting ? (
                <><span className="sq-spinner" />Processing...</>
              ) : 'Submit Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StructuredQueryModal;