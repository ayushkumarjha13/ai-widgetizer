import { LayoutDashboard, PlusCircle, BarChart2, LogOut, X, Shield, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navTo = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  const menu = [
    { label: 'My Widgets', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'Create Widget', icon: <PlusCircle size={20} />, path: '/builder' },
    { label: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} />
      )}

      <div className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Zap color="var(--primary-color)" size={24} fill="var(--primary-color)" />
          <span>ChatWatch</span>
          {/* Close btn on mobile */}
          <button className="sidebar-close-btn" onClick={onMobileClose}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-nav">
          {menu.map(item => (
            <div
              key={item.label}
              className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => navTo(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '1.25rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={16} color="var(--primary-color)" />
            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>STARTER PLAN</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Upgrade for Unlimited Widgets & CSV Export.</p>
          <button 
            onClick={() => alert('Redirecting to Payment...')}
            className="btn btn-primary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%', borderRadius: '8px' }}
          >
            Upgrade Now
          </button>
        </div>

        <div className="nav-item logout-btn" onClick={handleLogout} style={{ borderTop: '1px solid var(--border-color)', borderRadius: 0 }}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
