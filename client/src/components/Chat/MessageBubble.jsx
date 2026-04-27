import React from 'react';

const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`msg-row ${isUser ? 'msg-user' : 'msg-bot'}`}>
            <div className={`msg-avatar ${isUser ? 'msg-avatar-user' : 'msg-avatar-bot'}`}>
                {isUser ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                )}
            </div>
            <div className={`msg-bubble ${isUser ? 'msg-bubble-user' : 'msg-bubble-bot'}`}>
                <div className="msg-text">{message.content}</div>
                {message.metadata && (
                    <div className="msg-meta">
                        {message.metadata.sourcesCount || 0} sources &middot; {message.metadata.processingTime}ms
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;