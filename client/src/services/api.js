// client/src/services/api.js
// API service for backend communication

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Remove any null or undefined values from data
        if (config.data) {
            config.data = JSON.parse(JSON.stringify(config.data, (key, value) => {
                return value === null || value === undefined ? undefined : value;
            }));
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        const errorMessage = error.response?.data?.error?.message || 
                            error.response?.data?.errors?.[0]?.msg ||
                            error.message || 
                            'An unexpected error occurred';
        
        throw new Error(errorMessage);
    }
);

// Chat API functions
export const sendMessage = async (message, sessionId, userContext = {}) => {
    const payload = {
        message: message,
        userContext: userContext || {}
    };
    
    // Only add sessionId if it exists and is not null/undefined/empty
    if (sessionId && typeof sessionId === 'string' && sessionId.trim() !== '') {
        payload.sessionId = sessionId;
    }
    
    console.log('Sending payload:', payload);
    return api.post('/chat/message', payload);
};

export const sendFollowUp = async (message, sessionId) => {
    return api.post('/chat/follow-up', {
        message,
        sessionId
    });
};

export const getConversation = async (sessionId) => {
    return api.get(`/chat/conversation/${sessionId}`);
};

export const createConversation = async (data = {}) => {
    return api.post('/chat/conversation', data);
};

export const clearConversation = async (sessionId) => {
    return api.delete(`/chat/conversation/${sessionId}`);
};

// Research API functions
export const searchPublications = async (query, options = {}) => {
    return api.post('/research/publications', {
        query,
        ...options
    });
};

export const searchClinicalTrials = async (condition, options = {}) => {
    return api.post('/research/trials', {
        condition,
        ...options
    });
};

// Query API functions
export const expandQuery = async (query, diseaseContext) => {
    return api.post('/query/expand', {
        query,
        diseaseContext
    });
};

// Health check
export const checkHealth = async () => {
    return api.get('/health');
};

export default api;