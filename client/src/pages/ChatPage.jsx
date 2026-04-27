// client/src/pages/ChatPage.jsx
// EXACT Claude.ai chat interface replica for Curalink
// FIXED: Publication titles now display correctly

import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../contexts/ChatContext';
import { UserContext } from '../contexts/UserContext';
import { sendMessage, sendFollowUp, clearConversation } from '../services/api';


/* ── SVG Icons ─────────────────────────────────────────────── */
const Ic = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IcMenu      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IcPlus      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcSearch    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcEdit      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcAttach    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const IcMic       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const IcSend      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const IcCopy      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcThumbUp   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;
const IcThumbDn   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>;
const IcRetry     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>;
const IcSettings  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IcExport    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcMoon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const IcSun       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IcTrash     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;


const CuralinkMark = ({ size = 28 }) => (
    <img src="/medical-logo.svg" alt="Curalink" style={{ width: size, height: size }} />
);

// FIXED: Safe title extractor
const getDisplayTitle = (pub) => {
    if (!pub) return 'Untitled publication';
    // Convert to plain object if Mongoose document
    const p = pub.toObject ? pub.toObject() : pub;
    const t = p.title;
    if (!t) return 'Untitled publication';
    if (typeof t === 'string') return t.trim() || 'Untitled publication';
    if (Array.isArray(t)) return t[0] || 'Untitled publication';
    if (typeof t === 'object') return t._ || t['#text'] || String(t) || 'Untitled publication';
    return String(t) || 'Untitled publication';
};

// FIXED: Safe author extractor
const getDisplayAuthors = (pub) => {
    if (!pub) return [];
    const p = pub.toObject ? pub.toObject() : pub;
    if (Array.isArray(p.authors)) return p.authors;
    return [];
};

// FIXED: Safe year extractor
const getDisplayYear = (pub) => {
    if (!pub) return null;
    const p = pub.toObject ? pub.toObject() : pub;
    return p.year || null;
};

// FIXED: Safe URL extractor
const getDisplayUrl = (pub) => {
    if (!pub) return '';
    const p = pub.toObject ? pub.toObject() : pub;
    return p.url || '';
};

/* ── Render AI text with basic markdown ──────────────────────── */
const AiText = ({ content }) => {
  if (!content) return null;
  const paragraphs = content.split(/\n\n+/);
  return (
    <div className="msg-ai-text">
      {paragraphs.map((para, pi) => {
        const parts = para.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
        const inline = parts.map((p, i) => {
          if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2,-2)}</strong>;
          if (p.startsWith('*')  && p.endsWith('*'))  return <em key={i}>{p.slice(1,-1)}</em>;
          if (p.startsWith('`')  && p.endsWith('`'))  return <code key={i}>{p.slice(1,-1)}</code>;
          return p.split('\n').map((line, li, arr) => (
            <React.Fragment key={`${i}-${li}`}>
              {line}{li < arr.length - 1 ? <br /> : null}
            </React.Fragment>
          ));
        });
        return <p key={pi}>{inline}</p>;
      })}
    </div>
  );
};


/* ── Live Medical News Panel ─────────────────────────────────── */
const NEWS_SOURCES = [
  { label: 'PubMed', color: '#2563eb', url: 'https://pubmed.ncbi.nlm.nih.gov/', icon: '📄' },
  { label: 'OpenAlex', color: '#7c3aed', url: 'https://openalex.org/', icon: '🔬' },
  { label: 'ClinicalTrials', color: '#059669', url: 'https://clinicaltrials.gov/', icon: '🏥' },
  { label: 'WHO', color: '#dc2626', url: 'https://www.who.int/news-room', icon: '🌐' },
];
const LIVE_NEWS = [
  { title: 'Novel CAR-T Therapy Shows 87% Remission in Relapsed B-Cell Lymphoma', source: 'PubMed', tag: 'Oncology', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=CAR-T+lymphoma+2024', date: '2h ago' },
  { title: 'GLP-1 Receptor Agonists Demonstrate Cardiovascular Benefit Beyond Weight Loss', source: 'OpenAlex', tag: 'Cardiology', url: 'https://openalex.org/works?filter=title.search:GLP-1+cardiovascular', date: '4h ago' },
  { title: 'Phase III Trial: mRNA Vaccine Reduces Melanoma Recurrence by 49%', source: 'ClinicalTrials', tag: 'Immunotherapy', url: 'https://clinicaltrials.gov/search?cond=melanoma&phase=3', date: '6h ago' },
  { title: 'Gut Microbiome Signatures Predict Response to Immunotherapy', source: 'PubMed', tag: 'Genomics', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=microbiome+immunotherapy+2024', date: '8h ago' },
  { title: 'CRISPR-Based Therapy Corrects Sickle Cell in 94% of Patients', source: 'OpenAlex', tag: 'Gene Therapy', url: 'https://openalex.org/works?filter=title.search:CRISPR+sickle+cell', date: '10h ago' },
  { title: 'AI Outperforms Radiologists in Early Lung Cancer Detection Study', source: 'PubMed', tag: 'AI/ML', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=AI+lung+cancer+detection+2024', date: '12h ago' },
  { title: "Alzheimer's Biomarker Blood Test Achieves 93% Sensitivity", source: 'ClinicalTrials', tag: 'Neurology', url: 'https://clinicaltrials.gov/search?cond=alzheimers&studyType=INT', date: '14h ago' },
  { title: 'Long COVID Associated with Persistent Microclots in 60% of Patients', source: 'PubMed', tag: 'COVID-19', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=long+COVID+microclots', date: '16h ago' },
];
const SOURCE_COLORS = { PubMed: '#2563eb', OpenAlex: '#7c3aed', ClinicalTrials: '#059669', WHO: '#dc2626' };

/* ── Sidebar News Ticker ── */
const SidebarNewsTicker = () => {
  const [current, setCurrent] = React.useState(0);
  const [fade, setFade] = React.useState(true);
  React.useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setCurrent(p => (p + 1) % LIVE_NEWS.length); setFade(true); }, 350);
    }, 20000);
    return () => clearInterval(iv);
  }, []);
  const n = LIVE_NEWS[current];
  return (
    <div className="sb-ticker">
      <div className="sb-ticker-header">
        <span className="sb-ticker-dot" /><span className="sb-ticker-label">Medical Intelligence</span>
      </div>
      <a href={n.url} target="_blank" rel="noopener noreferrer"
        className={`sb-ticker-item${fade ? ' in' : ' out'}`}>
        <span className="sb-ticker-tag">{n.tag}</span>
        <span className="sb-ticker-title">{n.title}</span>
        <span className="sb-ticker-src">{n.source} · {n.date}</span>
      </a>
      <div className="sb-ticker-dots">
        {LIVE_NEWS.map((_, i) => (
          <button key={i} className={`sb-ticker-dot-btn${i === current ? ' a' : ''}`}
            onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 200); }} />
        ))}
      </div>
    </div>
  );
};

/* ── Inline Medical Feed ── */
const LiveNewsPanel = () => {
  const [current, setCurrent] = React.useState(0);
  const [fade, setFade] = React.useState(true);
  React.useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setCurrent(p => (p + 1) % LIVE_NEWS.length); setFade(true); }, 400);
    }, 20000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="feed-root">
      <div className="feed-header">
        <div className="feed-header-left">
          <span className="feed-live-dot" />
          <span className="feed-title">Medical Intelligence Feed</span>
        </div>
        <div className="feed-sources">
          {NEWS_SOURCES.map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="feed-src-pill">
              {s.icon} {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className={`feed-featured${fade ? ' in' : ' out'}`}
        onClick={() => window.open(LIVE_NEWS[current].url, '_blank')} title="Open source">
        <div className="feed-feat-left">
          <span className="feed-feat-tag">{LIVE_NEWS[current].tag}</span>
          <p className="feed-feat-title">{LIVE_NEWS[current].title}</p>
          <div className="feed-feat-meta">
            <span className="feed-feat-src">{LIVE_NEWS[current].source}</span>
            <span className="feed-feat-time">{LIVE_NEWS[current].date}</span>
            <span className="feed-feat-hint">↗ Open in {LIVE_NEWS[current].source}</span>
          </div>
        </div>
        <div className="feed-feat-right">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.15">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
        </div>
      </div>

      <div className="feed-grid">
        {LIVE_NEWS.filter((_, i) => i !== current).slice(0, 4).map((item, i) => (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="feed-card">
            <div className="feed-card-tag">{item.tag}</div>
            <div className="feed-card-title">{item.title}</div>
            <div className="feed-card-meta">{item.source} · {item.date}</div>
          </a>
        ))}
      </div>

      <div className="feed-dots">
        {LIVE_NEWS.map((_, i) => (
          <button key={i} className={`feed-dot${i === current ? ' a' : ''}`}
            onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 200); }} />
        ))}
      </div>
    </div>
  );
};

/* ── Suggestions ─────────────────────────────────────────────── */
const SUGGESTIONS = [
  { icon: '', label: 'Latest treatments for lung cancer' },
  { icon: '', label: 'Clinical trials for type 2 diabetes' },
  { icon: '', label: "Recent Alzheimer's research 2024" },
  { icon: '', label: 'New studies on heart disease prevention' },
  { icon: '', label: 'Immunotherapy advances in oncology' },
  { icon: '', label: 'Antibiotic resistance latest findings' },
];

/* ── Research stages ─────────────────────────────────────────── */
const STAGES = ['Query expansion', 'PubMed search', 'OpenAlex search', 'Clinical trials', 'Ranking results', 'Generating answer'];

/* ── Main component ──────────────────────────────────────────── */
const ChatPage = ({ sessionId, onSessionCreated, onToggleStructuredInput, showStructuredInput }) => {
  const navigate = useNavigate();
  const { messages, addMessage, clearMessages, setLoading, isLoading, sessionId: ctxSessionId } = useContext(ChatContext);
  const { userContext } = useContext(UserContext);

  const [input, setInput]               = useState('');
  const [sidebarOpen, setSidebar]       = useState(true);
  const [dark, setDark]                 = useState(() => document.documentElement.classList.contains('dark'));
  const [searchQuery, setSearchQuery]   = useState('');
  const [chatHistory, setChatHistory]   = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [progressStage, setProgressStage] = useState(0);
  const [showProgress, setShowProgress]   = useState(false);
  const [copied, setCopied]             = useState(null);
  const [showSettings, setShowSettings]   = useState(false);
  const [isListening, setIsListening]     = useState(false);
  const [voiceLevel, setVoiceLevel]       = useState(0);
  const [toastMsg, setToastMsg]           = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const recognitionRef = useRef(null);
  const voiceLevelRef  = useRef(null);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const progressTimer  = useRef(null);

  const userName    = localStorage.getItem('curalink_user') || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const saved = localStorage.getItem('curalink_chat_history');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setChatHistory(parsed); 
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        const trimmedHistory = chatHistory.slice(0, 10).map(chat => ({
          ...chat,
          messages: (chat.messages || []).slice(0, 20).map(msg => ({
            role: msg.role,
            content: msg.content?.substring(0, 500),
            timestamp: msg.timestamp,
            metadata: msg.metadata ? {
              sourcesCount: msg.metadata.sourcesCount,
              processingTime: msg.metadata.processingTime
            } : undefined,
            structuredContent: msg.structuredContent ? {
                publications: (msg.structuredContent.publications || []).slice(0, 6).map(pub => ({
                     title: getDisplayTitle(pub),
                     authors: getDisplayAuthors(pub),
                     year: getDisplayYear(pub),
                     url: getDisplayUrl(pub),
                     source: (pub.toObject ? pub.toObject() : pub).source || ''
                 }))
            } : undefined
          }))
        }));
        localStorage.setItem('curalink_chat_history', JSON.stringify(trimmedHistory));
      } catch (e) {
        console.warn('localStorage quota exceeded, clearing old history');
        localStorage.removeItem('curalink_chat_history');
      }
    }
  }, [chatHistory]);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(''), 2000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('curalink-dark-mode', String(next));
  };

  const handleExport = () => {
    if (!messages || messages.length === 0) {
      setToastMsg('No conversation to export');
      return;
    }
    try {
      const exportMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content?.substring(0, 2000) || '',
        timestamp: msg.timestamp,
        error: msg.error || false,
        metadata: msg.metadata ? {
          sourcesCount: msg.metadata.sourcesCount || 0,
          processingTime: msg.metadata.processingTime || 0
        } : null,
        publications: msg.structuredContent?.publications?.map(pub => ({
          title: getDisplayTitle(pub),
          authors: getDisplayAuthors(pub),
          year: getDisplayYear(pub),
          journal: typeof (pub.toObject ? pub.toObject() : pub).journal === 'string' ? (pub.toObject ? pub.toObject() : pub).journal : '',
          source: (pub.toObject ? pub.toObject() : pub).source || '',
          url: getDisplayUrl(pub)
        })) || []
      }));
      
      const data = {
        sessionId: sessionId || ctxSessionId || 'no-session',
        exportedAt: new Date().toISOString(),
        totalMessages: exportMessages.length,
        messages: exportMessages,
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `curalink-conversation-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMsg('Conversation exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      setToastMsg('Export failed. Please try again.');
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const title = messages[0]?.content?.slice(0, 48) || 'Chat';
      const newEntry = { 
        id: Date.now(), 
        title, 
        date: new Date().toISOString().split('T')[0],
        messages: [...messages].slice(-30),
        sessionId: sessionId || ctxSessionId
      };
      setChatHistory(prev => {
        const existingIdx = prev.findIndex(c => c.title === title);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...newEntry, id: updated[existingIdx].id };
          return updated.slice(0, 30);
        }
        return [newEntry, ...prev].slice(0, 30);
      });
      setActiveChatId(newEntry.id);
    }
    clearMessages();
    localStorage.removeItem('curalink_session_id');
    setInput('');
    setShowProgress(false);
  };

  const restoreConversation = (chatEntry) => {
    if (messages.length > 0) {
      const title = messages[0]?.content?.slice(0, 48) || 'Chat';
      const currentEntry = { 
        id: Date.now(), 
        title, 
        date: new Date().toISOString().split('T')[0],
        messages: [...messages].slice(-30),
        sessionId: sessionId || ctxSessionId
      };
      setChatHistory(prev => {
        const existingIdx = prev.findIndex(c => c.title === title);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...currentEntry, id: updated[existingIdx].id };
          return updated.slice(0, 30);
        }
        return [currentEntry, ...prev].slice(0, 30);
      });
    }
    
    clearMessages();
    
    if (chatEntry.messages && Array.isArray(chatEntry.messages)) {
      chatEntry.messages.forEach(msg => {
        addMessage(msg);
      });
    }
    
    if (chatEntry.sessionId && onSessionCreated) {
      onSessionCreated(chatEntry.sessionId);
    }
    
    setActiveChatId(chatEntry.id);
  };

  const deleteSingleHistory = (id) => {
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
    setToastMsg('Conversation deleted');
  };

  const deleteTodayHistory = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setChatHistory(prev => prev.filter(c => c.date !== todayStr));
    setToastMsg('Today\'s conversations deleted');
  };

  const deleteWeekHistory = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    setChatHistory(prev => prev.filter(c => c.date < weekStr));
    setToastMsg('This week\'s conversations deleted');
  };

  const deleteMonthHistory = () => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthStr = monthAgo.toISOString().split('T')[0];
    setChatHistory(prev => prev.filter(c => c.date < monthStr));
    setToastMsg('This month\'s conversations deleted');
  };

  const deleteAllHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('curalink_chat_history');
    setToastMsg('All conversations deleted');
  };

  const startProgress = () => {
    setProgressStage(0);
    setShowProgress(true);
    let stage = 0;
    progressTimer.current = setInterval(() => {
      stage++;
      if (stage >= STAGES.length) {
        clearInterval(progressTimer.current);
      } else {
        setProgressStage(stage);
      }
    }, 700);
  };
  const stopProgress = () => {
    clearInterval(progressTimer.current);
    setShowProgress(false);
    setProgressStage(0);
  };

  const handleSend = async (isFollowUp = false) => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');

    addMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });
    setLoading(true);
    startProgress();

    try {
      const diseaseOfInterest = userContext?.diseaseOfInterest
        || text.toLowerCase().split(' ').slice(0, 4).join(' ');
      const ctx = { diseaseOfInterest, location: userContext?.location || '' };

      let response;
      if (isFollowUp && (sessionId || ctxSessionId)) {
        response = await sendFollowUp(text, sessionId || ctxSessionId);
      } else {
        response = await sendMessage(text, sessionId, ctx);
        if (response.sessionId && !sessionId) {
          onSessionCreated(response.sessionId);
        }
      }

      stopProgress();

      const safeStructuredContent = response.message.structuredContent ? JSON.parse(JSON.stringify(response.message.structuredContent)) : undefined;
      addMessage({
        role: 'assistant',
        content: response.message.content,
        structuredContent: safeStructuredContent,
        metadata: response.metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      stopProgress();
      addMessage({
        role: 'assistant',
        content: 'I encountered an error processing your request. Please check the backend is running and try again.',
        error: true,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(messages.length > 0);
    }
  };

  const handleSuggestion = (label) => {
    setInput(label);
    textareaRef.current?.focus();
  };

  const handleCopy = (content, idx) => {
    navigator.clipboard.writeText(content || '').then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('curalink_user');
    localStorage.removeItem('curalink_email');
    localStorage.removeItem('curalink_auth_token');
    localStorage.removeItem('curalink_user_data');
    localStorage.removeItem('curalink_session_id');
    navigate('/');
  };

  const handleBadResponse = () => {
    setToastMsg('Retrying with refined query...');
    handleSend(true);
  };

  const handleRetry = () => {
    setToastMsg('Retrying request...');
    handleSend(true);
  };

  const filteredHistory = searchQuery
    ? chatHistory.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatHistory;

  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const grouped   = {
    Today:     filteredHistory.filter(c => c.date === today),
    Yesterday: filteredHistory.filter(c => c.date === yesterday),
    Earlier:   filteredHistory.filter(c => c.date < yesterday),
  };

  return (
    <div className={`chat-root${dark ? ' dark' : ''}`}>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '10px 20px',
          borderRadius: 20, fontSize: 13, zIndex: 99999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'msgFadeIn 0.3s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-confirm-title">Delete Conversations</h3>
            <p className="delete-confirm-text">
              {deleteConfirm === 'all' ? 'Are you sure you want to delete ALL conversation history? This cannot be undone.' :
               deleteConfirm === 'today' ? 'Delete all conversations from today?' :
               deleteConfirm === 'week' ? 'Delete all conversations from this week?' :
               deleteConfirm === 'month' ? 'Delete all conversations from this month?' :
               'Delete this conversation?'}
            </p>
            <div className="delete-confirm-actions">
              <button onClick={() => setDeleteConfirm(null)} className="delete-confirm-cancel-btn">Cancel</button>
              <button onClick={() => {
                if (deleteConfirm === 'all') deleteAllHistory();
                else if (deleteConfirm === 'today') deleteTodayHistory();
                else if (deleteConfirm === 'week') deleteWeekHistory();
                else if (deleteConfirm === 'month') deleteMonthHistory();
                else if (typeof deleteConfirm === 'number') deleteSingleHistory(deleteConfirm);
                setDeleteConfirm(null);
              }} className="delete-confirm-delete-btn">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`chat-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <div className="sb-top">
          <button className="sb-icon-btn" onClick={() => setSidebar(false)} title="Close sidebar">
            <IcMenu />
          </button>
          <button className="sb-new-btn" onClick={handleNewChat}>
            <IcPlus /> New chat
          </button>
          <button className="sb-icon-btn" title="New chat" onClick={handleNewChat}>
            <IcEdit />
          </button>
        </div>

        <div className="sb-search">
          <IcSearch />
          <input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sidebar history */}
        <div className="sb-history">
          {messages.length > 0 && (
            <>
              <div className="sb-section-label">Current</div>
              <button 
                className="sb-chat-item active"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 11 }}
              >
                {messages[0]?.content?.slice(0, 46) || 'Current conversation'}...
              </button>
            </>
          )}

          {Object.entries(grouped).map(([group, chats]) =>
            chats.length > 0 && (
              <div key={group}>
                <div className="sb-section-label">{group}</div>
                {chats.map(c => (
                  <button
                    key={c.id}
                    className={`sb-chat-item${activeChatId === c.id ? ' active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveChatId(c.id);
                      if (c.messages && c.messages.length > 0) {
                        restoreConversation(c);
                      }
                    }}
                    style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 11 }}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )
          )}

          {messages.length === 0 && filteredHistory.length === 0 && (
            <div className="sb-empty">No chat history yet</div>
          )}
        </div>

        <div className="sb-footer">
          <SidebarNewsTicker />
          <div className="sb-user">
            <div className="sb-user-av">{userInitial}</div>
            <div className="sb-user-info">
              <span className="sb-user-name">{userName}</span>
              <span className="sb-user-plan">Free plan</span>
            </div>
            <button className="sb-icon-btn" title="Settings" onClick={() => setShowSettings(true)}>
              <IcSettings />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="chat-main">

        <header className="chat-header">
          {!sidebarOpen && (
            <>
              <button className="chat-header-icon-btn" onClick={() => setSidebar(true)} title="Open sidebar">
                <IcMenu />
              </button>
              <button className="chat-header-icon-btn" onClick={handleNewChat} title="New chat">
                <IcEdit />
              </button>
            </>
          )}

          <button className="chat-model-pill">
            <span className="chat-model-dot" />
            Curalink Research
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <span className="chat-header-title" style={{ fontSize: 0 }}></span>

          <button
            className={`chat-header-btn${showStructuredInput ? ' active' : ''}`}
            onClick={onToggleStructuredInput}
          >
            Structured query
          </button>
          <button className="chat-header-btn" onClick={handleExport} title="Export conversation">
            <IcExport />
            &nbsp;Export
          </button>
          <button className="chat-header-icon-btn" onClick={toggleDark} title="Toggle theme">
            {dark ? <IcSun /> : <IcMoon />}
          </button>
          <button className="chat-header-btn" onClick={handleLogout} style={{ color: 'var(--text-3)' }}>
            Log out
          </button>
        </header>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome-full">
              <div className="chat-hero">
                <div className="chat-hero-logo">
                  <CuralinkMark size={36} />
                </div>
                <h2 className="chat-hero-h">What would you like to research?</h2>
                <p className="chat-hero-sub">
                  Evidence-based answers from PubMed, OpenAlex &amp; ClinicalTrials.gov
                </p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} className="chat-sug" onClick={() => handleSuggestion(s.label)}>
                      <span className="chat-sug-icon">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chat-feed-area">
                <LiveNewsPanel />
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`msg-row${msg.role === 'user' ? ' user' : ''}`}>
                {msg.role === 'user' ? (
                  <>
                    <div className="msg-avatar user">{userInitial}</div>
                    <div className="msg-body">
                      <div className="msg-bubble">{msg.content}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="msg-avatar ai">
                      <CuralinkMark size={22} />
                    </div>
                    <div className="msg-body">
                      <AiText content={msg.content} />

                      {/* FIXED: Publications rendering with safe extractors */}
                      {msg.structuredContent?.publications?.length > 0 && (
                        <div className="msg-sources">
                          <div className="msg-sources-header">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            {msg.structuredContent.publications.length} Sources
                          </div>
                          <div className="msg-sources-list">
                            {msg.structuredContent.publications.slice(0, 6).map((pub, pi) => {
                                const title = getDisplayTitle(pub);
                                const year = getDisplayYear(pub);
                                const url = getDisplayUrl(pub);
                                return (
                                    <div key={pi} className="msg-source-item">
                                        <span className="msg-source-idx">[{pi + 1}]</span>
                                        <span className="msg-source-title">
                                            {url ? (
                                                <a href={url} target="_blank" rel="noreferrer"
                                                    style={{ color: 'inherit', textDecoration: 'none' }}
                                                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                                                    onMouseLeave={e => e.target.style.textDecoration = 'none'}
                                                >
                                                    {title}
                                                </a>
                                            ) : title}
                                        </span>
                                        {year && <span className="msg-source-year">{year}</span>}
                                    </div>
                                );
                            })}
                          </div>
                        </div>
                      )}

                      {msg.metadata && (
                        <div className="msg-meta">
                          {msg.metadata.sourcesCount || msg.structuredContent?.publications?.length || 0} sources
                          {msg.metadata.processingTime ? ` \u00b7 ${msg.metadata.processingTime}ms` : ''}
                        </div>
                      )}

                      {msg.error && (
                        <div className="msg-error">Error &mdash; please try again or check backend connection.</div>
                      )}

                      <div className="msg-actions">
                        <button className="msg-action-btn" onClick={() => handleCopy(msg.content, idx)}>
                          <IcCopy /> {copied === idx ? 'Copied!' : 'Copy'}
                        </button>
                        <button className="msg-action-btn" title="Good response" onClick={() => setToastMsg('Thanks for your feedback!')}>
                          <IcThumbUp />
                        </button>
                        <button className="msg-action-btn" title="Bad response" onClick={handleBadResponse}>
                          <IcThumbDn />
                        </button>
                        <button className="msg-action-btn" title="Retry" onClick={handleRetry}>
                          <IcRetry /> Retry
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}

          {showProgress && (
            <div className="research-progress">
              <div className="rp-bar-track">
                <div className="rp-bar-fill" style={{ width: `${((progressStage + 1) / STAGES.length) * 100}%` }} />
              </div>
              <div className="rp-stage">
                {STAGES[progressStage] || STAGES[STAGES.length - 1]}...
              </div>
            </div>
          )}

          {isLoading && !showProgress && (
            <div className="msg-row">
              <div className="msg-avatar ai"><CuralinkMark size={22} /></div>
              <div className="msg-body">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: 20 }} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-box">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onPaste={e => {
                const text = e.clipboardData.getData('text/plain');
                if (text) {
                  e.preventDefault();
                  const ta = e.target;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const newVal = input.slice(0, start) + text + input.slice(end);
                  setInput(newVal);
                  requestAnimationFrame(() => {
                    ta.selectionStart = ta.selectionEnd = start + text.length;
                  });
                }
              }}
              onKeyDown={handleKey}
              placeholder={
                messages.length > 0
                  ? 'Ask a follow-up question...'
                  : 'Ask about medical research, treatments, or clinical trials...'
              }
              rows={1}
              disabled={isLoading}
            />
            <div className="chat-input-footer">
              <div className="chat-input-left">
                <button className="chat-input-icon-btn" title="Attach file" onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.pdf,.doc,.docx,.txt,.json,.csv';
                    fileInput.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) { setInput(prev => prev + ` [Attached: ${file.name}]`); textareaRef.current?.focus(); }
                    };
                    fileInput.click();
                }}><IcAttach /></button>
                <button
                  className={`chat-input-icon-btn voice-btn${isListening ? ' listening' : ''}`}
                  title={isListening ? 'Stop recording' : 'Voice input'}
                  onClick={() => {
                    if (isListening) {
                      recognitionRef.current?.stop();
                      setIsListening(false);
                      clearInterval(voiceLevelRef.current);
                      setVoiceLevel(0);
                      return;
                    }
                    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                      alert('Voice input not supported in your browser.');
                      return;
                    }
                    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                    const rec = new SR();
                    rec.lang = 'en-US';
                    rec.interimResults = true;
                    rec.continuous = false;
                    recognitionRef.current = rec;
                    rec.onstart = () => {
                      setIsListening(true);
                      voiceLevelRef.current = setInterval(() => {
                        setVoiceLevel(Math.random());
                      }, 120);
                    };
                    rec.onresult = (event) => {
                      const transcript = Array.from(event.results)
                        .map(r => r[0].transcript).join('');
                      setInput(transcript);
                    };
                    rec.onend = () => {
                      setIsListening(false);
                      clearInterval(voiceLevelRef.current);
                      setVoiceLevel(0);
                    };
                    rec.onerror = () => {
                      setIsListening(false);
                      clearInterval(voiceLevelRef.current);
                      setVoiceLevel(0);
                    };
                    rec.start();
                  }}
                >
                  {isListening ? (
                    <span className="voice-anim">
                      {[...Array(4)].map((_, i) => (
                        <span key={i} className="voice-bar" style={{ animationDelay: `${i * 0.12}s`, height: `${8 + voiceLevel * 14 + Math.sin(i) * 4}px` }} />
                      ))}
                    </span>
                  ) : <IcMic />}
                </button>
              </div>
              <button
                className={`chat-send-btn${input.trim() && !isLoading ? ' active' : ''}`}
                onClick={() => handleSend(messages.length > 0)}
                disabled={!input.trim() || isLoading}
                title="Send"
              >
                <IcSend />
              </button>
            </div>
          </div>
          <p className="chat-disclaimer">
            Curalink provides research information only. Always consult a healthcare professional for medical advice.
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="crl-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="crl-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <button className="crl-modal-close" onClick={() => setShowSettings(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>Dark mode</strong><br /><span style={{ fontSize: 12, color: 'var(--text-3)' }}>Toggle dark theme</span></div>
                <button onClick={toggleDark} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', background: dark ? '#22c55e' : '#ccc', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 2, left: dark ? 24 : 2, width: 22, height: 22, borderRadius: '50%', background: 'white', transition: 'left 0.15s ease' }} />
                </button>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              
              <button onClick={() => { handleExport(); setShowSettings(false); }} style={{ textAlign: 'left', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IcExport /> Export conversation data
              </button>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              
              <div>
                <strong style={{ fontSize: 14 }}>Delete Search History</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  <button onClick={() => setDeleteConfirm('today')} style={{ textAlign: 'left', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IcTrash /> Delete today's conversations
                  </button>
                  <button onClick={() => setDeleteConfirm('week')} style={{ textAlign: 'left', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IcTrash /> Delete this week's conversations
                  </button>
                  <button onClick={() => setDeleteConfirm('month')} style={{ textAlign: 'left', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IcTrash /> Delete this month's conversations
                  </button>
                  <button onClick={() => setDeleteConfirm('all')} style={{ textAlign: 'left', padding: 10, borderRadius: 8, border: '1px solid #ef4444', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IcTrash /> Delete all conversations
                  </button>
                </div>
                {chatHistory.length > 0 && (
                  <div style={{ marginTop: 12, maxHeight: 150, overflowY: 'auto' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Individual conversations ({chatHistory.length})</span>
                    {chatHistory.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.title}</span>
                        <button onClick={() => setDeleteConfirm(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px' }}>
                          <IcTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              
              <button onClick={handleLogout} style={{ textAlign: 'left', padding: 12, borderRadius: 8, border: '1px solid #ef4444', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>
                Log out
              </button>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>Version 2.0 | Built by Vigneshwar R<br />MERN Stack + DeepSeek R1 + Ollama</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;