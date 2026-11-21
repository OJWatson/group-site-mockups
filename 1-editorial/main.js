/* Renders the lists on every page from window.SITE (data/site-data.js).
   Each block below only runs if its container exists on the current page.
   Nothing here holds content: to update the site, edit the data file only. */
(function () {
  'use strict';
  var S = window.SITE;
  if (!S) return;

  /* Presentation choices (not content) */
  var NEWS_SHOWN = 4;          // home page: the latest four
  var PAPERS_SHOWN = 12;       // publications: then "Show all"

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function $(id) { return document.getElementById(id); }

  /* Typesetting only: keep "COVID-19", "SARS-CoV-2" and the like on one line
     by putting a word joiner after a hyphen that comes before a digit. */
  function tidy(t) { return String(t).replace(/([A-Za-z])-(\d)/g, '$1-⁠$2'); }

  /* el('a', {href: '…', class: '…'}, child, 'text', …) */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
        if (k === 'text') node.textContent = tidy(attrs[k]);
        else node.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(tidy(c)) : c);
    }
    return node;
  }

  function link(href, text, cls) {
    var external = /^https?:/.test(href);
    return el('a', { href: href, class: cls || null, rel: external ? 'noopener' : null, text: text });
  }

  function niceDate(iso) {
    var p = String(iso).split('-');
    if (p.length < 3) return iso;
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  /* "VeriXiv (preprint)" -> italic name, roman "(preprint)" */
  function venue(v) {
    var m = /^(.*?)\s*(\([^)]*\))\s*$/.exec(v || '');
    var frag = document.createDocumentFragment();
    frag.appendChild(el('cite', { text: m ? m[1] : v }));
    if (m) frag.appendChild(document.createTextNode(' ' + m[2]));
    return frag;
  }

  function firstSentence(t) {
    var m = /^(.*?[.?])(\s|$)/.exec(t || '');
    return m ? m[1] : t;
  }

  function initials(name) {
    var parts = name.trim().split(/\s+/);
    var a = parts[0], b = parts.length > 1 ? parts[parts.length - 1] : '';
    /* "OJ Watson" keeps "OJ" rather than "OW" */
    if (a.length <= 3 && a === a.toUpperCase()) return a;
    return (a.charAt(0) + b.charAt(0)).toUpperCase();
  }

  /* "a, b and c" */
  function listJoin(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function themesOf(p) {
    var t = p.theme;
    return Array.isArray(t) ? t : (t ? [t] : []);
  }

  var THEME_TITLE = {};
  (S.themes || []).forEach(function (t) { THEME_TITLE[t.id] = t.title; });

  /* ================= Home ================= */

  if ($('one-liner') && S.one_liner) $('one-liner').textContent = tidy(S.one_liner);

  if ($('intro')) {
    (S.intro || []).forEach(function (p) { $('intro').appendChild(el('p', { text: p })); });
  }

  if ($('where') && S.where) {
    $('where').appendChild(document.createTextNode(' ' + tidy(S.where)));
  }
  if ($('belongs-to')) {
    (S.belongs_to || []).forEach(function (g) {
      $('belongs-to').appendChild(el('li', null, g.url ? link(g.url, g.name) : g.name));
    });
  }

  if ($('teasers')) {
    (S.themes || []).forEach(function (t, i) {
      $('teasers').appendChild(el('li', null,
        el('h3', null, el('span', { class: 'num', text: '2.' + (i + 1) }), ' ',
          link('research.html#' + t.id, t.title)),
        t.short ? el('p', { text: t.short }) : null));
    });
  }

  if ($('news-list')) {
    (S.news || []).slice(0, NEWS_SHOWN).forEach(function (n) {
      var p = el('p', { text: n.text });
      if (n.url) {
        p.appendChild(document.createTextNode(' '));
        p.appendChild(link(n.url, /doi\.org/.test(n.url) ? 'Paper' : 'Link', 'label go'));
      }
      $('news-list').appendChild(el('li', null, el('time', { class: 'label', datetime: n.date, text: niceDate(n.date) }), p));
    });
  }

  if ($('notice-status') && S.join && S.join.status) $('notice-status').textContent = tidy(S.join.status);

  /* ================= Research ================= */

  if ($('themes')) {
    (S.themes || []).forEach(function (t, i) {
      var art = el('article', { class: 'theme', id: t.id, 'aria-labelledby': 'h-' + t.id });

      var head = el('header', { class: 'theme-head' },
        el('h2', { id: 'h-' + t.id }, el('span', { class: 'num', text: String(i + 1) }), ' ' + t.title),
        t.short ? el('p', { class: 'theme-short', text: t.short }) : null);

      var body = el('div', { class: 'prose theme-body' });
      (t.body || []).forEach(function (p) { body.appendChild(el('p', { text: p })); });

      var side = el('aside', { class: 'side theme-side', 'aria-label': 'Current focus and selected papers: ' + t.title });
      if (t.now) {
        side.appendChild(el('p', { class: 'sidenote now' },
          el('span', { class: 'label runin', text: 'Currently' }), ' ' + t.now));
      }
      if (t.papers && t.papers.length) {
        side.appendChild(el('p', { class: 'label side-label', text: 'Selected papers' }));
        var ul = el('ul', { class: 'side-papers' });
        t.papers.forEach(function (p) {
          var li = el('li', null, link(p.url, p.title), ' ');
          var src = el('span', { class: 'src' });
          src.appendChild(venue(p.venue));
          src.appendChild(document.createTextNode(', ' + p.year + '.'));
          li.appendChild(src);
          ul.appendChild(li);
        });
        side.appendChild(ul);
      }

      art.appendChild(head);
      art.appendChild(body);
      art.appendChild(side);
      $('themes').appendChild(art);
    });

    /* The areas are drawn by this script, and the web fonts arrive a moment later,
       so land on #area again once the page has settled. */
    if (location.hash) {
      var land = function () {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView();
      };
      land();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(land);
    }
  }

  /* ================= People ================= */

  if ($('people-list')) {
    (S.people || []).forEach(function (p) {
      var face = el('span', { class: 'face' + (p.photo ? '' : ' face--initials'), 'aria-hidden': p.photo ? null : 'true' });
      if (p.photo) {
        face.appendChild(el('img', {
          src: 'img/people/' + p.photo, alt: 'Portrait of ' + p.name,
          width: '120', height: '120', loading: 'lazy', decoding: 'async'
        }));
      } else {
        face.appendChild(document.createTextNode(initials(p.name)));
      }
      var name = el('span', { class: 'pname' }, p.link ? link(p.link, p.name) : p.name);
      /* First sentence only, so that every entry is the same length. */
      $('people-list').appendChild(el('li', { class: 'person' },
        face,
        el('p', { class: 'pwho' }, name, el('span', { class: 'prole label', text: p.role })),
        el('p', { class: 'ptopic', text: firstSentence(p.topic) })));
    });
  }

  if ($('alumni-list')) {
    (S.alumni || []).forEach(function (a) {
      $('alumni-list').appendChild(el('div', null,
        el('dt', { class: 'label', text: a.was || '' }),
        el('dd', { text: a.name + (a.now ? ', now at ' + a.now : '') + '.' })));
    });
  }

  if ($('masters-list') && S.masters_alumni && S.masters_alumni.length) {
    $('masters-list').textContent = tidy('With thanks to the Masters students who have worked with us: ' +
      listJoin(S.masters_alumni) + '.');
  }

  /* ================= Publications ================= */

  if ($('refs')) {
    var list = $('refs'), btn = $('refs-toggle'), shown = $('shown');
    var papers = S.recent_papers || [];
    var current = 'all', open = false;

    papers.forEach(function (p) {
      var li = el('li', { 'data-themes': themesOf(p).join(' ') });
      var authors = String(p.authors || '').replace(/\.$/, '');
      if (authors) li.appendChild(el('span', { class: 'authors', text: authors + '. ' }));
      li.appendChild(link(p.url, p.title, 'rtitle'));
      li.appendChild(document.createTextNode('. '));
      li.appendChild(venue(p.venue));
      li.appendChild(document.createTextNode(', ' + p.year + '.'));
      var areas = themesOf(p).map(function (id) { return THEME_TITLE[id]; }).filter(Boolean);
      if (areas.length) li.appendChild(el('span', { class: 'rarea label', text: areas.join(' · ') }));
      list.appendChild(li);
    });

    function apply() {
      var items = list.children, matching = 0;
      for (var i = 0; i < items.length; i++) {
        var ids = (items[i].getAttribute('data-themes') || '').split(' ');
        var match = current === 'all' || ids.indexOf(current) !== -1;
        if (match) matching++;
        items[i].hidden = !(match && (open || matching <= PAPERS_SHOWN));
      }
      list.setAttribute('data-filter', current);
      var visible = Math.min(matching, open ? matching : PAPERS_SHOWN);
      shown.textContent = 'Showing ' + visible + ' of ' + matching + (matching === 1 ? ' paper' : ' papers') +
        (current === 'all' ? '.' : ' in this area.');
      if (matching > PAPERS_SHOWN) {
        btn.hidden = false;
        btn.textContent = open ? 'Show the first ' + PAPERS_SHOWN + ' only' : 'Show all ' + matching;
        btn.setAttribute('aria-expanded', String(open));
      } else {
        btn.hidden = true;
      }
    }

    if ($('filter-list') && S.themes && S.themes.length) {
      var choices = [{ id: 'all', title: 'All areas' }].concat(S.themes);
      choices.forEach(function (t) {
        var b = el('button', { type: 'button', 'aria-pressed': String(t.id === current), 'data-id': t.id, text: t.title });
        b.addEventListener('click', function () {
          current = t.id; open = false;
          Array.prototype.forEach.call($('filter-list').querySelectorAll('button'), function (x) {
            x.setAttribute('aria-pressed', String(x.getAttribute('data-id') === current));
          });
          apply();
        });
        $('filter-list').appendChild(el('li', null, b));
      });
      $('filter').hidden = false;
    }

    btn.addEventListener('click', function () {
      open = !open;
      apply();
      if (!open) $('h-papers').scrollIntoView();
    });
    apply();

    if (S.publications_note) {
      var note = $('papers-note');
      note.appendChild(el('span', { class: 'label runin', text: 'About this list' }));
      note.appendChild(document.createTextNode(' '));
      var txt = tidy(S.publications_note), at = txt.indexOf('Google Scholar');
      if (S.links && S.links.scholar && at !== -1) {
        note.appendChild(document.createTextNode(txt.slice(0, at)));
        note.appendChild(link(S.links.scholar, 'Google Scholar'));
        note.appendChild(document.createTextNode(txt.slice(at + 'Google Scholar'.length)));
      } else {
        note.appendChild(document.createTextNode(txt));
      }
    }
  }

  if ($('elsewhere-list')) {
    var L0 = S.links || {};
    [['Google Scholar', L0.scholar, 'Complete list'], ['ORCID record', L0.orcid, 'ORCID'], ['GitHub', L0.github, 'Code']].forEach(function (r) {
      if (!r[1]) return;
      $('elsewhere-list').appendChild(el('div', null,
        el('dt', { class: 'label', text: r[2] }),
        el('dd', null, link(r[1], r[0], 'go'))));
    });
  }

  /* ================= Working with us ================= */

  var J = S.join || {};
  if ($('join-status') && J.status) $('join-status').textContent = tidy(J.status);
  if ($('join-body') && J.body) $('join-body').appendChild(el('p', { text: J.body }));
  if ($('routes')) {
    (J.routes || []).forEach(function (r) {
      $('routes').appendChild(el('div', null, el('dt', { class: 'label', text: r.who }), el('dd', { text: r.text })));
    });
  }
  if ($('join-footnote') && J.footnote) $('join-footnote').textContent = tidy(J.footnote);
  if ($('join-write') && S.links && S.links.email) {
    $('join-write').appendChild(el('span', { class: 'label runin', text: 'Write to' }));
    $('join-write').appendChild(document.createTextNode(' '));
    $('join-write').appendChild(link('mailto:' + S.links.email, S.links.email, 'email'));
  }

  /* ================= How we work ================= */

  var N = S.norms || {};
  if ($('norms-intro') && N.intro) $('norms-intro').textContent = tidy(N.intro);
  if ($('norms-quotes')) {
    (N.quotes || []).forEach(function (q, i) {
      $('norms-quotes').appendChild(el('blockquote', { class: 'pull' + (i === 0 ? ' pull--lead' : '') },
        el('p', { text: '“' + q + '”' })));
    });
  }
  if ($('norms-principles')) {
    (N.principles || []).forEach(function (p) {
      $('norms-principles').appendChild(el('li', null,
        el('span', { class: 'pt label', text: p.t }), ' ', el('span', { class: 'pd', text: p.d })));
    });
  }
  if ($('norms-link') && N.link_text) {
    var a = link(N.link || '#', N.link_text);
    if (!N.link || N.link === '#') {
      /* Placeholder until the norms document has a public address: do not jump to the top. */
      a.addEventListener('click', function (e) { e.preventDefault(); });
    }
    $('norms-link').appendChild(a);
  }

  /* ================= Footer (every page) ================= */

  if ($('contact-list')) {
    var dl = $('contact-list'), L = S.links || {};
    var row = function (label, content) {
      if (!content) return;
      var dd = el('dd');
      (Array.isArray(content) ? content : [content]).forEach(function (c, i) {
        if (i) dd.appendChild(document.createTextNode(' · '));
        dd.appendChild(typeof c === 'string' ? document.createTextNode(tidy(c)) : c);
      });
      dl.appendChild(el('div', null, el('dt', { class: 'label', text: label }), dd));
    };
    row('Email', L.email ? link('mailto:' + L.email, L.email, 'email') : null);
    var code = [];
    if (L.github) code.push(link(L.github, 'GitHub'));
    if (L.scholar) code.push(link(L.scholar, 'Google Scholar'));
    row('Code and papers', code.length ? code : null);
    row('Address', S.address);
    row('Where we sit', S.where);
    row('Part of', (S.belongs_to || []).length && S.belongs_to.map(function (g) { return g.url ? link(g.url, g.name) : g.name; }));
    row('Funders', S.funders && S.funders.length ? S.funders.join(', ') + '.' : null);
    row('Partners', S.partners && S.partners.length ? S.partners.join('; ') + '.' : null);
  }
})();
