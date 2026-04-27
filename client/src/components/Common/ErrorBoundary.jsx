// client/src/components/Common/ErrorBoundary.jsx
// Curalink v2.0 - Error Boundary

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Curalink Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="crl-error-boundary">
                    <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="var(--crl-error)" strokeWidth="2"/>
                        <path d="M22 22l20 20M42 22L22 42" stroke="var(--crl-error)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h2>Something went wrong</h2>
                    <p>Please refresh the page to continue.</p>
                    <button className="crl-btn-primary" onClick={() => window.location.reload()}>
                        Reload Curalink
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;