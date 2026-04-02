import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { fetchSaaSStats } from '../lib/firestoreService';
import { 
  Users, MessageSquare, Globe, 
  TrendingUp, Zap, Star, ShieldCheck, ArrowUpRight
} from 'lucide-react';

const DAYS_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SaaSAnalytics = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Security: Only owner can see this.
  const ownerEmail = 'ayushjha.in@gmail.com'; 
  const isOwner = user?.email === ownerEmail || user?.uid.startsWith('dev-mode');

  useEffect(() => {
    if (!isOwner) return;
    setLoading(true);
    fetchSaaSStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOwner]);

  const last7Days = useMemo(() => {
    if (!stats) return [];
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: DAYS_ABBR[d.getDay()], count: stats.usageByDay[key] || 0 });
    }
    return days;
  }, [stats]);

  const maxDay = Math.max(...last7Days.map(d => d.count), 1);

  if (!isOwner) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <ShieldCheck size={48} color="#ef4444" />
        <h2>Access Denied</h2>
        <p>This dashboard is only available for the SaaS Owner.</p>
        <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>Go Back</button>
      </div>
    );
  }

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
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Owner Dashboard</h2>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>SaaS Overview & Global Performance</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
             <span style={{ padding: '4px 12px', background: '#eef2ff', color: '#6366f1', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>LIVE STATS</span>
          </div>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>
          
          <div className="analytics-grid">
            <SaasStatCard
              icon={<Users size={22} />}
              label="Total Users"
              value={stats?.totalUsers || 0}
              subLabel="Registered Accounts"
              color="#6366f1"
              loading={loading}
            />
            <SaasStatCard
              icon={<Zap size={22} />}
              label="Total Widgets"
              value={stats?.totalWidgets || 0}
              subLabel="Created by Users"
              color="#10b981"
              loading={loading}
            />
            <SaasStatCard
              icon={<MessageSquare size={22} />}
              label="Total Messages"
              value={stats?.totalMessages || 0}
              subLabel="Cloud Handled AI Responses"
              color="#f59e0b"
              loading={loading}
            />
            <SaasStatCard
              icon={<Star size={22} />}
              label="Active Makers"
              value={stats?.activeMakers || 0}
              subLabel="Users with Active Widgets"
              color="#ec4899"
              loading={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
             <div className="analytics-card">
              <div className="analytics-card-header">
                <TrendingUp size={18} />
                <h4>Global Platform Growth (Last 7 Days)</h4>
              </div>
              <div className="day-chart">
                {last7Days.map((d, i) => (
                  <div key={i} className="day-bar-col">
                    <div className="day-bar-wrap">
                      <div
                        className="day-bar-fill"
                        style={{ height: `${Math.round((d.count / maxDay) * 100)}%` }}
                        title={`${d.count} events`}
                      />
                    </div>
                    <span className="day-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem', gap: '1.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Platform Health</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>AVG WIDGETS PER USER</p>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{stats ? (stats.totalWidgets / stats.totalUsers).toFixed(1) : 0}</h4>
                      </div>
                      <ArrowUpRight size={20} color="#10b981" />
                   </div>
                   <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL SYSTEM EVENTS</p>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{stats ? (stats.totalMessages + stats.totalOpens) : 0}</h4>
                      </div>
                      <Globe size={20} color="#6366f1" />
                   </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SaasStatCard = ({ icon, label, value, subLabel, color, loading }: any) => (
  <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div className="stat-icon" style={{ background: color + '20', color }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>{label}</p>
      <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>
        {loading ? '...' : value}
      </h3>
      <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{subLabel}</p>
    </div>
  </div>
);

export default SaaSAnalytics;
