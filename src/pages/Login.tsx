import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, 
  BarChart3, Palette, Zap, MessageSquare,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { syncUserDoc } from '../lib/firestoreService';

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      let isNewUser = false;
      if (isSignUp) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        user = res.user;
        isNewUser = true;
        await sendEmailVerification(user);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        user = res.user;
      }
      
      if (user) {
        // Enforce Email Verification (only for new signups)
        if (isNewUser && !user.emailVerified && !user.email?.endsWith('@local.host')) {
          await signOut(auth);
          setError('Account created! Please verify your email address. We sent a link to your email.');
          return;
        }

        await syncUserDoc(user.uid, user.email!);
        if (isNewUser) {
          fetch('https://n8n.srv976794.hstgr.cloud/webhook/user-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, uid: user.uid })
          }).catch(err => console.error('n8n error:', err));
        }
      }
      navigate('/dashboard');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'auth/api-key-not-valid' || auth.app.options.apiKey?.includes('DummyKey')) {
        const devUser = { uid: 'dev-mode-user', email: email || 'developer@local.host' };
        try {
          await syncUserDoc(devUser.uid, devUser.email);
        } catch (firestoreErr) {
          console.warn('Could not sync dev user to Firestore:', firestoreErr);
        }
        setUser(devUser as Parameters<typeof setUser>[0]);
        navigate('/dashboard');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (res.user && !res.user.emailVerified) {
        await sendEmailVerification(res.user);
        setError('Verification email resent. Please check your inbox.');
        await signOut(auth);
      }
    } catch(e) {
      setError('Error resending email. Please try logging in again to see options.');
    }
    setLoading(false);
  };

  return (
    <div className="landing-page" style={{ background: '#020617', minHeight: '100vh', color: '#f8fafc', overflowX: 'hidden', backgroundImage: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(239, 68, 68, 0.05), transparent 40%)' }}>
      
      {/* Navigation */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.5rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
          <Zap fill="#10b981" color="#10b981" size={28} />
          <span>ChatWatch<span style={{ color: '#10b981' }}>.</span></span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontWeight: 600, fontSize: '0.9rem', alignItems: 'center' }}>
          <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <button onClick={() => setShowAuth(true)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '8px 20px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: 'clamp(5rem, 12vw, 8rem) 1.5rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 24px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '2.5rem', border: '1px solid rgba(16, 185, 129, 0.3)', backdropFilter: 'blur(8px)' }}>
          <Star size={16} fill="#10b981" />
          <span style={{ letterSpacing: '0.5px' }}>SOLVING N8N'S BIGGEST BLINDSPOT</span>
        </div>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 4.8rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.03em', color: '#fff' }}>
          Stop guessing. <span style={{ color: '#10b981', textShadow: '0 0 40px rgba(16, 185, 129, 0.4)' }}>See exactly</span> what your n8n bots are saying.
        </h1>
        <p style={{ fontSize: 'clamp(1.1rem, 4vw, 1.35rem)', color: '#94a3b8', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '800px', margin: '0 auto 3rem' }}>
          Native n8n webhooks are a black box. ChatWatch gives you complete session-based transcripts, white-label branding without watermarks, and enterprise analytics for your n8n workflows.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button onClick={() => { setIsSignUp(true); setShowAuth(true); }} className="btn" style={{ padding: '1.25rem 2.75rem', fontSize: '1.1rem', borderRadius: '100px', fontWeight: 800, background: '#10b981', color: '#020617', border: 'none', boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Build Your First Widget <ArrowRight size={20} />
          </button>
          <button style={{ padding: '1.25rem 2.75rem', fontSize: '1.1rem', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            View Demo
          </button>
        </div>

        {/* Video Container placeholder */}
        <div style={{ 
          width: '100%', maxWidth: '1000px', margin: '6rem auto 0',
          aspectRatio: '16/9', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)'
        }}>
           <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                 <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #10b981', marginLeft: '6px' }}></div>
              </div>
              <p style={{ fontWeight: 600, fontSize: '1.2rem', color: '#fff' }}>See the Platform in Action</p>
              <p style={{ fontSize: '0.95rem', opacity: 0.8, marginTop: '0.5rem' }}>Provide your demo video link to embed here</p>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '6rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>Built for the n8n Maker</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>Native n8n widgets are a black box. We give you full control, deep insights, and a premium enterprise look.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <FeatureCard 
            icon={<MessageSquare color="#10b981" />}
            title="Session Transcript Tracking"
            desc="The missing feature for n8n. See exactly what your users and AI are saying with full session-based chat logs."
          />
          <FeatureCard 
            icon={<Palette color="#10b981" />}
            title="100% White-Labeled"
            desc="No 'Powered by n8n' watermarks. Apply your own custom colors, fonts, and logos for a true enterprise feel."
          />
          <FeatureCard 
            icon={<BarChart3 color="#10b981" />}
            title="SaaS-Grade Analytics"
            desc="Stop guessing if your workflow is converting. Track unique visitors, message volume, and engagement metrics natively."
          />
        </div>
      </section>


      {/* Auth Modal Overlay */}
      {showAuth && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="login-card" style={{ maxWidth: '440px', background: '#fff', padding: '2.5rem', borderRadius: '24px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.4 }}>&times;</button>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 800 }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p style={{ marginBottom: '2rem', color: '#64748b', fontWeight: 500 }}>
              {isSignUp ? 'Join 500+ makers building better n8n chatbots.' : 'Sign in to access your dashboard.'}
            </p>

            {error && (
              <div style={{ padding: '1rem', background: error.includes('resent') ? '#ecfdf5' : '#fef2f2', color: error.includes('resent') ? '#064e3b' : '#ef4444', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600, border: error.includes('resent') ? '1px solid #d1fae5' : '1px solid #fee2e2' }}>
                {error}
                {error.includes('verify') && !error.includes('resent') && (
                  <button type="button" onClick={handleResend} style={{ display: 'block', marginTop: '0.5rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
                    Resend Verification Email
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Work Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} size={18} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '2px solid #f1f5f9', outline: 'none' }}
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} size={18} />
                  <input
                    type="password"
                    className="form-control"
                    style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '2px solid #f1f5f9', outline: 'none' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', marginTop: '0.5rem', fontSize: '1rem' }} disabled={loading}>
                {loading ? 'Processing...' : (isSignUp ? 'Get Instant Access' : 'Sign In to Dashboard')}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  style={{ color: '#6366f1', background: 'none', border: 'none', padding: 0, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: '4rem 2rem', background: '#0f172a', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>
              <Zap fill="#fff" size={28} />
              <span>ChatWatch</span>
            </div>
            <p style={{ opacity: 0.5, maxWidth: '240px', fontSize: '0.9rem' }}>The #1 Analytics & Monitoring platform for n8n AI Chatbots.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a href="https://www.linkedin.com/in/ayushkumar1309/" target="_blank" style={{ color: '#fff', opacity: 0.6 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="mailto:ayushjha.in@gmail.com" style={{ color: '#fff', opacity: 0.6 }} title="ayushjha.in@gmail.com">
                <Mail size={20} />
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4rem' }}>
            <FooterCol title="Product" links={['Features', 'Integrations']} />
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4rem', paddingTop: '2rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem' }}>
          © 2026 ChatWatch. Built for n8n by <a href="https://www.linkedin.com/in/ayushkumar1309/" style={{ color: 'inherit', textDecoration: 'underline' }}>Ayush Kumar</a>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div style={{ padding: '3rem 2.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', backdropFilter: 'blur(10px)' }}>
    <div style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>{title}</h3>
    <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6 }}>{desc}</p>
  </div>
);


const FooterCol = ({ title, links }: { title: string, links: string[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <h4 style={{ fontWeight: 800, fontSize: '1rem' }}>{title}</h4>
    {links.map((l: string) => (
      <a key={l} href={`#${l.toLowerCase()}`} style={{ color: '#fff', opacity: 0.6, fontSize: '0.9rem', textDecoration: 'none' }}>{l}</a>
    ))}
  </div>
);

export default Login;
