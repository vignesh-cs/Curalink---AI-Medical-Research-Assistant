import React, { useState } from 'react';

const Sidebar = ({ isOpen, onToggle, chats, activeChatId, onSelectChat, onNewChat, isDark, onToggleTheme, isLoggedIn, onLoginClick, onLogout }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = searchQuery ? chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())) : chats;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const grouped = {
        'Today': filtered.filter(c => c.date === today),
        'Yesterday': filtered.filter(c => c.date === yesterday),
        'Older': filtered.filter(c => c.date < yesterday),
    };

    return (
        <aside className={`crl-sidebar ${isOpen ? 'crl-sidebar-open' : ''}`}>
            <div className="crl-sidebar-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="crl-sidebar-icon" onClick={onToggle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                    </button>
                    <button className="crl-newchat-btn" onClick={onNewChat}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>New chat</span>
                    </button>
                </div>
                <div className="crl-sidebar-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search chats" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>
            <div className="crl-sidebar-history">
                {Object.entries(grouped).map(([g, cs]) => cs.length > 0 && (
                    <div key={g}><div className="crl-history-label">{g}</div>
                        {cs.map(c => (
                            <button key={c.id} className={`crl-history-item ${activeChatId === c.id ? 'crl-history-active' : ''}`} onClick={() => onSelectChat(c.id)}>{c.title}</button>
                        ))}
                    </div>
                ))}
                {filtered.length === 0 && <div className="crl-history-empty">No chats found</div>}
            </div>
            <div className="crl-sidebar-bottom">
                {isLoggedIn ? (
                    <div className="crl-sidebar-user">
                        <div className="crl-user-avatar">VR</div>
                        <div className="crl-user-info"><span>Vignesh Rajavel</span><span>Free</span></div>
                        <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--crl-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>⋯</button>
                    </div>
                ) : (
                    <button className="crl-login-prompt-btn" onClick={onLoginClick}>
                        <span>Log in or sign up</span>
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;