import { LayoutDashboard, PlusCircle, BarChart2, LogOut, X, Zap, ShieldCheck, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

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
    { label: 'Chat History', icon: <MessageSquare size={20} />, path: '/chat-history' }
  ];

  const ownerEmail = 'ayushjha.in@gmail.com';
  const isOwner = user?.email === ownerEmail || (user?.user_id && String(user.user_id).startsWith('dev-mode'));

  if (isOwner) {
    menu.push({ label: 'Owner Dashboard', icon: <ShieldCheck size={20} />, path: '/admin' });
  }

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


        <div className="nav-item logout-btn" onClick={handleLogout} style={{ borderTop: '1px solid var(--border-color)', borderRadius: 0 }}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
