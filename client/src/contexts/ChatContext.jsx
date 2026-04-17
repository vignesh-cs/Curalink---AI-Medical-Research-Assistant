// client/src/contexts/ChatContext.jsx
// Chat state management context

import React, { createContext, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

export const ChatContext = createContext();

export const ChatProvider = ({ children, sessionId: initialSessionId }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(initialSessionId);
    const [conversationId, setConversationId] = useState(null);
    const [error, setError] = useState(null);
    
    const socketRef = useRef(null);

    // Initialize socket connection
    const initializeSocket = useCallback((sid) => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        
        const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
        
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5
        });
        
        socketRef.current.on('connect', () => {
            console.log('Socket connected');
            if (sid) {
                socketRef.current.emit('join-conversation', sid);
            }
        });
        
        socketRef.current.on('message-processed', (data) => {
            console.log('Message processed:', data);
        });
        
        socketRef.current.on('user-typing', (data) => {
            console.log('User typing:', data);
        });
        
        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }, []);

    // Add message to state
    const addMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Set loading state
    const setLoading = useCallback((loading) => {
        setIsLoading(loading);
    }, []);

    // Update session ID
    const updateSessionId = useCallback((newSessionId) => {
        setSessionId(newSessionId);
        initializeSocket(newSessionId);
    }, [initializeSocket]);

    // Emit typing event
    const emitTyping = useCallback(() => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit('typing', { conversationId: sessionId });
        }
    }, [sessionId]);

    const value = {
        messages,
        addMessage,
        clearMessages,
        isLoading,
        setLoading,
        sessionId,
        updateSessionId,
        conversationId,
        setConversationId,
        error,
        setError,
        emitTyping
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};