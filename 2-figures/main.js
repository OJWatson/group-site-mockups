/* Renders every page from window.SITE (data/site-data.js). Each block below fills its
   container only if that container exists on the current page, so one data-file edit
   updates the whole site. */
(function () {
  'use strict';
  var S = window.SITE || {};
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag), k;
    for (k in attrs || {}) {
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) continue;
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function ext(url, text, cls) { return el('a', { href: url, text: text, class: cls, rel: 'noopener' }); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function niceDate(iso) {
    var p = String(iso).split('-');
    return p.length < 3 ? iso : parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  /* Short chip labels and figure legends, keyed by theme id. A theme without an entry
     still renders: it uses its full title and has no figure or legend. */
  var SHORT = { crises: 'Crises', malaria: 'Malaria', vaccines: 'Vaccines', decisions: 'Decisions', methods: 'Methods' };
  var LEGEND = {
    crises: [['dot', 'reported'], ['ring', 'not reported'], ['line warm', 'estimate, with uncertainty']],
    malaria: [['hex warm', 'resists treatment'], ['hex cool', 'missed by tests'], ['hex', 'not yet reached']],
    vaccines: [['dash', 'without vaccination'], ['line cool', 'with vaccination'], ['dot warm', 'vaccination begins']],
    decisions: [['dot', 'observed'], ['line cool', 'forecast'], ['dash', 'threshold'], ['target', 'decision point']],
    methods: [['jag', 'simulation, slow'], ['line cool', 'surrogate, fast']]
  };
  var HAS_FIG = { crises: 1, malaria: 1, vaccines: 1, decisions: 1, methods: 1 };
  function themeLabel(id) {
    if (SHORT[id]) return SHORT[id];
    var t = (S.themes || []).filter(function (x) { return x.id === id; })[0];
    return t ? t.title : id;
  }
  function num(i) { return String(i + 1).padStart(2, '0'); }

  /* ---------- Home: one-liner, about, where we sit ---------- */
  (function () {
    var ol = $('one-liner'); if (ol && S.one_liner) ol.textContent = S.one_liner;
    var box = $('about-body');
    if (box) {
      var intro = S.intro || [];
      if (intro[0]) box.appendChild(el('p', { class: 'lede', text: intro[0] }));
      box.appendChild(el('div', { class: 'about-rest' }, intro.slice(1).map(function (p) { return el('p', { text: p }); })));
    }
    var w = $('where-body');
    if (w) {
      if (S.where) w.appendChild(el('p', { class: 'where-text', text: S.where }));
      if ((S.belongs_to || []).length) w.appendChild(el('ul', { class: 'belongs' }, S.belongs_to.map(function (g) {
        return el('li', {}, [g.url ? ext(g.url, g.name) : g.name]);
      })));
    }
  })();

  /* ---------- Home: research teasers, each with a small version of its figure ---------- */
  (function () {
    var list = $('teasers'); if (!list) return;
    (S.themes || []).forEach(function (t, i) {
      list.appendChild(el('li', {}, [el('a', { class: 'teaser', href: 'research.html#' + t.id }, [
        HAS_FIG[t.id] ? el('div', { class: 'teaser-fig' }, [el('canvas', { 'data-figure': t.id, 'aria-hidden': 'true' })]) : null,
        el('div', { class: 'teaser-text' }, [
          el('p', { class: 'theme-num', 'aria-hidden': 'true', text: num(i) }),
          el('h3', { text: t.title }),
          el('p', { class: 'theme-short', text: t.short })
        ])
      ])]));
    });
  })();

  /* ---------- Research page: the areas in full ---------- */
  function paperItem(p, full) {
    var meta = [p.venue, p.year].filter(Boolean).join(', ');
    return el('li', { class: 'paper' }, [
      el('a', { href: p.url, class: 'paper-title', text: p.title, rel: 'noopener' }),
      full && p.authors ? el('span', { class: 'paper-authors', text: p.authors }) : null,
      el('span', { class: 'paper-meta' }, [
        meta,
        full && p.theme ? el('span', { class: 'tag', text: themeLabel(p.theme) }) : null
      ])
    ]);
  }
  (function () {
    var jump = $('jump');
    if (jump) (S.themes || []).forEach(function (t) {
      jump.appendChild(el('li', {}, [el('a', { class: 'chip', href: '#' + t.id, text: themeLabel(t.id) })]));
    });
    var box = $('themes'); if (!box) return;
    (S.themes || []).forEach(function (t, i) {
      var fig = null;
      if (HAS_FIG[t.id]) {
        var canvas = el('canvas', { 'data-figure': t.id, role: 'img', 'aria-label': 'Illustration. ' + (t.motif || t.short || '') });
        var legend = el('ul', { class: 'legend', 'aria-hidden': 'true' }, (LEGEND[t.id] || []).map(function (l) {
          return el('li', {}, [el('i', { class: 'sw ' + l[0] }), l[1]]);
        }));
        fig = el('div', { class: 'theme-fig' }, [el('div', { class: 'theme-canvas' }, [canvas]), legend]);
      }
      var papers = t.papers || [];
      box.appendChild(el('article', { class: 'theme', id: t.id, 'aria-labelledby': 'h-' + t.id }, [
        fig,
        el('div', { class: 'theme-text' }, [
          el('p', { class: 'theme-num', 'aria-hidden': 'true', text: num(i) }),
          el('h2', { id: 'h-' + t.id, text: t.title }),
          el('p', { class: 'theme-short', text: t.short }),
          el('div', { class: 'theme-body' }, (t.body || []).map(function (p) { return el('p', { text: p }); })),
          t.now ? el('p', { class: 'now' }, [el('strong', { text: 'At the moment' }), t.now]) : null,
          papers.length ? el('h3', { class: 'papers-h', text: 'Selected papers' }) : null,
          papers.length ? el('ul', { class: 'paper-list small' }, papers.map(function (p) { return paperItem(p, false); })) : null
        ])
      ]));
    });
  })();

  /* ---------- People page ---------- */
  (function () {
    var list = $('people-list');
    if (list) {
      (S.people || []).forEach(function (p, i) {
        var initials = p.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2);
        var pic = p.photo
          ? el('img', { src: 'img/people/' + p.photo, alt: 'Photo of ' + p.name, width: 480, height: 480, loading: i < 4 ? null : 'lazy', decoding: 'async' })
          : el('div', { class: 'initials t' + (i % 3), 'aria-hidden': 'true', text: initials });
        list.appendChild(el('li', { class: 'person' }, [
          el('div', { class: 'person-pic' }, [pic]),
          el('h3', {}, [p.link ? ext(p.link, p.name) : p.name]),
          el('p', { class: 'person-role', text: p.role }),
          el('p', { class: 'person-topic', text: p.topic })
        ]));
      });
      var hint = document.querySelector('.swipe-hint');
      if (hint) list.addEventListener('scroll', function () { hint.classList.toggle('used', list.scrollLeft > 24); }, { passive: true });
    }
    var al = $('alumni'); if (!al) return;
    if ((S.alumni || []).length) al.appendChild(el('section', { 'aria-labelledby': 'h-alumni' }, [
      el('h2', { id: 'h-alumni', text: 'Alumni' }),
      el('ul', { class: 'past-list' }, S.alumni.map(function (a) {
        return el('li', {}, [el('strong', { text: a.name }), el('span', { text: a.was + ', now at ' + a.now })]);
      }))
    ]));
    if ((S.masters_alumni || []).length) al.appendChild(el('section', { 'aria-labelledby': 'h-masters' }, [
      el('h2', { id: 'h-masters', text: 'Masters project students' }),
      el('p', { class: 'past-note', text: 'With thanks to everyone who has done their Masters project with us:' }),
      el('ul', { class: 'name-list' }, S.masters_alumni.map(function (n) { return el('li', { text: n }); }))
    ]));
  })();

  /* ---------- Home: latest news ---------- */
  (function () {
    var list = $('news-list'); if (!list) return;
    (S.news || []).slice(0, 4).forEach(function (n) {
      list.appendChild(el('li', {}, [
        el('time', { datetime: n.date, text: niceDate(n.date) }),
        el('p', {}, [n.url ? ext(n.url, n.text) : n.text])
      ]));
    });
  })();

  /* ---------- Working with us ---------- */
  (function () {
    var box = $('join-body'), j = S.join; if (!box || !j) return;
    box.appendChild(el('p', { class: 'notice', text: j.status }));
    box.appendChild(el('p', { class: 'join-lead', text: j.body }));
    box.appendChild(el('dl', { class: 'routes' }, (j.routes || []).map(function (r) {
      return el('div', {}, [el('dt', { text: r.who }), el('dd', { text: r.text })]);
    })));
    box.appendChild(el('p', { class: 'join-foot', text: j.footnote }));
    if (S.links && S.links.email) box.appendChild(el('a', { class: 'btn', href: 'mailto:' + S.links.email, text: 'Email ' + S.links.email }));
  })();

  /* ---------- How we work ---------- */
  (function () {
    var box = $('norms-body'), n = S.norms; if (!box || !n) return;
    var intro = $('norms-intro'); if (intro && n.intro) intro.textContent = n.intro;
    // Three of the quotes: the ones written in the group's voice. Indices into norms.quotes.
    var pick = [1, 3, 5].map(function (i) { return (n.quotes || [])[i]; }).filter(Boolean);
    box.appendChild(el('div', { class: 'quotes' }, pick.map(function (q) {
      return el('blockquote', {}, [el('p', { text: q })]);
    })));
    if ((n.principles || []).length) {
      box.appendChild(el('h2', { text: 'Principles' }));
      box.appendChild(el('ul', { class: 'principles' }, n.principles.map(function (p) {
        return el('li', {}, [el('strong', { text: p.t }), el('span', { text: p.d })]);
      })));
    }
    if (n.link && n.link !== '#') box.appendChild(ext(n.link, n.link_text, 'btn'));
  })();

  /* ---------- Publications, with filter chips ---------- */
  (function () {
    var list = $('paper-list'), chips = $('chips'), more = $('more-papers'); if (!list) return;
    var all = S.recent_papers || [], current = 'all', STEP = 10, shown = STEP;
    function render() {
      var rows = all.filter(function (p) { return current === 'all' || p.theme === current; });
      list.textContent = '';
      rows.slice(0, shown).forEach(function (p) { list.appendChild(paperItem(p, true)); });
      var left = rows.length - shown;
      more.hidden = left <= 0;
      if (left > 0) more.textContent = 'Show ' + left + ' more';
    }
    var ids = ['all'].concat((S.themes || []).map(function (t) { return t.id; }));
    ids.forEach(function (id) {
      var n = id === 'all' ? all.length : all.filter(function (p) { return p.theme === id; }).length;
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': id === 'all' ? 'true' : 'false' },
        [id === 'all' ? 'All' : themeLabel(id), el('span', { class: 'chip-n', text: String(n) })]);
      b.addEventListener('click', function () {
        current = id; shown = STEP;
        [].forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        render();
      });
      chips.appendChild(b);
    });
    more.addEventListener('click', function () { shown = 999; render(); });
    render();
    var note = $('papers-note');
    if (note && S.publications_note) {
      note.textContent = S.publications_note + ' ';
      if (S.links && S.links.scholar) note.appendChild(ext(S.links.scholar, 'Go to Google Scholar'));
    }
  })();

  /* ---------- Footer, on every page ---------- */
  (function () {
    var box = $('footer-body'), L = S.links || {}; if (!box) return;
    if (S.where || (S.belongs_to || []).length) box.appendChild(el('div', { class: 'footer-where' }, [
      el('h2', { class: 'label', text: 'Where we sit' }),
      S.where ? el('p', { text: S.where }) : null,
      el('ul', { class: 'footer-belongs' }, (S.belongs_to || []).map(function (g) { return el('li', {}, [g.url ? ext(g.url, g.name) : g.name]); }))
    ]));
    var contact = el('ul', { class: 'footer-links' }, [
      L.email ? el('li', {}, [el('a', { href: 'mailto:' + L.email, text: L.email })]) : null,
      L.github ? el('li', {}, [ext(L.github, 'GitHub')]) : null,
      L.scholar ? el('li', {}, [ext(L.scholar, 'Google Scholar')]) : null
    ]);
    box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'Contact' }), contact, S.address ? el('p', { text: S.address }) : null]));
    if ((S.partners || []).length) box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'We work with' }), el('p', { text: S.partners.join(', ') + '.' })]));
    if ((S.funders || []).length) box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'Funders' }), el('p', { text: S.funders.join(', ') + '.' })]));
  })();

  /* ---------- Figures: each one animates only while it is on screen ---------- */
  if (window.Figures) [].forEach.call(document.querySelectorAll('canvas[data-figure]'), window.Figures.mount);

  /* ---------- Page pills: keep the current page's pill in view on phones ---------- */
  (function () {
    var bar = $('nav-scroll'); if (!bar) return;
    var a = bar.querySelector('[aria-current="page"]');
    if (a && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = Math.max(0, a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2);
  })();

  /* ---------- Arriving at research.html#<id>: land on the card once fonts and layout settle ---------- */
  (function () {
    var id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
    var target = $(id); if (!target) return;
    window.addEventListener('load', function () {
      if (Math.abs(target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop || 0)) > 4) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  })();
})();
