import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Analytics from './pages/Analytics';
import ChatHistory from './pages/ChatHistory';
import SaaSAnalytics from './pages/SaaSAnalytics';
import { useAuthStore } from './store/authStore';
import { authService } from './lib/authService';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function initAuth() {
      try {
        const user = await authService.checkStatus();
        setUser(user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, [setUser, setLoading]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/builder" element={<PrivateRoute><Builder /></PrivateRoute>} />
        <Route path="/builder/:widgetId" element={<PrivateRoute><Builder /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/chat-history" element={<PrivateRoute><ChatHistory /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><SaaSAnalytics /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
