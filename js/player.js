/* Player: the flying character (physics + drawing).
 * Uses assets/friend.png when available, otherwise a built-in cartoon bird. */
(function (TB) {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function Player(config) {
    this.cfg = config;
    this.x = config.player.x;
    this.radius = config.player.radius;
    this.drawHeight = config.player.drawHeight;
    this.homeY = config.world.height * 0.42;
    this.y = this.homeY;
    this.vy = 0;
    this.rotation = 0;
    this.wingPhase = 0;
    this.wingBoost = 0;
    this.popTimer = 0;
    this.image = null;
    this.imageReady = false;
    this._loadImage('assets/friend.png');
  }

  Player.prototype._loadImage = function (src) {
    var self = this;
    var img = new Image();
    img.onload = function () {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) { self.image = img; self.imageReady = true; }
    };
    img.onerror = function () { self.imageReady = false; };
    img.src = src;
  };

  Player.prototype.reset = function () {
    this.y = this.homeY;
    this.vy = 0;
    this.rotation = 0;
    this.wingBoost = 0;
    this.popTimer = 0.35;   // little "pop" when a run begins
  };

  Player.prototype.flap = function () {
    this.vy = this.cfg.physics.jump;
    this.wingBoost = 1;
  };

  /* Gentle hover on the start screen. */
  Player.prototype.updateIdle = function (dt, time) {
    this.y = this.homeY + Math.sin(time * 3) * 9;
    this.rotation = Math.sin(time * 3 + 1) * 0.1;
    this.wingPhase += dt * 9;
  };

  Player.prototype.update = function (dt) {
    var p = this.cfg.physics;
    this.vy = Math.min(this.vy + p.gravity * dt, p.maxFall);
    this.y += this.vy * dt;

    // Hitting the top of the screen just stops the climb (obstacles still fill the full height).
    if (this.y < this.radius) { this.y = this.radius; if (this.vy < 0) this.vy = 0; }

    var target = this.vy < 0 ? -0.45 : clamp(this.vy / 620, 0, 1.15);
    this.rotation += (target - this.rotation) * Math.min(1, dt * 12);

    this.wingBoost = Math.max(0, this.wingBoost - dt * 2.2);
    this.wingPhase += dt * (9 + this.wingBoost * 26);
    if (this.popTimer > 0) this.popTimer = Math.max(0, this.popTimer - dt);
  };

  Player.prototype.draw = function (ctx) {
    var scale = 1 + (this.popTimer > 0 ? Math.sin((this.popTimer / 0.35) * Math.PI) * 0.22 : 0);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(scale, scale);

    var h = this.drawHeight;
    var wingAngle = Math.sin(this.wingPhase) * 0.7;

    // Wing flapping behind the face (never drawn over it, so the face stays clearly visible)
    this._drawWing(ctx, -h * 0.3, h * 0.04, wingAngle, h * 1.15);

    if (this.imageReady) {
      var w = h * (this.image.naturalWidth / this.image.naturalHeight);
      ctx.shadowColor = 'rgba(255,255,255,0.95)';   // white outline-glow keeps the face readable on any background
      ctx.shadowBlur = 9;
      ctx.drawImage(this.image, -w / 2, -h / 2, w, h);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    } else {
      this._drawFallbackBird(ctx, h);
    }
    ctx.restore();
  };

  Player.prototype._drawWing = function (ctx, x, y, angle, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle - 0.4);
    ctx.fillStyle = '#ffe9a8';
    ctx.strokeStyle = '#e6a416';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, 0, size * 0.26, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  Player.prototype._drawFallbackBird = function (ctx, h) {
    var r = h * 0.4;
    ctx.fillStyle = '#ffcf33';
    ctx.strokeStyle = '#c98a00';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * 0.95, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.ellipse(r * 0.1, r * 0.3, r * 0.65, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d2b53';
    ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.25, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a3d';
    ctx.beginPath(); ctx.moveTo(r * 0.95, -r * 0.05); ctx.lineTo(r * 1.65, r * 0.12); ctx.lineTo(r * 0.95, r * 0.35); ctx.closePath(); ctx.fill();
  };

  TB.Player = Player;
})(window.TapBird = window.TapBird || {});
