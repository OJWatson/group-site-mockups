/* Partially Observed: renders the lists on the page from window.SITE (data/site-data.js).
   Nothing here holds content. To update the site, edit the data file only. */
(function () {
  'use strict';
  var S = window.SITE;
  if (!S) return;

  /* Presentation choices (not content) */
  var NEWS_SHOWN = 5;          // the brief asks for four or five
  var PAPERS_SHOWN = 10;       // then "Show all"
  var PULL_QUOTES = [0, 1, 5]; // which of norms.quotes are set as pull quotes

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function $(id) { return document.getElementById(id); }

  /* Typesetting only: keep "COVID-19", "SARS-CoV-2" and the like on one line
     by putting a word joiner after a hyphen that comes before a digit. */
  function tidy(t) { return String(t).replace(/([A-Za-z])-(\d)/g, '$1-\u2060$2'); }

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
    var m = /^(.*?)\s*(\([^)]*\))\s*$/.exec(v);
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

  /* ---------- 1 About ---------- */
  (function () {
    var intro = $('intro');
    (S.intro || []).forEach(function (p) { intro.appendChild(el('p', { text: p })); });
    if (S.affiliation_line) {
      $('affiliation').appendChild(el('span', { class: 'label runin', text: 'Affiliation' }));
      $('affiliation').appendChild(document.createTextNode(' ' + S.affiliation_line));
    }
    if (S.join && S.join.status) $('notice-status').textContent = S.join.status;
  })();

  /* ---------- 2 Research ---------- */
  (function () {
    var host = $('themes');
    (S.themes || []).forEach(function (t, i) {
      var n = '2.' + (i + 1);
      var art = el('article', { class: 'theme', id: 'theme-' + t.id, 'aria-labelledby': 'h-theme-' + t.id });

      var head = el('header', { class: 'theme-head' },
        el('h3', { id: 'h-theme-' + t.id }, el('span', { class: 'num', text: n }), ' ' + t.title),
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
      host.appendChild(art);
    });
  })();

  /* ---------- 3 People ---------- */
  (function () {
    var list = $('people-list');
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
      var li = el('li', { class: 'person' },
        face,
        el('p', { class: 'pwho' }, name, el('span', { class: 'prole label', text: p.role })),
        el('p', { class: 'ptopic', text: firstSentence(p.topic) }));
      list.appendChild(li);
    });

    var side = $('alumni');
    if (S.alumni && S.alumni.length) {
      var txt = S.alumni.map(function (a) {
        return a.name + (a.was ? ', ' + a.was : '') + (a.now ? ' (now at ' + a.now + ')' : '');
      }).join('; ') + '.';
      side.appendChild(el('p', { class: 'sidenote' }, el('span', { class: 'label runin', text: 'Alumni' }), ' ' + txt));
    }
    if (S.masters_alumni && S.masters_alumni.length) {
      side.appendChild(el('p', { class: 'sidenote' },
        el('span', { class: 'label runin', text: 'Masters students' }), ' ' + S.masters_alumni.join(', ') + '.'));
    }
  })();

  /* ---------- 4 Working with us ---------- */
  (function () {
    var J = S.join || {};
    var body = $('join-body');
    if (J.status) body.appendChild(el('p', { class: 'status', text: J.status }));
    if (J.body) body.appendChild(el('p', { text: J.body }));
    var dl = $('routes');
    (J.routes || []).forEach(function (r) {
      dl.appendChild(el('div', null, el('dt', { class: 'label', text: r.who }), el('dd', { text: r.text })));
    });
    if (J.footnote) $('join-footnote').textContent = J.footnote;
    if (S.links && S.links.email) {
      $('join-side').appendChild(el('p', { class: 'sidenote' },
        el('span', { class: 'label runin', text: 'Write to' }), ' ',
        link('mailto:' + S.links.email, S.links.email, 'email')));
    }
  })();

  /* ---------- 5 Notes ---------- */
  (function () {
    var list = $('news-list');
    (S.news || []).slice(0, NEWS_SHOWN).forEach(function (n) {
      var p = el('p', { text: n.text });
      if (n.url) {
        p.appendChild(document.createTextNode(' '));
        p.appendChild(link(n.url, /doi\.org/.test(n.url) ? 'Paper' : 'Link', 'label go'));
      }
      list.appendChild(el('li', null, el('time', { class: 'label', datetime: n.date, text: niceDate(n.date) }), p));
    });
  })();

  /* ---------- 6 How we work ---------- */
  (function () {
    var N = S.norms || {};
    var host = $('norms-body');
    var quotes = PULL_QUOTES.map(function (i) { return (N.quotes || [])[i]; }).filter(Boolean);

    function pull(q, cls) {
      return el('blockquote', { class: 'pull ' + cls }, el('p', { text: '“' + q + '”' }));
    }

    if (N.intro) host.appendChild(el('div', { class: 'prose norms-intro' }, el('p', { text: N.intro })));
    if (quotes[0]) host.appendChild(pull(quotes[0], 'pull--lead'));

    if (N.principles && N.principles.length) {
      var ol = el('ol', { class: 'principles' });
      N.principles.forEach(function (p) {
        ol.appendChild(el('li', null, el('span', { class: 'pt label', text: p.t }), ' ', el('span', { class: 'pd', text: p.d })));
      });
      host.appendChild(ol);
    }

    if (quotes.length > 1) {
      var side = el('div', { class: 'side norms-side' });
      quotes.slice(1).forEach(function (q) { side.appendChild(pull(q, 'pull--margin')); });
      host.appendChild(side);
    }

    if (N.link_text) {
      var a = link(N.link || '#', N.link_text);
      if (!N.link || N.link === '#') {
        /* Placeholder until the norms document has a public address: do not jump to the top. */
        a.addEventListener('click', function (e) { e.preventDefault(); });
      }
      host.appendChild(el('p', { class: 'norms-link' }, a));
    }
  })();

  /* ---------- 7 Recent papers ---------- */
  (function () {
    var list = $('refs'), btn = $('refs-toggle');
    var papers = S.recent_papers || [];
    papers.forEach(function (p, i) {
      var li = el('li', { class: i >= PAPERS_SHOWN ? 'extra' : null, hidden: i >= PAPERS_SHOWN });
      var authors = String(p.authors || '').replace(/\.$/, '');
      if (authors) li.appendChild(el('span', { class: 'authors', text: authors + '. ' }));
      li.appendChild(link(p.url, p.title, 'rtitle'));
      li.appendChild(document.createTextNode('. '));
      li.appendChild(venue(p.venue));
      li.appendChild(document.createTextNode(', ' + p.year + '.'));
      list.appendChild(li);
    });
    if (papers.length > PAPERS_SHOWN) {
      var open = false;
      var showText = 'Show all ' + papers.length + ' papers';
      btn.textContent = showText;
      btn.hidden = false;
      btn.addEventListener('click', function () {
        open = !open;
        Array.prototype.forEach.call(list.querySelectorAll('.extra'), function (li) { li.hidden = !open; });
        btn.textContent = open ? 'Show the first ' + PAPERS_SHOWN + ' only' : showText;
        btn.setAttribute('aria-expanded', String(open));
        if (!open) $('papers').scrollIntoView();
      });
    }
    if (S.publications_note) $('papers-note').textContent = S.publications_note;
  })();

  /* ---------- Contact (footer) ---------- */
  (function () {
    var dl = $('contact-list'), L = S.links || {};
    function row(label, content) {
      if (!content) return;
      var dd = el('dd');
      (Array.isArray(content) ? content : [content]).forEach(function (c, i) {
        if (i) dd.appendChild(document.createTextNode(' · '));
        dd.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
      dl.appendChild(el('div', null, el('dt', { class: 'label', text: label }), dd));
    }
    row('Email', L.email ? link('mailto:' + L.email, L.email, 'email') : null);
    var code = [];
    if (L.github) code.push(link(L.github, 'GitHub'));
    if (L.scholar) code.push(link(L.scholar, 'Google Scholar'));
    row('Code and papers', code.length ? code : null);
    row('Address', S.address);
    row('Funders', S.funders && S.funders.length ? S.funders.join(', ') + '.' : null);
    row('Partners', S.partners && S.partners.length ? S.partners.join('; ') + '.' : null);
  })();
})();
