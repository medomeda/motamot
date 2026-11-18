'use strict';
/* Moteur : dictionnaire, voisinage, plus courts chemins, défis reproductibles, IA. */
const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

const Engine = (function () {
  const D = new Set(WORDS.split(' '));
  const CL = COMMON.split(' ').filter(w => D.has(w));
  // Mots « agréables » pour départs/arrivées : on écarte les formes conjuguées (aime, finit, voyait…).
  const SUF = ['erai', 'eras', 'era', 'ait', 'ais', 'ant', 'ent', 'ons', 'ez', 'ont', 'ront', 'rai', 'ras', 'iez'];
  const inflected = w => w.length >= 5 && SUF.some(s => w.endsWith(s) && ['er', 'ir', 're', 'oir'].some(e => D.has(w.slice(0, -s.length) + e)));
  const NICE = CL.filter(w => !inflected(w));
  const CS = new Set(NICE);
  const byLen = {};
  NICE.forEach(w => (byLen[w.length] = byLen[w.length] || []).push(w));

  const nbCache = new Map();
  function neighbors(w) {
    let r = nbCache.get(w);
    if (r) return r;
    r = [];
    for (let i = 0; i < w.length; i++) {
      const a = w.slice(0, i), b = w.slice(i + 1);
      for (const c of ALPHA) {
        if (c === w[i]) continue;
        const x = a + c + b;
        if (D.has(x)) r.push(x);
      }
    }
    nbCache.set(w, r);
    return r;
  }

  const distCache = new Map();
  function distFrom(t) {
    let d = distCache.get(t);
    if (d) return d;
    d = new Map([[t, 0]]);
    const q = [t];
    for (let h = 0; h < q.length; h++) {
      const u = q[h], du = d.get(u);
      for (const v of neighbors(u)) if (!d.has(v)) { d.set(v, du + 1); q.push(v); }
    }
    distCache.set(t, d);
    if (distCache.size > 12) distCache.delete(distCache.keys().next().value);
    return d;
  }
  const dist = (a, t) => { const v = distFrom(t).get(a); return v === undefined ? Infinity : v; };

  /** Prochain mot conseillé : sur un chemin optimal si possible, en préférant les mots courants. */
  function nextOnPath(cur, t, used) {
    const d = distFrom(t), dc = d.get(cur);
    if (dc === undefined || dc === 0) return null;
    const free = neighbors(cur).filter(w => !(used && used.has(w)) && d.has(w));
    if (!free.length) return null;
    const best = Math.min(...free.map(w => d.get(w)));
    const c = free.filter(w => d.get(w) === best);
    const common = c.filter(w => CS.has(w));
    return (common.length ? common : c)[0];
  }

  // --- Hasard reproductible (même défi pour tous le même jour) ---
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickChallenge(len, steps, rand, tries, pref) {
    const base = byLen[len];
    if (!base) return null;
    const list = pref ? base.filter(w => pref.has(w)) : base;
    if (!list.length) return null;
    for (let k = 0; k < (tries || 150); k++) {
      const s = list[Math.floor(rand() * list.length)];
      const d = new Map([[s, 0]]);
      const q = [s];
      const found = [];
      for (let h = 0; h < q.length; h++) {
        const u = q[h], du = d.get(u);
        if (du >= steps) continue;
        for (const v of neighbors(u)) {
          if (d.has(v)) continue;
          d.set(v, du + 1);
          q.push(v);
          if (du + 1 === steps && CS.has(v) && (!pref || pref.has(v))) found.push(v);
        }
      }
      if (found.length) return { start: s, target: found[Math.floor(rand() * found.length)], steps };
    }
    return null;
  }
  /** Défi garanti réalisable. `pref` : mots à privilégier (ceux qui ont une définition) ; la distance
   *  demandée est conservée en priorité, on ne la réduit qu'en dernier recours. */
  function challenge(len, steps, rand, pref) {
    for (let st = steps; st >= 1; st--) {
      if (pref) { const c = pickChallenge(len, st, rand, 120, pref); if (c) return c; }
      const c = pickChallenge(len, st, rand, 150);
      if (c) return c;
    }
    return null;
  }

  // --- Duel : IA (niveaux facile / moyen / difficile) ---
  function aiMove(cur, target, used, level) {
    const c = neighbors(cur).filter(w => !used.has(w));
    if (!c.length) return null;
    if (c.includes(target)) return target;
    const d = distFrom(target);
    const dd = w => (d.has(w) ? d.get(w) : 99);
    const rnd = a => a[Math.floor(Math.random() * a.length)];
    if (level === 'easy') {
      if (Math.random() < 0.25) return rnd(c);
      const m = Math.min(...c.map(dd));
      return rnd(c.filter(w => dd(w) === m));
    }
    const safe = c.filter(w => dd(w) >= 2); // ne jamais offrir la victoire
    const pool = safe.length ? safe : c;
    if (level === 'mid') {
      const m = Math.min(...pool.map(dd));
      return Math.random() < 0.7 ? rnd(pool.filter(w => dd(w) === m)) : rnd(pool);
    }
    // difficile : réduit au minimum les réponses « sûres » de l'adversaire
    let best = null, bs = 1e9;
    for (const w of pool) {
      const u2 = new Set(used); u2.add(w);
      const replies = neighbors(w).filter(x => !u2.has(x) && x !== target);
      const s = replies.filter(x => dd(x) >= 2).length * 10 + Math.random() * 3;
      if (s < bs) { bs = s; best = w; }
    }
    return best;
  }

  return {
    valid: w => D.has(w),
    neighbors, distFrom, dist, nextOnPath, rng, challenge, aiMove,
    isCommon: w => CS.has(w),
    commonByLen: n => byLen[n] || [],
    norm: x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae'),
  };
})();

if (typeof module !== 'undefined') module.exports = Engine;
