import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../lib/apiService';
import { 
  Users, 
  TrendingUp, Zap, Star, ShieldCheck,
  AlertCircle, ExternalLink
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
  const ownerEmail = 'ayushkumarjha13@gmail.com'; 
  const isOwner = user?.email === ownerEmail || user?.user_id?.startsWith('dev-mode');

  useEffect(() => {
    if (!isOwner) return;
    setLoading(true);
    apiService.getAdminStats()
      .then(setStats)
      .catch((err: any) => {
        console.error(err);
        setError(err.message || 'Failed to connect to platform data. Check database permissions.');
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
        </div>

        {/* Tabs Bar */}
        <div className="saas-tabs-container" style={{ 
            display: 'flex', gap: '8px', overflowX: 'auto', 
            padding: '1rem 1.5rem', background: 'var(--surface-color)', 
            borderBottom: '1px solid var(--border-color)',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            flexShrink: 0
        }}>
             <button 
                onClick={() => setActiveTab('overview')}
                className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`} 
                style={{ padding: '6px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '100px' }}
             >Dashboard</button>
             <button 
                onClick={() => setActiveTab('users')}
                className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '100px' }}
             >Customer Base ({stats?.totalUsers || 0})</button>
             <button 
                onClick={() => setActiveTab('widgets')}
                className={`btn ${activeTab === 'widgets' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '100px' }}
             >Deployments ({stats?.totalWidgets || 0})</button>
        </div>

        <div className="saas-overview-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>
          
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
                  label="Total Users"
                  value={stats?.totalUsers || 0}
                  subLabel="Registered accounts"
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
                  icon={<TrendingUp size={22} />}
                  label="Total Impressions"
                  value={stats?.totalOpens || 0}
                  subLabel="Widget load volume"
                  color="#f59e0b"
                  loading={loading}
                />
                <SaasStatCard
                  icon={<Star size={22} />}
                  label="Active Makers"
                  value={stats?.activeMakers || 0}
                  subLabel="Users with deployments"
                  color="#ec4899"
                  loading={loading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                      <Users size={18} />
                      <h4>Recent Signups</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats?.users?.slice(0, 4).map((u: any) => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{u.email}</span>
                               <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                   {(u.updatedAt as any)?.toDate?.().toLocaleDateString() || 'Recently'}
                               </span>
                           </div>
                           <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', background: '#ecfeff', color: '#0891b2', borderRadius: '100px', textTransform: 'uppercase' }}>
                               Registered
                           </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Platform Growth Insights</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data to showcase to the public</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                       <div style={{ padding: '1.25rem', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '0.7rem', color: '#7c3aed', fontWeight: 800, letterSpacing: '0.5px' }}>MESSAGES PROCESSED</p>
                          <h4 style={{ margin: 0, color: '#7c3aed', fontSize: '1.75rem' }}>{stats?.totalMessages || 0}</h4>
                       </div>
                       <div style={{ padding: '1.25rem', background: '#ecfeff', borderRadius: '12px', border: '1px solid #cffafe' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '0.7rem', color: '#0891b2', fontWeight: 800, letterSpacing: '0.5px' }}>ENGAGEMENT RATE</p>
                          <h4 style={{ margin: 0, color: '#0891b2', fontSize: '1.75rem' }}>{stats?.totalOpens ? Math.round((stats.totalMessages / Math.max(1, stats.totalOpens)) * 100) : 0}%</h4>
                       </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                         <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Top Widgets</h4>
                         <Zap size={16} color="#6366f1" />
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {stats?.leaderboard?.slice(0, 5).map((w: any, i: number) => (
                             <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#ffedd5' : '#f8fafc', color: i === 0 ? '#d97706' : i === 1 ? '#64748b' : i === 2 ? '#c2410c' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                                      {i+1}
                                   </div>
                                   <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{w.name}</span>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '4px 8px', borderRadius: '6px' }}>{w.count} msg</span>
                             </div>
                          ))}
                       </div>
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
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>STATUS</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>LAST UPDATED</th>
                           <th style={{ padding: '1rem 2rem', fontSize: '0.8rem', color: '#64748b' }}>USER ID</th>
                        </tr>
                     </thead>
                     <tbody>
                        {stats?.users.map((u: any) => (
                           <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '1rem 2rem', fontSize: '0.9rem', fontWeight: 600 }}>{u.email}</td>
                              <td style={{ padding: '1rem 2rem' }}>
                                 <span style={{ padding: '4px 10px', background: '#ecfeff', color: '#0891b2', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Active
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
