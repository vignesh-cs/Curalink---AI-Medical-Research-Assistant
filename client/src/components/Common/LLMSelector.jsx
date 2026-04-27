// client/src/components/Common/LLMSelector.jsx
// Premium LLM model selector

import React, { useState, useRef, useEffect } from 'react';

const MODELS = [
    { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Best for medical reasoning', icon: '🔮', available: true },
    { id: 'llama3', name: 'Llama 3.1 8B', desc: 'Fast responses', icon: '🦙', available: false },
    { id: 'medllama2', name: 'MedLlama 2', desc: 'Medical fine-tuned', icon: '🧬', available: false },
    { id: 'mixtral', name: 'Mixtral 8x7B', desc: 'Mixture of experts', icon: '⚡', available: false },
];

const LLMSelector = ({ selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = MODELS.find(m => m.id === selected) || MODELS[0];

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="llm-select" ref={ref}>
            <button className="llm-trigger" onClick={() => setOpen(!open)}>
                <span className="llm-trigger-icon">{current.icon}</span>
                <span className="llm-trigger-name">{current.name}</span>
                <svg className={`llm-chevron ${open ? 'llm-chevron-open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
            </button>

            {open && (
                <div className="llm-dropdown">
                    <div className="llm-dropdown-title">Select AI Model</div>
                    {MODELS.map(m => (
                        <button
                            key={m.id}
                            className={`llm-option ${m.id === selected ? 'llm-selected' : ''} ${!m.available ? 'llm-disabled' : ''}`}
                            onClick={() => { onChange(m.id); setOpen(false); }}
                        >
                            <span className="llm-option-icon">{m.icon}</span>
                            <div className="llm-option-info">
                                <span className="llm-option-name">{m.name}</span>
                                <span className="llm-option-desc">{m.desc}</span>
                            </div>
                            {m.available ? (
                                m.id === selected && <span className="llm-check">✓</span>
                            ) : (
                                <span className="llm-badge">Soon</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LLMSelector;