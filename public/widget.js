(function() {
  window.ChatWidget = {
    init: async function(config) {
      if (!config || !config.widgetId) {
        console.error('ChatWidget: widgetId is required.');
        return;
      }

      console.log('ChatWidget: Starting init for widgetId:', config.widgetId);
      const widgetId = config.widgetId;
      
      let baseUrl = config.baseUrl || '';
      if (!baseUrl) {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
          if (scripts[i].src && scripts[i].src.includes('widget.js')) {
            baseUrl = new URL(scripts[i].src).origin;
            break;
          }
        }
      }
      
      // Final fallback if detection fails
      if (!baseUrl) {
        baseUrl = window.location.origin;
        console.warn('ChatWidget: Base URL not detected, falling back to origin.', baseUrl);
      }
      console.log('ChatWidget: Using baseUrl:', baseUrl);

      try {
        // 1. Fetch config from backend
        const configUrl = `${baseUrl}/api/widget/${widgetId}`;
        console.log('ChatWidget: Loading from:', configUrl);
        const response = await fetch(configUrl);
        if (!response.ok) {
          console.error('ChatWidget: Fetch failed with status:', response.status);
          throw new Error('Failed to fetch widget configuration');
        }
        const c = await response.json();
        console.log('ChatWidget: Received config:', c);

        // 2. Set up session
        let sId;
        try {
          sId = localStorage.getItem('chat_session_' + widgetId);
          if (!sId) {
            sId = 'sess_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('chat_session_' + widgetId, sId);
          }
        } catch (e) {
          console.warn('ChatWidget: LocalStorage not available, using temporary session.');
          sId = 'sess_' + Math.random().toString(36).substring(2, 15);
        }

        // 3. Wait for body to be ready
        while (!document.body) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 4. Render UI
        if (document.getElementById('ai-chat-wrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'ai-chat-wrapper';
        document.body.appendChild(wrapper);
        const root = wrapper.attachShadow({ mode: 'open' });

        const s = document.createElement('style');
        s.textContent = [
          ':host{all:initial;--p:'+c.color+';--r:16px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;position:fixed;z-index:999999}',
          '*,*::before,*::after{box-sizing:border-box}',
          'input,button,textarea{font-family:inherit;color:inherit}',
          '.rc-l{position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:var(--p);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 24px rgba(0,0,0,.2);z-index:999999;overflow:hidden;transition:transform .3s;border:none;padding:0}',
          '.rc-l:hover{transform:scale(1.1)}',
          '.rc-l img{width:100%;height:100%;object-fit:cover}',
          '.rc-w{position:fixed;bottom:90px;right:20px;width:400px;height:600px;max-height:85vh;background:#fff;border-radius:var(--r);box-shadow:0 24px 64px rgba(0,0,0,.15);display:none;flex-direction:column;overflow:hidden;z-index:999999;border:1px solid #e2e8f0}',
          '.rc-w.o{display:flex;animation:rcFadeUp .3s ease-out}',
          '@keyframes rcFadeUp{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}',
          '.rc-h{background:var(--p);padding:16px 20px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
          '.rc-h-main{display:flex;align-items:center;gap:12px}',
          '.rc-h-logo{width:36px;height:36px;border-radius:10px;background:#fff;object-fit:cover;border:1px solid rgba(255,255,255,.2)}',
          '.rc-h-titles{display:flex;flex-direction:column;text-align:left}',
          '.rc-h-title{margin:0;font-size:15px;font-weight:800;line-height:1.1}',
          '.rc-h-sub{margin:0;font-size:10px;opacity:.8;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}',
          '.rc-m{flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;scroll-behavior:smooth;gap:12px}',
          '.rc-hero{text-align:center;margin:auto 0;padding:20px;width:100%;box-sizing:border-box;animation:rcFadeIn .5s ease-out}',
          '@keyframes rcFadeIn{from{opacity:0}to{opacity:1}}',
          '.rc-hero img{width:80px;height:80px;border-radius:20px;margin:0 auto 20px;display:block;box-shadow:0 8px 32px rgba(0,0,0,.15);object-fit:cover;border:2px solid #fff}',
          '.rc-hero h3{margin:0 0 10px;font-size:18px;color:#0f172a;font-weight:800}',
          '.rc-hero p{font-size:14px;color:#64748b;line-height:1.5;margin-bottom:24px;font-weight:500}',
          '.rc-btn{display:block;width:100%;background:#fff;border:1px solid #e2e8f0;padding:12px 16px;border-radius:12px;margin-bottom:8px;font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:.2s;box-shadow:0 2px 4px rgba(0,0,0,.02)}',
          '.rc-btn:hover{border-color:var(--p);color:var(--p);transform:translateY(-1px)}',
          '.rc-msg-row{display:flex;align-items:flex-end;animation:rcSlideIn .3s ease-out;margin-bottom:12px}',
          '@keyframes rcSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
          '.rc-row-bot{justify-content:flex-start}',
          '.rc-row-usr{justify-content:flex-end}',
          '.rc-msg-avatar{width:32px;height:32px;border-radius:10px;margin-right:10px;border:1px solid #eee;background:#fff;object-fit:cover;flex-shrink:0;margin-bottom:2px}',
          '.rc-msg{max-width:85%;padding:14px 18px;font-size:14.5px;border-radius:18px;line-height:1.6;word-wrap:break-word;overflow-x:auto;box-shadow:0 2px 4px rgba(0,0,0,0.02)}',
          '.rc-m-bot{background:'+c.botBg+';color:#1F2937;border:1px solid #e2e8f0;border-bottom-left-radius:4px}',
          '.rc-m-usr{background:'+c.usrBg+';color:#ffffff;border-bottom-right-radius:4px}',
          '.rc-msg a{color:var(--p);text-decoration:underline;font-weight:600}',
          '.rc-msg ul{margin:8px 0;padding-left:20px;list-style-type:disc}',
          '.rc-msg li{margin-bottom:8px;padding-left:4px}',
          '.rc-msg table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px;background:rgba(0,0,0,0.02);border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}',
          '.rc-msg th,.rc-msg td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}',
          '.rc-msg th{background:rgba(0,0,0,0.04);font-weight:700}',
          '.rc-typing{display:flex;gap:4px;padding:14px 18px!important}',
          '.rc-typing span{width:6px;height:6px;background:#94a3b8;border-radius:50%;animation:rcBounce 1.4s infinite ease-in-out}',
          '.rc-typing span:nth-child(2){animation-delay:.2s}',
          '.rc-typing span:nth-child(3){animation-delay:.4s}',
          '@keyframes rcBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}',
          '.rc-f{padding:12px 16px;border-top:1px solid #f1f5f9;background:#fff;flex-shrink:0}',
          '.rc-i{display:flex;gap:8px;background:#f1f5f9;padding:4px;border-radius:12px;border:1px solid #e2e8f0}',
          '.rc-in{flex:1;border:none;background:transparent;padding:10px 12px;outline:none;font-size:14px;color:#1e293b;width:100%}',
          '.rc-go{background:var(--p);border:none;width:36px;height:36px;border-radius:10px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;transition:.2s;flex-shrink:0}',
          '.rc-go:hover{transform:scale(1.05)}',
          '.rc-pwr{text-align:center;font-size:9px;color:#94a3b8;margin-top:8px;text-transform:uppercase;font-weight:800;letter-spacing:1px}',
          '.rc-pwr a{color:inherit;text-decoration:none;opacity:.8}',
          '.rc-pwr a:hover{opacity:1;color:var(--p)}',
          '@media(max-width:480px){.rc-w{width:calc(100vw - 20px)!important;height:85vh!important;bottom:80px!important;left:10px!important;right:10px!important;bottom:10px!important}}'
        ].join('');
        root.appendChild(s);

        const lch = document.createElement('button');
        lch.className = 'rc-l';
        lch.innerHTML = c.logo ? '<img src="'+c.logo+'" alt="chat">' : '<svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

        const win = document.createElement('div');
        win.className = 'rc-w';
        win.innerHTML = '<div class="rc-h"><div class="rc-h-main"><img class="rc-h-logo" src="'+c.logo+'"><div class="rc-h-titles"><b class="rc-h-title">'+c.name+'</b><span class="rc-h-sub">'+(c.headerSubtitle || 'Online')+'</span></div></div><span id="rc-cx" style="cursor:pointer;font-size:28px;opacity:.6;line-height:1">&times;</span></div><div class="rc-m" id="rc-ms"><div class="rc-hero" id="rc-hr"><img src="'+c.logo+'"><h3>Welcome to '+c.name+'</h3><p>'+c.greetingMessage+'</p><div id="rc-ps"></div></div></div><div class="rc-f"><div class="rc-i"><input class="rc-in" id="rc-in" placeholder="Type a message..." autocomplete="off"><button class="rc-go" id="rc-go"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button></div>'+(c.showBranding ? '<div class="rc-pwr"><a href="'+(c.brandingLink || '#')+'" target="_blank">'+(c.brandingText || 'Powered by ChatWidget')+'</a></div>' : '')+'</div>';

        root.appendChild(lch);
        root.appendChild(win);

        const ms = root.getElementById('rc-ms');
        const hr = root.getElementById('rc-hr');
        const inp = root.getElementById('rc-in');

        // Analytics Helpers
        const getSentiment = (t) => {
          if (!t) return 'neutral';
          const h = ['good','great','awesome','thanks','thank','love','happy','help','helpful','perfect','yes','nice','excellent'];
          const a = ['bad','wrong','error','broken','angry','useless','stupid','no','hate','worst','terrible','problem','issue'];
          const tl = t.toLowerCase();
          if (h.some(w => tl.indexOf(w)!==-1)) return 'happy';
          if (a.some(w => tl.indexOf(w)!==-1)) return 'angry';
          return 'neutral';
        };

        const trackEvent = async (type, sentiment) => {
          const payload = {
            widgetId,
            eventType: type,
            sessionId: sId,
            sentiment: sentiment || null,
            country: window._rc_c || 'Unknown'
          };
          
          if (!window._rc_c) {
            try {
              const r = await fetch('https://ipapi.co/json/');
              const j = await r.json();
              window._rc_c = j.country_name || 'Unknown';
              payload.country = window._rc_c;
            } catch(e) {}
          }

          fetch(`${baseUrl}/api/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(() => {});
        };

        let hasTrackedOpen = false;

        const parseMD = (str) => {
          if (!str) return '';
          let lines = str.split('\n');
          let html = [];
          let inList = false;

          for (let line of lines) {
            let clean = line.trim();
            if (clean.startsWith('* ') || clean.startsWith('- ')) {
              if (!inList) {
                html.push('<ul>');
                inList = true;
              }
              html.push(`<li>${clean.substring(2)}</li>`);
            } else {
              if (inList) {
                html.push('</ul>');
                inList = false;
              }
              if (clean) html.push(`<p>${clean}</p>`);
            }
          }
          if (inList) html.push('</ul>');

          let res = html.join('');
          res = res.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
          res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
          return res;
        };

        const addMessage = (t, bot) => {
          if (hr) hr.style.display = 'none';
          const row = document.createElement('div');
          row.className = 'rc-msg-row rc-row-' + (bot ? 'bot' : 'usr');
          const out = bot ? parseMD(t) : t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          row.innerHTML = bot ? '<img src="'+c.logo+'" class="rc-msg-avatar"><div class="rc-msg rc-m-bot">'+out+'</div>' : '<div class="rc-msg rc-m-usr">'+out+'</div>';
          ms.appendChild(row); ms.scrollTop = ms.scrollHeight;
        };

        const showType = () => {
          if (root.getElementById('rc-typ')) return;
          const row = document.createElement('div'); row.id = 'rc-typ'; row.className = 'rc-msg-row rc-row-bot';
          row.innerHTML = '<img src="'+c.logo+'" class="rc-msg-avatar"><div class="rc-msg rc-m-bot rc-typing"><span></span><span></span><span></span></div>';
          ms.appendChild(row); ms.scrollTop = ms.scrollHeight;
        };

        const hideType = () => { const t = root.getElementById('rc-typ'); if (t) t.remove(); };

        const sendMessage = async (t) => {
          if (!t || !t.trim()) return;
          const clean = t.trim(); 
          addMessage(clean, false); 
          inp.value = ''; 
          showType();
          trackEvent('message', getSentiment(clean));

          try {
            const r = await fetch(c.hook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: clean, sessionId: sId, widgetId: widgetId, chatInput: clean })
            });
            const txt = await r.text();
            hideType();
            
            let d; try { d = JSON.parse(txt); } catch(e) { d = txt; }
            let res;
            if (d && typeof d === 'object') {
              if (Array.isArray(d)) {
                const f = d[0];
                res = f ? (f.output || f.text || f.message || f.response || f.answer || JSON.stringify(f)) : 'No response.';
              } else {
                res = d.output || d.text || d.message || d.response || d.answer || d.result || (d.error ? 'Error: ' + d.error : JSON.stringify(d));
              }
            } else { res = d || 'Response received.'; }
            addMessage(String(res), true);
          } catch (err) {
            hideType();
            addMessage('Connection error. Please check your network or n8n workflow.', true);
          }
        };

        if (c.prompts && c.prompts.length > 0) {
          c.prompts.forEach(p => {
            const b = document.createElement('button');
            b.className = 'rc-btn';
            b.textContent = p;
            b.onclick = () => sendMessage(p);
            root.getElementById('rc-ps').appendChild(b);
          });
        }

        lch.onclick = () => {
          win.classList.toggle('o');
          if (win.classList.contains('o')) {
            setTimeout(() => inp.focus(), 100);
            if (!hasTrackedOpen) {
              trackEvent('open');
              hasTrackedOpen = true;
            }
          }
        };

        root.getElementById('rc-cx').onclick = (e) => {
          e.stopPropagation();
          win.classList.remove('o');
        };

        root.getElementById('rc-go').onclick = () => sendMessage(inp.value);
        inp.onkeydown = (e) => { if (e.key === 'Enter') sendMessage(inp.value); };

        if (c.autoOpen) {
          setTimeout(() => {
            win.classList.add('o');
            inp.focus();
            if (!hasTrackedOpen) {
              trackEvent('open');
              hasTrackedOpen = true;
            }
          }, 500);
        }

      } catch (error) {
        console.error('ChatWidget Error:', error);
      }
    }
  };
})();
