/* Rendered from window.SITE (data/site-data.js). Every page loads this file and it fills
   whichever containers exist on that page, so a scheduled job only edits the data file. */
(function () {
  'use strict';
  var S = window.SITE;
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel) { return [].slice.call(document.querySelectorAll(sel)); };

  // Small element builder. Children may be strings (set as text) or nodes.
  function el(tag, attrs, kids) {
    var n = document.createElement(tag), k;
    if (attrs) for (k in attrs) {
      if (attrs[k] === null || attrs[k] === undefined) continue;
      if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k]);
    }
    if (kids !== undefined && kids !== null) {
      (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
        if (c === null || c === undefined) return;
        n.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
      });
    }
    return n;
  }
  function link(text, href, cls) { return el('a', { href: href, class: cls || null }, text); }
  function each(key, fn) { all('[data-render="' + key + '"]').forEach(fn); }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    var p = String(iso).split('-');
    if (p.length < 3) return iso;
    return p[2] + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return 'Link'; }
  }
  function initials(name) {
    var w = name.trim().split(/\s+/);
    var a = w[0].charAt(0), b = w.length > 1 ? w[w.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }
  function pad(i) { return (i < 10 ? '0' : '') + i; }

  function revealBars() {
    var bars = all('.bar:not(.in)');
    if (!('IntersectionObserver' in window)) { bars.forEach(function (b) { b.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    bars.forEach(function (b) { io.observe(b); });
  }

  if (!S) { revealBars(); return; }

  /* ---- Simple fills (title, one-liner, where, address ...) ---- */
  all('[data-fill]').forEach(function (n) {
    var v = S[n.getAttribute('data-fill')];
    if (v) n.textContent = v;
  });
  all('[data-email]').forEach(function (a) {
    a.href = 'mailto:' + S.links.email;
    a.textContent = S.links.email;
  });
  all('[data-href]').forEach(function (a) {
    var v = S.links[a.getAttribute('data-href')];
    if (v) a.href = v;
  });

  /* ---- Shared: footer and home ---- */
  each('belongs_to', function (ul) {
    (S.belongs_to || []).forEach(function (g) {
      ul.appendChild(el('li', null, g.url ? link(g.name, g.url) : g.name));
    });
  });
  each('links', function (ul) {
    [['GitHub', S.links.github], ['Google Scholar', S.links.scholar]].forEach(function (l) {
      if (l[1]) ul.appendChild(el('li', null, link(l[0], l[1])));
    });
  });
  each('funders', function (ul) {
    S.funders.forEach(function (f) { ul.appendChild(el('li', null, f)); });
  });

  /* ---- Home ---- */
  each('intro', function (d) {
    S.intro.forEach(function (t) { d.appendChild(el('p', null, t)); });
  });
  each('teasers', function (ol) {
    S.themes.forEach(function (t, i) {
      ol.appendChild(el('li', null, el('a', { class: 'grid teaser', href: 'research.html#' + t.id }, [
        el('span', { class: 't-n', 'aria-hidden': 'true' }, i + 1),
        el('span', { class: 't-title' }, t.title),
        el('span', { class: 't-short' }, t.short),
        el('span', { class: 't-go', 'aria-hidden': 'true' }, '→')
      ])));
    });
  });
  each('news', function (ol) {
    S.news.slice(0, 4).forEach(function (n) {
      ol.appendChild(el('li', { class: 'grid row' }, [
        el('time', { class: 'r-date', datetime: n.date }, fmtDate(n.date)),
        el('p', { class: 'r-text' }, n.text),
        n.url ? el('p', { class: 'r-link' }, el('a', { href: n.url, 'aria-label': host(n.url) + ', link for the news item of ' + fmtDate(n.date) }, host(n.url))) : null
      ]));
    });
  });

  /* ---- Paper tables (divs on the page grid, with table roles) ---- */
  function headRow(cols) {
    return el('div', { class: 'grid prow phead', role: 'row' }, cols.map(function (c) {
      return el('span', { class: c[0], role: 'columnheader' }, c[1]);
    }));
  }
  function paperRow(p, withAuthors) {
    var cells = [
      el('span', { class: 'c-year', role: 'cell' }, p.year),
      el('span', { class: 'c-title', role: 'cell' }, p.url ? link(p.title, p.url) : p.title)
    ];
    if (withAuthors) cells.push(el('span', { class: 'c-authors', role: 'cell' }, p.authors));
    cells.push(el('span', { class: 'c-venue', role: 'cell' }, p.venue));
    return el('div', { class: 'grid prow', role: 'row' }, cells);
  }

  /* ---- Research ---- */
  each('toc', function (ol) {
    S.themes.forEach(function (t, i) {
      ol.appendChild(el('li', null, el('a', { href: '#' + t.id }, [el('span', { class: 'n', 'aria-hidden': 'true' }, i + 1), t.title])));
    });
  });
  each('themes', function (box) {
    S.themes.forEach(function (t, i) {
      var hid = 'h-' + t.id;
      var table = el('div', { class: 'ptable', role: 'table', 'aria-label': 'Selected papers: ' + t.title }, [
        el('div', { role: 'rowgroup' }, headRow([['c-year', 'Year'], ['c-title', 'Selected papers'], ['c-venue', 'Published in']])),
        el('div', { role: 'rowgroup' }, t.papers.map(function (p) { return paperRow(p, false); }))
      ]);
      box.appendChild(el('article', { class: 'theme', id: t.id, 'aria-labelledby': hid }, [
        el('div', { class: 'grid theme-head' }, [
          el('p', { class: 'theme-n', 'aria-hidden': 'true' }, i + 1),
          el('p', { class: 'theme-short' }, t.short),
          el('div', { class: 'bar', 'aria-hidden': 'true' }),
          el('h2', { id: hid }, t.title)
        ]),
        el('div', { class: 'grid theme-text' }, [
          el('div', { class: 'theme-body prose' }, t.body.map(function (b) { return el('p', null, b); })),
          el('p', { class: 'theme-now' }, [el('span', { class: 'label' }, 'Now'), t.now])
        ]),
        table
      ]));
    });
  });
  each('partners', function (ul) {
    S.partners.forEach(function (t) { ul.appendChild(el('li', null, t)); });
  });

  /* ---- People ---- */
  each('people', function (ul) {
    S.people.forEach(function (p) {
      var tile = el('div', { class: 'tile' }, p.photo
        ? el('img', { src: 'img/people/' + p.photo, alt: 'Portrait of ' + p.name, width: 480, height: 480, loading: 'lazy', decoding: 'async' })
        : el('span', { class: 'ini', 'aria-hidden': 'true' }, initials(p.name)));
      ul.appendChild(el('li', { class: 'person' }, [
        tile,
        el('h3', { class: 'person-name' }, p.link ? link(p.name, p.link) : p.name),
        el('p', { class: 'person-role' }, p.role),
        el('p', { class: 'person-topic' }, p.topic)
      ]));
    });
  });
  each('alumni', function (d) {
    d.appendChild(el('p', null, S.alumni.map(function (a) {
      return a.name + ', ' + a.was + ', now at ' + a.now;
    }).join('; ') + '.'));
  });
  each('masters', function (d) {
    d.appendChild(el('p', null, 'With thanks to ' + S.masters_alumni.join(', ') + '.'));
  });

  /* ---- Working with us ---- */
  if ($('routes')) {
    $('join-status').textContent = S.join.status;
    $('join-body').textContent = S.join.body;
    S.join.routes.forEach(function (r, i) {
      $('routes').appendChild(el('li', { class: 'route' }, [
        el('h2', null, [el('span', { class: 'n', 'aria-hidden': 'true' }, pad(i + 1)), r.who]),
        el('p', null, r.text)
      ]));
    });
    $('join-footnote').textContent = S.join.footnote;
  }

  /* ---- How we work ---- */
  if ($('quotes')) {
    $('norms-intro').textContent = S.norms.intro;
    // Four of the six quotes: the ones written as "we" or as shared practice, not in one person's voice.
    [1, 2, 3, 5].forEach(function (i) {
      var q = S.norms.quotes[i];
      if (!q) return;
      $('quotes').appendChild(el('figure', { class: 'quote' }, el('blockquote', null, el('p', null, '“' + q + '”'))));
    });
    S.norms.principles.forEach(function (p, i) {
      $('principles').appendChild(el('li', { class: 'grid row' }, [
        el('span', { class: 'r-num', 'aria-hidden': 'true' }, pad(i + 1)),
        el('h3', { class: 'r-t' }, p.t),
        el('p', { class: 'r-d' }, p.d)
      ]));
    });
    if (S.norms.link && S.norms.link !== '#') $('norms-link').appendChild(link(S.norms.link_text, S.norms.link));
    else $('norms-link').appendChild(el('span', null, S.norms.link_text.replace(/^Read the full/, 'The full') + ' will be linked here.'));
  }

  /* ---- Publications ---- */
  if ($('paper-table')) {
    var LIMIT = 10, filter = 'all', expanded = false;
    var papers = S.recent_papers;
    var body = el('div', { role: 'rowgroup' });
    $('paper-table').appendChild(el('div', { role: 'rowgroup' },
      headRow([['c-year', 'Year'], ['c-title', 'Title'], ['c-authors', 'Authors'], ['c-venue', 'Published in']])));
    $('paper-table').appendChild(body);
    var btn = $('show-all');

    var draw = function () {
      var match = papers.filter(function (p) { return filter === 'all' || p.theme === filter; });
      var shown = (filter === 'all' && !expanded) ? match.slice(0, LIMIT) : match;
      body.textContent = '';
      shown.forEach(function (p) { body.appendChild(paperRow(p, true)); });
      $('count-n').textContent = shown.length;
      $('count-text').textContent = shown.length + ' of ' + papers.length + ' papers shown';
      btn.hidden = filter !== 'all' || papers.length <= LIMIT;
      btn.textContent = expanded ? 'Show fewer' : 'Show all ' + papers.length;
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };
    btn.addEventListener('click', function () {
      expanded = !expanded;
      draw();
      if (!expanded) $('papers').scrollIntoView();
    });

    var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    [{ id: 'all' }].concat(S.themes).forEach(function (t) {
      var b = el('button', { type: 'button', 'aria-pressed': t.id === 'all' ? 'true' : 'false' }, t.id === 'all' ? 'All' : cap(t.id));
      if (t.title) b.title = t.title;
      b.addEventListener('click', function () {
        filter = t.id;
        [].forEach.call($('filters').children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        draw();
      });
      $('filters').appendChild(b);
    });
    draw();
  }

  revealBars();

  // Anchors such as research.html#malaria point at content rendered above, so land on them now.
  if (location.hash.length > 1) {
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
})();
