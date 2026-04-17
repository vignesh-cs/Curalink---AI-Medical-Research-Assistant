// client/src/contexts/UserContext.jsx
// User context for managing user preferences and medical context

import React, { createContext, useState, useCallback } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userContext, setUserContext] = useState({
        patientName: '',
        diseaseOfInterest: '',
        location: '',
        preferences: {
            detailLevel: 'detailed',
            language: 'en'
        },
        history: []
    });

    const updateUserContext = useCallback((updates) => {
        setUserContext(prev => ({
            ...prev,
            ...updates,
            preferences: {
                ...prev.preferences,
                ...(updates.preferences || {})
            }
        }));
    }, []);

    const addToHistory = useCallback((condition) => {
        setUserContext(prev => ({
            ...prev,
            history: [
                ...prev.history,
                {
                    condition,
                    timestamp: new Date().toISOString()
                }
            ].slice(-10) // Keep last 10 entries
        }));
    }, []);

    const clearUserContext = useCallback(() => {
        setUserContext({
            patientName: '',
            diseaseOfInterest: '',
            location: '',
            preferences: {
                detailLevel: 'detailed',
                language: 'en'
            },
            history: []
        });
    }, []);

    const value = {
        userContext,
        updateUserContext,
        addToHistory,
        clearUserContext
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};