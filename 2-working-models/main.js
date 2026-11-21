/* Renders everything from window.SITE (data/site-data.js). To update the site, edit only that file. */
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
     still renders: it uses its full title and has no legend. */
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

  /* ---------- About ---------- */
  (function () {
    var box = $('about-body'); if (!box) return;
    if (S.one_liner) box.appendChild(el('p', { class: 'lede', text: S.one_liner }));
    var rest = el('div', { class: 'about-rest' });
    (S.intro || []).forEach(function (p) { rest.appendChild(el('p', { text: p })); });
    if (S.affiliation_line) rest.appendChild(el('p', { class: 'fine', text: S.affiliation_line }));
    box.appendChild(rest);
  })();

  /* ---------- Research areas ---------- */
  function paperItem(p, full) {
    var meta = [p.venue, p.year].filter(Boolean).join(', ');
    var li = el('li', { class: 'paper' }, [
      el('a', { href: p.url, class: 'paper-title', text: p.title, rel: 'noopener' }),
      full && p.authors ? el('span', { class: 'paper-authors', text: p.authors }) : null,
      el('span', { class: 'paper-meta' }, [
        meta,
        full && p.theme ? el('span', { class: 'tag', text: themeLabel(p.theme) }) : null
      ])
    ]);
    return li;
  }
  (function () {
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
      var more = el('details', { class: 'more' }, [
        el('summary', {}, [el('span', { class: 'when-closed', text: 'Read more' }), el('span', { class: 'when-open', text: 'Show less' }),
          el('span', { class: 'sr', text: ' about ' + t.title })]),
        el('div', { class: 'more-body' }, (t.body || []).map(function (p) { return el('p', { text: p }); }).concat([
          t.now ? el('p', { class: 'now' }, [el('strong', { text: 'At the moment ' }), t.now]) : null,
          (t.papers || []).length ? el('h4', { text: 'Selected papers' }) : null,
          (t.papers || []).length ? el('ul', { class: 'paper-list small' }, t.papers.map(function (p) { return paperItem(p, false); })) : null
        ]))
      ]);
      box.appendChild(el('article', { class: 'theme', id: 'theme-' + t.id }, [
        fig,
        el('div', { class: 'theme-text' }, [
          el('p', { class: 'theme-num', 'aria-hidden': 'true', text: String(i + 1).padStart(2, '0') }),
          el('h3', { text: t.title }),
          el('p', { class: 'theme-short', text: t.short }),
          more
        ])
      ]));
    });
  })();

  /* ---------- People ---------- */
  (function () {
    var list = $('people-list'); if (!list) return;
    (S.people || []).forEach(function (p, i) {
      var initials = p.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2);
      var pic = p.photo
        ? el('img', { src: 'img/people/' + p.photo, alt: 'Photo of ' + p.name, width: 480, height: 480, loading: 'lazy', decoding: 'async' })
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

    var al = $('alumni'); if (!al) return;
    var parts = (S.alumni || []).map(function (a) { return a.name + ' (' + a.was + ', now at ' + a.now + ')'; });
    if (parts.length) al.appendChild(el('p', {}, [el('strong', { text: 'Alumni ' }), parts.join('; ') + '.']));
    if ((S.masters_alumni || []).length) al.appendChild(el('p', {}, [el('strong', { text: 'Masters project students ' }), S.masters_alumni.join(', ') + '.']));
  })();

  /* ---------- News ---------- */
  (function () {
    var list = $('news-list'); if (!list) return;
    (S.news || []).slice(0, 5).forEach(function (n) {
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
    box.appendChild(el('dl', { class: 'routes' }, [].concat.apply([], (j.routes || []).map(function (r) {
      return [el('div', {}, [el('dt', { text: r.who }), el('dd', { text: r.text })])];
    }))));
    box.appendChild(el('p', { class: 'join-foot', text: j.footnote }));
    if (S.links && S.links.email) box.appendChild(el('a', { class: 'btn', href: 'mailto:' + S.links.email, text: 'Email ' + S.links.email }));
  })();

  /* ---------- How we work ---------- */
  (function () {
    var box = $('norms-body'), n = S.norms; if (!box || !n) return;
    box.appendChild(el('p', { class: 'norms-intro', text: n.intro }));
    // Three of the quotes: the ones written in the group's voice. Indices into norms.quotes.
    var pick = [1, 3, 5].map(function (i) { return (n.quotes || [])[i]; }).filter(Boolean);
    box.appendChild(el('div', { class: 'quotes' }, pick.map(function (q) {
      return el('blockquote', {}, [el('p', { text: q })]);
    })));
    box.appendChild(el('ul', { class: 'principles' }, (n.principles || []).map(function (p) {
      return el('li', {}, [el('strong', { text: p.t }), el('span', { text: p.d })]);
    })));
    if (n.link && n.link !== '#') box.appendChild(ext(n.link, n.link_text, 'btn'));
  })();

  /* ---------- Recent papers, with filter chips ---------- */
  (function () {
    var list = $('paper-list'), chips = $('chips'), more = $('more-papers'); if (!list) return;
    var all = S.recent_papers || [], current = 'all', STEP = 8, shown = STEP;
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
      if (S.links && S.links.scholar) note.appendChild(ext(S.links.scholar, 'Google Scholar'));
    }
  })();

  /* ---------- Footer ---------- */
  (function () {
    var box = $('footer-body'), L = S.links || {}; if (!box) return;
    var contact = el('ul', { class: 'footer-links' }, [
      L.email ? el('li', {}, [el('a', { href: 'mailto:' + L.email, text: L.email })]) : null,
      L.github ? el('li', {}, [ext(L.github, 'GitHub')]) : null,
      L.scholar ? el('li', {}, [ext(L.scholar, 'Google Scholar')]) : null
    ]);
    box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'Contact' }), contact, S.address ? el('p', { text: S.address }) : null]));
    if ((S.partners || []).length) box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'We work with' }), el('p', { text: S.partners.join(', ') + '.' })]));
    if ((S.funders || []).length) box.appendChild(el('div', {}, [el('h2', { class: 'label', text: 'Funders' }), el('p', { text: S.funders.join(', ') + '.' })]));
  })();

  /* ---------- Figures ---------- */
  if (window.Figures) [].forEach.call(document.querySelectorAll('canvas[data-figure]'), window.Figures.mount);

  /* ---------- Section pills: mark the current one, keep it in view ---------- */
  (function () {
    var bar = $('nav-scroll'); if (!bar || !('IntersectionObserver' in window)) return;
    var links = {}; [].forEach.call(bar.querySelectorAll('a'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = links[e.target.id], k;
        for (k in links) if (links[k] === a) links[k].setAttribute('aria-current', 'true'); else links[k].removeAttribute('aria-current');
        if (a && bar.scrollWidth > bar.clientWidth) {
          var left = a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2;
          bar.scrollLeft = left;
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(links).forEach(function (id) { var s = $(id); if (s) io.observe(s); });
    var top = $('top');
    if (top) new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) for (var k in links) links[k].removeAttribute('aria-current');
    }, { rootMargin: '-40% 0px -55% 0px' }).observe(top);
  })();
})();
