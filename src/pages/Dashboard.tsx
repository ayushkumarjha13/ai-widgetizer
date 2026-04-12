import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { PlusCircle, Code, Edit2, Trash2, MessageSquare, Loader2, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWidgetStore } from '../store/widgetStore';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { resetConfig, savedWidgets, deleteWidget, setConfig, loadWidgets, loading, loadError } = useWidgetStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    resetConfig();
    if (user) {
      loadWidgets(user.user_id);
    }
  }, [resetConfig, user, loadWidgets]);

  const handleEdit = (widget: any) => {
    setConfig(widget);
    navigate(`/builder/${widget.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this widget?')) return;
    await deleteWidget(id);
  };

  return (
    <div className="app-container">
      <Sidebar mobileOpen={isMobileNavOpen} onMobileClose={() => setIsMobileNavOpen(false)} />
      <div className="main-content">
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileNavOpen(true)}>
              <span /><span /><span />
            </button>
            <h2 style={{ margin: 0 }}>My Widgets</h2>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/builder')}>
            <PlusCircle size={18} /> <span className="btn-label">Create Widget</span>
          </button>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
            <Loader2 size={28} className="spin" /> Loading widgets...
          </div>
        ) : loadError ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '12px', color: '#b91c1c', maxWidth: '480px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#b91c1c' }}>⚠️ Could not load widgets</h4>
              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#dc2626' }}>{loadError}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Make sure your PostgreSQL database is connected and environment variables are set in Vercel.</p>
            </div>
            <button className="btn btn-outline" onClick={() => user && loadWidgets(user.user_id)}>Retry</button>
          </div>
        ) : savedWidgets.length > 0 ? (
          <div className="widgets-grid">
            {savedWidgets.map(w => (
              <div key={w.id} className="widget-card">
                <div className="widget-card-header">
                  <div className="widget-card-title">
                    <div className="color-dot" style={{ backgroundColor: w.primaryColor }} />
                    {w.name}
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>
                  {w.n8nWebhookUrl ? '✅ Connected to n8n' : '⚠️ No webhook configured'}
                </p>
                <div className="widget-card-actions">
                  <button className="btn btn-outline card-action-btn" onClick={() => handleEdit(w)}>
                    <Edit2 size={14} /> <span>Edit</span>
                  </button>
                  <button className="btn btn-outline card-action-btn" onClick={() => navigate(`/analytics`)}>
                    <BarChart2 size={14} /> <span>Analytics</span>
                  </button>
                  <button className="btn btn-outline card-action-btn" onClick={() => handleEdit(w)}>
                    <Code size={14} /> <span>Embed</span>
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.5rem 0.75rem' }} onClick={() => handleDelete(w.id!)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', padding: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={32} />
            </div>
            <h3 style={{ color: 'var(--text-main)', margin: 0 }}>No widgets yet</h3>
            <p style={{ textAlign: 'center', margin: 0 }}>Create your first AI chat widget and deploy it anywhere.</p>
            <button className="btn btn-primary" onClick={() => navigate('/builder')}>
              <PlusCircle size={18} /> Create Your First Widget
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
