import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { fetchSaaSStats } from '../lib/firestoreService';
import { 
  Users, MessageSquare, Globe, 
  TrendingUp, Zap, Star, ShieldCheck, ArrowUpRight,
  AlertCircle, ExternalLink, Calendar, Plus
} from 'lucide-react';

const DAYS_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SaaSAnalytics = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'widgets'>('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Security: Only owner can see this.
  const ownerEmail = 'ayushjha.in@gmail.com'; 
  const isOwner = user?.email === ownerEmail || user?.uid.startsWith('dev-mode');

  useEffect(() => {
    if (!isOwner) return;
    setLoading(true);
    fetchSaaSStats()
      .then(setStats)
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to connect to platform data. Check Firebase permissions.');
      })
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
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Platform Control Centre</h2>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>Global monitoring & user tracking</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <button 
                onClick={() => setActiveTab('overview')}
                className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`} 
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
             >Overview</button>
             <button 
                onClick={() => setActiveTab('users')}
                className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
             >Users ({stats?.totalUsers || 0})</button>
             <button 
                onClick={() => setActiveTab('widgets')}
                className={`btn ${activeTab === 'widgets' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
             >Widgets ({stats?.totalWidgets || 0})</button>
          </div>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>
          
          {error && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '12px' }}>
                <AlertCircle size={20} />
                <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
             </div>
          )}

          {activeTab === 'overview' && (
            <>
              <div className="analytics-grid">
                <SaasStatCard
                  icon={<Users size={22} />}
                  label="Total Registered"
                  value={stats?.totalUsers || 0}
                  subLabel="Users unique growth"
                  color="#6366f1"
                  loading={loading}
                />
                <SaasStatCard
                  icon={<Zap size={22} />}
                  label="Global Widgets"
                  value={stats?.totalWidgets || 0}
                  subLabel="Deployed assets"
                  color="#10b981"
                  loading={loading}
                />
                <SaasStatCard
                  icon={<MessageSquare size={22} />}
                  label="Total Messages"
                  value={stats?.totalMessages || 0}
                  subLabel="Platform load volume"
                  color="#f59e0b"
                  loading={loading}
                />
                <SaasStatCard
                  icon={<Star size={22} />}
                  label="Active Makers"
                  value={stats?.activeMakers || 0}
                  subLabel="Users with creations"
                  color="#ec4899"
                  loading={loading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="analytics-card">
                  <div className="analytics-card-header">
                    <TrendingUp size={18} />
                    <h4>Daily Platform Activity</h4>
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

                <div className="analytics-card">
                   <div className="analytics-card-header">
                      <Zap size={18} />
                      <h4>Quick User Scan</h4>
                   </div>
                   <div style={{ padding: '1rem' }}>
                      {stats?.users.slice(0, 5).map((u: any) => (
                         <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                               <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{u.email}</p>
                               <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Plan: {u.plan || 'Free'}</p>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                               {(u.updatedAt as any)?.toDate?.().toLocaleDateString() || '--'}
                            </span>
                         </div>
                      ))}
                      <button 
                        onClick={() => setActiveTab('users')}
                        style={{ width: '100%', padding: '10px', marginTop: '1rem', border: '1px solid #eef2ff', background: '#f5f7ff', borderRadius: '8px', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >View All User Records</button>
                   </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="analytics-card" style={{ padding: '0' }}>
               <div className="analytics-card-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
                  <Users size={18} />
                  <h4 style={{ margin: 0 }}>Registered Customer Database</h4>
               </div>
               <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>EMAIL ADDRESS</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>PLAN</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>LAST UPDATED</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>USER ID</th>
                        </tr>
                     </thead>
                     <tbody>
                        {stats?.users.map((u: any) => (
                           <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '1rem 2rem', fontSize: '0.9rem', fontWeight: 600 }}>{u.email}</td>
                              <td style={{ padding: '1rem 2rem' }}>
                                 <span style={{ padding: '4px 10px', background: u.plan === 'business' ? '#f5f3ff' : '#f1f5f9', color: u.plan === 'business' ? '#7c3aed' : '#475569', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {u.plan || 'starter'}
                                 </span>
                              </td>
                              <td style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#64748b' }}>
                                 {(u.updatedAt as any)?.toDate?.().toLocaleString() || 'N/A'}
                              </td>
                              <td style={{ padding: '1rem 2rem', fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{u.id}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'widgets' && (
             <div className="analytics-card" style={{ padding: '0' }}>
                <div className="analytics-card-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
                   <Zap size={18} />
                   <h4 style={{ margin: 0 }}>Platform-Wide Widget Deployment</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>WIDGET NAME</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>OWNER UID</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>N8N WEBHOOK</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>LAST MODIFIED</th>
                        </tr>
                     </thead>
                     <tbody>
                        {stats?.widgets.map((w: any) => (
                           <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '1rem 2rem', fontSize: '0.9rem', fontWeight: 600 }}>{w.name}</td>
                              <td style={{ padding: '1rem 2rem', fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{w.ownerUid}</td>
                              <td style={{ padding: '1rem 2rem' }}>
                                 <div style={{ fontSize: '0.75rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ExternalLink size={12} />
                                    {w.n8nWebhookUrl?.substring(0, 30)}...
                                 </div>
                              </td>
                              <td style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#64748b' }}>
                                 {(w.updatedAt as any)?.toDate?.().toLocaleString() || 'N/A'}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

const SaasStatCard = ({ icon, label, value, subLabel, color, loading }: any) => (
  <div className="stat-card">
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
