/* Field notebook: renders everything that changes from window.SITE (data/site-data.js).
   One script for all six pages; each block runs only if its container is on the page.
   A scheduled job only needs to edit the data file. */
(function () {
  'use strict';
  var S = window.SITE;
  if (!S) return;

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(href, text, cls) {
    var a = el('a', cls, text);
    a.href = href;
    if (/^https?:/.test(href)) a.rel = 'noopener';
    return a;
  }
  function row(marginNode, contentNode) {
    var r = el('div', 'row'), m = el('div', 'm'), c = el('div', 'c');
    if (marginNode) m.appendChild(marginNode);
    if (contentNode) c.appendChild(contentNode);
    r.appendChild(m); r.appendChild(c);
    return r;
  }
  function time(iso) {
    var t = el('time', 'date', iso);
    t.setAttribute('datetime', iso);
    return t;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ------------------------------------------------------------------
     Sketching: a small seeded "unsteady hand". No data, only shapes.
     ------------------------------------------------------------------ */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function Pen(seed) {
    var r = rng(seed), out = [], clipN = 0, uid = 'sk' + seed;
    function j(a) { return (r() - 0.5) * 2 * a; }
    function f(n) { return Math.round(n * 10) / 10; }
    // Walk a polyline with a slightly unsteady hand and return a smooth path.
    function wobble(pts, amp, step) {
      amp = amp == null ? 0.7 : amp; step = step || 13;
      var d = [], i, k;
      for (i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        var n = Math.max(1, Math.round(len / step));
        for (k = 0; k < n; k++) {
          var t = k / n;
          d.push([a[0] + (b[0] - a[0]) * t + j(amp), a[1] + (b[1] - a[1]) * t + j(amp)]);
        }
      }
      var last = pts[pts.length - 1];
      d.push([last[0] + j(amp), last[1] + j(amp)]);
      if (d.length < 3) return 'M' + f(d[0][0]) + ' ' + f(d[0][1]) + 'L' + f(d[1][0]) + ' ' + f(d[1][1]);
      var s = 'M' + f(d[0][0]) + ' ' + f(d[0][1]);
      for (i = 1; i < d.length - 1; i++) {
        var mx = (d[i][0] + d[i + 1][0]) / 2, my = (d[i][1] + d[i + 1][1]) / 2;
        s += 'Q' + f(d[i][0]) + ' ' + f(d[i][1]) + ' ' + f(mx) + ' ' + f(my);
      }
      return s + 'L' + f(d[d.length - 1][0]) + ' ' + f(d[d.length - 1][1]);
    }
    var pen = {
      r: r, j: j,
      path: function (pts, cls, amp, step) { out.push('<path class="' + cls + '" d="' + wobble(pts, amp, step) + '"/>'); },
      line: function (x1, y1, x2, y2, cls, amp) { pen.path([[x1, y1], [x2, y2]], cls, amp); },
      // a circle drawn in one go, not quite closing where it started
      ring: function (cx, cy, rad, cls, amp) {
        var pts = [], n = Math.max(7, Math.round(rad * 1.6)), start = r() * 6.28, i;
        for (i = 0; i <= n + 1; i++) {
          var a = start + (i / n) * 6.283, rr = rad + (i > n ? 0.7 : 0);
          pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
        }
        pen.path(pts, cls, amp == null ? 0.25 : amp, 99);
      },
      // a straight-edged shape: each edge is its own stroke, so corners stay corners
      poly: function (pts, cls, amp) {
        pts.forEach(function (a, i) {
          var b = pts[(i + 1) % pts.length], ox = (b[0] - a[0]) * 0.04, oy = (b[1] - a[1]) * 0.04;
          pen.path([[a[0] - ox, a[1] - oy], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [b[0] + ox, b[1] + oy]], cls, amp == null ? 0.4 : amp, 99);
        });
      },
      dot: function (cx, cy, rad) { out.push('<circle class="pf" cx="' + f(cx + j(0.3)) + '" cy="' + f(cy + j(0.3)) + '" r="' + rad + '"/>'); },
      axes: function () {
        pen.path([[20, 10], [20, 131]], 'p', 0.5);
        pen.path([[16, 128], [232, 128]], 'p', 0.5);
      },
      // pencil hatching inside a polygon
      hatch: function (poly, gap, cls, slope) {
        var id = uid + 'c' + (clipN++), xs = poly.map(function (p) { return p[0]; }), ys = poly.map(function (p) { return p[1]; });
        var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
        var h = y1 - y0, run = h * (slope == null ? 0.7 : slope), g = '', x;
        for (x = x0 - Math.abs(run) + gap * r(); x < x1 + Math.abs(run); x += gap * (0.8 + r() * 0.4)) {
          g += '<path class="' + cls + '" d="' + wobble([[x + run, y0 - 1], [x, y1 + 1]], 0.5, 16) + '"/>';
        }
        out.push('<clipPath id="' + id + '"><path d="M' + poly.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z"/></clipPath><g clip-path="url(#' + id + ')">' + g + '</g>');
      },
      svg: function (label) {
        return '<svg class="sk" viewBox="0 0 240 142" role="img" aria-label="' + label + '">' + out.join('') + '</svg>';
      }
    };
    return pen;
  }
  function sample(fn, x0, x1, step) {
    var pts = [], x;
    for (x = x0; x <= x1 + 0.01; x += step) pts.push([x, fn(x)]);
    return pts;
  }

  var SKETCH = {
    // few solid points, many hollow ones, a rough fitted curve with honest error bars
    crises: function () {
      var p = Pen(11);
      p.axes();
      var fn = function (x) { return 112 - 74 * Math.exp(-Math.pow((x - 128) / 52, 2)) - (x - 30) * 0.05; };
      var x, i = 0;
      for (x = 34; x <= 222; x += 12.5, i++) {
        var y = fn(x) + p.j(9);
        if (i % 4 === 1) p.dot(x, Math.min(123, y + 16 + p.r() * 8), 2.3);
        else p.ring(x + p.j(2), y, 2.6, 'p');
      }
      [50, 88, 126, 166, 206].forEach(function (bx, k) {
        var by = fn(bx), h = [9, 15, 19, 14, 10][k] + p.r() * 3;
        p.line(bx, by - h, bx, by + h, 'p', 0.3);
        p.line(bx - 3.2, by - h, bx + 3.2, by - h, 'p', 0.2);
        p.line(bx - 3.2, by + h, bx + 3.2, by + h, 'p', 0.2);
      });
      p.path(sample(fn, 28, 226, 11), 'i', 0.9, 99);
      return p.svg('Sketch: a few solid points, many hollow ones, and a rough fitted curve with error bars.');
    },
    // a patch of hexagons, shading outward from where it started
    malaria: function () {
      var p = Pen(23), R = 15.5, w = R * Math.sqrt(3), cells = [], q, rr;
      for (rr = 0; rr < 5; rr++) for (q = 0; q < 8; q++) {
        var cx = 28 + q * w + (rr % 2 ? w / 2 : 0), cy = 24 + rr * R * 1.5;
        if (cx > 226) continue;
        if ((rr === 0 && (q < 1 || q > 5)) || (rr === 4 && (q < 2 || q > 6)) || (rr === 3 && q === 0) || (rr === 1 && q === 7)) continue;
        cells.push([cx, cy]);
      }
      var origin = [28 + 2 * w + w / 2, 24 + R * 1.5];
      cells.forEach(function (c) {
        var poly = [], k;
        for (k = 0; k < 6; k++) { var a = Math.PI / 180 * (60 * k - 30); poly.push([c[0] + (R - 1.1) * Math.cos(a), c[1] + (R - 1.1) * Math.sin(a)]); }
        var d = Math.hypot(c[0] - origin[0], c[1] - origin[1]) / w + p.j(0.38) - (c[0] > origin[0] ? 0.35 : 0);
        if (d < 0.6) p.hatch(poly, 3, 'il');
        else if (d < 1.55) p.hatch(poly, 4.6, 'il');
        else if (d < 2.45) p.hatch(poly, 7.5, 'pl');
        p.poly(poly, d < 1.55 ? 'i' : 'p', 0.4);
      });
      return p.svg('Sketch: a patch of hexagons, shaded most densely at one cell and fading outward.');
    },
    // two curves from the same start; one bends down after a marked moment
    vaccines: function () {
      var p = Pen(37), x0 = 96;
      p.axes();
      var up = function (x) { return 118 - 98 / (1 + Math.exp(-(x - 138) / 26)); };
      var bend = function (x) { return x <= x0 ? up(x) : up(x0) - (up(x0) - up(x)) * Math.exp(-Math.pow((x - x0) / 34, 1.5)) + Math.pow((x - x0) / 126, 1.6) * 21; };
      var a = sample(up, x0, 224, 8), b = sample(bend, x0, 224, 8);
      p.hatch(a.concat(b.slice().reverse()), 6.5, 'pl', 0.55);
      p.path([[x0, 16], [x0, 127]], 'p dash', 0.3);
      p.path(sample(up, 26, 224, 11), 'p', 0.8, 99);
      p.path(sample(bend, x0, 224, 11), 'i', 0.8, 99);
      p.path([[x0 - 4.5, 14], [x0, 20], [x0 + 4.5, 14]], 'p', 0.2, 99);
      return p.svg('Sketch: two curves from the same start. One keeps rising; the other bends down after a marked moment.');
    },
    // a forecast fan crossing a threshold, with the crossing circled
    decisions: function () {
      var p = Pen(53), xs = 104, ys = 96, th = 46;
      p.axes();
      var past = [], x;
      for (x = 26; x < xs; x += 9) past.push([x, 116 - (x - 26) * 0.2 + p.j(4.5)]);
      past.push([xs, ys]);
      var mid = function (x) { return ys - (x - xs) * 0.36; };
      var hi = function (x) { return mid(x) - Math.pow(x - xs, 1.12) * 0.31; };
      var lo = function (x) { return mid(x) + Math.pow(x - xs, 1.05) * 0.36; };
      p.hatch(sample(hi, xs, 226, 10).concat(sample(lo, xs, 226, 10).reverse()), 7, 'pl', -0.5);
      p.path([[22, th], [232, th]], 'p dash', 0.3);
      p.path(past, 'p', 0.3, 99);
      p.path(sample(hi, xs, 226, 12), 'p', 0.6, 99);
      p.path(sample(lo, xs, 226, 12), 'p', 0.6, 99);
      p.path(sample(mid, xs, 226, 12), 'i', 0.7, 99);
      var cx = xs; while (hi(cx) > th && cx < 226) cx += 0.5;
      p.ring(cx, th, 7.5, 'i', 0.5);
      return p.svg('Sketch: a forecast fan widening to the right. Where it first crosses a dashed threshold line, the point is circled.');
    },
    // a jagged slow line with quick smooth ones laid over it
    methods: function () {
      var p = Pen(71);
      p.axes();
      var fn = function (x) { return 86 - 44 * Math.exp(-Math.pow((x - 78) / 26, 2)) - 26 * Math.exp(-Math.pow((x - 168) / 30, 2)) + (x - 26) * 0.07; };
      var jag = [], x;
      for (x = 26; x <= 226; x += 4.6) jag.push([x, fn(x) + p.j(7.5)]);
      p.path(jag, 'p', 0.2, 99);
      p.path(sample(function (x) { return fn(x) + 5 + Math.sin(x / 31) * 2.5; }, 26, 226, 12), 'il', 0.5, 99);
      p.path(sample(function (x) { return fn(x) - 4 + Math.cos(x / 27) * 2.5; }, 26, 226, 12), 'il', 0.5, 99);
      p.path(sample(fn, 26, 226, 11), 'i', 0.6, 99);
      return p.svg('Sketch: a jagged pencil line with smooth ink lines laid over the same shape.');
    }
  };

  /* ------------------------------------------------------------------ */


  // Every block below renders only if its container exists on the current page.
  var L = S.links || {};
  var byDate = function (a, b) { return a.date < b.date ? 1 : -1; };
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

  // a hand-drawn ring around one phrase
  function circled(text) {
    var s = el('span', 'circled', text);
    s.insertAdjacentHTML('beforeend', '<svg class="mark circle" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M14 9.5 C 38 1.8, 88 1.2, 108 9.8 C 121 16.2, 118 29.5, 98 34.6 C 70 40.2, 30 39.6, 11 31.8 C -2.5 25.4, 1.2 11.8, 22 6.4 C 30 4.4, 37 3.8, 44 3.9"/></svg>');
    return s;
  }
  function sketchFor(id) {
    if (!SKETCH[id]) return null;
    var fig = el('div', 'sketch');
    fig.innerHTML = SKETCH[id]();
    return fig;
  }
  function areaUrl(id) { return 'research.html#' + id; }

  /* ---------- home ---------- */

  // "Last entry": the newest date in news and papers
  (function () {
    var box = $('last-entry');
    if (!box) return;
    var dates = [].concat((S.news || []).map(function (n) { return n.date; }), (S.recent_papers || []).map(function (p) { return p.date; })).filter(Boolean).sort();
    var last = dates[dates.length - 1];
    if (!last) return;
    var t = box.querySelector('time');
    t.textContent = last; t.setAttribute('datetime', last);
    box.hidden = false;
  })();

  // one-liner, with the word "decisions" ringed in pen
  if ($('one-liner') && S.one_liner) {
    var ol = clear($('one-liner')), key = 'decisions', at = S.one_liner.indexOf(key);
    if (at < 0) ol.textContent = S.one_liner;
    else {
      ol.appendChild(document.createTextNode(S.one_liner.slice(0, at)));
      ol.appendChild(circled(key));
      ol.appendChild(document.createTextNode(S.one_liner.slice(at + key.length)));
    }
  }

  if ($('intro')) (S.intro || []).forEach(function (t) { $('intro').appendChild(el('p', null, t)); });

  if ($('partners-note') && S.partners && S.partners.length) {
    $('partners-note').querySelector('.note-text').textContent = S.partners.join(', ') + '.';
    $('partners-note').hidden = false;
  }

  // where we sit, and the shared groups (home and footer)
  function belongsList(cls) {
    var ul = el('ul', cls);
    (S.belongs_to || []).forEach(function (g) {
      var li = el('li');
      li.appendChild(g.url ? link(g.url, g.name) : el('span', null, g.name));
      ul.appendChild(li);
    });
    return ul;
  }
  if ($('where')) $('where').textContent = S.where || '';
  if ($('belongs')) $('belongs').appendChild(belongsList('belongs'));

  // research teasers
  if ($('teasers')) (S.themes || []).forEach(function (t, i) {
    var li = el('li', 'teaser');
    var a = link(areaUrl(t.id), '');
    var fig = sketchFor(t.id);
    if (fig) { fig.querySelector('svg').setAttribute('aria-hidden', 'true'); fig.querySelector('svg').removeAttribute('role'); a.appendChild(fig); }
    var txt = el('span', 'tx');
    txt.appendChild(el('span', 'lab', pad(i + 1)));
    txt.appendChild(el('span', 'tt', t.title));
    if (t.short) txt.appendChild(el('span', 'sh', t.short));
    a.appendChild(txt);
    li.appendChild(a);
    $('teasers').appendChild(li);
  });

  // news: newest four, as a dated log
  if ($('news-log')) (S.news || []).slice().sort(byDate).slice(0, 4).forEach(function (n) {
    var p = el('p', null, n.text);
    if (n.url) { p.appendChild(document.createTextNode(' ')); p.appendChild(link(n.url, /doi\.org/.test(n.url) ? 'Paper' : 'Link', 'tag')); }
    $('news-log').appendChild(row(time(n.date), p));
  });

  if ($('join-line') && S.join && S.join.status) {
    var st = S.join.status, cut = st.indexOf('. ');
    $('join-line').textContent = cut > 0 ? st.slice(0, cut + 1) : st;
  }

  /* ---------- research ---------- */

  // margin contents for the page
  if ($('toc')) (S.themes || []).forEach(function (t) {
    var li = el('li'); li.appendChild(link('#' + t.id, t.title)); $('toc').appendChild(li);
  });

  if ($('themes')) (S.themes || []).forEach(function (t, i) {
    var art = el('article', 'theme');
    art.id = t.id;
    art.setAttribute('aria-labelledby', 'h-' + t.id);
    var head = el('div');
    var h = el('h2', null, t.title); h.id = 'h-' + t.id;
    head.appendChild(h);
    if (t.short) head.appendChild(el('p', 'short', t.short));
    art.appendChild(row(el('p', 'lab num', 'Area ' + (i + 1)), head));

    var body = el('div');
    var prose = el('div', 'prose');
    (t.body || []).forEach(function (b) { prose.appendChild(el('p', null, b)); });
    body.appendChild(prose);
    if (t.now) {
      var now = el('p', 'now');
      now.appendChild(el('span', 'now-lab', 'Now:'));
      now.appendChild(document.createTextNode(' ' + t.now));
      body.appendChild(now);
    }
    if (t.papers && t.papers.length) {
      var wrap = el('div', 'reflist');
      wrap.appendChild(el('h3', 'lab reflist-h', 'Selected papers'));
      var ul = el('ul');
      t.papers.forEach(function (p) {
        var li = el('li');
        li.appendChild(link(p.url, p.title));
        li.appendChild(document.createTextNode('. '));
        li.appendChild(el('span', 'venue', p.venue));
        li.appendChild(el('span', 'dim', ', ' + p.year + '.'));
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
      body.appendChild(wrap);
    }
    art.appendChild(row(sketchFor(t.id), body));
    $('themes').appendChild(art);
  });

  /* ---------- people ---------- */

  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 3).toUpperCase();
  }
  if ($('people-grid')) (S.people || []).forEach(function (p) {
    var li = el('li', 'person');
    var ph = el('div', 'ph');
    if (p.photo) {
      var img = el('img');
      img.src = 'img/people/' + p.photo; img.alt = 'Portrait of ' + p.name;
      img.width = 480; img.height = 480; img.loading = 'lazy'; img.decoding = 'async';
      ph.appendChild(img);
    } else {
      var tile = el('div', 'init', initials(p.name));
      tile.setAttribute('aria-hidden', 'true');
      ph.appendChild(tile);
    }
    li.appendChild(ph);
    var cap = el('p', 'cap');
    var nm = el('span', 'nm');
    if (p.link) nm.appendChild(link(p.link, p.name)); else nm.textContent = p.name;
    cap.appendChild(nm);
    cap.appendChild(el('span', 'rl', p.role));
    li.appendChild(cap);
    if (p.topic) li.appendChild(el('p', 'topic', p.topic));
    $('people-grid').appendChild(li);
  });
  if ($('alumni') && S.alumni && S.alumni.length) {
    S.alumni.forEach(function (a) {
      var li = el('li');
      li.appendChild(el('span', 'nm', a.name));
      li.appendChild(el('span', 'dim', ', ' + a.was + '. Now at ' + a.now + '.'));
      $('alumni').appendChild(li);
    });
    $('alumni-row').hidden = false;
  }
  if ($('masters') && S.masters_alumni && S.masters_alumni.length) {
    $('masters').textContent = S.masters_alumni.join(', ') + '.';
    $('masters-row').hidden = false;
  }

  /* ---------- publications: theme filter, ten then all ---------- */

  if ($('papers-log')) (function () {
    var FIRST = 10, papers = S.recent_papers || [], themes = S.themes || [], title = {}, rows = [];
    themes.forEach(function (t) { title[t.id] = t.title; });
    if ($('papers-note')) $('papers-note').textContent = S.publications_note || '';
    if ($('scholar-link') && L.scholar) { $('scholar-link').href = L.scholar; $('scholar-link').parentNode.hidden = false; }

    papers.forEach(function (p) {
      var ref = el('p', 'ref');
      ref.appendChild(link(p.url, p.title, 't'));
      ref.appendChild(el('span', 'au', p.authors));
      var ve = el('span', 've');
      ve.appendChild(el('span', 'venue', p.venue));
      ve.appendChild(document.createTextNode(', ' + p.year + '. '));
      if (title[p.theme]) ve.appendChild(link(areaUrl(p.theme), title[p.theme], 'tag'));
      ref.appendChild(ve);
      var r = row(time(p.date || String(p.year)), ref);
      r.dataset.theme = p.theme || '';
      rows.push(r);
      $('papers-log').appendChild(r);
    });

    var current = 'all', open = false, btn = $('papers-toggle'), count = $('papers-count');
    function apply() {
      var shown = 0, matching = 0;
      rows.forEach(function (r) {
        var match = current === 'all' || r.dataset.theme === current;
        if (match) matching++;
        var show = match && (current !== 'all' || open || matching <= FIRST);
        r.hidden = !show;
        if (show) shown++;
      });
      if (count) count.textContent = shown + ' of ' + (current === 'all' ? papers.length : matching) + ' shown';
      if (btn) {
        btn.hidden = !(current === 'all' && papers.length > FIRST);
        btn.textContent = open ? 'Show fewer' : 'Show all ' + papers.length;
        btn.setAttribute('aria-expanded', String(open));
      }
    }
    if (btn) btn.addEventListener('click', function () { open = !open; apply(); });

    var bar = $('papers-filter');
    if (bar) {
      var opts = [['all', 'All areas']].concat(themes.map(function (t) { return [t.id, t.title]; }));
      opts.forEach(function (o) {
        if (o[0] !== 'all' && !papers.some(function (p) { return p.theme === o[0]; })) return;
        var b = el('button', 'chip', o[1]);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(o[0] === current));
        b.addEventListener('click', function () {
          current = o[0];
          [].forEach.call(bar.querySelectorAll('.chip'), function (c) { c.setAttribute('aria-pressed', String(c === b)); });
          apply();
        });
        bar.appendChild(b);
      });
      bar.parentNode.parentNode.hidden = false;
    }
    apply();
  })();

  /* ---------- working with us ---------- */

  var J = S.join || {};
  if ($('join-status')) {
    var s = J.status || '', cut = s.indexOf('. ');
    var first = cut > 0 ? s.slice(0, cut + 1) : s, rest = cut > 0 ? s.slice(cut + 1) : '';
    $('join-status').appendChild(el('span', 'hl', first));
    if (rest) $('join-status').appendChild(document.createTextNode(rest));
  }
  if ($('join-body')) $('join-body').textContent = J.body || '';
  if ($('join-routes')) (J.routes || []).forEach(function (r) {
    var d = el('div');
    d.appendChild(el('dt', null, r.who));
    d.appendChild(el('dd', null, r.text));
    $('join-routes').appendChild(d);
  });
  if ($('join-footnote')) $('join-footnote').textContent = J.footnote || '';
  if ($('join-email') && L.email) { $('join-email').textContent = L.email; $('join-email').href = 'mailto:' + L.email; }

  /* ---------- how we work ---------- */

  var N = S.norms || {};
  if ($('norms-intro')) $('norms-intro').textContent = N.intro || '';
  if ($('quotes')) (N.quotes || []).forEach(function (q) {
    var b = el('blockquote');
    b.innerHTML = '<svg class="mark bracket" viewBox="0 0 12 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M10.5 1.5 C 5.2 2.2, 3.4 3.6, 3.9 8.5 C 4.6 34, 2.6 63, 3.6 91.5 C 3.5 96.4, 5.6 97.9, 10.8 98.6"/></svg>';
    b.appendChild(el('p', null, q));
    $('quotes').appendChild(b);
  });
  if ($('principles')) (N.principles || []).forEach(function (p, i) {
    var li = el('li');
    li.appendChild(el('span', 'n', pad(i + 1)));
    var d = el('div');
    d.appendChild(el('strong', null, p.t));
    d.appendChild(el('span', 'd', p.d));
    li.appendChild(d);
    $('principles').appendChild(li);
  });
  if ($('norms-link')) {
    var nl = $('norms-link');
    nl.textContent = N.link_text || '';
    nl.href = N.link || '#';
    if (!N.link_text) nl.parentNode.hidden = true;
  }

  /* ---------- footer, on every page ---------- */

  if ($('foot-links')) [[L.email && 'mailto:' + L.email, L.email], [L.github, 'GitHub'], [L.scholar, 'Google Scholar']].forEach(function (x) {
    if (!x[0]) return;
    var li = el('li'); li.appendChild(link(x[0], x[1])); $('foot-links').appendChild(li);
  });
  if ($('foot-address')) $('foot-address').textContent = S.address || '';
  if ($('foot-where')) $('foot-where').textContent = S.where || '';
  if ($('foot-belongs')) $('foot-belongs').appendChild(belongsList('belongs small'));
  if ($('foot-funders')) $('foot-funders').textContent = (S.funders || []).join(', ') + '.';

  // keep the anchor in view once sketches have been drawn in
  if (location.hash && $('themes')) {
    var target = document.getElementById(location.hash.slice(1));
    var jump = function () { target.scrollIntoView({ behavior: 'instant', block: 'start' }); };
    if (target) {
      jump();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(jump);
    }
  }
})();
