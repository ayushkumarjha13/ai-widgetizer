import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { useWidgetStore } from '../store/widgetStore';
import { 
  BarChart2, Users, MessageSquare, Globe, Clock, 
  TrendingUp, Smile, Meh, Frown, Download,
  ArrowLeft, Bot, MessageCircle
} from 'lucide-react';
import { 
  fetchAnalyticsForUser, 
  fetchConversationsForWidget, 
  fetchSessionMessages,
} from '../lib/firestoreService';
import type { WidgetEvent, AnalyticsSummary } from '../lib/firestoreService';

type AllAnalytics = Record<string, AnalyticsSummary>;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COUNTRIES_EMOJI: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Germany': '🇩🇪',
  'France': '🇫🇷', 'Brazil': '🇧🇷', 'Pakistan': '🇵🇰', 'Unknown': '🌍',
};

const Analytics = () => {
  const { user } = useAuthStore();
  const { savedWidgets, loadWidgets } = useWidgetStore();
  const [analytics, setAnalytics] = useState<AllAnalytics>({});
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('all');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Date and Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations'>('overview');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  
  // Conversation state
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WidgetEvent[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    setLoadingAnalytics(true);
    fetchAnalyticsForUser(user.uid, resolvedRange.start, resolvedRange.end)
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoadingAnalytics(false));
  }, [user, resolvedRange]);

  // Fetch sessions when entering conversations tab or switching widget
  useEffect(() => {
    if (activeTab === 'conversations' && selectedWidgetId !== 'all') {
      fetchConversationsForWidget(selectedWidgetId, resolvedRange.start, resolvedRange.end)
        .then(setSessions)
        .catch(console.error);
    }
  }, [activeTab, selectedWidgetId, resolvedRange]);

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

  // Aggregate across all widgets or a single selected one
  const aggData = useMemo<AnalyticsSummary>(() => {
    const ids = selectedWidgetId === 'all'
      ? Object.keys(analytics)
      : [selectedWidgetId];

    const agg: AnalyticsSummary = {
      totalOpens: 0, totalMessages: 0, uniqueSessions: 0,
      byHour: {}, byCountry: {}, byDay: {},
      bySentiment: { happy: 0, neutral: 0, angry: 0 },
    };

    ids.forEach(id => {
      const s = analytics[id];
      if (!s) return;
      agg.totalOpens += s.totalOpens;
      agg.totalMessages += s.totalMessages;
      agg.uniqueSessions += (s.uniqueSessions as any as number);
      Object.entries(s.byHour).forEach(([h, c]) => { agg.byHour[Number(h)] = (agg.byHour[Number(h)] || 0) + c; });
      Object.entries(s.byCountry).forEach(([c, n]) => { agg.byCountry[c] = (agg.byCountry[c] || 0) + n; });
      Object.entries(s.byDay).forEach(([d, n]) => { agg.byDay[d] = (agg.byDay[d] || 0) + n; });
      
      agg.bySentiment.happy += s.bySentiment.happy;
      agg.bySentiment.neutral += s.bySentiment.neutral;
      agg.bySentiment.angry += s.bySentiment.angry;
    });

    return agg;
  }, [analytics, selectedWidgetId]);

  const maxHour = Math.max(...Object.values(aggData.byHour), 1);
  const last7Days = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: DAYS_ABBR[d.getDay()], count: aggData.byDay[key] || 0 });
    }
    return days;
  }, [aggData]);
  const maxDay = Math.max(...last7Days.map(d => d.count), 1);

  const topCountries = Object.entries(aggData.byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);


  const handleExportCSV = () => {
    const headers = ['WidgetId', 'Total Opens', 'Total Messages', 'Unique Sessions', 'Happy', 'Neutral', 'Angry'].join(',');
    const rows = Object.entries(analytics).map(([id, s]) => {
      return [id, s.totalOpens, s.totalMessages, s.uniqueSessions, s.bySentiment.happy, s.bySentiment.neutral, s.bySentiment.angry].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Analytics</h2>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>Track your widget performance</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* View Switcher Button */}
            {activeTab === 'overview' ? (
              <button 
                type="button"
                className="btn"
                onClick={() => setActiveTab('conversations')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                <MessageSquare size={18} />
                <span>View Chat History</span>
              </button>
            ) : (
              <button 
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab('overview')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                <ArrowLeft size={18} />
                <span>Back to Overview</span>
              </button>
            )}

            {/* Date Preset */}
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

            {/* Widget Selector */}
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
              <option value="all">All Widgets</option>
              {savedWidgets.map(w => (
                <option key={w.id} value={w.id!}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>
          
          {activeTab === 'overview' ? (
            <>


          {/* Stat Cards */}
          <div className="analytics-grid">
            <StatCard
              icon={<Users size={22} />}
              label="Unique Visitors"
              value={aggData.uniqueSessions}
              color="#6366f1"
              loading={loadingAnalytics}
            />
            <StatCard
              icon={<TrendingUp size={22} />}
              label="Total Opens"
              value={aggData.totalOpens}
              color="#10b981"
              loading={loadingAnalytics}
            />
            <StatCard
              icon={<MessageSquare size={22} />}
              label="Messages Sent"
              value={aggData.totalMessages}
              color="#f59e0b"
              loading={loadingAnalytics}
            />
            <StatCard
              icon={<BarChart2 size={22} />}
              label="Engagement Rate"
              value={aggData.totalOpens > 0 ? `${Math.round((aggData.totalMessages / aggData.totalOpens) * 100)}%` : '0%'}
              color="#ec4899"
              loading={loadingAnalytics}
            />
          </div>

          <div className="analytics-row-2">
            {/* Hourly Activity */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <Clock size={18} />
                <h4>Activity by Hour</h4>
              </div>
              <div className="hour-chart">
                {HOURS.map(h => (
                  <div key={h} className="hour-bar-col">
                    <div className="hour-bar-wrap">
                      <div
                        className="hour-bar-fill"
                        style={{ height: `${Math.round(((aggData.byHour[h] || 0) / maxHour) * 100)}%` }}
                        title={`${aggData.byHour[h] || 0} events`}
                      />
                    </div>
                    {h % 6 === 0 && <span className="hour-label">{h}:00</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Activity */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <TrendingUp size={18} />
                <h4>Last 7 Days</h4>
              </div>
              <div className="day-chart">
                {last7Days.map((d, i) => (
                  <div key={i} className="day-bar-col">
                    <div className="day-bar-wrap">
                      <div
                        className="day-bar-fill"
                        style={{ height: `${Math.round((d.count / maxDay) * 100)}%` }}
                        title={`${d.count} opens`}
                      />
                    </div>
                    <span className="day-label">{d.label}</span>
                    <span className="day-count">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment Analysis */}
          <div className="analytics-card">
            <div className="analytics-card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smile size={18} />
                <h4>Customer Sentiment Analysis</h4>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', padding: '1rem' }}>
              <SentimentStat icon={<Smile color="#10b981" />} label="Positive" count={aggData.bySentiment.happy} color="#10b981" total={aggData.totalMessages} />
              <SentimentStat icon={<Meh color="#64748b" />} label="Neutral" count={aggData.bySentiment.neutral} color="#94a3b8" total={aggData.totalMessages} />
              <SentimentStat icon={<Frown color="#ef4444" />} label="Negative" count={aggData.bySentiment.angry} color="#ef4444" total={aggData.totalMessages} />
            </div>
          </div>


          {/* Countries */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              <Globe size={18} />
              <h4>Top Countries / Regions</h4>
            </div>
            {topCountries.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No location data yet</p>
            ) : (
              <div className="country-list">
                {topCountries.map(([country, count]) => {
                  const pct = aggData.totalOpens > 0 ? Math.round((count / aggData.totalOpens) * 100) : 0;
                  return (
                    <div key={country} className="country-row">
                      <span className="country-flag">{COUNTRIES_EMOJI[country] || '🌍'}</span>
                      <span className="country-name">{country}</span>
                      <div className="country-bar-wrap">
                        <div className="country-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="country-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </>
          ) : (
            /* Conversations Tab Content */
            <div className="conversations-container" style={{ display: 'flex', gap: '2rem', height: '100%', minHeight: '600px' }}>
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
                      {sessions.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.9rem' }}>No conversations found for this period.</p>
                      ) : (
                        sessions.map(s => (
                          <div 
                            key={s.sessionId}
                            onClick={() => setSelectedSessionId(s.sessionId)}
                            style={{ 
                              padding: '1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                              background: selectedSessionId === s.sessionId ? '#f5f3ff' : 'transparent',
                              borderLeft: selectedSessionId === s.sessionId ? '4px solid var(--p)' : '4px solid transparent',
                              transition: '0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>{COUNTRIES_EMOJI[s.country] || '🌍'} {s.country}</span>
                              <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{s.lastTs.toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.lastMessage || 'Open Event'}
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
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Conversation</span>
                            <code style={{ display: 'block', fontSize: '0.65rem', opacity: 0.5 }}>{selectedSessionId}</code>
                          </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                          {loadingMessages ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><span className="spinner" /></div>
                          ) : messages.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                                <MessageCircle size={32} style={{ marginBottom: '1rem' }} />
                                <p>This was an "Open Widget" event with no messages sent.</p>
                            </div>
                          ) : (
                            messages.map((m, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{ 
                                  maxWidth: '80%', 
                                  padding: '10px 14px', 
                                  borderRadius: '12px',
                                  background: m.sender === 'user' ? '#6366f1' : '#fff',
                                  color: m.sender === 'user' ? '#fff' : 'inherit',
                                  border: m.sender === 'bot' ? '1px solid #e2e8f0' : 'none',
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
          )}

        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, loading }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  loading: boolean;
}) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: color + '20', color }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{label}</p>
      <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
        {loading ? <span className="skeleton-text" /> : value}
      </h3>
    </div>
  </div>
);

const SentimentStat = ({ icon, label, count, total, color }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {icon}
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.25rem' }}>{count}</h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pct}%</span>
      </div>
      <div style={{ height: '4px', background: '#eee', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export default Analytics;
