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

  /* Figure legends, keyed by area id. An area without an entry still renders: it has no
     figure or legend until one is added here and in figures.js. */
  var LEGEND = {
    crises: [['dot', 'reported'], ['ring', 'not reported'], ['line warm', 'estimate, with uncertainty']],
    malaria: [['hex warm', 'resists treatment'], ['hex cool', 'missed by tests'], ['hex', 'not yet reached']],
    vaccines: [['dash', 'without vaccination'], ['line cool', 'with vaccination'], ['dot warm', 'vaccination begins']]
  };
  var HAS_FIG = { crises: 1, malaria: 1, vaccines: 1, decisions: 1, methods: 1 };
  var ACROSS_FIGS = ['decisions', 'methods'];

  var ME = S.me || {};
  var AREAS = ME.areas || [];
  function paras(box, list) { (list || []).forEach(function (p) { box.appendChild(el('p', { text: p })); }); }

  /* me.areas[].papers and me.across.papers are DOIs. The full entry lives in themes[].papers
     (or, failing that, recent_papers), matched on its url. */
  var BY_URL = {};
  (S.recent_papers || []).forEach(function (p) { BY_URL[String(p.url).toLowerCase()] = p; });
  (S.themes || []).forEach(function (t) { (t.papers || []).forEach(function (p) { BY_URL[String(p.url).toLowerCase()] = p; }); });
  function byDoi(list) {
    return (list || []).map(function (d) { return BY_URL[('https://doi.org/' + d).toLowerCase()]; }).filter(Boolean);
  }
  /* VENUE · YEAR / title / Read paper */
  function paperRow(p) {
    return el('li', { class: 'prow' }, [
      el('p', { class: 'prow-meta', text: [p.venue, p.year].filter(Boolean).join(' · ') }),
      el('p', { class: 'prow-title', text: p.title }),
      el('a', { class: 'pill-link', href: p.url, rel: 'noopener', 'aria-label': 'Read paper: ' + p.title }, [el('span', { text: 'Read paper' })])
    ]);
  }
  function paperRows(dois) {
    var rows = byDoi(dois);
    return rows.length ? el('ul', { class: 'prows' }, rows.map(paperRow)) : null;
  }
  /* A photo, or initials on a tinted tile of the same shape when there is no photo yet. */
  function portrait(p, i, eager) {
    var initials = p.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2);
    return p.photo
      ? el('img', { src: 'img/people/' + p.photo, alt: 'Photo of ' + p.name, width: 480, height: 640, loading: eager ? null : 'lazy', decoding: 'async' })
      : el('div', { class: 'initials t' + (i % 3), 'aria-hidden': 'true', text: initials });
  }
  function firstSentence(t) { var m = /^.*?[.!?](?=\s|$)/.exec(t || ''); return m ? m[0] : (t || ''); }

  /* ---------- Every page: name, sub-line and institution in the header and footer ---------- */
  [].forEach.call(document.querySelectorAll('[data-me]'), function (n) {
    var v = ME[n.getAttribute('data-me')]; if (v) n.textContent = v;
  });

  /* ---------- Home: introduction ---------- */
  (function () {
    var box = $('intro-text'); if (box) paras(box, ME.home_intro);
  })();

  /* ---------- Home: the three areas as tiles, each with a small version of its figure ---------- */
  (function () {
    var list = $('tiles'); if (!list) return;
    AREAS.forEach(function (t) {
      list.appendChild(el('li', {}, [el('a', { class: 'tile', href: 'research.html#' + t.id }, [
        HAS_FIG[t.id] ? el('div', { class: 'tile-fig' }, [el('canvas', { 'data-figure': t.id, 'aria-hidden': 'true' })]) : null,
        el('div', { class: 'tile-text' }, [
          el('h3', { text: t.title }),
          el('p', { class: 'tile-short', text: t.short })
        ])
      ])]));
    });
  })();

  /* ---------- Home: about me (photo, short background, compact timeline, CV, profiles) ---------- */
  (function () {
    var pic = $('about-pic');
    if (pic && ME.photo) pic.appendChild(el('img', { src: 'img/people/' + ME.photo, alt: 'Photo of ' + (ME.name || ''), width: 480, height: 640, loading: 'lazy', decoding: 'async' }));
    var sh = $('about-short'); if (sh && ME.about_short) sh.textContent = ME.about_short;
    var tl = $('timeline');
    if (tl) (ME.timeline || []).forEach(function (t) {
      tl.appendChild(el('li', {}, [
        el('span', { class: 'cv-when', text: t.when }),
        el('span', { class: 'cv-what' }, [t.what, t.where ? el('span', { class: 'cv-where', text: ', ' + t.where }) : null])
      ]));
    });
    var cv = $('cv-box');
    if (cv && ME.cv_url) cv.appendChild(el('a', { class: 'btn btn-solid', href: ME.cv_url, text: 'Download my CV (PDF)', rel: 'noopener' }));
    var pr = $('profiles');
    if (pr) {
      var L = S.links || {};
      var self = (S.people || []).filter(function (p) { return p.name === ME.name; })[0] || {};
      [['Google Scholar', L.scholar], ['ORCID', L.orcid], ['GitHub', L.github], ['Bluesky', L.bluesky], ['Imperial profile', self.link]].forEach(function (x) {
        if (x[1]) pr.appendChild(el('li', {}, [ext(x[1], x[0])]));
      });
    }
  })();

  /* ---------- Home: latest news, three one-liners ---------- */
  (function () {
    var list = $('news-list'); if (!list) return;
    (S.news || []).slice(0, 3).forEach(function (n) {
      list.appendChild(el('li', {}, [
        el('time', { datetime: n.date, text: niceDate(n.date) }),
        el('p', {}, [n.url ? ext(n.url, n.text) : n.text])
      ]));
    });
  })();

  /* ---------- Home: where the work sits ---------- */
  (function () {
    var w = $('where-body'); if (!w) return;
    if (ME.where) w.appendChild(el('p', { class: 'where-text', text: ME.where }));
    if ((S.belongs_to || []).length) w.appendChild(el('ul', { class: 'belongs' }, S.belongs_to.map(function (g) {
      return el('li', {}, [g.url ? ext(g.url, g.name) : g.name]);
    })));
  })();

  /* ---------- Research: three areas built the same way, then the band across them ---------- */
  (function () {
    var ri = $('research-intro'); if (ri && ME.research_intro) ri.textContent = ME.research_intro;
    var box = $('areas');
    if (box) AREAS.forEach(function (t) {
      var fig = null;
      if (HAS_FIG[t.id]) {
        var theme = (S.themes || []).filter(function (x) { return x.id === t.id; })[0] || {};
        var canvas = el('canvas', { 'data-figure': t.id, role: 'img', 'aria-label': 'Illustration. ' + (theme.motif || t.short || '') });
        var legend = el('ul', { class: 'legend', 'aria-hidden': 'true' }, (LEGEND[t.id] || []).map(function (l) {
          return el('li', {}, [el('i', { class: 'sw ' + l[0] }), l[1]]);
        }));
        fig = el('div', { class: 'area-fig' }, [el('div', { class: 'area-canvas' }, [canvas]), legend]);
      }
      var rows = paperRows(t.papers);
      box.appendChild(el('article', { class: 'area', id: t.id, 'aria-labelledby': 'h-' + t.id }, [
        fig,
        el('div', { class: 'area-text' }, [
          el('h2', { id: 'h-' + t.id, text: t.title }),
          el('p', { class: 'area-short', text: t.short }),
          el('p', { class: 'area-body', text: t.body }),
          rows ? el('h3', { class: 'papers-h', text: 'Selected papers' }) : null,
          rows
        ])
      ]));
    });
    var ab = $('across-body'), A = ME.across;
    if (ab && A) {
      $('across').hidden = false;
      var arows = paperRows(A.papers);
      ab.appendChild(el('div', { class: 'across-text' }, [
        el('h2', { id: 'h-across', text: A.title }),
        el('p', { class: 'area-body', text: A.body }),
        el('div', { class: 'across-figs', 'aria-hidden': 'true' }, ACROSS_FIGS.map(function (id) {
          return el('div', { class: 'across-fig' }, [el('canvas', { 'data-figure': id })]);
        }))
      ]));
      if (arows) ab.appendChild(el('div', { class: 'across-papers' }, [el('h3', { class: 'papers-h', text: 'Selected papers' }), arows]));
    }
  })();

  /* ---------- People: a uniform grid, then alumni and Masters thanks ---------- */
  (function () {
    var ti = $('team-intro'); if (ti && ME.team_intro) ti.textContent = ME.team_intro;
    var list = $('people-list');
    if (list) (S.people || []).forEach(function (p, i) {
      /* My own background is on the home page, so my card carries name and role only. */
      var topic = firstSentence(p.topic);
      list.appendChild(el('li', { class: 'person' }, [
        el('div', { class: 'person-pic' }, [portrait(p, i, i < 4)]),
        el('h3', {}, [p.link ? ext(p.link, p.name) : p.name]),
        el('p', { class: 'person-role', text: p.role }),
        topic ? el('p', { class: 'person-topic', text: topic }) : null
      ]));
    });
    var al = $('alumni'); if (!al) return;
    if ((S.alumni || []).length) al.appendChild(el('section', { 'aria-labelledby': 'h-alumni' }, [
      el('h2', { class: 'label', id: 'h-alumni', text: 'Alumni' }),
      el('ul', { class: 'past-list' }, S.alumni.map(function (a) {
        return el('li', {}, [el('strong', { text: a.name }), el('span', { text: ' ' + a.was + ', now at ' + a.now })]);
      }))
    ]));
    if ((S.masters_alumni || []).length) al.appendChild(el('section', { 'aria-labelledby': 'h-masters' }, [
      el('h2', { class: 'label', id: 'h-masters', text: 'Masters project students' }),
      el('p', { class: 'past-note', text: 'With thanks to everyone who has done their Masters project with me: ' + S.masters_alumni.join(', ') + '.' })
    ]));
  })();

  /* ---------- Join: status first, routes, then how I work ---------- */
  (function () {
    var box = $('join-body'), j = ME.join;
    if (box && j) {
      var h = $('join-headline'); if (h && j.headline) h.textContent = j.headline;
      box.appendChild(el('p', { class: 'notice', text: j.status }));
      box.appendChild(el('p', { class: 'join-lead', text: j.body }));
      box.appendChild(el('dl', { class: 'routes' }, (j.routes || []).map(function (r) {
        return el('div', {}, [el('dt', { text: r.who }), el('dd', { text: r.text })]);
      })));
      box.appendChild(el('p', { class: 'join-foot', text: j.footnote }));
      if (S.links && S.links.email) box.appendChild(el('a', { class: 'btn btn-solid', href: 'mailto:' + S.links.email, text: 'Write to me' }));
    }
    var nb = $('norms-body'), n = S.norms || {}, m = ME.norms || {}; if (!nb) return;
    var nh = $('norms-headline'); if (nh && m.headline) nh.textContent = m.headline;
    var intro = $('norms-intro'); if (intro && m.intro) intro.textContent = m.intro;
    nb.appendChild(el('div', { class: 'quotes' }, (n.quotes || []).map(function (q) {
      return el('blockquote', {}, [el('p', { text: q })]);
    })));
    if ((n.principles || []).length) {
      nb.appendChild(el('h3', { class: 'label', text: 'Principles' }));
      nb.appendChild(el('ul', { class: 'principles' }, n.principles.map(function (p) {
        return el('li', {}, [el('strong', { text: p.t }), el('span', { text: p.d })]);
      })));
    }
    if (n.link && n.link !== '#') nb.appendChild(ext(n.link, n.link_text || n.link, 'btn'));
  })();

  /* ---------- Publications, with filter chips from me.pub_filters ---------- */
  (function () {
    var list = $('paper-list'), chips = $('chips'), more = $('more-papers'); if (!list) return;
    var all = S.recent_papers || [], STEP = 10, shown = STEP;
    var filters = [{ id: 'all', label: 'All', themes: null }].concat(ME.pub_filters || []);
    var current = filters[0];
    function match(f, p) { return !f.themes || f.themes.indexOf(p.theme) !== -1; }
    function tagFor(p) {
      var f = (ME.pub_filters || []).filter(function (x) { return match(x, p); })[0];
      return f ? f.label : '';
    }
    function item(p) {
      var tag = tagFor(p);
      return el('li', { class: 'paper' }, [
        el('a', { href: p.url, class: 'paper-title', text: p.title, rel: 'noopener' }),
        p.authors ? el('span', { class: 'paper-authors', text: p.authors }) : null,
        el('span', { class: 'paper-meta' }, [[p.venue, p.year].filter(Boolean).join(', '), tag ? el('span', { class: 'tag', text: tag }) : null])
      ]);
    }
    function render() {
      var rows = all.filter(function (p) { return match(current, p); });
      list.textContent = '';
      rows.slice(0, shown).forEach(function (p) { list.appendChild(item(p)); });
      var left = rows.length - shown;
      more.hidden = left <= 0;
      if (left > 0) more.textContent = 'Show ' + left + ' more';
    }
    filters.forEach(function (f, i) {
      var n = all.filter(function (p) { return match(f, p); }).length;
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': i === 0 ? 'true' : 'false' },
        [f.label, el('span', { class: 'chip-n', text: String(n) })]);
      b.addEventListener('click', function () {
        current = f; shown = STEP;
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
      if (ME.cv_url) { note.appendChild(document.createTextNode('. The full list is also in ')); note.appendChild(ext(ME.cv_url, 'my CV (PDF)')); note.appendChild(document.createTextNode('.')); }
    }
  })();

  /* ---------- Footer, on every page ---------- */
  (function () {
    var box = $('footer-body'), L = S.links || {}; if (!box) return;
    var id = $('footer-id'); if (id && S.address) id.appendChild(el('p', { class: 'footer-address', text: S.address }));
    var contact = el('ul', { class: 'footer-links' }, [
      L.email ? el('li', {}, [el('a', { href: 'mailto:' + L.email, text: L.email })]) : null,
      L.github ? el('li', {}, [ext(L.github, 'GitHub')]) : null,
      L.scholar ? el('li', {}, [ext(L.scholar, 'Google Scholar')]) : null
    ]);
    box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'Contact' }), contact]));
    if ((S.funders || []).length) box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'Funders' }), el('p', { text: S.funders.join(', ') + '.' })]));
    if ((S.partners || []).length) box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'Partners' }), el('p', { text: S.partners.join(', ') + '.' })]));
  })();

  /* ---------- Figures: each one animates only while it is on screen ---------- */
  if (window.Figures) [].forEach.call(document.querySelectorAll('canvas[data-figure]'), window.Figures.mount);

  /* ---------- Page pills: keep the current page's pill in view on phones ---------- */
  (function () {
    var bar = $('nav-scroll'); if (!bar) return;
    var a = bar.querySelector('[aria-current="page"]');
    function fit() { bar.classList.toggle('scrolls', bar.scrollWidth > bar.clientWidth + 1); }
    fit(); window.addEventListener('resize', fit);
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
