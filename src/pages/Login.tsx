import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, 
  BarChart3, Palette, Zap, MessageSquare,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../lib/authService';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email);
      
      if (data.token) {
        setUser(data.user);
        // Sync with n8n if needed
        if (isSignUp) {
          fetch('https://n8n.srv976794.hstgr.cloud/webhook/user-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.user.email, uid: data.user.user_id })
          }).catch(err => console.error('n8n error:', err));
        }
        navigate('/dashboard');
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Authentication failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="landing-page" style={{ 
      background: '#020617', 
      minHeight: '100vh', 
      color: '#f8fafc',
      overflowX: 'hidden',
      backgroundImage: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(239, 68, 68, 0.05), transparent 40%)'
    }}>
      
      {/* Navigation */}
      <nav style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(2, 6, 23, 0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.5rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
          <Zap fill="#10b981" color="#10b981" size={28} />
          <span>ChatWatch<span style={{ color: '#10b981' }}>.</span></span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => { setIsSignUp(false); setShowAuth(true); }}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Log in
          </button>
          <button 
            onClick={() => { setIsSignUp(true); setShowAuth(true); }}
            style={{ background: '#10b981', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'; }}
          >
            Get Started
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Hero Section */}
        <section style={{ padding: '8rem 0 5rem', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)', zIndex: -1 }}></div>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Star size={14} fill="#10b981" />
            <span>Trusted by 500+ n8n developers</span>
          </div>

          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 850, lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.04em', background: 'linear-gradient(to bottom right, #f8fafc 60%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            White-labeled AI Chat<br/>
            <span style={{ color: '#10b981', WebkitTextFillColor: '#10b981' }}>Built for n8n.</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
            The most powerful chat widget component for n8n. Create premium, branded experiences for your clients and track every message with advanced session analytics.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              onClick={() => { setIsSignUp(true); setShowAuth(true); }}
              style={{ background: '#10b981', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
            >
              Start Building Now
              <ArrowRight size={20} />
            </button>
            <button 
              style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#f8fafc', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
            >
              Watch Demo
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ padding: '8rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>SaaS features out of the box</h2>
            <p style={{ color: '#94a3b8' }}>Everything you need to ship a professional chatbot product.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { 
                icon: <Palette color="#10b981" />, 
                title: "Full White-labeling", 
                desc: "Custom colors, logos, and fonts. Remove all branding to make it truly yours." 
              },
              { 
                icon: <MessageSquare color="#10b981" />, 
                title: "Live Chat Intercept", 
                desc: "Monitor conversations in real-time and jump in when your users need help." 
              },
              { 
                icon: <BarChart3 color="#10b981" />, 
                title: "Session Tracking", 
                desc: "Detailed analytics on conversion, drop-off rates, and conversation length." 
              }
            ].map((f, i) => (
              <div key={i} style={{ padding: '2.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'all 0.3s' }} className="feature-card">
                <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Auth Modal Overlay */}
      {showAuth && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0f172a', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Lock color="#10b981" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p style={{ color: '#94a3b8' }}>
                {isSignUp ? 'Start your ChatWatch journey today' : 'Log in to manage your widgets'}
              </p>
            </div>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#f1f5f9' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: '#fff', fontSize: '1rem' }}
                  />
                </div>
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                style={{ background: '#10b981', color: '#fff', padding: '0.875rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', marginTop: '0.5rem' }}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', marginLeft: '0.5rem' }}
                  >
                    {isSignUp ? 'Log In' : 'Sign Up'}
                  </button>
                </span>
              </div>
            </form>
            
            <button 
              onClick={() => setShowAuth(false)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', marginTop: '1.5rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, opacity: 0.5 }}>
            <Zap size={20} />
            <span>ChatWatch</span>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
            © 2024 ChatWatch. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        .feature-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(16, 185, 129, 0.2) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus {
          outline: none;
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.03) !important;
        }
      `}</style>
    </div>
  );
};

export default Login;
