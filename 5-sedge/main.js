/* SEDGE. Renders everything that changes from window.SITE (data/site-data.js).
   A scheduled job only needs to edit that data file. */
(function () {
  'use strict';
  var S = window.SITE;
  if (!S) return;

  var $ = function (id) { return document.getElementById(id); };
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

  /* ---- 1. Intro (short version: first and last paragraphs; the middle one opens the research section) ---- */
  var intro = S.intro || [];
  var short = intro.length > 2 ? [intro[0], intro[intro.length - 1]] : intro;
  $('intro').innerHTML = short.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  if (intro.length > 2) $('research-lead').textContent = intro[1];

  /* ---- 2. People ---- */
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
  var firstSentence = function (t) {
    var m = /^.*?[.!?](?=\s|$)/.exec(t || '');
    return m ? m[0] : (t || '');
  };
  var tileCount = 0;
  $('people-grid').innerHTML = (S.people || []).map(function (p) {
    var pic;
    if (p.photo) {
      pic = '<div class="person__pic"><img src="img/people/' + esc(p.photo) + '" alt="Portrait of ' + esc(p.name) +
        '" width="480" height="480" loading="lazy" decoding="async"></div>';
    } else {
      var t = TINTS[tileCount % TINTS.length];
      var sprig = SPRIGS[tileCount % SPRIGS.length];
      var flip = tileCount % 2 ? ' tile--flip' : '';
      tileCount++;
      pic = '<div class="person__pic person__pic--tile"><div class="tile' + flip + '" style="--t-bg:' + t[0] + ';--t-fg:' + t[1] + '">' +
        '<svg class="tile__sprig" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="' + sprig +
        '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        '<span class="tile__init" aria-hidden="true">' + esc(initials(p.name)) + '</span></div></div>';
    }
    var name = p.link
      ? '<a href="' + esc(p.link) + '"' + ext(p.link) + '>' + esc(p.name) + '</a>'
      : esc(p.name);
    /* Everyone gets a card of the same size, so a long entry is cut to its first sentence. */
    var topic = (p.topic || '').length > 90 ? firstSentence(p.topic) : p.topic;
    return '<li class="person">' + pic +
      '<h3 class="person__name">' + name + '</h3>' +
      '<p class="person__role">' + esc(p.role) + '</p>' +
      '<p class="person__topic">' + esc(topic) + '</p></li>';
  }).join('');

  var slug = function (n) { return String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  if ((S.alumni || []).length) {
    $('alumni-line').innerHTML = '<span class="k">Alumni</span>' + S.alumni.map(function (a) {
      return '<span class="alum"><img src="img/people/' + slug(a.name) + '.jpg" alt="" width="40" height="40" loading="lazy" onerror="this.remove()">' +
        '<span><strong>' + esc(a.name) + '</strong>, ' + esc(a.was) + (a.now ? ', now at ' + esc(a.now) : '') + '</span></span>';
    }).join(' ');
  } else { $('alumni-line').remove(); }
  if ((S.masters_alumni || []).length) {
    $('masters-line').innerHTML = '<span class="k">With thanks to our Masters students</span>' +
      esc(joinNames(S.masters_alumni)) + '.';
  } else { $('masters-line').remove(); }

  /* ---- 3. How we work ---- */
  var N = S.norms || {};
  $('norms-intro').textContent = N.intro || '';
  $('principles').innerHTML = (N.principles || []).map(function (p, i) {
    return '<li class="principle"><span class="principle__n" aria-hidden="true">' + (i + 1) + '</span>' +
      '<h3>' + esc(p.t) + '</h3><p>' + esc(p.d) + '</p></li>';
  }).join('');
  /* Three of the quotes, set large. Indices into norms.quotes. */
  var PICK = [0, 1, 5];
  var qs = (N.quotes || []);
  $('quotes').innerHTML = PICK.filter(function (i) { return qs[i]; }).map(function (i, n) {
    return '<blockquote class="quote' + (n === 0 ? ' quote--lead' : '') + '"><p>“' + esc(qs[i]) + '”</p>' +
      (n === 0 ? '<footer>From the group norms</footer>' : '') + '</blockquote>';
  }).join('');
  if (N.link_text) {
    var href = N.link && N.link !== '#' ? N.link : '#how';
    $('norms-link').innerHTML = '<a href="' + esc(href) + '"' + ext(href) + '>' + esc(N.link_text) + ' <span aria-hidden="true">→</span></a>';
  }

  /* ---- 4. Research areas (accordion) ---- */
  var THEME_LABEL = {};
  var SHORT_LABEL = { crises: 'Crises', malaria: 'Malaria', vaccines: 'Vaccines', decisions: 'Decisions', methods: 'Methods' };
  $('themes').innerHTML = (S.themes || []).map(function (t) {
    THEME_LABEL[t.id] = SHORT_LABEL[t.id] || t.title;
    return '<details class="theme" id="theme-' + esc(t.id) + '">' +
      '<summary><span class="theme__head"><span class="theme__title">' + esc(t.title) + '</span>' +
      '<span class="theme__short">' + esc(t.short) + '</span></span>' +
      '<span class="theme__plus" aria-hidden="true"></span></summary>' +
      '<div class="theme__body"><div class="theme__text">' +
      (t.body || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      (t.now ? '<p class="theme__now"><b>Right now</b>' + esc(t.now) + '</p>' : '') +
      '</div><div class="theme__papers"><h4>Selected papers</h4><ul>' +
      (t.papers || []).map(function (p) {
        return '<li><a href="' + esc(p.url) + '"' + ext(p.url) + '><span class="t">' + esc(p.title) + '</span>' +
          '<span class="v">' + esc(p.venue) + ', ' + esc(p.year) + '</span></a></li>';
      }).join('') + '</ul></div></div></details>';
  }).join('');
  var themeEls = Array.prototype.slice.call(document.querySelectorAll('.theme'));
  /* One open by default on wide screens; all closed, and clearly tappable, on phones. */
  if (themeEls[0] && window.matchMedia('(min-width: 940px)').matches) themeEls[0].open = true;

  /* ---- 5. Working with us ---- */
  var J = S.join || {};
  $('join-status').textContent = J.status || '';
  $('join-body').textContent = J.body || '';
  $('routes').innerHTML = (J.routes || []).map(function (r) {
    return '<li class="route"><h3>' + esc(r.who) + '</h3><p>' + esc(r.text) + '</p></li>';
  }).join('');
  $('join-footnote').textContent = J.footnote || '';
  var email = (S.links || {}).email;
  if (email) $('join-email').href = 'mailto:' + email;

  /* ---- 6. News ---- */
  $('news-list').innerHTML = (S.news || []).slice(0, 4).map(function (n) {
    return '<li><time datetime="' + esc(n.date) + '">' + esc(niceDate(n.date)) + '</time>' + esc(n.text) +
      (n.url ? ' <a href="' + esc(n.url) + '"' + ext(n.url) + ' aria-label="Read more: ' + esc(n.text) + '">Read more <span aria-hidden="true">→</span></a>' : '') + '</li>';
  }).join('');

  /* ---- 7. Recent papers ---- */
  var FIRST = 8;
  var papers = S.recent_papers || [];
  var list = $('papers-list');
  list.innerHTML = papers.map(function (p, i) {
    return '<li' + (i >= FIRST ? ' hidden data-extra' : '') + '>' +
      '<a class="paper__t" href="' + esc(p.url) + '"' + ext(p.url) + '>' + esc(p.title) + '</a>' +
      '<p class="paper__a">' + esc(p.authors) + '</p>' +
      '<p class="paper__m"><span>' + esc(String(p.venue).replace(/\s*\(preprint\)\s*$/i, '')) + ', ' + esc(p.year) + '</span>' +
      (p.preprint ? '<span class="tag tag--pre">Preprint</span>' : '') +
      (THEME_LABEL[p.theme] ? '<span class="tag">' + esc(THEME_LABEL[p.theme]) + '</span>' : '') + '</p></li>';
  }).join('');
  var more = $('papers-more');
  var extra = papers.length - FIRST;
  if (extra > 0) {
    more.hidden = false;
    more.textContent = 'Show ' + extra + ' more';
    more.addEventListener('click', function () {
      var open = more.getAttribute('aria-expanded') === 'true';
      Array.prototype.forEach.call(list.querySelectorAll('[data-extra]'), function (li) { li.hidden = open; });
      more.setAttribute('aria-expanded', String(!open));
      more.textContent = open ? 'Show ' + extra + ' more' : 'Show fewer';
      if (open) $('papers').scrollIntoView();
    });
  }
  $('papers-note').textContent = S.publications_note || '';

  /* ---- 8. Footer ---- */
  var L = S.links || {};
  $('foot-affil').textContent = S.affiliation_line || '';
  if (email) $('foot-email').innerHTML = '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a>';
  $('foot-address').textContent = S.address || '';
  $('foot-links').innerHTML = [
    ['GitHub', L.github], ['Google Scholar', L.scholar],
    ['Jameel Institute RISE', L.rise], ['Crisis Vaccination Planner', L.planner]
  ].filter(function (x) { return x[1]; }).map(function (x) {
    return '<li><a href="' + esc(x[1]) + '"' + ext(x[1]) + '>' + esc(x[0]) + '</a></li>';
  }).join('');
  $('foot-funders').textContent = (S.funders || []).join(', ') + '.';
  $('foot-partners').textContent = (S.partners || []).join('; ') + '.';

  /* ---- Nav: mark the section in view ---- */
  if ('IntersectionObserver' in window) {
    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
        var a = links[e.target.id];
        if (a) {
          a.setAttribute('aria-current', 'true');
          var ul = a.closest('ul');
          if (ul && ul.scrollWidth > ul.clientWidth) {
            ul.scrollLeft = Math.max(0, a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2);
          }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (k) { var el = $(k); if (el) io.observe(el); });
  }
})();
