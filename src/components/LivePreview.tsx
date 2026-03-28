import { useState } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { Send, Monitor, Phone, X } from 'lucide-react';

const LivePreview = () => {
  const { config } = useWidgetStore();
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isOpen, setIsOpen] = useState(false); // Widget open state

  const parseMD = (str: string) => {
    if (!str) return '';
    let html = str;
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?:^|\n|\s)\* /g, '<br/><br/><span style="margin-right:6px;">•</span>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="text-decoration:underline;font-weight:600;color:inherit;">$1</a>');
    html = html.replace(/\r?\n/g, '<br/>');
    html = html.replace(/^(<br\/>)+/g, '');
    return html;
  };

  return (
    <div className="preview-panel">
      {/* Device Toggle */}
      <div className="device-toggle">
        <button
          className={`device-btn ${device === 'mobile' ? 'active' : ''}`}
          onClick={() => setDevice('mobile')}
        >
          <Phone size={18} /> Mobile
        </button>
        <button
          className={`device-btn ${device === 'desktop' ? 'active' : ''}`}
          onClick={() => setDevice('desktop')}
        >
          <Monitor size={18} /> Desktop
        </button>
      </div>

      <div className={`preview-mockup ${device}`}>

        {/* The floating widget itself inside the preview context */}
        <div className="widget-preview-floating">

          {isOpen && (
            <div className="widget-window">
              <div className="widget-header" style={{ backgroundColor: config.primaryColor }}>
                <img src={config.logoUrl || 'https://ui-avatars.com/api/?name=AI&background=0D8ABC&color=fff'} alt="Logo" />
                <div className="widget-header-info">
                  <h4>{config.name}</h4>
                  <p>{config.headerSubtitle}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="widget-messages" style={{ backgroundColor: '#f8fafc' }}>
                {/* Greeting */}
                <div 
                  className="message bot" 
                  style={{ borderColor: config.primaryColor }}
                  dangerouslySetInnerHTML={{ __html: parseMD(config.greetingMessage) }}
                />

                {/* Example user message */}
                <div className="message user" style={{ backgroundColor: config.userBubbleColor }}>
                  I have a question about my account.
                </div>

                {/* Example bot message */}
                <div className="message bot" style={{ backgroundColor: config.botBubbleColor, borderColor: config.primaryColor }}>
                  Of course! I'd be happy to help you with your account. What seems to be the issue?
                </div>

                {/* Starter Questions (shown at bottom of messages) */}
                {(config.starterQuestions?.length || 0) > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
                    {(config.starterQuestions || []).map((q, i) => (
                      <button
                        key={i}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '16px', border: `1px solid ${config.primaryColor}`, background: 'white', color: config.primaryColor, fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="widget-input-area">
                <div className="widget-input-box">
                  <input type="text" placeholder="Type your message..." />
                  <button style={{ color: config.primaryColor }}>
                    <Send size={18} />
                  </button>
                </div>
                {config.showBranding && (
                  <div className="brand-footer-preview" style={{ marginTop: '0.5rem' }}>
                    <a href={config.brandingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                      {config.brandingText}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Launcher Button */}
          {!isOpen && (
            <div
              className="widget-launcher"
              style={{ backgroundColor: config.primaryColor }}
              onClick={() => setIsOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
