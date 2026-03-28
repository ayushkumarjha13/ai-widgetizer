var str = 'weXelerate offers 1,500 m² of event and meeting space close to Schwedenplatz in the heart of Vienna, suited for various types of events including presentations, workshops, and corporate meetings. - Auditorium: 110 m², up to 80 people, €830 half day / €1,490 full day (excl. VAT) - Lounge: 100 m², up to 20 people, €720 half day / €1,320 full day (excl. VAT) - Twenty Eight: 370 m², up to 130 people, €1,320 half day / €2,620 full day (excl. VAT) - Breakout Lab: 100 m², up to 30 people, €610 half day / €1,160 full day (excl. VAT) For full details, visit the [event spaces page](https://wexelerate.com/rent-an-event-space/). To receive a non-binding personalized offer, submit your [request here](https://tally.so/r/aQ4Elv).';

var parseMD = function(str) {
  try {
    if (!str) return '';
    var b = String.fromCharCode(96);
    var html = str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    /* Code */
    html = html.replace(new RegExp(b+b+b+'([\\s\\S]*?)'+b+b+b, 'g'), '<pre><code>$1</code></pre>');
    html = html.replace(new RegExp(b+'([^'+b+'\\n]+)'+b, 'g'), '<code>$1</code>');
    /* Tables */
    if (html.indexOf('|') !== -1) {
      html = html.replace(/^\|(.+)\|\n\|([-: ]+)\|\n((?:\|.+\|(?:\n|$))+)/gm, function(m, head, d, body) {
        var rows = body.trim().split('\n').map(function(r) { return '<tr>' + r.split('|').filter(Boolean).map(function(cell) { return '<td>'+cell.trim()+'</td>'; }).join('') + '</tr>'; }).join('');
        var ths = '<tr>' + head.split('|').filter(Boolean).map(function(cell) { return '<th>'+cell.trim()+'</th>'; }).join('') + '</tr>';
        return '<table><thead>'+ths+'</thead><tbody>'+rows+'</tbody></table>';
      });
    }
    /* Headlines */
    html = html.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
    /* Bold/Italic */
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/__([^_]+)__/g,'<strong>$1</strong>').replace(/_([^_\n]+)_/g,'<em>$1</em>');
    /* Quotes/Lists */
    html = html.replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>').replace(/^([-*_]{3,})$/gm,'<hr>').replace(/^[\*\-] (.+)$/gm,'<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g,'<ul>$1</ul>').replace(/<\/ul>\s*<ul>/g,'');
    /* Links */
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>');
    html = html.replace(/(https?:\/\/[^\s<>"]+)/g, function(u, o, f) {
      var p = f.substring(o - 2, o); if (p === '="' || p === "='") return u;
      var l = u.match(/[.,!?;:]+$/); var cu = l ? u.substring(0, u.length - l[0].length) : u;
      return '<a href="'+cu+'" target="_blank">'+cu+'</a>' + (l ? l[0] : '');
    });
    return html.replace(/\r?\n/g,'<br>');
  } catch (e) { console.error('MD Error:', e); return str; }
};

console.log(parseMD(str));
