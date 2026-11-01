/* Obstacles: Engineering Mathematics subject pillars.
 * - SUBJECTS is the single, easy-to-edit configuration of subject codes, colours and topics.
 * - Custom images (assets/obstacle-1.png, obstacle-2.png) are never stretched. A horizontal image
 *   (like a ruler) is rotated once into a vertical sprite and then tiled end-to-end.
 * - If no image loads, a stack of colourful textbooks is drawn instead. */
(function (TB) {
  'use strict';

  /* ======= EDIT TOPICS HERE ======= */
  var SUBJECTS = {
    M1: {
      name: 'Engineering Mathematics I', color: '#3f51b5', dark: '#2a378a',
      topics: ['Matrices', 'Jacobians', 'Maxima & Minima', 'Taylor Series', 'Partial Differentiation', 'Multiple Integrals', 'Differential Equations']
    },
    M2: {
      name: 'Engineering Mathematics II', color: '#c2185b', dark: '#8c1142',
      topics: ['Laplace Transforms', 'Fourier Series', 'Vector Calculus', 'Higher-Order Differential Equations', 'Inverse Laplace Transforms']
    },
    M3: {
      name: 'Engineering Mathematics III', color: '#00897b', dark: '#005f56',
      topics: ['Complex Variables', 'Analytic Functions', 'Cauchy–Riemann Equations', 'Conformal Mapping', 'Residues', 'Complex Integration']
    },
    DM: {
      name: 'Discrete Mathematics', color: '#7b1fa2', dark: '#561072',
      topics: ['Graph Theory', 'Propositional Logic', 'Recurrence Relations', 'Sets & Relations', 'Permutations & Combinations', 'Mathematical Induction', 'Trees & Spanning Trees']
    },
    AM: {
      name: 'Applied Mathematics', color: '#1565c0', dark: '#0d4a91',
      topics: ['Numerical Methods', 'Probability', 'Statistics', 'Interpolation', 'Numerical Integration', 'Curve Fitting']
    }
  };
  /* ================================ */

  var SUBJECT_CODES = Object.keys(SUBJECTS);
  var FONT = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';
  var IMAGE_FILES = ['assets/obstacle-1.png', 'assets/obstacle-2.png'];

  var measureCtx = null;
  function getMeasureCtx() {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    return measureCtx;
  }

  function randomInt(n) { return Math.floor(Math.random() * n); }

  /* Wrap a topic into at most 3 lines, shrinking the font until every word fits. */
  function layoutLabel(topic, maxWidth) {
    var ctx = getMeasureCtx();
    var words = topic.split(' ');
    for (var size = 13; size >= 8; size--) {
      ctx.font = '700 ' + size + 'px ' + FONT;
      var lines = [], line = '', fits = true;
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width <= maxWidth) { line = test; }
        else {
          if (!line) { fits = false; break; }        // a single word is too wide at this size
          lines.push(line); line = words[i];
          if (ctx.measureText(line).width > maxWidth) { fits = false; break; }
        }
      }
      if (!fits) continue;
      lines.push(line);
      if (lines.length <= 3) return { lines: lines, size: size };
    }
    ctx.font = '700 8px ' + FONT;   // last resort: tiny text, squeezed to width when drawn
    return { lines: words.length > 2 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [topic], size: 8 };
  }

  /* Turn a loaded image into a vertical sprite (rotating horizontal images once). */
  function makeSprite(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    var c = document.createElement('canvas');
    var cx;
    if (w > h) {            // horizontal artwork (e.g. a ruler) -> rotate 90 degrees
      c.width = h; c.height = w;
      cx = c.getContext('2d');
      cx.translate(h / 2, w / 2);
      cx.rotate(Math.PI / 2);
      cx.drawImage(img, -w / 2, -h / 2);
    } else {                // already vertical (or square)
      c.width = w; c.height = h;
      cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);
    }
    return { canvas: c, aspect: c.height / c.width };
  }

  function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
    var nx = cx < rx ? rx : (cx > rx + rw ? rx + rw : cx);
    var ny = cy < ry ? ry : (cy > ry + rh ? ry + rh : cy);
    var dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  function ObstacleManager(config) {
    this.cfg = config;
    this.list = [];
    this.sprites = [];
    this.recentTopics = [];
    this.lastSubject = '';
    this.lastGapY = config.world.height * 0.4;
    this._loadSprites();
  }

  ObstacleManager.prototype._loadSprites = function () {
    var self = this;
    IMAGE_FILES.forEach(function (src) {
      var img = new Image();
      img.onload = function () {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          try { self.sprites.push(makeSprite(img)); } catch (e) { /* unusable image: keep fallback */ }
        }
      };
      img.onerror = function () { /* missing image: built-in books are used */ };
      img.src = src;
    });
  };

  ObstacleManager.prototype.reset = function () {
    this.list.length = 0;
    this.recentTopics.length = 0;
    this.lastSubject = '';
    this.lastGapY = this.cfg.world.height * 0.4;
  };

  ObstacleManager.prototype._pickTopic = function () {
    var code, topic, tries = 0;
    do {
      code = SUBJECT_CODES[randomInt(SUBJECT_CODES.length)];
      var topics = SUBJECTS[code].topics;
      topic = topics[randomInt(topics.length)];
      tries++;
    } while (tries < 30 && (code === this.lastSubject || this.recentTopics.indexOf(topic) !== -1));
    this.lastSubject = code;
    this.recentTopics.push(topic);
    if (this.recentTopics.length > 6) this.recentTopics.shift();
    return { code: code, topic: topic };
  };

  ObstacleManager.prototype.spawn = function (gap) {
    var world = this.cfg.world, ocfg = this.cfg.obstacles;
    var groundY = world.height - world.groundHeight;
    var minSeg = ocfg.minSegment;
    var lo = minSeg + gap / 2, hi = groundY - minSeg - gap / 2;
    // Never ask for a vertical jump the player cannot make between two pillars.
    var from = Math.max(lo, this.lastGapY - ocfg.maxGapShift);
    var to = Math.min(hi, this.lastGapY + ocfg.maxGapShift);
    var gapY = from + Math.random() * (to - from);
    this.lastGapY = gapY;

    var pick = this._pickTopic();
    var w = ocfg.width;
    this.list.push({
      x: world.width + 60, w: w, gapY: gapY, gap: gap,
      subject: pick.code, topic: pick.topic,
      label: layoutLabel(pick.topic, w - 20),
      sprite: this.sprites.length ? this.sprites[randomInt(this.sprites.length)] : null,
      passed: false
    });
  };

  /* Advance obstacles; spawn new ones at a fixed distance apart. */
  ObstacleManager.prototype.update = function (dt, speed, gap) {
    var ocfg = this.cfg.obstacles, worldW = this.cfg.world.width;
    var list = this.list, i;
    for (i = 0; i < list.length; i++) list[i].x -= speed * dt;
    for (i = list.length - 1; i >= 0; i--) if (list[i].x + list[i].w < -20) list.splice(i, 1);
    var last = list.length ? list[list.length - 1] : null;
    if (!last || last.x <= worldW + 60 - ocfg.spacing) this.spawn(gap);
  };

  /* Returns how many obstacles were newly passed (each is counted once). */
  ObstacleManager.prototype.countPassed = function (playerX) {
    var n = 0;
    for (var i = 0; i < this.list.length; i++) {
      var o = this.list[i];
      if (!o.passed && o.x + o.w < playerX) { o.passed = true; n++; }
    }
    return n;
  };

  ObstacleManager.prototype.collides = function (cx, cy, r) {
    var groundY = this.cfg.world.height - this.cfg.world.groundHeight;
    for (var i = 0; i < this.list.length; i++) {
      var o = this.list[i];
      if (cx + r < o.x || cx - r > o.x + o.w) continue;
      if (circleHitsRect(cx, cy, r, o.x, -2000, o.w, o.gapY - o.gap / 2 + 2000)) return true;
      if (circleHitsRect(cx, cy, r, o.x, o.gapY + o.gap / 2, o.w, groundY - (o.gapY + o.gap / 2))) return true;
    }
    return false;
  };

  /* ---------------- Drawing ---------------- */

  ObstacleManager.prototype.draw = function (ctx) {
    var groundY = this.cfg.world.height - this.cfg.world.groundHeight;
    for (var i = 0; i < this.list.length; i++) {
      var o = this.list[i];
      var gapTop = o.gapY - o.gap / 2, gapBottom = o.gapY + o.gap / 2;
      this._drawSegment(ctx, o, 0, gapTop, true);
      this._drawSegment(ctx, o, gapBottom, groundY, false);
      this._drawLabel(ctx, o, 0, gapTop);
      this._drawLabel(ctx, o, gapBottom, groundY);
    }
  };

  ObstacleManager.prototype._drawSegment = function (ctx, o, y0, y1, isTop) {
    var h = y1 - y0;
    if (h <= 0) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(o.x, y0, o.w, h); ctx.clip();
    if (o.sprite) this._drawSpriteTiles(ctx, o, y0, y1, isTop);
    else this._drawBooks(ctx, o, y0, y1, isTop);
    ctx.restore();
  };

  /* Sprite tiles keep their aspect ratio; they start flush at the gap edge and run outward. */
  ObstacleManager.prototype._drawSpriteTiles = function (ctx, o, y0, y1, isTop) {
    var tileH = o.w * o.sprite.aspect, y;
    if (isTop) { for (y = y1 - tileH; y > y0 - tileH; y -= tileH) ctx.drawImage(o.sprite.canvas, o.x, y, o.w, tileH); }
    else { for (y = y0; y < y1; y += tileH) ctx.drawImage(o.sprite.canvas, o.x, y, o.w, tileH); }
  };

  /* Built-in fallback: a stack of textbooks in the subject colour. */
  ObstacleManager.prototype._drawBooks = function (ctx, o, y0, y1, isTop) {
    var subj = SUBJECTS[o.subject];
    var shades = [subj.color, subj.dark, '#ffb703', '#e63946', '#2a9d8f', '#f4a261'];
    var i = 0, y = isTop ? y1 : y0, bh, book;
    while (isTop ? y > y0 - 40 : y < y1 + 40) {
      bh = 24 + ((i * 7 + (o.subject.charCodeAt(0) % 5) * 3) % 14);
      book = shades[(i + o.subject.charCodeAt(1)) % shades.length];
      var by = isTop ? y - bh : y;
      var inset = (i % 2) * 4;
      ctx.fillStyle = book;
      ctx.beginPath(); ctx.roundRect(o.x + inset, by, o.w - inset * 2, bh, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(20,24,60,.75)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(o.x + inset + 8, by + 5, o.w - inset * 2 - 16, 3);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fillRect(o.x + inset + 8, by + bh - 8, o.w - inset * 2 - 16, 3);
      y += isTop ? -bh : bh;
      i++;
    }
  };

  ObstacleManager.prototype._drawLabel = function (ctx, o, y0, y1) {
    var L = o.label, subj = SUBJECTS[o.subject];
    var lineH = L.size + 3;
    var panelW = o.w - 8;
    var panelH = 36 + L.lines.length * lineH;
    if (y1 - y0 < panelH + 16) return;                 // segment too short: the other one carries the label
    var px = o.x + 4, py = (y0 + y1) / 2 - panelH / 2;

    ctx.save();
    ctx.fillStyle = subj.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(px, py, panelW, panelH, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = subj.dark;                         // darker header strip behind the code
    ctx.beginPath(); ctx.roundRect(px + 3, py + 3, panelW - 6, 25, 7); ctx.fill();

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
    ctx.font = '900 21px ' + FONT;
    ctx.fillText(o.subject, px + panelW / 2, py + 16);
    ctx.font = '700 ' + L.size + 'px ' + FONT;
    for (var i = 0; i < L.lines.length; i++) {
      ctx.fillText(L.lines[i], px + panelW / 2, py + 32 + (i + 0.5) * lineH, panelW - 8);
    }
    ctx.restore();
  };

  TB.SUBJECTS = SUBJECTS;
  TB.ObstacleManager = ObstacleManager;
})(window.TapBird = window.TapBird || {});
