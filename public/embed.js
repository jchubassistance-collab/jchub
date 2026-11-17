/*!
 * JcHub embed — affiche les outils ou les articles de JcHub sur n'importe quel site.
 *
 *   <div data-jchub="tools" data-lang="fr" data-limit="6"></div>
 *   <script src="https://jchub.dev/embed.js" async></script>
 *
 * Attributs : data-jchub="tools|articles", data-lang="fr|en", data-limit (1-24),
 * data-category (filtre par catégorie), data-theme="light|dark|auto", data-columns (1-4).
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var origin = 'https://jchub.dev';
  try { if (script && script.src) origin = new URL(script.src).origin; } catch (e) { /* default origin */ }

  var cache = {};
  function load(type, lang) {
    var key = lang + '/' + type;
    if (!cache[key]) {
      cache[key] = fetch(origin + '/api/public/v1/' + key, { credentials: 'omit' })
        .then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
        .then(function (data) { return data[type] || []; });
    }
    return cache[key];
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function tracked(url) {
    try {
      var link = new URL(url);
      if (link.protocol !== 'https:' && link.protocol !== 'http:') return origin;
      link.searchParams.set('utm_source', location.hostname || 'embed');
      link.searchParams.set('utm_medium', 'jchub-embed');
      return link.toString();
    } catch (e) { return origin; }
  }

  var STYLE = [
    ':host{all:initial;display:block;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
    '--bg:#fff;--card:#fff;--border:#e2e8f0;--text:#0f172a;--muted:#475569;--accent:#2563eb}',
    ':host([data-theme-resolved="dark"]){--bg:transparent;--card:#0f172a;--border:#1e293b;--text:#f1f5f9;--muted:#94a3b8;--accent:#60a5fa}',
    '.grid{display:grid;gap:12px;grid-template-columns:repeat(var(--cols,3),minmax(0,1fr))}',
    '@media (max-width:720px){.grid{grid-template-columns:repeat(min(var(--cols,3),2),minmax(0,1fr))}}',
    '@media (max-width:480px){.grid{grid-template-columns:1fr}}',
    'a.card{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--border);border-radius:12px;',
    'background:var(--card);color:var(--text);text-decoration:none;transition:border-color .15s,transform .15s;min-width:0}',
    'a.card:hover,a.card:focus-visible{border-color:var(--accent);transform:translateY(-1px);outline:none}',
    '.cover{width:100%;aspect-ratio:1200/630;object-fit:cover;border-radius:8px;background:var(--border)}',
    '.icon{font-size:24px;line-height:1}',
    '.cat{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--accent)}',
    '.title{font-size:15px;font-weight:700;line-height:1.3;margin:0}',
    '.desc{font-size:13px;line-height:1.45;color:var(--muted);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.meta{font-size:12px;color:var(--muted);margin-top:auto}',
    '.foot{margin-top:10px;font-size:12px;color:var(--muted);text-align:right}',
    '.foot a{color:var(--accent);text-decoration:none;font-weight:600}',
    '.msg{font-size:13px;color:var(--muted);padding:8px 0}',
  ].join('');

  var TEXT = {
    fr: { by: 'Propulsé par', loading: 'Chargement…', error: 'Contenu JcHub indisponible pour le moment.', empty: 'Rien à afficher.', all: { tools: 'Tous les outils', articles: 'Tous les articles' } },
    en: { by: 'Powered by', loading: 'Loading…', error: 'JcHub content is unavailable right now.', empty: 'Nothing to show.', all: { tools: 'All tools', articles: 'All articles' } },
  };

  function render(host) {
    if (host.__jchub) return;
    host.__jchub = true;

    var type = host.getAttribute('data-jchub') === 'articles' ? 'articles' : 'tools';
    var lang = host.getAttribute('data-lang') === 'en' ? 'en' : 'fr';
    var limit = Math.min(24, Math.max(1, parseInt(host.getAttribute('data-limit') || '6', 10) || 6));
    var columns = Math.min(4, Math.max(1, parseInt(host.getAttribute('data-columns') || '3', 10) || 3));
    var category = (host.getAttribute('data-category') || '').trim().toLowerCase();
    var theme = host.getAttribute('data-theme') || 'light';
    if (theme === 'auto') theme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var t = TEXT[lang];

    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    if (host.attachShadow) host.setAttribute('data-theme-resolved', theme === 'dark' ? 'dark' : 'light');
    var style = el('style'); style.textContent = STYLE; root.appendChild(style);
    var msg = el('div', 'msg', t.loading); root.appendChild(msg);

    load(type, lang).then(function (items) {
      if (category) items = items.filter(function (item) { return String(item.category).toLowerCase() === category; });
      items = items.slice(0, limit);
      root.removeChild(msg);
      if (!items.length) { root.appendChild(el('div', 'msg', t.empty)); return; }

      var grid = el('div', 'grid');
      grid.style.setProperty('--cols', String(columns));
      items.forEach(function (item) {
        var card = el('a', 'card');
        card.href = tracked(item.url);
        card.target = '_blank';
        card.rel = 'noopener';
        if (type === 'tools') {
          card.appendChild(el('span', 'icon', item.icon));
          card.appendChild(el('span', 'cat', item.category));
          card.appendChild(el('p', 'title', item.name));
          card.appendChild(el('p', 'desc', item.description));
        } else {
          if (item.image) {
            var img = el('img', 'cover');
            img.src = item.image; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
            card.appendChild(img);
          }
          card.appendChild(el('span', 'cat', item.category));
          card.appendChild(el('p', 'title', item.title));
          card.appendChild(el('p', 'desc', item.excerpt));
          var date = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
          card.appendChild(el('span', 'meta', [date, item.readTime].filter(Boolean).join(' · ')));
        }
        grid.appendChild(card);
      });
      root.appendChild(grid);

      var foot = el('div', 'foot');
      var all = el('a', null, t.all[type] + ' →');
      all.href = tracked(origin + '/' + lang + (type === 'tools' ? (lang === 'en' ? '/tools' : '/outils') : '/blog'));
      all.target = '_blank'; all.rel = 'noopener';
      foot.appendChild(document.createTextNode(t.by + ' '));
      var brand = el('a', null, 'JcHub');
      brand.href = tracked(origin + '/' + lang); brand.target = '_blank'; brand.rel = 'noopener';
      foot.appendChild(brand);
      foot.appendChild(document.createTextNode(' · '));
      foot.appendChild(all);
      root.appendChild(foot);
    }).catch(function () {
      msg.textContent = t.error;
    });
  }

  function scan() {
    var nodes = document.querySelectorAll('[data-jchub]');
    for (var i = 0; i < nodes.length; i++) render(nodes[i]);
  }

  window.JcHubEmbed = { refresh: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
})();
