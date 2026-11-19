/* THE CODEFATHER — shared app: shell, theme + language switching, animated background, pages. */
(() => {
  'use strict';

  const LS_LANG = 'cf-lang', LS_THEME = 'cf-theme';
  const S = {
    lang: localStorage.getItem(LS_LANG) || 'ar',          // Arabic is the default
    theme: localStorage.getItem(LS_THEME) || 'dark-techn', // Dark Techn is the default
    menu: false, themeOpen: false, cat: 'all', y: 0, e: 0
  };
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tr = o => (o == null ? '' : typeof o === 'string' ? o : (o[S.lang] ?? o.en ?? ''));
  const missing = o => (o && typeof o === 'object' && !o[S.lang] ? `<span class="chip">${UI[S.lang].missingTr}</span>` : '');
  const t = k => UI[S.lang][k] ?? UI.en[k] ?? k;
  const published = list => list.filter(x => x.status === 'published');

  /* ---------- colour helpers (official HEX values are never altered) ---------- */
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = rgb => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; const [r, g, b] = rgb.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const textOn = hex => (lum(hex2rgb(hex)) > 0.179 ? '#111111' : '#FFFFFF'); // best contrast against the colour
  const mix = (a, b, p) => { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',') + ')'; };

  const BG = { a: '123,44,191', b: '0,168,255', c: '255,255,255' }; // read by the canvas

  function applyTheme() {
    const th = THEMES.find(x => x.id === S.theme) || THEMES[0];
    const [c1, c2, c3, c4] = th.colors, txt = textOn(c1), st = document.documentElement.style;
    const rgb = h => hex2rgb(h).join(',');
    st.setProperty('--bg', c1); st.setProperty('--bg-2', c2);
    st.setProperty('--accent', c3); st.setProperty('--accent-2', c4);
    st.setProperty('--accent-text', textOn(c3));
    st.setProperty('--text', txt);
    st.setProperty('--muted', mix(txt, c1, 0.3));
    st.setProperty('--surface', mix(c1, txt, 0.06));
    st.setProperty('--surface-2', mix(c1, txt, 0.12));
    st.setProperty('--border', mix(c1, txt, 0.18));
    st.setProperty('--glass', `rgba(${rgb(c1)},0.55)`);
    st.setProperty('--bg-rgb', rgb(c1)); st.setProperty('--text-rgb', rgb(txt));
    st.setProperty('--accent-rgb', rgb(c3)); st.setProperty('--accent-2-rgb', rgb(c4));
    document.documentElement.style.colorScheme = txt === '#FFFFFF' ? 'dark' : 'light';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', c1);
    BG.a = rgb(c3); BG.b = rgb(c4); BG.c = rgb(txt);
  }

  /* ---------- animated background: drifting nodes that link up ---------- */
  function startBackground() {
    const cv = document.getElementById('bg'); if (!cv) return;
    const ctx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pts = [], W = 0, H = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(80, Math.floor((W * H) / 18000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 0.6, k: Math.random() }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      if (!still) for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = `rgb(${p.k > 0.5 ? BG.a : BG.b})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 14400) {
            ctx.globalAlpha = (1 - Math.sqrt(d) / 120) * 0.28;
            ctx.strokeStyle = `rgb(${BG.c})`; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      if (!still) requestAnimationFrame(frame);
    };
    size(); frame();
    if (!still) requestAnimationFrame(frame);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); frame(); }, 150); });
    // redraw colours when theme changes
    document.addEventListener('cf-theme', () => { if (still) frame(); });
  }

  /* ---------- shell: header, theme panel, footer ---------- */
  const NAV = [['index.html', 'navHome', 'home'], ['about.html', 'navAbout', 'about'], ['projects.html', 'navProjects', 'projects'], ['contact.html', 'navContact', 'contact']];

  function themePanel() {
    return `<div id="themePanel" class="panel${S.themeOpen ? ' open' : ''}" role="dialog" aria-label="${t('theme')}">
      <div class="panel-head"><strong>${t('theme')}</strong><button class="btn ghost sm" data-action="theme-reset">${t('reset')}</button></div>
      <div class="theme-grid">${THEMES.map(th => {
        const [a, b, c, d] = th.colors;
        return `<button class="theme-card${th.id === S.theme ? ' on' : ''}" data-action="theme-set" data-id="${th.id}" aria-pressed="${th.id === S.theme}"
          style="--p1:${a};--p2:${b};--p3:${c};--p4:${d}">
          <span class="tc-preview" aria-hidden="true"><i></i><b></b></span>
          <span class="tc-name">${esc(th.name)}</span>
          <span class="tc-sw" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>`;
      }).join('')}</div></div>`;
  }

  function header() {
    return `<header class="nav-wrap"><nav class="nav glass${S.menu ? ' open' : ''}" aria-label="Main">
      <a class="brand" href="index.html" aria-label="THE CODEFATHER"><img src="assets/img/logo-mark.png" alt="" width="36" height="28"><span class="wordmark">THE CODEFATHER</span></a>
      <ul class="nav-links" id="navLinks">
        <li class="drawer-head"><button class="icon-btn" data-action="menu-close" aria-label="${t('close')}">×</button></li>
        ${NAV.map(([href, key, id]) => `<li><a href="${href}" data-page-link="${id}"${page === id ? ' aria-current="page"' : ''}>${t(key)}</a></li>`).join('')}
      </ul>
      <div class="nav-tools">
        <div class="theme-wrap">
          <button id="themeBtn" class="tool-btn" data-action="theme-toggle" aria-expanded="${S.themeOpen}" aria-controls="themePanel">
            <span class="swatch" style="background:var(--accent)"></span>${t('theme')}</button>
          ${themePanel()}
        </div>
        <button class="tool-btn" data-action="lang" lang="${S.lang === 'ar' ? 'en' : 'ar'}">${t('langBtn')}</button>
        <button id="menuBtn" class="burger" data-action="menu-toggle" aria-expanded="${S.menu}" aria-controls="navLinks" aria-label="${t('menu')}"><span></span><span></span><span></span></button>
      </div></nav></header>`;
  }

  function footer() {
    return `<footer class="site-foot"><div class="foot-brand"><img src="assets/img/logo-mark.png" alt="" width="28" height="22"><span class="wordmark">THE CODEFATHER</span></div>
      <p class="tagline">${t('tagline')}</p>
      <p class="muted">© ${new Date().getFullYear()} ${tr(CONTENT.owner.name)} · ${t('rights')} · <a href="mailto:${esc(CONTENT.owner.email)}">${t('email')}</a></p></footer>`;
  }

  /* ---------- building blocks ---------- */
  const skillsHTML = compact => CONTENT.skills.map(cat => `
    <div class="skill-cat"><h3>${tr(cat.cat)}</h3><div class="skill-grid">
      ${cat.items.map(s => `<div class="skill">
        <span class="mono" aria-hidden="true">${esc(s.code)}</span>
        <div class="skill-text"><strong>${esc(s.name)}</strong>
          ${!compact && s.desc ? `<p>${esc(tr(s.desc))}</p>` : ''}
          ${!compact ? `<div class="bar" role="img" aria-label="${s.level}%"><i style="--w:${s.level}%"></i></div>` : ''}</div></div>`).join('')}
    </div></div>`).join('');

  const projCard = p => `<article class="card proj">
    <a class="proj-thumb" href="project.html?id=${esc(p.id)}" tabindex="-1" aria-hidden="true">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : `<span class="ph">${esc(p.code)}</span>`}</a>
    <div class="proj-body"><p class="meta">${esc(tr(p.category))} <span>${p.year}</span></p>
      <h3><a href="project.html?id=${esc(p.id)}">${esc(tr(p.title))}</a></h3>
      <p>${esc(tr(p.short))}</p>${missing(p.short)}
      <a class="link" href="project.html?id=${esc(p.id)}">${t('viewDetails')} →</a></div></article>`;

  function eduGroups() {
    const ev = published(CONTENT.education).sort((a, b) => a.year - b.year || a.order - b.order);
    const m = new Map();
    ev.forEach(x => { if (!m.has(x.year)) m.set(x.year, []); m.get(x.year).push(x); });
    return [...m].map(([year, events]) => ({ year, events }));
  }

  function timelineHTML() {
    const g = eduGroups();
    if (!g.length) return `<p class="empty">${t('emptyEdu')}</p>`;
    S.y = Math.min(S.y, g.length - 1);
    S.e = Math.min(S.e, g[S.y].events.length - 1);
    const cur = g[S.y].events[S.e], n = g[S.y].events.length;
    const atStart = S.y === 0 && S.e === 0, atEnd = S.y === g.length - 1 && S.e === n - 1;
    return `<div class="rail" role="tablist" aria-label="${t('eduTitle')}">
        ${g.map((x, i) => `<button class="tl-year${i === S.y ? ' on' : ''}" role="tab" aria-selected="${i === S.y}" data-action="tl-year" data-y="${i}">
          <span class="tl-dot" aria-hidden="true"></span><span class="tl-num">${x.year}</span></button>`).join('')}
      </div>
      <article class="tl-detail" aria-live="polite">
        <figure class="tl-img">${cur.image ? `<img src="${esc(cur.image)}" alt="${esc(tr(cur.title))}" loading="lazy">` : `<div class="ph" aria-hidden="true">${cur.year}</div>`}</figure>
        <div class="tl-text"><p class="meta">${cur.year} <span>${S.e + 1} / ${n}</span></p>
          <h3>${esc(tr(cur.title))}</h3><p>${esc(tr(cur.desc))}</p>${missing(cur.title)}</div>
      </article>
      <div class="tl-ctrl">
        <button class="btn ghost" data-action="tl-prev" ${atStart ? 'disabled' : ''}>${t('prev')}</button>
        <button class="btn ghost" data-action="tl-next" ${atEnd ? 'disabled' : ''}>${t('next')}</button>
      </div>`;
  }

  const sectionHead = (title, sub) => `<header class="sec-head"><h2>${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}</header>`;

  /* ---------- pages ---------- */
  const PAGES = {
    home() {
      const featured = published(CONTENT.projects).filter(p => p.featured).slice(0, 3);
      return `
      <section class="hero">
        <div class="hero-inner">
          <p class="kicker">${t('heroKicker')} ${tr(CONTENT.owner.name)}</p>
          <h1 class="wordmark-xl"><span class="w-the">The</span><span class="w-main">Codefather</span></h1>
          <p class="tagline">${t('tagline')}</p>
          <p class="lead">${tr(CONTENT.owner.intro)}</p>
          ${missing(CONTENT.owner.intro)}
          <div class="actions"><a class="btn" href="projects.html">${t('viewProjects')}</a><a class="btn ghost" href="contact.html">${t('contactMe')}</a></div>
        </div>
      </section>
      <section class="sec"><h2>${t('aboutTitle')}</h2><div class="card about-card">${CONTENT.owner.about.map(p => `<p>${esc(tr(p))}</p>`).join('')}</div></section>
      <section class="sec">${sectionHead(t('skillsTitle'), t('skillsSub'))}<div class="skill-overview">${skillsHTML(true)}</div><a class="link" href="about.html">${t('aboutTitle')} →</a></section>
      <section class="sec"><h2>${t('featuredTitle')}</h2><div class="cards">${featured.map(projCard).join('')}</div></section>
      <section class="sec"><h2>${t('eduTitle')}</h2><p class="muted">${t('eduSub')}</p><div id="tl" class="tl">${timelineHTML()}</div></section>
      <section class="cta card"><div><h2>${t('ctaTitle')}</h2><p>${t('ctaText')}</p></div><a class="btn" href="contact.html">${t('ctaBtn')}</a></section>`;
    },

    about() {
      return `<section class="page-head"><h1>${t('aboutTitle')}</h1><p class="lead">${tr(CONTENT.owner.role)}</p></section>
        <section class="sec"><div class="card about-card">${CONTENT.owner.about.map(p => `<p>${esc(tr(p))}</p>`).join('')}${missing(CONTENT.owner.about[0])}</div></section>
        <section class="sec"><h2>${t('skillsTitle')}</h2><p class="muted">${t('skillsSub')}</p><div class="skill-overview">${skillsHTML(false)}</div></section>
        <section class="sec"><h2>${t('eduTitle')}</h2><p class="muted">${t('eduSub')}</p><div id="tl" class="tl">${timelineHTML()}</div></section>`;
    },

    projects() {
      const list = published(CONTENT.projects);
      const cats = [...new Map(list.map(p => [tr(p.category), p.category])).values()];
      const shown = list.filter(p => S.cat === 'all' || tr(p.category) === S.cat);
      return `<section class="page-head"><h1>${t('projectsTitle')}</h1><p class="lead">${t('projectsSub')}</p></section>
        <div class="filters" role="group" aria-label="${t('category')}">
          <button class="chip-btn" data-action="filter" data-cat="all" aria-pressed="${S.cat === 'all'}">${t('allProjects')}</button>
          ${cats.map(c => `<button class="chip-btn" data-action="filter" data-cat="${esc(tr(c))}" aria-pressed="${S.cat === tr(c)}">${esc(tr(c))}</button>`).join('')}
        </div>
        <div class="cards">${shown.length ? shown.map(projCard).join('') : `<p class="empty">${t('emptyProj')}</p>`}</div>`;
    },

    project() {
      const id = new URLSearchParams(location.search).get('id');
      const p = published(CONTENT.projects).find(x => x.id === id);
      if (!p) return PAGES['404']();
      const related = published(CONTENT.projects).filter(x => x.id !== p.id && tr(x.category) === tr(p.category)).slice(0, 2);
      return `<section class="page-head"><a class="link" href="projects.html">← ${t('back')}</a>
          <h1>${esc(tr(p.title))}</h1><p class="meta">${esc(tr(p.category))} <span>${p.year}</span></p>${missing(p.title)}</section>
        <section class="proj-detail">
          <figure class="proj-hero">${p.image ? `<img src="${esc(p.image)}" alt="${esc(tr(p.title))}">` : `<div class="ph big">${esc(p.code)}</div>`}</figure>
          <div class="card"><h2>${t('projectsTitle')}</h2><p>${esc(tr(p.full))}</p>${missing(p.full)}
            <h3>${t('techTitle')}</h3><div class="tags">${p.tech.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>
            ${p.live || p.source ? `<h3>${t('linksTitle')}</h3><div class="actions">
              ${p.live ? `<a class="btn" href="${esc(p.live)}" target="_blank" rel="noopener">${t('liveLink')}</a>` : ''}
              ${p.source ? `<a class="btn ghost" href="${esc(p.source)}" target="_blank" rel="noopener">${t('sourceLink')}</a>` : ''}</div>` : ''}
          </div></section>
        ${related.length ? `<section class="sec"><h2>${t('relatedTitle')}</h2><div class="cards">${related.map(projCard).join('')}</div></section>` : ''}`;
    },

    contact() {
      return `<section class="page-head"><h1>${t('contactTitle')}</h1><p class="lead">${t('contactSub')}</p></section>
        <form id="contactForm" class="card form" novalidate>
          <div class="field"><label for="f-name">${t('fName')}</label><input id="f-name" name="name" autocomplete="name" required aria-describedby="e-name"><small id="e-name" class="err"></small></div>
          <div class="field"><label for="f-email">${t('fEmail')}</label><input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="e-email"><small id="e-email" class="err"></small></div>
          <div class="field"><label for="f-subject">${t('fSubject')}</label><input id="f-subject" name="subject" value="${esc(tr(CONTENT.contact.subjectDefault))}"></div>
          <div class="field"><label for="f-msg">${t('fMessage')}</label><textarea id="f-msg" name="message" rows="6" required aria-describedby="e-msg"></textarea><small id="e-msg" class="err"></small></div>
          <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
          <div class="actions"><button class="btn" type="submit">${t('send')}</button></div>
          <p id="formStatus" class="status" role="status" aria-live="polite"></p>
        </form>`;
    },

    '404'() {
      return `<section class="notfound"><p class="big-code">404</p><h1>${t('notFoundTitle')}</h1><p class="lead">${t('notFoundText')}</p>
        <a class="btn" href="index.html">${t('backHome')}</a></section>`;
    }
  };

  /* ---------- render ---------- */
  function render() {
    document.documentElement.lang = S.lang;
    document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = page === 'home' ? `${t('siteTitle')} — ${t('tagline')}` : `${t('siteTitle')}`;
    const keep = page === 'contact' ? readForm() : null;
    $('#site-header').innerHTML = header();
    $('#app').innerHTML = (PAGES[page] || PAGES['404'])();
    $('#site-footer').innerHTML = footer();
    if (keep) writeForm(keep);
  }
  const readForm = () => { const f = $('#contactForm'); return f ? Object.fromEntries(new FormData(f)) : null; };
  const writeForm = d => { const f = $('#contactForm'); if (!f) return; for (const [k, v] of Object.entries(d)) if (f.elements[k] && k !== 'website') f.elements[k].value = v; };

  function setTheme(id) {
    S.theme = id; localStorage.setItem(LS_THEME, id); applyTheme();
    $('#site-header').innerHTML = header();
    document.dispatchEvent(new Event('cf-theme'));
    document.getElementById('themeBtn')?.focus();
  }

  function setLang(lang) {
    S.lang = lang; localStorage.setItem(LS_LANG, lang);
    const y = scrollY; render(); scrollTo(0, y);
  }

  function updateTl() { const el = $('#tl'); if (el) el.innerHTML = timelineHTML(); }
  function step(dir) {
    const g = eduGroups(); if (!g.length) return;
    if (dir > 0) {
      if (S.e < g[S.y].events.length - 1) S.e++;
      else if (S.y < g.length - 1) { S.y++; S.e = 0; }
    } else {
      if (S.e > 0) S.e--;
      else if (S.y > 0) { S.y--; S.e = g[S.y].events.length - 1; }
    }
    updateTl();
  }

  function setMenu(open) {
    S.menu = open;
    const nav = $('.nav'), btn = $('#menuBtn');
    nav?.classList.toggle('open', open); btn?.setAttribute('aria-expanded', open);
    document.body.classList.toggle('lock', open);
  }
  function setThemeOpen(open) {
    S.themeOpen = open;
    $('#themePanel')?.classList.toggle('open', open);
    $('#themeBtn')?.setAttribute('aria-expanded', open);
  }

  /* ---------- events ---------- */
  const ACTIONS = {
    lang: () => setLang(S.lang === 'ar' ? 'en' : 'ar'),
    'menu-toggle': () => setMenu(!S.menu),
    'menu-close': () => setMenu(false),
    'theme-toggle': () => setThemeOpen(!S.themeOpen),
    'theme-set': el => setTheme(el.dataset.id),
    'theme-reset': () => setTheme('dark-techn'),
    filter: el => { S.cat = el.dataset.cat; render(); },
    'tl-year': el => { S.y = +el.dataset.y; S.e = 0; updateTl(); },
    'tl-prev': () => step(-1),
    'tl-next': () => step(1)
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (el && ACTIONS[el.dataset.action]) { ACTIONS[el.dataset.action](el); return; }
    if (S.menu && (e.target.closest('.nav-links a') || !e.target.closest('.nav-links, #menuBtn'))) setMenu(false);
    if (S.themeOpen && !e.target.closest('#themePanel, #themeBtn')) setThemeOpen(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (S.menu) { setMenu(false); $('#menuBtn')?.focus(); } if (S.themeOpen) setThemeOpen(false); }
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'contactForm') return;
    e.preventDefault();
    const f = e.target, v = { name: f.name.value.trim(), email: f.email.value.trim(), subject: f.subject.value.trim(), message: f.message.value.trim() };
    const errs = { name: '', email: '', message: '' };
    if (!v.name) errs.name = t('errRequired');
    if (!v.email) errs.email = t('errRequired'); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errs.email = t('errEmail');
    if (!v.message) errs.message = t('errRequired'); else if (v.message.length < 10) errs.message = t('errLen');
    for (const k of ['name', 'email', 'message']) {
      const s = $('#e-' + (k === 'message' ? 'msg' : k)); s.textContent = errs[k];
      f.elements[k].setAttribute('aria-invalid', !!errs[k]);
    }
    const status = $('#formStatus');
    if (f.website.value) return; // honeypot: silently drop bot submissions
    if (Object.values(errs).some(Boolean)) { status.className = 'status bad'; status.textContent = t('errRequired'); return; }
    const body = `${v.message}\n\n— ${v.name} <${v.email}>`;
    location.href = `mailto:${encodeURIComponent(CONTENT.owner.email)}?subject=${encodeURIComponent(v.subject)}&body=${encodeURIComponent(body)}`;
    status.className = 'status ok';
    status.textContent = t('okMsg') + CONTENT.owner.email;
  });

  /* ---------- boot ---------- */
  applyTheme();
  render();
  startBackground();
})();
