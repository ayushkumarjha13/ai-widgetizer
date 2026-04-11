import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, 
  BarChart3, Palette, Zap, Globe, Shield, MessageSquare,
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
    <div className="landing-page" style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', overflowX: 'hidden' }}>
      
      {/* Navigation */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.5rem', color: '#6366f1' }}>
          <Zap fill="#6366f1" size={28} />
          <span>ChatWatch</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontWeight: 600, fontSize: '0.9rem' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
          <button onClick={() => setShowAuth(true)} style={{ background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', color: '#6366f1' }}>Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: 'clamp(3rem, 10vw, 6rem) 1.5rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: '#eef2ff', color: '#6366f1', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '2.5rem', border: '1px solid #c7d2fe' }}>
          <Star size={16} fill="#6366f1" />
          <span style={{ letterSpacing: '0.5px' }}>NOW POWERED BY SENTIMENT AI</span>
        </div>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em', color: '#0f172a' }}>
          Turn your n8n workflows into <span style={{ color: '#6366f1' }}>Professional AI Chat Widgets</span>
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Complete custom branding, advanced analytics, and sentiment analysis for your n8n chatbots. Install in seconds with one line of code.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
          <button onClick={() => { setIsSignUp(true); setShowAuth(true); }} className="btn btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', borderRadius: '100px', fontWeight: 800, boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.3), 0 8px 10px -6px rgba(99, 102, 241, 0.4)', transition: 'transform 0.2s', ...({':hover': {transform: 'scale(1.05)'}} as any) }}>
            Start Building for Free <ArrowRight size={20} />
          </button>
          <button style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', borderRadius: '100px', background: '#fff', border: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 700, transition: 'transform 0.2s' }}>
            Book a Demo
          </button>
        </div>

        {/* Video Container placeholder */}
        <div style={{ 
          width: '100%', maxWidth: '1000px', margin: '5rem auto 0',
          aspectRatio: '16/9', background: '#f1f5f9', borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
           <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                 <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid #6366f1', marginLeft: '4px' }}></div>
              </div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Video Presentation Area</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Provide your video link to replace this placeholder</p>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Everything you need to ship</h2>
          <p style={{ color: '#64748b', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>Native n8n widgets are limited. We give you full control over your chat experience.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <FeatureCard 
            icon={<Palette color="#6366f1" />}
            title="Custom Branding"
            desc="Remove all watermarks. Use your own logos, colors, and themes to match your brand perfectly."
          />
          <FeatureCard 
            icon={<BarChart3 color="#6366f1" />}
            title="Advanced Analytics"
            desc="Track every interaction. See unique visitors, message volume, and engagement rates in real-time."
          />
          <FeatureCard 
            icon={<MessageSquare color="#6366f1" />}
            title="Sentiment Analysis"
            desc="Understand your users. Our AI analyzes message sentiment so you know when users are happy or frustrated."
          />
          <FeatureCard 
            icon={<Shield color="#6366f1" />}
            title="Lead Capture"
            desc="Capture emails and names before starting a chat to build your pipeline automatically."
          />
          <FeatureCard 
            icon={<Globe color="#6366f1" />}
            title="Geo Tracking"
            desc="Know where your customers are. Detailed geographical maps showing user distribution."
          />
          <FeatureCard 
            icon={<Zap color="#6366f1" />}
            title="One-Line Install"
            desc="Works everywhere. Wordpress, Webflow, React, or plain HTML. Just paste a script and go."
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
  <div style={{ padding: '3rem 2.5rem', background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default' }} className="hover-lift">
    <div style={{ width: '56px', height: '56px', background: '#eef2ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>{title}</h3>
    <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6 }}>{desc}</p>
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
