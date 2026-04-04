import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LivePreview from '../components/LivePreview';
import { useWidgetStore } from '../store/widgetStore';
import { useAuthStore } from '../store/authStore';
import { Save, CheckCircle2, Plus, Trash, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { WidgetConfig } from '../store/widgetStore';

const generateEmbedCode = (c: WidgetConfig) => {
  const host = window.location.origin;
  return `<!-- AI CHAT WIDGET -->
<script src="${host}/widget.js"></script>
<script>
  ChatWidget.init({
    widgetId: "${c.id || 'YOUR_WIDGET_ID'}",
    baseUrl: "${host}"
  });
</script>`;
};

const Builder = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [saved, setSaved] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { config, updateConfig, saveWidget, savedWidgets, setConfig, saving } = useWidgetStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { widgetId } = useParams();

  useEffect(() => {
    if (widgetId) {
      const existing = savedWidgets.find(w => w.id === widgetId);
      if (existing && existing.id !== config.id) {
        setConfig(existing);
      }
    }
  }, [widgetId, savedWidgets, setConfig, config.id]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await saveWidget(config, user.uid);
      setSaved(true);
      setActiveTab('embed');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save. Please check your Firebase configuration.');
    }
  };

  const tabs = [
    { id: 'setup', label: 'Setup' },
    { id: 'design', label: 'Design' },
    { id: 'content', label: 'Content' },
    { id: 'embed', label: 'Embed' },
  ];

  return (
    <div className="app-container">
      <Sidebar mobileOpen={isMobileNavOpen} onMobileClose={() => setIsMobileNavOpen(false)} />
      <div className="builder-layout">
        <div className="builder-panel">

          <div className="header" style={{ padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="mobile-menu-btn" onClick={() => setIsMobileNavOpen(true)}>
                <span /><span /><span />
              </button>
              <input
                type="text"
                value={config.name}
                onChange={e => updateConfig('name', e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1.05rem', fontWeight: 600, width: '180px', color: 'var(--text-main)' }}
              />
            </div>
            <button className="btn btn-primary" style={{ padding: '0.4rem 1rem' }} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>

          <div className="tabs-header">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="tab-content" style={{ overflowY: 'auto' }}>

            {activeTab === 'setup' && (
              <div className="flex-col gap-4">
                <h4>Connection</h4>
                <p>Configure the connection to your n8n workflow webhook.</p>
                <div className="form-group">
                  <label>n8n Webhook URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://your-n8n.com/webhook/..."
                    value={config.n8nWebhookUrl}
                    onChange={e => updateConfig('n8nWebhookUrl', e.target.value)}
                  />
                  {config.n8nWebhookUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      <CheckCircle2 size={14} /> URL Provided
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Open Automatically</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show chat window instantly on page load</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.autoOpen === true}
                      onChange={e => updateConfig('autoOpen', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="flex-col gap-4">
                <h4>Appearance</h4>

                <div className="form-group">
                  <label>Logo URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={config.logoUrl}
                    onChange={e => updateConfig('logoUrl', e.target.value)}
                  />
                  {config.logoUrl && (
                    <img src={config.logoUrl} alt="Logo preview" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', marginTop: 4, border: '1px solid var(--border-color)' }} />
                  )}
                </div>

                <div className="form-group">
                  <label>Primary Color</label>
                  <div className="color-picker-row">
                    <input type="color" className="color-swatch" value={config.primaryColor} onChange={e => updateConfig('primaryColor', e.target.value)} />
                    <input type="text" className="form-control" style={{ flex: 1 }} value={config.primaryColor} onChange={e => updateConfig('primaryColor', e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>User Bubble Color</label>
                  <div className="color-picker-row">
                    <input type="color" className="color-swatch" value={config.userBubbleColor} onChange={e => updateConfig('userBubbleColor', e.target.value)} />
                    <input type="text" className="form-control" style={{ flex: 1 }} value={config.userBubbleColor} onChange={e => updateConfig('userBubbleColor', e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bot Bubble Color</label>
                  <div className="color-picker-row">
                    <input type="color" className="color-swatch" value={config.botBubbleColor} onChange={e => updateConfig('botBubbleColor', e.target.value)} />
                    <input type="text" className="form-control" style={{ flex: 1 }} value={config.botBubbleColor} onChange={e => updateConfig('botBubbleColor', e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Widget Position</label>
                  <select
                    className="form-control"
                    value={config.position || 'right'}
                    onChange={e => updateConfig('position', e.target.value)}
                  >
                    <option value="right">Bottom Right</option>
                    <option value="left">Bottom Left</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="flex-col gap-4">
                <h4>Messaging</h4>

                <div className="form-group">
                  <label>Header Subtitle</label>
                  <input type="text" className="form-control" value={config.headerSubtitle} onChange={e => updateConfig('headerSubtitle', e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Greeting Message</label>
                  <textarea className="form-control" value={config.greetingMessage} onChange={e => updateConfig('greetingMessage', e.target.value)} />
                </div>

                <h4>Starter Questions</h4>
                <div className="flex-col gap-2">
                  {config.starterQuestions?.map((q, idx) => (
                    <div className="starter-question-item" key={idx}>
                      <input
                        className="form-control"
                        value={q}
                        onChange={(e) => {
                          const newQ = [...(config.starterQuestions || [])];
                          newQ[idx] = e.target.value;
                          updateConfig('starterQuestions', newQ);
                        }}
                      />
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.5rem' }}
                        onClick={() => {
                          const newQ = (config.starterQuestions || []).filter((_, i) => i !== idx);
                          updateConfig('starterQuestions', newQ);
                        }}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                    onClick={() => updateConfig('starterQuestions', [...(config.starterQuestions || []), 'New question'])}
                  >
                    <Plus size={16} /> Add Question
                  </button>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>Branding Footer</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Display a link at the bottom of the chat</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.showBranding !== false}
                        onChange={e => updateConfig('showBranding', e.target.checked)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {config.showBranding !== false && (
                    <div className="flex-col gap-3" style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div className="form-group">
                        <label>Branding Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Powered by AI Widget"
                          value={config.brandingText}
                          onChange={e => updateConfig('brandingText', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Branding URL</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://yourwebsite.com"
                          value={config.brandingLink}
                          onChange={e => updateConfig('brandingLink', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>Open Automatically</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically pop the chat window open on page load</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.autoOpen === true}
                        onChange={e => updateConfig('autoOpen', e.target.checked)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}



            {activeTab === 'embed' && (
              <div className="flex-col gap-4">
                {saved && (
                  <div style={{ padding: '1.25rem', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <div>
                      <h4 style={{ margin: 0 }}>Widget Saved!</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Your widget is ready for production.</p>
                    </div>
                  </div>
                )}

                <h4>Installation Code</h4>
                <p>Paste this code right before the closing <code>&lt;/body&gt;</code> tag. The widget supports <strong>full Markdown</strong> including clickable links.</p>

                <div style={{ position: 'relative' }}>
                  <textarea
                    readOnly
                    className="form-control"
                    style={{ width: '100%', minHeight: '320px', fontFamily: 'monospace', fontSize: '0.75rem', background: '#1e293b', color: '#e2e8f0', borderColor: '#334155', whiteSpace: 'pre', lineHeight: 1.5 }}
                    value={generateEmbedCode(config)}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ position: 'absolute', top: '10px', right: '10px', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => { 
                      navigator.clipboard.writeText(generateEmbedCode(config));
                      const btn = document.activeElement as HTMLButtonElement;
                      const originalText = btn.innerText;
                      btn.innerText = 'Copied!';
                      setTimeout(() => btn.innerText = originalText, 2000);
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div className="mt-4">
                  <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        <LivePreview />

      </div>
    </div>
  );
};

export default Builder;
