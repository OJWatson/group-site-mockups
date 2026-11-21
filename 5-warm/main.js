/* Renders everything that changes from window.SITE (data/site-data.js).
   Each page has only some of the containers below; anything missing is skipped,
   so a scheduled job only ever needs to edit the data file. */
(function () {
  'use strict';
  var S = window.SITE;
  if (!S) return;

  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var ext = function (url) { return /^https?:/.test(url) ? ' rel="noopener"' : ''; };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var niceDate = function (iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : (iso || '');
  };
  var joinNames = function (arr) {
    if (arr.length < 2) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  };
  var slug = function (n) { return String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var firstSentence = function (t) {
    var m = /^.*?[.!?](?=\s|$)/.exec(t || '');
    return m ? m[0] : (t || '');
  };
  var set = function (id, text) { var el = $(id); if (el) el.textContent = text || ''; return el; };
  var email = (S.links || {}).email;
  var intro = S.intro || [];

  /* Short labels for paper tags and filters; an unknown theme id falls back to its title. */
  var SHORT_LABEL = { crises: 'Crises', malaria: 'Malaria', vaccines: 'Vaccines', decisions: 'Decisions', methods: 'Methods' };
  var THEME_LABEL = {};
  (S.themes || []).forEach(function (t) { THEME_LABEL[t.id] = SHORT_LABEL[t.id] || t.title; });

  /* ---- Portraits: a photo, or initials on a tinted tile with a sprig ---- */
  var TINTS = [
    ['#DCE4C6', '#3F5226'],  /* sage */
    ['#F1D8C6', '#8A3B1E'],  /* clay blush */
    ['#EBDDB4', '#6B5212'],  /* straw */
    ['#D2DFD3', '#24503A'],  /* water green */
    ['#EAD9CF', '#6E4634']   /* earth */
  ];
  var SPRIGS = [
    'M50 98C48 66 38 40 12 40M50 98C52 64 66 44 90 50M50 98C50 62 56 34 66 12',
    'M50 98C46 70 30 52 8 58M50 98C54 60 70 36 94 36M50 98C49 64 46 34 38 10',
    'M50 98C48 60 36 30 16 22M50 98C53 70 68 56 92 62M50 98C51 66 58 40 72 22'
  ];
  var initials = function (name) {
    var parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  /* Tints are assigned in data order, so the strip on the home page and the People page match. */
  var portraits = (function () {
    var n = 0;
    return (S.people || []).map(function (p, i) {
      if (p.photo) {
        return { img: true, html: '<img src="img/people/' + esc(p.photo) + '" alt="Portrait of ' + esc(p.name) +
          '" width="480" height="480" loading="' + (i < 4 ? 'eager' : 'lazy') + '" decoding="async">' };
      }
      var t = TINTS[n % TINTS.length], sprig = SPRIGS[n % SPRIGS.length], flip = n % 2 ? ' tile--flip' : '';
      n++;
      return { img: false, html: '<div class="tile' + flip + '" style="--t-bg:' + t[0] + ';--t-fg:' + t[1] + '">' +
        '<svg class="tile__sprig" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="' + sprig +
        '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        '<span class="tile__init" aria-hidden="true">' + esc(initials(p.name)) + '</span></div>' };
    });
  })();
  var pic = function (i, extra) {
    var pt = portraits[i];
    return '<div class="person__pic' + (pt.img ? '' : ' person__pic--tile') + (extra || '') + '">' + pt.html + '</div>';
  };

  /* ---- Shared: where we sit, and the groups we belong to (home and footer) ---- */
  all('[data-where]').forEach(function (el) { el.textContent = S.where || ''; });
  all('[data-belongs]').forEach(function (el) {
    el.innerHTML = (S.belongs_to || []).map(function (g) {
      return '<li><a href="' + esc(g.url) + '"' + ext(g.url) + '>' + esc(g.name) + '</a></li>';
    }).join('');
  });

  /* ---- Home ---- */
  set('one-liner', S.one_liner);
  if ($('intro')) {
    /* Paragraphs 1 and 3 here; paragraph 2 opens "What we work on". */
    var short = intro.length > 2 ? [intro[0], intro[intro.length - 1]] : intro;
    $('intro').innerHTML = short.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  }
  if ($('research-lead') && intro.length > 2) $('research-lead').textContent = intro[1];

  if ($('people-strip')) {
    $('people-strip').innerHTML = (S.people || []).map(function (p, i) {
      var first = String(p.name).split(/\s+/)[0];
      return '<li><a class="strip__item" href="people.html#' + esc(slug(p.name)) + '">' + pic(i, ' strip__pic') +
        '<span class="strip__name"><span class="strip__first">' + esc(first) + '</span>' +
        '<span class="strip__rest"> ' + esc(String(p.name).split(/\s+/).slice(1).join(' ')) + '</span></span></a></li>';
    }).join('');
    /* img alt is redundant next to the visible name inside the same link */
    all('#people-strip img').forEach(function (im) { im.alt = ''; });
  }

  if ($('teasers')) {
    $('teasers').innerHTML = (S.themes || []).map(function (t, i) {
      return '<li><a class="teaser" href="research.html#' + esc(t.id) + '">' +
        '<span class="teaser__n" aria-hidden="true">' + (i + 1) + '</span>' +
        '<span class="teaser__head"><span class="teaser__title">' + esc(t.title) + '</span>' +
        '<span class="teaser__short">' + esc(t.short) + '</span></span>' +
        '<span class="teaser__go" aria-hidden="true">→</span></a></li>';
    }).join('');
  }

  if ($('news-list')) {
    $('news-list').innerHTML = (S.news || []).slice(0, 4).map(function (n) {
      return '<li><time datetime="' + esc(n.date) + '">' + esc(niceDate(n.date)) + '</time>' + esc(n.text) +
        (n.url ? ' <a href="' + esc(n.url) + '"' + ext(n.url) + ' aria-label="Read more: ' + esc(n.text) + '">Read more <span aria-hidden="true">→</span></a>' : '') + '</li>';
    }).join('');
  }
  set('nudge-text', (S.join || {}).status);

  /* ---- Research ---- */
  if ($('themes')) {
    var themes = S.themes || [];
    if ($('jump')) {
      $('jump').innerHTML = themes.map(function (t) {
        return '<li><a href="#' + esc(t.id) + '">' + esc(THEME_LABEL[t.id]) + '</a></li>';
      }).join('');
    }
    $('themes').innerHTML = themes.map(function (t) {
      return '<details class="theme" id="' + esc(t.id) + '">' +
        '<summary><span class="theme__head"><span class="theme__title">' + esc(t.title) + '</span>' +
        '<span class="theme__short">' + esc(t.short) + '</span></span>' +
        '<span class="theme__plus" aria-hidden="true"></span></summary>' +
        '<div class="theme__body"><div class="theme__text">' +
        (t.body || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        (t.now ? '<p class="theme__now"><b>Right now</b>' + esc(t.now) + '</p>' : '') +
        '</div><div class="theme__papers"><h3>Selected papers</h3><ul>' +
        (t.papers || []).map(function (p) {
          return '<li><a href="' + esc(p.url) + '"' + ext(p.url) + '><span class="t">' + esc(p.title) + '</span>' +
            '<span class="v">' + esc(p.venue) + ', ' + esc(p.year) + '</span></a></li>';
        }).join('') + '</ul></div></div></details>';
    }).join('');

    /* Wide screens: every area open. Phones: the area you came for is open, the rest are one tap away. */
    var wide = window.matchMedia('(min-width: 940px)').matches;
    var els = all('.theme');
    var openHash = function (scroll) {
      var id = decodeURIComponent((location.hash || '').slice(1));
      var el = id && document.getElementById(id);
      if (el && el.classList.contains('theme')) {
        el.open = true;
        if (scroll) el.scrollIntoView();
        return true;
      }
      return false;
    };
    if (wide) els.forEach(function (d) { d.open = true; });
    else if (!openHash(false) && els[0]) els[0].open = true;
    /* The areas are drawn after the browser's first jump to the fragment, so jump again now. */
    if (location.hash) openHash(true);
    window.addEventListener('hashchange', function () { openHash(true); });
  }

  /* ---- People ---- */
  if ($('people-grid')) {
    $('people-grid').innerHTML = (S.people || []).map(function (p, i) {
      var name = p.link
        ? '<a href="' + esc(p.link) + '"' + ext(p.link) + '>' + esc(p.name) + '</a>'
        : esc(p.name);
      /* Everyone gets a card of the same size, so a long entry is cut to its first sentence. */
      var topic = (p.topic || '').length > 90 ? firstSentence(p.topic) : p.topic;
      return '<li class="person" id="' + esc(slug(p.name)) + '">' + pic(i) +
        '<h2 class="person__name">' + name + '</h2>' +
        '<p class="person__role">' + esc(p.role) + '</p>' +
        '<p class="person__topic">' + esc(topic) + '</p></li>';
    }).join('');
    if (location.hash) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }
  if ($('alumni-line')) {
    if ((S.alumni || []).length) {
      $('alumni-line').innerHTML = '<span class="k">Alumni</span>' + S.alumni.map(function (a) {
        return '<span class="alum"><img src="img/people/' + slug(a.name) + '.jpg" alt="" width="40" height="40" loading="lazy" onerror="this.remove()">' +
          '<span><strong>' + esc(a.name) + '</strong>, ' + esc(a.was) + (a.now ? ', now at ' + esc(a.now) : '') + '</span></span>';
      }).join(' ');
    } else { $('alumni-line').remove(); }
  }
  if ($('masters-line')) {
    if ((S.masters_alumni || []).length) {
      $('masters-line').innerHTML = '<span class="k">With thanks to our Masters students</span>' +
        esc(joinNames(S.masters_alumni)) + '.';
    } else { $('masters-line').remove(); }
  }

  /* ---- How we work ---- */
  var N = S.norms || {};
  set('norms-intro', N.intro);
  if ($('principles')) {
    $('principles').innerHTML = (N.principles || []).map(function (p, i) {
      return '<li class="principle"><span class="principle__n" aria-hidden="true">' + (i + 1) + '</span>' +
        '<h2>' + esc(p.t) + '</h2><p>' + esc(p.d) + '</p></li>';
    }).join('');
  }
  if ($('quotes')) {
    $('quotes').innerHTML = (N.quotes || []).map(function (q, n) {
      return '<blockquote class="quote' + (n === 0 ? ' quote--lead' : '') + '"><p>“' + esc(q) + '”</p></blockquote>';
    }).join('');
  }
  /* norms.link is "#" until the document is published; show the link only once it is real. */
  if ($('norms-link')) {
    if (N.link_text && N.link && N.link !== '#') {
      $('norms-link').innerHTML = '<a href="' + esc(N.link) + '"' + ext(N.link) + '>' + esc(N.link_text) + ' <span aria-hidden="true">→</span></a>';
    } else { $('norms-link').remove(); }
  }

  /* ---- Working with us ---- */
  var J = S.join || {};
  set('join-status', J.status);
  set('join-body', J.body);
  if ($('routes')) {
    $('routes').innerHTML = (J.routes || []).map(function (r) {
      return '<li class="route"><h2>' + esc(r.who) + '</h2><p>' + esc(r.text) + '</p></li>';
    }).join('');
  }
  set('join-footnote', J.footnote);
  if (email && $('join-email')) $('join-email').href = 'mailto:' + email;

  /* ---- Publications ---- */
  var list = $('papers-list');
  if (list) {
    var FIRST = 10;
    var papers = S.recent_papers || [];
    var filter = 'all';
    var expanded = false;
    list.innerHTML = papers.map(function (p) {
      return '<li data-theme="' + esc(p.theme) + '">' +
        '<a class="paper__t" href="' + esc(p.url) + '"' + ext(p.url) + '>' + esc(p.title) + '</a>' +
        '<p class="paper__a">' + esc(p.authors) + '</p>' +
        '<p class="paper__m"><span>' + esc(String(p.venue).replace(/\s*\(preprint\)\s*$/i, '')) + ', ' + esc(p.year) + '</span>' +
        (p.preprint ? '<span class="tag tag--pre">Preprint</span>' : '') +
        (THEME_LABEL[p.theme] ? '<span class="tag">' + esc(THEME_LABEL[p.theme]) + '</span>' : '') + '</p></li>';
    }).join('');
    var items = all('#papers-list > li');
    var more = $('papers-more');
    var count = $('papers-count');

    var used = {};
    papers.forEach(function (p) { used[p.theme] = true; });
    var opts = [['all', 'All']].concat((S.themes || []).filter(function (t) { return used[t.id]; })
      .map(function (t) { return [t.id, THEME_LABEL[t.id]]; }));
    $('filters').innerHTML = opts.map(function (o) {
      return '<button type="button" class="chip" data-f="' + esc(o[0]) + '" aria-pressed="' + (o[0] === 'all') + '">' + esc(o[1]) + '</button>';
    }).join('');

    var draw = function () {
      var match = items.filter(function (li) { return filter === 'all' || li.getAttribute('data-theme') === filter; });
      var limit = filter === 'all' && !expanded ? FIRST : Infinity;
      items.forEach(function (li) { li.hidden = true; });
      match.forEach(function (li, i) { li.hidden = i >= limit; });
      var extra = match.length - FIRST;
      more.hidden = !(filter === 'all' && extra > 0);
      more.setAttribute('aria-expanded', String(expanded));
      more.textContent = expanded ? 'Show fewer' : 'Show ' + extra + ' more';
      count.textContent = filter === 'all'
        ? (expanded ? 'All ' + match.length + ' recent papers' : 'The ' + Math.min(FIRST, match.length) + ' most recent of ' + match.length)
        : match.length + ' recent paper' + (match.length === 1 ? '' : 's') + ' in ' + THEME_LABEL[filter];
    };
    $('filters').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      filter = b.getAttribute('data-f');
      all('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      draw();
    });
    more.addEventListener('click', function () {
      expanded = !expanded;
      draw();
      if (!expanded) $('papers').scrollIntoView();
    });
    draw();
    set('papers-note', S.publications_note);
    if ((S.links || {}).scholar) {
      $('papers-scholar').innerHTML = '<a class="more-link" href="' + esc(S.links.scholar) + '"' + ext(S.links.scholar) +
        '>The complete list on Google Scholar <span aria-hidden="true">→</span></a>';
    }
  }

  /* ---- Footer ---- */
  var L = S.links || {};
  if (email && $('foot-email')) $('foot-email').innerHTML = '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a>';
  set('foot-address', S.address);
  if ($('foot-links')) {
    $('foot-links').innerHTML = [
      ['GitHub', L.github], ['Google Scholar', L.scholar],
      ['Jameel Institute RISE', L.rise], ['Crisis Vaccination Planner', L.planner]
    ].filter(function (x) { return x[1]; }).map(function (x) {
      return '<li><a href="' + esc(x[1]) + '"' + ext(x[1]) + '>' + esc(x[0]) + '</a></li>';
    }).join('');
  }
  set('foot-funders', (S.funders || []).join(', ') + '.');
  set('foot-partners', (S.partners || []).join('; ') + '.');
})();
