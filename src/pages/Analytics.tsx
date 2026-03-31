import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { useWidgetStore } from '../store/widgetStore';
import { fetchAnalyticsForUser } from '../lib/firestoreService';
import type { AnalyticsSummary } from '../lib/firestoreService';
import { 
  BarChart2, Users, MessageSquare, Globe, Clock, 
  TrendingUp, Zap, Smile, Meh, Frown, Download 
} from 'lucide-react';

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

  useEffect(() => {
    if (user) {
      loadWidgets(user.uid).then(() => {});
    }
  }, [user, loadWidgets]);

  useEffect(() => {
    if (!user) return;
    setLoadingAnalytics(true);
    fetchAnalyticsForUser(user.uid)
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoadingAnalytics(false));
  }, [user]);

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

  const isDemo = !user?.uid.startsWith('dev-mode') && Object.keys(analytics).length === 0 && !loadingAnalytics;

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

          {/* Widget Selector */}
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={selectedWidgetId}
            onChange={e => setSelectedWidgetId(e.target.value)}
          >
            <option value="all">All Widgets</option>
            {savedWidgets.map(w => (
              <option key={w.id} value={w.id!}>{w.name}</option>
            ))}
          </select>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>

          {/* Demo Notice */}
          {isDemo && (
            <div className="analytics-notice">
              <Zap size={18} />
              <span>Analytics data will appear here once you deploy your widget and visitors start interacting with it.</span>
            </div>
          )}

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
