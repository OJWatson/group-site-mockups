/* Living figures: six small looping canvas illustrations that share one palette and line style.
   They are illustrations, not data. Everything is generated from a seeded random number
   generator, so the pictures are the same on every load.
   Usage: <canvas data-figure="crises"></canvas>, then Figures.mount(canvas). */
(function () {
  'use strict';

  /* ---------- small maths ---------- */
  function rng(seed) { // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.28318 * r()); }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function ease(x) { return x * x * (3 - 2 * x); }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function frac(x) { return x - Math.floor(x); }
  var TAU = Math.PI * 2;

  /* ---------- shared palette, read from CSS so the dark theme follows ---------- */
  var pal = { ink: '#1b2430', warm: '#c8553d', cool: '#2f7f86', paper: '#f6f4ee' };
  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    ['ink', 'warm', 'cool', 'paper'].forEach(function (k) {
      var v = cs.getPropertyValue('--fig-' + k).trim();
      if (v) pal[k] = v;
    });
  }

  /* ---------- shared drawing helpers ---------- */
  // Plot box inside the canvas, in CSS pixels.
  function box(w, h) {
    var px = Math.max(14, w * 0.06);
    return { x0: px, x1: w - px, y0: h * 0.13, y1: h * 0.86, w: w - 2 * px, h: h * 0.73 };
  }
  function baseline(c, b) {
    c.globalAlpha = 0.3; c.strokeStyle = pal.ink; c.lineWidth = 1; c.setLineDash([]);
    c.beginPath(); c.moveTo(b.x0, b.y1 + 0.5); c.lineTo(b.x1, b.y1 + 0.5); c.stroke();
    c.globalAlpha = 1;
  }
  // Stroke a polyline of [x, y] points up to a fraction f of its length (by index).
  function trace(c, pts, f) {
    var n = pts.length - 1, e = clamp(f) * n, k = Math.floor(e), i;
    if (e <= 0) return null;
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i <= k; i++) c.lineTo(pts[i][0], pts[i][1]);
    var tip = pts[k];
    if (k < n) {
      var u = e - k;
      tip = [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u];
      c.lineTo(tip[0], tip[1]);
    }
    c.stroke();
    return tip;
  }
  function dot(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
  function style(c, col, lw, alpha, dash) {
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.globalAlpha = alpha;
    c.setLineDash(dash || []); c.lineJoin = 'round'; c.lineCap = 'round';
  }
  // Every figure fades its content in at the start of the loop and out at the end,
  // so the loop point is seamless.
  function envelope(p) { return ease(seg(p, 0, 0.035)) * (1 - ease(seg(p, 0.93, 1))); }

  var FIG = {};

  /* =====================================================================
     1. Crises: counting what goes uncounted.
     A dot is a death. Filled dots were reported, hollow dots were not.
     An estimate with an uncertainty band is then drawn over the stacks.
     ===================================================================== */
  FIG.crises = (function () {
    var r = rng(11), N = 20, bins = [], maxc = 0, i;
    function f(i) { // underlying mortality: a small early bump, then a crisis
      return 1.3 + 1.5 * Math.exp(-Math.pow((i - 3.6) / 2, 2)) + 5.6 * Math.exp(-Math.pow((i - 12.5) / 3.3, 2));
    }
    for (i = 0; i < N; i++) {
      var c = Math.max(1, Math.min(8, Math.round(f(i) + gauss(r) * 0.7)));
      // reporting gets worse as the crisis deepens
      var pr = 0.42 - 0.26 * Math.exp(-Math.pow((i - 12.5) / 4.2, 2)), rep = 0, j;
      for (j = 0; j < c; j++) if (r() < pr) rep++;
      if (i === 12 || i === 13) rep = Math.min(rep, 1);
      bins.push({ c: c, rep: rep });
      if (c > maxc) maxc = c;
    }
    return {
      dur: 9, still: 0.9,
      draw: function (c, w, h, p) {
        var b = box(w, h), bw = b.w / N;
        var rad = Math.min(bw * 0.38, b.h / (maxc + 2.2) / 2.25), dy = rad * 2.3;
        var env = envelope(p), i, j;
        baseline(c, b);
        // dots
        for (i = 0; i < N; i++) {
          var x = b.x0 + (i + 0.5) * bw, u = i / N;
          for (j = 0; j < bins[i].c; j++) {
            var solid = j < bins[i].rep;
            var t0 = solid ? 0.04 + u * 0.2 : 0.27 + u * 0.22 + j * 0.004;
            var a = easeOut(seg(p, t0, t0 + 0.035));
            if (a <= 0) continue;
            var y = b.y1 - rad - 2.5 - j * dy;
            if (solid) {
              style(c, pal.ink, 1, env * a * 0.9);
              dot(c, x, y, rad * (0.5 + 0.5 * a)); c.fill();
            } else {
              style(c, pal.ink, 1.1, env * a * 0.5);
              dot(c, x, y, (rad - 0.55) * (0.5 + 0.5 * a)); c.stroke();
            }
          }
        }
        // estimate and band, swept left to right
        var s = ease(seg(p, 0.53, 0.84));
        if (s > 0) {
          var M = 60, top = [], bot = [], mid = [], k;
          for (k = 0; k <= M; k++) {
            var v = (k / M) * (N - 1), xx = b.x0 + (v + 0.5) * bw;
            var m = f(v), sd = 0.55 + 0.2 * m;
            mid.push([xx, b.y1 - 2.5 - m * dy]);
            top.push([xx, b.y1 - 2.5 - (m + sd) * dy]);
            bot.push([xx, b.y1 - 2.5 - Math.max(0.2, m - sd) * dy]);
          }
          c.save();
          c.beginPath(); c.rect(0, 0, b.x0 + 0.5 * bw + s * (b.w - bw), h); c.clip();
          style(c, pal.warm, 1, env * 0.17);
          c.beginPath(); c.moveTo(top[0][0], top[0][1]);
          for (k = 1; k <= M; k++) c.lineTo(top[k][0], top[k][1]);
          for (k = M; k >= 0; k--) c.lineTo(bot[k][0], bot[k][1]);
          c.closePath(); c.fill();
          style(c, pal.warm, 2, env);
          trace(c, mid, 1);
          c.restore();
        }
        c.globalAlpha = 1;
      }
    };
  })();

  /* =====================================================================
     2. Malaria: a parasite that keeps changing.
     An abstract hexagonal map. Two kinds of parasite (warm, cool) start in a
     few cells and spread to neighbours at uneven speed.
     ===================================================================== */
  FIG.malaria = (function () {
    var r = rng(29), COLS = 19, ROWS = 11, cells = [], idx = {}, q, rr;
    var a1 = r() * TAU, a2 = r() * TAU, a3 = r() * TAU;
    for (rr = 0; rr < ROWS; rr++) for (q = 0; q < COLS; q++) {
      var cx = (q + 0.5 + (rr & 1) * 0.5) / (COLS + 0.5) * 2 - 1;
      var cy = (rr + 0.5) / ROWS * 2 - 1;
      var th = Math.atan2(cy, cx), d = Math.sqrt(cx * cx + cy * cy);
      var R = 0.86 + 0.1 * Math.sin(2 * th + a1) + 0.09 * Math.sin(3 * th + a2) + 0.05 * Math.sin(5 * th + a3);
      if (d < R) { idx[q + ',' + rr] = cells.length; cells.push({ q: q, r: rr, u: cx, v: cy, t: Infinity, k: 0 }); }
    }
    function nbrs(cell) {
      var o = cell.r & 1, q = cell.q, y = cell.r;
      return [[q - 1, y], [q + 1, y], [q - 1 + o, y - 1], [q + o, y - 1], [q - 1 + o, y + 1], [q + o, y + 1]]
        .map(function (a) { return idx[a[0] + ',' + a[1]]; }).filter(function (v) { return v !== undefined; });
    }
    function nearest(u, v) {
      var best = 0, bd = 9; cells.forEach(function (cl, i) {
        var dd = (cl.u - u) * (cl.u - u) + (cl.v - v) * (cl.v - v); if (dd < bd) { bd = dd; best = i; }
      }); return best;
    }
    // slow and fast country: a smooth field that scales the time to cross a cell
    var f1 = r() * TAU, f2 = r() * TAU;
    cells.forEach(function (cl) { cl.slow = 1 + 0.9 * (0.5 + 0.5 * Math.sin(2.6 * cl.u + f1) * Math.cos(2.2 * cl.v + f2)); });
    var seeds = [[nearest(-0.55, 0.3), 1, 0], [nearest(0.1, -0.55), 1, 3.2], [nearest(0.58, 0.35), 2, 1.4]];
    var open = [];
    seeds.forEach(function (s) { cells[s[0]].t = s[2]; cells[s[0]].k = s[1]; cells[s[0]].seed = true; open.push(s[0]); });
    // multi-source shortest paths with random edge weights (a simple Dijkstra; the grid is tiny)
    var done = {};
    for (;;) {
      var bi = -1, bt = Infinity;
      cells.forEach(function (cl, i) { if (!done[i] && cl.t < bt) { bt = cl.t; bi = i; } });
      if (bi < 0) break;
      done[bi] = true;
      nbrs(cells[bi]).forEach(function (ni) {
        var wgt = (0.45 + 1.5 * r()) * cells[ni].slow, nt = cells[bi].t + wgt;
        if (nt < cells[ni].t) { cells[ni].t = nt; cells[ni].k = cells[bi].k; }
      });
    }
    var times = cells.map(function (cl) { return cl.t; }).sort(function (a, b) { return a - b; });
    var TCUT = times[Math.floor(times.length * 0.8)]; // one cell in five is never reached
    function hex(c, x, y, s) {
      c.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = TAU * (i / 6) + TAU / 12;
        if (i) c.lineTo(x + s * Math.cos(a), y + s * Math.sin(a)); else c.moveTo(x + s * Math.cos(a), y + s * Math.sin(a));
      }
      c.closePath();
    }
    return {
      dur: 10, still: 0.88,
      draw: function (c, w, h, p) {
        var s = Math.min((w - 20) / (Math.sqrt(3) * (COLS + 0.5)), (h * 0.9) / (1.5 * ROWS + 0.5));
        var gw = Math.sqrt(3) * s * (COLS + 0.5), gh = s * (1.5 * ROWS + 0.5);
        var ox = (w - gw) / 2, oy = (h - gh) / 2, env = envelope(p);
        var T = seg(p, 0.05, 0.86) * TCUT, i;
        for (i = 0; i < cells.length; i++) {
          var cl = cells[i];
          var x = ox + Math.sqrt(3) * s * (cl.q + 0.5 + (cl.r & 1) * 0.5), y = oy + s * (1.5 * cl.r + 1);
          style(c, pal.ink, 1, 0.075);
          hex(c, x, y, s * 0.9); c.fill();
          var a = clamp((T - cl.t) / (TCUT * 0.2));
          if (a > 0) {
            style(c, cl.k === 1 ? pal.warm : pal.cool, 1, env * (0.16 + 0.74 * ease(a)));
            hex(c, x, y, s * 0.9); c.fill();
          }
          if (cl.seed) { // a quiet ring where each one starts
            var pulse = seg(T, cl.t - 0.6, cl.t + 3);
            if (pulse > 0 && pulse < 1) {
              style(c, cl.k === 1 ? pal.warm : pal.cool, 1.5, env * (1 - pulse));
              dot(c, x, y, s * (0.9 + 1.6 * easeOut(pulse))); c.stroke();
            }
          }
        }
        c.globalAlpha = 1;
      }
    };
  })();

  /* =====================================================================
     3. Vaccines: what vaccination changed.
     Two curves from one start. The dashed one carries on up; the solid one
     bends down after vaccination begins. The gap between them is shaded.
     ===================================================================== */
  FIG.vaccines = (function () {
    var XV = 0.4, M = 80;
    function cf(x) { return 0.95 / (1 + Math.exp(-(x - 0.55) / 0.115)) - 0.0075; }
    function vx(x) { return x < XV ? cf(x) : cf(x) * Math.exp(-9.5 * (x - XV) * (x - XV)); }
    return {
      dur: 8, still: 0.85,
      draw: function (c, w, h, p) {
        var b = box(w, h), env = envelope(p), s = seg(p, 0.05, 0.7), k;
        var X = function (x) { return b.x0 + x * b.w; }, Y = function (v) { return b.y1 - 2 - v * (b.h - 2); };
        baseline(c, b);
        var A = [], B = [];
        for (k = 0; k <= M; k++) { var x = k / M; A.push([X(x), Y(cf(x))]); B.push([X(x), Y(vx(x))]); }
        // the gap
        if (s > XV) {
          c.save(); c.beginPath(); c.rect(0, 0, X(s), h); c.clip();
          style(c, pal.cool, 1, env * 0.16);
          c.beginPath(); c.moveTo(A[0][0], A[0][1]);
          for (k = 1; k <= M; k++) c.lineTo(A[k][0], A[k][1]);
          for (k = M; k >= 0; k--) c.lineTo(B[k][0], B[k][1]);
          c.closePath(); c.fill(); c.restore();
        }
        // the moment vaccination begins
        var mk = easeOut(seg(s, XV - 0.02, XV + 0.06));
        if (mk > 0) {
          style(c, pal.warm, 1.25, env * mk * 0.9, [2, 4]);
          c.beginPath(); c.moveTo(X(XV), b.y1); c.lineTo(X(XV), b.y1 - (b.h * 0.94) * mk); c.stroke();
        }
        style(c, pal.ink, 1.5, env * 0.75, [5, 5]);
        trace(c, A, s);
        style(c, pal.cool, 2.25, env);
        var tip = trace(c, B, s);
        if (mk > 0) {
          style(c, pal.paper, 1, env * mk); dot(c, X(XV), Y(cf(XV)), 5.5); c.fill();
          style(c, pal.warm, 1, env * mk); dot(c, X(XV), Y(cf(XV)), 3.5 * mk); c.fill();
        }
        if (tip && s < 1) { style(c, pal.cool, 1, env); dot(c, tip[0], tip[1], 2.6); c.fill(); }
        c.globalAlpha = 1;
      }
    };
  })();

  /* =====================================================================
     4. Decisions: from a forecast to a decision.
     Observed points, then a forecast fan that widens. Where the fan first
     reaches the threshold, a marker appears: a decision point.
     ===================================================================== */
  FIG.decisions = (function () {
    var r = rng(47), X0 = 0.4, THR = 0.74, obs = [], i, NO = 11;
    for (i = 0; i < NO; i++) {
      var u = i / (NO - 1);
      obs.push([u * X0, 0.16 + 0.2 * Math.pow(u, 1.7) + gauss(r) * 0.013]);
    }
    var Y0 = obs[NO - 1][1];
    function mid(u) { return Y0 + 0.34 * Math.pow(u, 1.25); }
    function sd(u) { return 0.27 * Math.pow(u, 0.85); }
    var UC = 0; // where the upper edge of the fan meets the threshold
    for (i = 0; i <= 1000; i++) { if (mid(i / 1000) + sd(i / 1000) >= THR) { UC = i / 1000; break; } }
    return {
      dur: 9, still: 0.86,
      draw: function (c, w, h, p) {
        var b = box(w, h), env = envelope(p), k, M = 50;
        var X = function (x) { return b.x0 + x * b.w; }, Y = function (v) { return b.y1 - 2 - v * (b.h - 2); };
        baseline(c, b);
        // threshold
        style(c, pal.ink, 1.25, 0.2 + 0.5 * env, [6, 5]);
        c.beginPath(); c.moveTo(b.x0, Y(THR)); c.lineTo(b.x1, Y(THR)); c.stroke();
        // forecast fan
        var s = ease(seg(p, 0.3, 0.72));
        if (s > 0) {
          var bands = [[1, 0.13], [0.45, 0.17]], bi;
          for (bi = 0; bi < 2; bi++) {
            style(c, pal.cool, 1, env * bands[bi][1]);
            c.beginPath();
            for (k = 0; k <= M; k++) { var u = (k / M) * s; c[k ? 'lineTo' : 'moveTo'](X(X0 + u * (1 - X0)), Y(mid(u) + bands[bi][0] * sd(u))); }
            for (k = M; k >= 0; k--) { var u2 = (k / M) * s; c.lineTo(X(X0 + u2 * (1 - X0)), Y(mid(u2) - bands[bi][0] * sd(u2))); }
            c.closePath(); c.fill();
          }
          style(c, pal.cool, 2.25, env);
          c.beginPath();
          for (k = 0; k <= M; k++) { var u3 = (k / M) * s; c[k ? 'lineTo' : 'moveTo'](X(X0 + u3 * (1 - X0)), Y(mid(u3))); }
          c.stroke();
        }
        // observed so far
        var so = seg(p, 0.04, 0.27), pts = obs.map(function (o) { return [X(o[0]), Y(o[1])]; });
        style(c, pal.ink, 1.25, env * 0.55);
        trace(c, pts, so);
        for (k = 0; k < NO; k++) {
          var a = easeOut(seg(so, k / (NO - 1) - 0.04, k / (NO - 1) + 0.04));
          if (a > 0) { style(c, pal.ink, 1, env * a); dot(c, pts[k][0], pts[k][1], 2.6 * a); c.fill(); }
        }
        // decision point
        var m = seg(s, UC, UC + 0.12);
        if (s >= UC && s > 0) {
          var mx = X(X0 + UC * (1 - X0)), my = Y(THR), e = easeOut(m);
          style(c, pal.warm, 1.25, env * e * 0.9, [2, 4]);
          c.beginPath(); c.moveTo(mx, my); c.lineTo(mx, my + (b.y1 - my) * e); c.stroke();
          var pr = frac(seg(s, UC, 1) * 0.999 + seg(p, 0.72, 0.93)); // two slow outward rings
          style(c, pal.warm, 1.5, env * (1 - pr) * 0.8);
          dot(c, mx, my, 6 + 12 * easeOut(pr)); c.stroke();
          style(c, pal.paper, 1, env * e); dot(c, mx, my, 7.5 * e); c.fill();
          style(c, pal.warm, 2, env * e); dot(c, mx, my, 5.5 * e); c.stroke();
          style(c, pal.warm, 1, env * e); dot(c, mx, my, 2.4 * e); c.fill();
        }
        c.globalAlpha = 1;
      }
    };
  })();

  /* =====================================================================
     5. Methods: making slow simulations quick.
     A jagged simulation is drawn slowly. Then a smooth surrogate snaps over
     the same shape several times, each with a small variation.
     The bars along the top keep time: one long, then several short.
     ===================================================================== */
  FIG.methods = (function () {
    var r = rng(83), N = 96, jag = [], i, K = 5, vars = [];
    function g(x, v) {
      v = v || [1, 0, 1, 0];
      return 0.05 + 0.66 * v[0] * Math.exp(-Math.pow((x - 0.3 - v[1]) / 0.105, 2)) +
        0.44 * v[2] * Math.exp(-Math.pow((x - 0.69 - v[3]) / 0.14, 2));
    }
    var walk = 0;
    for (i = 0; i <= N; i++) {
      var x = i / N; walk = walk * 0.6 + gauss(r) * 0.09;
      jag.push([x, Math.max(0.01, g(x) * (1 + walk + gauss(r) * 0.07) + gauss(r) * 0.008)]);
    }
    for (i = 0; i < K; i++) vars.push([1 + gauss(r) * 0.07, gauss(r) * 0.014, 1 + gauss(r) * 0.09, gauss(r) * 0.018]);
    vars[K - 1] = [1, 0, 1, 0];
    var S0 = 0.52, GAP = 0.075, SNAP = 0.03;
    return {
      dur: 9, still: 0.9,
      draw: function (c, w, h, p) {
        var b = box(w, h), env = envelope(p), k, j, M = 70;
        var X = function (x) { return b.x0 + x * b.w; }, Y = function (v) { return b.y1 - 2 - v * (b.h * 0.86); };
        baseline(c, b);
        var s = seg(p, 0.04, 0.47);
        var started = seg(p, S0 - 0.02, S0 + 0.03);
        // the slow model
        var pts = jag.map(function (o) { return [X(o[0]), Y(o[1])]; });
        style(c, pal.ink, 1.25, env * (0.85 - 0.5 * started));
        var tip = trace(c, pts, s);
        if (tip && s < 1) { style(c, pal.ink, 1, env); dot(c, tip[0], tip[1], 2.4); c.fill(); }
        // the surrogate, several times over
        for (k = 0; k < K; k++) {
          var t0 = S0 + k * GAP, f = easeOut(seg(p, t0, t0 + SNAP));
          if (f <= 0) continue;
          var newer = seg(p, t0 + GAP, t0 + GAP + SNAP); // dims once the next one lands
          var sp = [];
          for (j = 0; j <= M; j++) sp.push([X(j / M), Y(g(j / M, vars[k]))]);
          style(c, pal.cool, k === K - 1 ? 2.25 : 1.5, env * (k === K - 1 ? 1 : 0.9 - 0.55 * newer));
          trace(c, sp, f);
        }
        // time taken: one long bar, then short ones
        var by = b.y0 - h * 0.045, long = b.w * 0.5, bh = 3;
        style(c, pal.ink, 1, env * 0.55);
        if (s > 0) c.fillRect(b.x0, by, long * s, bh);
        for (k = 0; k < K; k++) {
          var f2 = seg(p, S0 + k * GAP, S0 + k * GAP + SNAP);
          if (f2 > 0) { style(c, pal.cool, 1, env); c.fillRect(b.x0 + long + 7 + k * 11, by, 7 * f2, bh); }
        }
        c.globalAlpha = 1;
      }
    };
  })();

  /* =====================================================================
     Header: many working models.
     An ensemble of faint stochastic epidemic trajectories, each drawn and
     redrawn on its own clock, around one steady central line.
     ===================================================================== */
  FIG.ensemble = (function () {
    var NT = 16, VAR = 3, M = 72, set = [], k, v, j;
    function shape(x, tp, ht, wd, tp2, h2) {
      return ht * Math.exp(-Math.pow((x - tp) / wd, 2)) + h2 * Math.exp(-Math.pow((x - tp2) / (wd * 1.25), 2));
    }
    for (k = 0; k < NT; k++) {
      set.push([]);
      for (v = 0; v < VAR; v++) {
        var r = rng(1000 + k * 17 + v * 101), pts = [];
        var tp = 0.34 + gauss(r) * 0.055, ht = 0.56 * Math.exp(gauss(r) * 0.26), wd = 0.13 + r() * 0.05;
        var tp2 = 0.72 + gauss(r) * 0.06, h2 = 0.3 * Math.exp(gauss(r) * 0.4), wk = 0;
        for (j = 0; j <= M; j++) {
          var x = j / M; wk = wk * 0.82 + gauss(r) * 0.05;
          var y = 0.03 + shape(x, tp, ht, wd, tp2, h2) * (1 + wk);
          pts.push([x, Math.max(0, y > 0.8 ? 0.8 + 0.2 * (1 - Math.exp(-(y - 0.8) / 0.2)) : y)]);
        }
        set[k].push(pts);
      }
    }
    var centre = [];
    for (j = 0; j <= M; j++) centre.push([j / M, 0.03 + shape(j / M, 0.34, 0.56, 0.155, 0.72, 0.3)]);
    return {
      dur: 9, still: 0.5, continuous: true,
      draw: function (c, w, h, p, cycles, still) {
        var x0 = 0, x1 = w, y1 = h - 6, hh = h - 16;
        var map = function (pts) { return pts.map(function (o) { return [x0 + o[0] * (x1 - x0), y1 - o[1] * hh]; }); };
        for (var k = 0; k < NT; k++) {
          var q = p + cycles + k / NT, ph = frac(q), vi = Math.floor(q) % VAR;
          var drawn = still ? 1 : seg(ph, 0, 0.55), a = still ? 0.35 + 0.65 * frac(k * 0.618) : 1 - ease(seg(ph, 0.72, 1));
          var tint = k % 5 === 2 ? pal.cool : k % 7 === 4 ? pal.warm : pal.ink;
          style(c, tint, 1, a * (tint === pal.ink ? 0.2 : 0.42));
          var tip = trace(c, map(set[k][vi]), drawn);
          if (tip && drawn < 1) { c.globalAlpha = a * 0.7; dot(c, tip[0], tip[1], 1.6); c.fill(); }
        }
        style(c, pal.ink, 2, 1);
        trace(c, map(centre), 1);
        c.globalAlpha = 1;
      }
    };
  })();

  /* ---------- runtime: sizing, visibility, one shared animation loop ---------- */
  var items = [], running = false, frozen = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function size(it) {
    var rect = it.canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 3);
    var w = Math.round(rect.width), h = Math.round(rect.height);
    if (!w || !h) return;
    it.w = w; it.h = h; it.dpr = dpr;
    it.canvas.width = Math.round(w * dpr); it.canvas.height = Math.round(h * dpr);
  }
  function paint(it, now) {
    if (!it.w) return;
    var fig = it.fig, c = it.ctx, t = now / 1000 / fig.dur, p, cycles = 0, still = false;
    if (frozen !== null) { p = frozen; }
    else if (reduce.matches) { p = fig.still; still = true; }
    else { p = frac(t); cycles = Math.floor(t); }
    c.setTransform(it.dpr, 0, 0, it.dpr, 0, 0);
    c.clearRect(0, 0, it.w, it.h);
    fig.draw(c, it.w, it.h, p, cycles, still);
  }
  function loop(now) {
    var any = false;
    for (var i = 0; i < items.length; i++) if (items[i].visible) { paint(items[i], now); any = true; }
    if (any && !reduce.matches && frozen === null) requestAnimationFrame(loop); else running = false;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
  function repaintAll() { readPalette(); items.forEach(function (it) { paint(it, performance.now()); }); kick(); }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var it = items.filter(function (x) { return x.canvas === e.target; })[0];
      if (it) { it.visible = e.isIntersecting; if (it.visible) kick(); }
    });
  }, { rootMargin: '40px' }) : null;
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) {
    es.forEach(function (e) {
      var it = items.filter(function (x) { return x.canvas === e.target; })[0];
      if (it) { size(it); paint(it, performance.now()); }
    });
  }) : null;

  function mount(canvas) {
    var fig = FIG[canvas.getAttribute('data-figure')];
    if (!fig || !canvas.getContext) return;
    var it = { canvas: canvas, ctx: canvas.getContext('2d'), fig: fig, visible: !io, w: 0, h: 0, dpr: 1 };
    items.push(it); size(it); paint(it, performance.now());
    if (io) io.observe(canvas);
    if (ro) ro.observe(canvas); else window.addEventListener('resize', function () { size(it); paint(it, performance.now()); });
    if (!io) kick();
  }

  readPalette();
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  [dark, reduce].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', repaintAll); else if (m.addListener) m.addListener(repaintAll);
  });

  window.Figures = {
    mount: mount,
    // For checking frames: Figures.freeze(0.5) holds every figure at that point in its loop; freeze(null) resumes.
    freeze: function (p) { frozen = p; items.forEach(function (it) { paint(it, performance.now()); }); if (p === null) kick(); }
  };
})();
