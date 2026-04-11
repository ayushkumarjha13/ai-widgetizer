import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { useWidgetStore } from '../store/widgetStore';
import { 
  MessageSquare, ArrowLeft, Bot, Users, MessageCircle
} from 'lucide-react';
import { 
  fetchConversationsForWidget, 
  fetchSessionMessages,
} from '../lib/firestoreService';
import type { WidgetEvent } from '../lib/firestoreService';

const COUNTRIES_EMOJI: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Germany': '🇩🇪',
  'France': '🇫🇷', 'Brazil': '🇧🇷', 'Pakistan': '🇵🇰', 'Unknown': '🌍',
};

const ChatHistory = () => {
  const { user } = useAuthStore();
  const { savedWidgets, loadWidgets } = useWidgetStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Date and Widget selection
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  
  // Conversation state
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WidgetEvent[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const resolvedRange = useMemo(() => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    if (dateRange === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (dateRange === 'yesterday') {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (dateRange === 'week') {
      start.setDate(now.getDate() - 7);
      return { start, end };
    }
    if (dateRange === 'month') {
      start.setMonth(now.getMonth() - 1);
      return { start, end };
    }
    return { start: undefined, end: undefined };
  }, [dateRange]);

  useEffect(() => {
    if (user) {
      loadWidgets(user.uid).then(() => {});
    }
  }, [user, loadWidgets]);

  // Fetch sessions
  useEffect(() => {
    if (selectedWidgetId !== 'all') {
      setLoadingSessions(true);
      fetchConversationsForWidget(selectedWidgetId, resolvedRange.start, resolvedRange.end)
        .then(setSessions)
        .catch(console.error)
        .finally(() => setLoadingSessions(false));
    } else {
      setSessions([]);
    }
  }, [selectedWidgetId, resolvedRange]);

  // Fetch messages when a session is selected
  useEffect(() => {
    if (selectedSessionId) {
      setLoadingMessages(true);
      fetchSessionMessages(selectedSessionId)
        .then(setMessages)
        .catch(console.error)
        .finally(() => setLoadingMessages(false));
    }
  }, [selectedSessionId]);

  return (
    <div className="app-container">
      <Sidebar mobileOpen={isMobileNavOpen} onMobileClose={() => setIsMobileNavOpen(false)} />
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileNavOpen(true)}>
              <span /><span /><span />
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Chat History</h2>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>Review full transcripts and sessions</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '130px' }}
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedWidgetId}
              onChange={e => {
                setSelectedWidgetId(e.target.value);
                setSelectedSessionId(null);
                setSessions([]);
              }}
            >
              <option value="all">All Widgets (Select One)</option>
              {savedWidgets.map(w => (
                <option key={w.id} value={w.id!}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ padding: '2rem', display: 'flex', gap: '2rem', flex: 1, backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
          
          {selectedWidgetId === 'all' ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>Select a specific widget to view conversations</p>
              </div>
            </div>
          ) : (
            <>
              {/* Sessions List */}
              <div className="sessions-list" style={{ width: '350px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                  Recent Chats ({sessions.length})
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loadingSessions ? (
                     <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>Loading sessions...</div>
                  ) : sessions.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.9rem' }}>No conversations found for this period.</p>
                  ) : (
                    sessions.map(s => (
                      <div 
                        key={s.sessionId}
                        onClick={() => setSelectedSessionId(s.sessionId)}
                        style={{ 
                          padding: '1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                          background: selectedSessionId === s.sessionId ? '#f5f3ff' : 'transparent',
                          borderLeft: selectedSessionId === s.sessionId ? '4px solid var(--primary-color)' : '4px solid transparent',
                          transition: '0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>{COUNTRIES_EMOJI[s.country] || '🌍'} {s.country}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{s.lastTs.toLocaleDateString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.lastMessage || 'Conversation started'}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.messageCount} messages</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Messages View */}
              <div className="messages-view" style={{ flex: 1, background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selectedSessionId ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <p>Select a chat to view messages</p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button onClick={() => setSelectedSessionId(null)} className="btn btn-outline" style={{ padding: '4px', borderRadius: '4px' }}>
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Session Transcript</span>
                        <code style={{ display: 'block', fontSize: '0.65rem', opacity: 0.5, marginTop: '2px', padding: '2px 4px', background: '#e2e8f0', borderRadius: '4px' }}>{selectedSessionId}</code>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                      {loadingMessages ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><span className="spinner" /></div>
                      ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                            <MessageCircle size={32} style={{ marginBottom: '1rem' }} />
                            <p>No messages sent yet.</p>
                        </div>
                      ) : (
                        messages.map((m, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{ 
                              maxWidth: '80%', 
                              padding: '10px 14px', 
                              borderRadius: '12px',
                              background: m.sender === 'user' ? 'var(--primary-color)' : '#fff',
                              color: m.sender === 'user' ? '#fff' : 'inherit',
                              border: m.sender === 'bot' ? '1px solid var(--border-color)' : 'none',
                              fontSize: '0.9rem',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', opacity: 0.8, fontSize: '0.7rem' }}>
                                {m.sender === 'bot' ? <Bot size={12} /> : <Users size={12} />}
                                <span>{m.sender === 'bot' ? 'AI Assistant' : 'Visitor'}</span>
                                <span>•</span>
                                <span>{m.ts?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
