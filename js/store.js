'use strict';
/* Sauvegarde locale : progression, réglages, carnet de mots, succès. Tout reste sur l'appareil. */
const Store = (function () {
  const KEY = 'motamot.v1';
  const fresh = () => ({
    name: '', sound: true, music: false, vibe: true, assist: true,
    levels: {},                 // index de niveau -> étoiles (1 à 3)
    daily: {},                  // 'AAAA-MM-JJ' -> { stars, moves }
    streak: { n: 0, last: '', best: 0 },
    notebook: {},               // mot -> nombre de fois rencontré
    stats: { solved: 0, duels: 0, wins: 0, losses: 0, online: 0, onlineWins: 0, hardWins: 0 },
    badges: {}, xp: 0, seenHow: false,
  });
  const d = fresh();
  try { Object.assign(d, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* données illisibles : on repart de zéro */ }
  ['stats', 'streak'].forEach(k => { d[k] = Object.assign(fresh()[k], d[k]); });

  function save() { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* stockage indisponible */ } }

  const RANKS = [
    [0, 'Curieux', '🐣'], [60, 'Apprenti lettré', '✏️'], [180, 'Jongleur de mots', '🤹'],
    [400, 'Cruciverbiste', '🧩'], [800, 'Maître des chaînes', '⛓️'], [1500, 'Académicien', '🎓'],
  ];
  function rank() {
    let r = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) if (d.xp >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; }
    return { title: r[1], icon: r[2], from: r[0], next: next ? next[0] : null };
  }

  const BADGES = [
    { id: 'first', icon: '🌟', name: 'Premier mot', desc: 'Termine un premier niveau.', test: () => d.stats.solved >= 1 },
    { id: 'five', icon: '🖐️', name: 'Bien lancé', desc: 'Termine 5 niveaux.', test: () => Object.keys(d.levels).length >= 5 },
    { id: 'world1', icon: '🌱', name: 'Petits pas, grands mots', desc: 'Termine le monde 1.', test: () => [0, 1, 2, 3, 4, 5].every(i => d.levels[i]) },
    { id: 'perfect', icon: '💎', name: 'Sans faute', desc: 'Obtiens 3 étoiles dix fois.', test: () => Object.values(d.levels).filter(s => s === 3).length >= 10 },
    { id: 'streak3', icon: '🔥', name: 'Régulier', desc: '3 jours de suite le défi du jour.', test: () => d.streak.best >= 3 },
    { id: 'streak7', icon: '📅', name: 'Habitué', desc: '7 jours de suite le défi du jour.', test: () => d.streak.best >= 7 },
    { id: 'duel', icon: '⚔️', name: 'Duelliste', desc: 'Gagne un duel.', test: () => d.stats.wins >= 1 },
    { id: 'hard', icon: '🧠', name: 'Cerveau d’acier', desc: 'Bats l’ordinateur difficile.', test: () => d.stats.hardWins >= 1 },
    { id: 'online', icon: '🌍', name: 'Sans frontières', desc: 'Gagne un duel en ligne.', test: () => d.stats.onlineWins >= 1 },
    { id: 'words50', icon: '📖', name: 'Petit dictionnaire', desc: 'Découvre 50 mots.', test: () => Object.keys(d.notebook).length >= 50 },
    { id: 'words200', icon: '📚', name: 'Bibliothèque', desc: 'Découvre 200 mots.', test: () => Object.keys(d.notebook).length >= 200 },
  ];
  /** Renvoie les succès nouvellement obtenus. */
  function checkBadges() {
    const got = [];
    for (const b of BADGES) if (!d.badges[b.id] && b.test()) { d.badges[b.id] = Date.now(); got.push(b); }
    if (got.length) save();
    return got;
  }

  function learn(words) {
    let fresh = 0;
    for (const w of words) { if (!d.notebook[w]) fresh++; d.notebook[w] = (d.notebook[w] || 0) + 1; }
    return fresh;
  }
  const stars = () => Object.values(d.levels).reduce((a, b) => a + b, 0);
  function reset() { Object.keys(d).forEach(k => delete d[k]); Object.assign(d, fresh()); save(); }

  return { d, save, rank, checkBadges, BADGES, learn, stars, reset };
})();
