import { CheckCircle2, Zap, Shield, Rocket } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useState } from 'react';

const Pricing = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      icon: <Zap size={24} color="#6366f1" />,
      desc: 'Perfect for side projects & hobbyists',
      features: ['1 AI Widget', '100 Messages/month', 'Basic Analytics', 'Community Support'],
      cta: 'Current Plan',
      current: true
    },
    {
      name: 'Professional',
      price: activeTab === 'monthly' ? '$19' : '$190',
      icon: <Rocket size={24} color="#6366f1" />,
      desc: 'Best for growing startups & businesses',
      features: ['3 AI Widgets', '2,000 Messages/month', 'Advanced Analytics', 'Sentiment Analysis', 'Custom CSS', 'Priority Email Support'],
      cta: 'Upgrade to Pro',
      featured: true
    },
    {
      name: 'Business',
      price: activeTab === 'monthly' ? '$49' : '$490',
      icon: <Shield size={24} color="#6366f1" />,
      desc: 'For high-volume production & white-labeling',
      features: ['Unlimited AI Widgets', 'Uncapped Messages', 'CSV Data Export', 'Remove ChatWatch Branding', 'White-labeling Options', '1-on-1 Dedicated Support'],
      cta: 'Go Business'
    }
  ];

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content" style={{ background: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem' }}>Manage Your Subscription</h1>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Choose the plan that fits your growth. Scale your AI assistant as you grow your user base.</p>
            
            {/* Toggle */}
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginTop: '2.5rem', border: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setActiveTab('monthly')}
                style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: activeTab === 'monthly' ? '#fff' : 'transparent', fontWeight: 600, color: activeTab === 'monthly' ? '#0f172a' : '#64748b', transition: '0.2s', cursor: 'pointer', boxShadow: activeTab === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                Monthly
              </button>
              <button 
                onClick={() => setActiveTab('yearly')}
                style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: activeTab === 'yearly' ? '#fff' : 'transparent', fontWeight: 600, color: activeTab === 'yearly' ? '#0f172a' : '#64748b', transition: '0.2s', cursor: 'pointer', boxShadow: activeTab === 'yearly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                Yearly <span style={{ color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', marginLeft: '4px' }}>-20%</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {plans.map(plan => (
              <div 
                key={plan.name}
                style={{ 
                  background: '#fff', 
                  borderRadius: '24px', 
                  padding: '3rem 2.5rem', 
                  border: plan.featured ? '2px solid #6366f1' : '1px solid #e2e8f0', 
                  position: 'relative',
                  boxShadow: plan.featured ? '0 20px 40px -10px rgba(99,102,241,0.15)' : '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                {plan.featured && (
                  <div style={{ position: 'absolute', top: '24px', right: '24px', background: '#6366f1', color: '#fff', padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>MOST POPULAR</div>
                )}
                
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ width: '48px', height: '48px', background: '#f5f7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    {plan.icon}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>{plan.price}</span>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>/{activeTab === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>{plan.desc}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <button 
                  disabled={plan.current}
                  onClick={() => alert(`Redirecting to payment for ${plan.name}...`)}
                  className={plan.featured ? 'btn btn-primary' : 'btn btn-outline'} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem', background: plan.current ? '#f1f5f9' : undefined, color: plan.current ? '#94a3b8' : undefined, border: plan.current ? '1px solid #e2e8f0' : undefined }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '5rem', background: '#0f172a', borderRadius: '32px', padding: '4rem', textAlign: 'center', color: '#fff' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Need a custom enterprise solution?</h2>
            <p style={{ opacity: 0.7, marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>For established companies requiring specific security, higher rate limits, and dedicated account management.</p>
            <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: '100px', fontSize: '1.1rem' }}>
              Talk to Sales
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Pricing;
