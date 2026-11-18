'use strict';
/* Sons synthétisés (aucun fichier audio : tout marche hors ligne), musique douce, vibrations, confettis. */
const Sfx = (function () {
  let ctx = null, master = null, musicTimer = null, musicGain = null;
  const N = n => 440 * Math.pow(2, (n - 69) / 12);

  function ac() {
    if (!ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.5; musicGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, t0, dur, type, vol, dest) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const on = () => Store.d.sound;
  const seq = (notes, step, type, vol, len) => on() && notes.forEach((n, i) => tone(N(n), i * step, len || step * 2.2, type || 'triangle', vol || 0.15));

  const PENTA = [60, 62, 64, 67, 69, 72, 74, 76];
  let last = 3;
  function musicStep() {
    if (!ctx || !Store.d.music || document.hidden) return;
    last = Math.max(0, Math.min(PENTA.length - 1, last + Math.floor(Math.random() * 5) - 2));
    tone(N(PENTA[last]), 0, 2.2, 'sine', 0.05, musicGain);
    if (Math.random() < 0.3) tone(N(PENTA[last] - 12), 0, 3, 'sine', 0.04, musicGain);
  }
  function music(enable) {
    clearInterval(musicTimer); musicTimer = null;
    if (enable) { ac(); musicStep(); musicTimer = setInterval(musicStep, 900); }
  }

  return {
    unlock() { ac(); if (Store.d.music && !musicTimer) music(true); },
    music,
    tap() { on() && tone(N(76), 0, 0.07, 'triangle', 0.08); },
    pick() { on() && tone(N(79), 0, 0.09, 'sine', 0.12); },
    good(step) { const k = Math.min(step || 0, 8); seq([67 + k, 74 + k], 0.07, 'triangle', 0.15); },
    bad() { seq([50, 46], 0.1, 'sawtooth', 0.07, 0.2); },
    flip() { on() && tone(N(84), 0, 0.05, 'square', 0.04); },
    win() { seq([72, 76, 79, 84, 88], 0.09, 'triangle', 0.16, 0.5); },
    lose() { seq([67, 64, 60, 55], 0.14, 'sine', 0.14, 0.4); },
    badge() { seq([79, 84, 91], 0.08, 'sine', 0.14, 0.5); },
  };
})();

const Haptic = {
  go(p) { try { if (Store.d.vibe && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* non supporté */ } },
};

const Confetti = (function () {
  let cv, c2, parts = [], raf = 0;
  const COLORS = ['#d9531e', '#1f6f8b', '#f2b705', '#2e8b57', '#e0568a', '#7a5cd6'];
  function fit() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  function frame() {
    c2.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.vy += 0.12 * devicePixelRatio; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      c2.save(); c2.translate(p.x, p.y); c2.rotate(p.r); c2.fillStyle = p.c;
      c2.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
      c2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c2.restore();
    });
    parts = parts.filter(p => p.life > 0 && p.y < cv.height + 40);
    raf = parts.length ? requestAnimationFrame(frame) : 0;
    if (!parts.length) c2.clearRect(0, 0, cv.width, cv.height);
  }
  return {
    burst(amount) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      cv = cv || document.getElementById('fx'); c2 = c2 || cv.getContext('2d'); fit();
      const d = devicePixelRatio, n = amount || 90;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, s = (6 + Math.random() * 9) * d;
        parts.push({ x: cv.width / 2, y: cv.height * 0.55, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          w: (6 + Math.random() * 6) * d, h: (4 + Math.random() * 6) * d, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          c: COLORS[i % COLORS.length], life: 90 + Math.random() * 60 });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    },
  };
})();
