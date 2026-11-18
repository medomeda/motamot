'use strict';
/* Mot à mot — interface et modes de jeu. */
const $ = (s, r) => (r || document).querySelector(s);
const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const U = w => w.toUpperCase();
const COL = ['#d9531e', '#1f6f8b'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const diffIdx = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i; return -1; };
const oneLetter = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d === 1; };
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

/* ---------- Parcours : 5 mondes de 6 niveaux ---------- */
const WORLDS = [
  { name: 'Petits pas', em: '🌱', lv: [[3, 2], [3, 2], [3, 2], [3, 3], [3, 3], [3, 3]] },
  { name: 'Quatre lettres', em: '🍀', lv: [[4, 2], [4, 3], [4, 3], [4, 4], [4, 4], [4, 4]] },
  { name: 'Cinq sur cinq', em: '🌻', lv: [[5, 3], [5, 3], [5, 4], [5, 4], [5, 5], [5, 5]] },
  { name: 'Grands mots', em: '🌳', lv: [[6, 3], [6, 4], [6, 4], [6, 5], [6, 5], [6, 6]] },
  { name: 'Maîtres de la chaîne', em: '👑', lv: [[4, 5], [5, 5], [5, 6], [6, 6], [6, 7], [6, 7]] },
];
const LEVELS = [];
WORLDS.forEach((w, wi) => w.lv.forEach(([len, steps], k) => LEVELS.push({ i: LEVELS.length, wi, k, len, steps })));
const TIPS = {
  0: 'Touche une lettre du mot, puis choisis la lettre qui la remplace. Chaque étape doit donner un vrai mot !',
  1: 'Bloqué ? Le bouton 💡 te montre d’abord quelle lettre changer, puis le mot suivant.',
  3: 'Tu peux annuler un coup avec ↩️ si tu penses être dans une impasse.',
  6: 'Un mot plus long, c’est plus de choix. Rapproche-toi de l’objectif lettre après lettre.',
};
const PREF = new Set(Object.keys(DEFS)); // départs/arrivées privilégiés : des mots qu'on peut définir
const lvCache = new Map(), lvKeys = new Set();
function levelChallenge(i) {
  for (let j = 0; j <= i; j++) {            // dans l'ordre, pour que chaque niveau soit toujours le même
    if (lvCache.has(j)) continue;
    const L = LEVELS[j];
    let c = null;
    for (let a = 0; a < 12; a++) {           // évite les paires déjà vues (même sens ou inversé)
      c = Engine.challenge(L.len, L.steps, Engine.rng(4242 + j * 977 + a * 131), PREF);
      if (c && !lvKeys.has(c.start + '>' + c.target) && !lvKeys.has(c.target + '>' + c.start)) break;
    }
    if (c) lvKeys.add(c.start + '>' + c.target);
    lvCache.set(j, c);
  }
  return lvCache.get(i);
}
const unlocked = i => i === 0 || !!Store.d.levels[i - 1];
function dailyChallenge(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(), hard = dow === 0 || dow === 6;
  return Engine.challenge(hard ? 6 : 5, hard ? 5 : 4, Engine.rng(y * 10000 + m * 100 + d), PREF);
}

/* ---------- État global ---------- */
let screen = 'home';
let G = null;                       // partie en cours (solo ou duel)
const DS = { mode: 'ai', level: 'mid', len: 4, diff: 'mid', own: false, s: '', t: '', n1: '', n2: '', code: '' };
const FP = { len: 4, steps: 3 };
const OL = { role: null, code: '', status: 'idle', err: '', peerName: '', first: 0 };
let NBF = 0;                        // filtre du carnet (0 = tous)
let installEvt = null;

const myName = () => Store.d.name || 'Joueur';

/* ---------- Affichage de base ---------- */
function toast(t, ms) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = t;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), ms || 2800);
}
function showModal(html) {
  $('#modal').innerHTML = `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
}
function closeModal() { $('#modal').innerHTML = ''; }
function ask(text, act, arg, yes) {
  showModal(`<h2>${esc(text)}</h2><div class="row" style="margin-top:18px"><button class="btn" data-act="close">Non</button><button class="btn primary" data-act="${act}" data-arg="${esc(arg || '')}">${esc(yes || 'Oui')}</button></div>`);
}

function wordRow(w, o) {
  o = o || {};
  const tiles = [...w].map((c, i) => `<span class="t ${o.mark ? o.mark(i) : ''}${o.chg === i ? ' chg' : ''}">${U(c)}</span>`).join('');
  return `<div class="wr ${o.cls || ''}" style="--n:${w.length}">${tiles}</div>`;
}

function badgeToasts() {
  const got = Store.checkBadges();
  got.forEach((b, i) => setTimeout(() => { Sfx.badge(); toast(`${b.icon} Succès : ${b.name}`, 3500); }, 900 + i * 1200));
}
function addXp(n) { if (n > 0) { Store.d.xp += n; Store.save(); } }

/* ---------- Accueil ---------- */
function viewHome() {
  const d = Store.d, r = Store.rank();
  const pct = r.next ? Math.min(100, Math.round((d.xp - r.from) / (r.next - r.from) * 100)) : 100;
  const done = d.daily[dayKey()];
  const nextLv = LEVELS.findIndex(l => !d.levels[l.i]);
  const w = Learn.wordOfDay();
  const on = navigator.onLine;
  return `
  <div class="hero">
    <div class="logo">${wordRow('mot')}${wordRow('à')}${wordRow('mot')}</div>
    <p class="tag">Change une lettre à la fois et trouve le mot !</p>
  </div>
  <div class="card me">
    <div class="av">${r.icon}</div>
    <div style="flex:1;min-width:0">
      <b>${esc(d.name ? 'Bonjour ' + d.name + ' !' : 'Bienvenue !')}</b>
      <div class="small">${esc(r.title)} · ${d.xp} points${r.next ? ` (prochain titre à ${r.next})` : ''}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>
  </div>
  <div class="menu">
    <button class="mi hot" data-act="go" data-arg="map"><span class="em">🗺️</span><div><b>Parcours</b><span class="s">${nextLv < 0 ? 'Tous les niveaux terminés ! 🎉' : 'Niveau ' + (nextLv + 1) + ' · ' + Store.stars() + '/' + LEVELS.length * 3 + ' ⭐'}</span></div></button>
    <button class="mi" data-act="daily"><span class="em">📅</span><div><b>Défi du jour</b><span class="s">${done ? 'Réussi ✓ ' + '⭐'.repeat(done.stars) : 'Le même mot pour tout le monde'}${d.streak.n ? ' · 🔥 ' + d.streak.n + ' j' : ''}</span></div>${done ? '' : '<span class="badge-dot">Nouveau</span>'}</button>
    <button class="mi" data-act="go" data-arg="duelsetup"><span class="em">⚔️</span><div><b>Duel</b><span class="s">Contre l’ordinateur · à 2 sur l’écran · en ligne</span></div></button>
    <button class="mi" data-act="go" data-arg="notebook"><span class="em">📖</span><div><b>Mon carnet</b><span class="s">${Object.keys(d.notebook).length} mots découverts · ${Object.keys(d.badges).length}/${Store.BADGES.length} succès</span></div></button>
  </div>
  ${w ? `<div class="card wod"><div style="font-size:28px">💡</div><div><div class="small">Mot du jour</div><div class="big">${esc(U(w.acc))}</div><div>${esc(w.def)}</div>${w.fact ? `<div class="small" style="margin-top:4px">${esc(w.fact)}</div>` : ''}</div></div>` : ''}
  <div class="row" style="margin-top:6px">
    <button class="btn" data-act="go" data-arg="settings">⚙️ Réglages</button>
    <button class="btn" data-act="how">❓ Aide</button>
  </div>
  ${installEvt ? '<button class="btn teal" style="margin-top:10px" data-act="install">📲 Installer l’application</button>' : ''}
  <p class="center" style="margin-top:14px"><span class="net ${on ? '' : 'off'}"><i></i>${on ? 'En ligne' : 'Hors ligne · tout fonctionne sauf le duel en ligne'}</span></p>`;
}

/* ---------- Parcours ---------- */
function viewMap() {
  const d = Store.d;
  const worlds = WORLDS.map((w, wi) => {
    const lv = LEVELS.filter(l => l.wi === wi);
    const st = lv.reduce((a, l) => a + (d.levels[l.i] || 0), 0);
    const next = LEVELS.find(l => !d.levels[l.i]);
    return `<div class="world"><h3>${w.em} ${esc(w.name)}<span class="sub">${st}/18 ⭐</span></h3><div class="lv-grid">${lv.map(l => {
      const s = d.levels[l.i] || 0, ok = unlocked(l.i);
      return `<button class="lv ${s ? 'done' : ''} ${!ok ? 'lock' : ''} ${next && next.i === l.i ? 'next' : ''}" data-act="level" data-arg="${l.i}" aria-label="Niveau ${l.i + 1}${s ? ', ' + s + ' étoiles' : ''}">${ok ? l.i + 1 : '🔒'}<small>${s ? '★'.repeat(s) : ''}</small></button>`;
    }).join('')}</div></div>`;
  }).join('');
  return `
  <div class="hdr"><button class="ib" data-act="go" data-arg="home" aria-label="Retour">←</button><h2>Parcours</h2><span class="pill">${Store.stars()} ⭐</span></div>
  ${worlds}
  <div class="card"><h3>🎲 Défi libre</h3><p class="small">Un mot de départ et d’arrivée tirés au hasard, toujours réalisables.</p>
    <label class="l">Nombre de lettres</label><div class="seg">${[3, 4, 5, 6].map(n => `<button class="${FP.len === n ? 'on' : ''}" data-act="fp" data-arg="len:${n}">${n}</button>`).join('')}</div>
    <label class="l">Distance (nombre de coups idéal)</label><div class="seg">${[2, 3, 4, 5, 6].map(n => `<button class="${FP.steps === n ? 'on' : ''}" data-act="fp" data-arg="steps:${n}">${n}</button>`).join('')}</div>
    <button class="btn primary" data-act="free">Lancer</button></div>`;
}

/* ---------- Jeu solo (parcours, défi du jour, défi libre) ---------- */
function startSolo(src, ch) {
  if (!ch) { toast('Impossible de générer ce défi, réessaie.'); return; }
  G = { kind: 'solo', src, start: ch.start, target: ch.target, opt: ch.steps, cur: ch.start, chain: [ch.start],
    sel: null, msg: '', msgInfo: false, hintWords: 0, hintStage: 0, hintIdx: -1, over: false, flash: -1, shake: false };
  go('solo');
}
const soloTitle = () => G.src.type === 'level' ? `Niveau ${G.src.i + 1}` : G.src.type === 'daily' ? 'Défi du jour' : 'Défi libre';

function keyboardHtml() {
  if (G.sel === null) return '<div class="kb"><div class="kbhint">👆 Touche la lettre à remplacer</div></div>';
  const cur = G.cur, i = G.sel;
  const usedSet = G.kind === 'solo' ? new Set(G.chain) : G.used;
  const keys = ALPHA.split('').filter(c => c !== cur[i]).map(c => {
    const w = cur.slice(0, i) + c + cur.slice(i + 1);
    const ok = Engine.valid(w) && !usedSet.has(w);
    let cls = '';
    if (Store.d.assist) {
      if (!ok) cls = 'dim';
      else if (G.kind === 'duel' && w !== G.target && Engine.dist(w, G.target) === 1) cls = 'risk';
      else cls = 'ok';
    }
    return `<button class="${cls}" data-act="key" data-arg="${c}" aria-label="${U(c)}">${U(c)}</button>`;
  });
  return `<div class="kb">${keys.join('')}</div>`;
}
function currentRow(canPlay) {
  const tiles = [...G.cur].map((c, i) => `<${canPlay ? 'button' : 'span'} class="t ${canPlay ? 'k' : ''} ${G.sel === i ? 'sel' : ''} ${G.flash === i ? 'pop' : ''} ${G.hintIdx === i ? 'hint' : ''}" ${canPlay ? `data-act="pick" data-arg="${i}" aria-label="Lettre ${i + 1} : ${U(c)}"` : ''}>${U(c)}</${canPlay ? 'button' : 'span'}>`).join('');
  return `<div class="wr cur ${G.shake ? 'shake' : ''}" style="--n:${G.cur.length}">${tiles}</div>`;
}
function targetRow() {
  return wordRow(G.target, { cls: 'target', mark: i => G.cur[i] === G.target[i] ? 'match' : '' });
}
function ladderHtml(items) { // items : [{w, p}]
  const last = items.length - 1;
  return items.map((it, i) => {
    const prev = i ? items[i - 1].w : null;
    const chg = prev ? diffIdx(prev, it.w) : -1;
    const dot = it.p >= 0 ? `<span class="dot" style="background:${COL[it.p]}"></span>` : '<span class="dot" style="background:var(--mut)"></span>';
    return `<div class="lrow ${i === last ? 'new' : ''}"><span class="n">${i}</span>${wordRow(it.w, { cls: 'small-row', chg })}${dot}</div>`;
  }).join('');
}

function viewSolo() {
  const moves = G.chain.length - 1;
  const items = G.chain.slice(0, -1).map((w, i) => ({ w, p: G.kind === 'solo' ? (i === 0 ? -1 : 0) : -1 }));
  const tip = G.src.type === 'level' && TIPS[G.src.i] !== undefined && moves === 0 ? `<div class="tip">💬 ${esc(TIPS[G.src.i])}</div>` : '';
  return `
  <div class="gamebar"><button class="ib" data-act="leave" aria-label="Quitter">✕</button><div class="ttl">${soloTitle()}</div><button class="ib" data-act="how" aria-label="Aide">❓</button></div>
  <div class="center small">3 ⭐ en ${G.opt} coups · <b>${moves}</b> coup${moves > 1 ? 's' : ''} joué${moves > 1 ? 's' : ''}</div>
  <div class="lbl">Objectif</div>${targetRow()}
  <div class="lbl">Ta chaîne</div>
  <div class="ladder" id="ladder">${ladderHtml(items)}</div>
  ${currentRow(!G.over)}
  ${tip}
  <div class="msg ${G.msgInfo ? 'info' : ''}" aria-live="polite">${esc(G.msg)}</div>
  ${keyboardHtml()}
  <div class="tools">
    <button class="btn" data-act="undo" ${moves ? '' : 'disabled'}>↩️ Annuler</button>
    <button class="btn" data-act="hint">💡 Indice${G.hintWords ? ' (' + G.hintWords + ')' : ''}</button>
    <button class="btn" data-act="restart">🔄 Départ</button>
  </div>`;
}

function fail(msg) {
  G.msg = msg; G.msgInfo = false; G.shake = true; G.sel = null;
  Sfx.bad(); Haptic.go([40, 40, 40]); render();
}
function soloPlay(c) {
  if (G.over || G.sel === null) return;
  const i = G.sel, w = G.cur.slice(0, i) + c + G.cur.slice(i + 1);
  if (!Engine.valid(w)) return fail(`« ${U(w)} » n’est pas dans mon dictionnaire.`);
  if (G.chain.includes(w)) return fail(`« ${U(w)} » est déjà dans ta chaîne.`);
  G.chain.push(w); G.cur = w; G.sel = null; G.flash = i; G.msg = ''; G.hintStage = 0; G.hintIdx = -1;
  Sfx.good(G.chain.length - 1); Haptic.go(15);
  if (w === G.target) return soloWin();
  render();
}
function soloUndo() {
  if (G.over || G.chain.length < 2) return;
  G.chain.pop(); G.cur = G.chain[G.chain.length - 1]; G.sel = null; G.msg = ''; G.hintStage = 0; G.hintIdx = -1; render();
}
function soloHint() {
  if (G.over) return;
  const next = Engine.nextOnPath(G.cur, G.target, new Set(G.chain));
  if (!next) { G.msg = 'Impasse ! Annule un coup (↩️) pour essayer un autre chemin.'; G.msgInfo = true; return render(); }
  if (G.hintStage === 0) {
    G.hintIdx = diffIdx(G.cur, next); G.hintStage = 1; G.sel = null;
    G.msg = 'Essaie de changer la lettre qui brille…'; G.msgInfo = true;
  } else {
    G.hintWords++; G.msg = `Un chemin possible : ${U(G.cur)} → ${U(next)}`; G.msgInfo = true;
    G.sel = G.hintIdx;
  }
  render();
}
async function soloWin() {
  G.over = true; G.sel = null;
  const moves = G.chain.length - 1;
  const base = moves <= G.opt ? 3 : moves <= G.opt + 2 ? 2 : 1;
  const cap = G.hintWords === 0 ? 3 : G.hintWords <= 2 ? 2 : 1;
  const stars = Math.min(base, cap);
  const d = Store.d; let gain = 0, extra = '';
  if (G.src.type === 'level') {
    const old = d.levels[G.src.i] || 0;
    if (stars > old) { gain = (stars - old) * 10 + (old ? 0 : 10); d.levels[G.src.i] = stars; }
  } else if (G.src.type === 'daily') {
    if (!d.daily[G.src.key]) {
      d.daily[G.src.key] = { stars, moves };
      d.streak.n = d.streak.last === yesterdayKey() ? d.streak.n + 1 : 1;
      d.streak.last = G.src.key; d.streak.best = Math.max(d.streak.best, d.streak.n);
      gain = 20 + stars * 10;
      if (d.streak.n > 1) extra = `🔥 ${d.streak.n} jours de suite !`;
    }
  } else gain = stars * 3;
  d.stats.solved++; addXp(gain);
  const fresh = Store.learn([...new Set(G.chain)]); Store.save();
  G.result = { stars, moves, gain, extra, fresh };
  render(); Sfx.win(); Haptic.go([30, 50, 80]);
  await sleep(650);
  if (!G || !G.over || G.kind !== 'solo') return;
  Confetti.burst(stars === 3 ? 140 : 80);
  const hasNext = G.src.type === 'level' && G.src.i + 1 < LEVELS.length;
  showModal(`
    <h2>${stars === 3 ? 'Parfait !' : stars === 2 ? 'Bravo !' : 'Bien joué !'}</h2>
    <div class="bigstars">${[1, 2, 3].map(k => `<span class="s ${k <= stars ? 'on' : ''}" style="--k:${k}">⭐</span>`).join('')}</div>
    <p class="center">${esc(U(G.start))} → ${esc(U(G.target))} en <b>${moves}</b> coups (idéal : ${G.opt})${gain ? ` · <b>+${gain}</b> pts` : ''}</p>
    ${extra ? `<p class="center"><b>${extra}</b></p>` : ''}
    ${fresh ? `<p class="center small">📖 ${fresh} nouveau${fresh > 1 ? 'x' : ''} mot${fresh > 1 ? 's' : ''} dans ton carnet</p>` : ''}
    <div class="lbl">Tu viens de croiser</div>
    <div class="learned" id="learned"><p class="small center">Recherche des définitions…</p></div>
    <div class="menu" style="margin:10px 0 0">
      ${hasNext ? '<button class="btn primary" data-act="nextlevel">Niveau suivant →</button>' : ''}
      ${G.src.type === 'daily' ? '<button class="btn teal" data-act="share">📤 Partager mon résultat</button>' : ''}
      ${G.src.type !== 'daily' ? '<button class="btn" data-act="replay">🔄 Rejouer</button>' : ''}
      <button class="btn ghost" data-act="${G.src.type === 'level' ? 'tomap' : 'tohome'}">${G.src.type === 'level' ? 'Retour au parcours' : 'Accueil'}</button>
    </div>`);
  badgeToasts();
  fillLearned(G.chain);
}
async function fillLearned(words) {
  const uniq = [...new Set(words)];
  const local = uniq.filter(w => Learn.local(w)), rest = uniq.filter(w => !Learn.local(w));
  const picks = local.slice(0, 4).concat(local.length < 4 ? rest.slice(0, 4) : []);
  const res = await Promise.all(picks.map(w => Learn.get(w)));
  const box = $('#learned'); if (!box) return;
  const shown = res.filter(Boolean).slice(0, 4);
  box.innerHTML = shown.length
    ? shown.map(r => `<div class="lw"><b>${esc(U(r.acc))}</b> — ${esc(r.def)}${r.fact ? `<span class="fact">${esc(r.fact)}</span>` : ''}</div>`).join('')
    : `<p class="small center">${navigator.onLine ? 'Pas de définition trouvée cette fois.' : 'Connecte-toi pour découvrir la définition de tous les mots !'}</p>`;
}

/* ---------- Duel ---------- */
const nameOf = i => G.mode === 'ai' && i === 1 ? 'Ordinateur' : G.names[i];
const duelMine = () => G.mode === 'ai' ? G.turn === 0 : G.mode === 'online' ? G.turn === G.me : true;
const aiTurn = () => G && G.kind === 'duel' && G.mode === 'ai' && G.turn === 1 && !G.over;

function startDuel(cfg) {
  G = { kind: 'duel', mode: cfg.mode, level: cfg.level, names: cfg.names, start: cfg.start, target: cfg.target, cur: cfg.start,
    used: new Set([cfg.start]), chain: [{ w: cfg.start, p: -1 }], turn: cfg.first || 0, moves: [0, 0], sel: null, msg: '', over: null,
    me: cfg.me || 0, flash: -1, shake: false, showDist: false, own: !!cfg.own };
  go('duel');
  if (aiTurn()) aiSchedule();
}
function viewDuel() {
  const over = !!G.over, mine = duelMine();
  const d = Engine.dist(G.cur, G.target);
  const banner = over ? '' : G.mode === 'ai'
    ? `<div class="turn ${mine ? '' : 'think'}" style="background:${COL[G.turn]}">${mine ? 'À toi de jouer !' : 'L’ordinateur réfléchit'}</div>`
    : G.mode === 'online'
      ? `<div class="turn ${mine ? '' : 'think'}" style="background:${COL[G.turn]}">${mine ? 'À toi de jouer !' : esc(nameOf(G.turn)) + ' réfléchit'}</div>`
      : `<div class="turn" style="background:${COL[G.turn]}">Tour de ${esc(nameOf(G.turn))}</div>`;
  return `
  <div class="gamebar"><button class="ib" data-act="leave" aria-label="Quitter">✕</button><div class="ttl">Duel ${G.mode === 'online' ? '· en ligne' : ''}</div><button class="ib" data-act="how" aria-label="Aide">❓</button></div>
  <div class="score">${[0, 1].map(i => `<div class="sc ${!over && G.turn === i ? 'act' : ''}" style="border-color:${COL[i]}"><span>${esc(nameOf(i))}${G.mode === 'online' && G.me === i ? ' (toi)' : ''}</span><b>${G.moves[i]}</b></div>`).join('')}</div>
  <div class="lbl">Objectif — le premier qui l’atteint gagne</div>${targetRow()}
  <div class="ladder" id="ladder">${ladderHtml(G.chain.slice(0, -1))}</div>
  ${banner}
  ${currentRow(!over && mine)}
  <div class="msg ${G.showDist ? 'info' : ''}" aria-live="polite">${G.showDist && !over ? (d === Infinity ? 'Ce mot est trop loin de l’objectif.' : d === 0 ? '' : `À ${d} étape${d > 1 ? 's' : ''} de l’objectif.`) : esc(G.msg)}</div>
  ${over || !mine ? '<div class="kb"><div class="kbhint"></div></div>' : keyboardHtml()}
  ${over ? '' : `<div class="tools"><button class="btn" data-act="dist">🧭 ${G.showDist ? 'Cacher la distance' : 'Distance'}</button><button class="btn ghost" data-act="resign" ${G.mode === 'ai' && !mine ? 'disabled' : ''}>🏳️ J’abandonne</button></div>`}
  ${Store.d.assist && !over && mine ? '<p class="small center" style="margin-top:8px">⚠️ Une lettre entourée de rouge offrirait la victoire à l’adversaire.</p>' : ''}`;
}
function duelPlay(c) {
  if (G.over || G.sel === null || !duelMine()) return;
  const i = G.sel, w = G.cur.slice(0, i) + c + G.cur.slice(i + 1);
  if (!Engine.valid(w)) return fail(`« ${U(w)} » n’est pas dans mon dictionnaire.`);
  if (G.used.has(w)) return fail(`« ${U(w)} » a déjà été joué.`);
  G.flash = i;
  if (G.mode === 'online') Online.send({ t: 'move', w });
  duelCommit(w);
}
function duelCommit(w) {
  G.sel = null; G.msg = ''; G.hintIdx = -1;
  G.flash = diffIdx(G.cur, w);
  G.used.add(w); G.chain.push({ w, p: G.turn }); G.moves[G.turn]++; G.cur = w;
  Sfx.good(G.chain.length - 1); Haptic.go(15);
  if (w === G.target) return duelEnd(G.turn, `${nameOf(G.turn)} atteint « ${U(G.target)} » en ${G.chain.length - 1} coups.`);
  G.turn = 1 - G.turn;
  if (!Engine.neighbors(w).some(x => !G.used.has(x))) return duelEnd(1 - G.turn, `${nameOf(G.turn)} est bloqué(e) : plus aucun mot possible.`);
  render();
  if (aiTurn()) aiSchedule();
}
function aiSchedule() {
  const g = G;
  setTimeout(() => {
    if (G !== g || !aiTurn()) return;
    const m = Engine.aiMove(G.cur, G.target, G.used, G.level);
    if (!m) duelEnd(0, 'L’ordinateur est bloqué : plus aucun mot possible.'); else { G.flash = -1; duelCommit(m); }
  }, 900 + Math.random() * 600);
}
async function duelEnd(w, why) {
  if (G.over) return;
  G.over = { w, why }; G.sel = null; render();
  const mineWin = G.mode === 'local' ? null : (G.mode === 'ai' ? w === 0 : w === G.me);
  const d = Store.d; d.stats.duels++;
  let gain = 8;
  if (G.mode === 'local') gain = 10;
  else if (mineWin) { d.stats.wins++; gain = 25; if (G.mode === 'ai' && G.level === 'hard') d.stats.hardWins++; if (G.mode === 'online') d.stats.onlineWins++; }
  else d.stats.losses++;
  if (G.mode === 'online') d.stats.online++;
  addXp(gain);
  Store.learn([...new Set(G.chain.map(c => c.w))]); Store.save();
  mineWin === false ? Sfx.lose() : Sfx.win();
  await sleep(600);
  if (!G || G.kind !== 'duel' || !G.over) return;
  if (mineWin !== false) Confetti.burst(110);
  const title = mineWin === null ? `${nameOf(w)} gagne !` : mineWin ? 'Victoire !' : 'Défaite…';
  const emoji = mineWin === false ? '😅' : '🏆';
  showModal(`
    <div class="center" style="font-size:54px">${emoji}</div>
    <h2>${esc(title)}</h2>
    <p class="center">${esc(why)}</p>
    <p class="center small">+${gain} points</p>
    <div class="lbl">Mots de la partie</div>
    <div class="learned" id="learned"><p class="small center">Recherche des définitions…</p></div>
    <div class="menu" style="margin:10px 0 0">
      <button class="btn primary" data-act="rematch">🔄 Rejouer</button>
      <button class="btn ghost" data-act="duelend">${G.mode === 'online' ? 'Quitter le salon' : 'Menu'}</button>
    </div>`);
  badgeToasts();
  fillLearned(G.chain.map(c => c.w));
}

/* ---------- Duel : préparation ---------- */
function readInputs() {
  const g = id => { const e = $('#' + id); return e ? e.value : null; };
  const n1 = g('n1'), n2 = g('n2'), cs = g('cs'), ct = g('ct'), code = g('code');
  if (n1 !== null) { DS.n1 = n1.trim(); if (DS.mode !== 'local') Store.d.name = DS.n1.slice(0, 14); }
  if (n2 !== null) DS.n2 = n2.trim();
  if (cs !== null) DS.s = cs.trim();
  if (ct !== null) DS.t = ct.trim();
  if (code !== null) DS.code = code.trim().toUpperCase();
}
function viewDuelSetup() {
  const m = DS.mode;
  const n1 = DS.n1 || Store.d.name || '';
  return `
  <div class="hdr"><button class="ib" data-act="go" data-arg="home" aria-label="Retour">←</button><h2>Duel</h2><span style="width:42px"></span></div>
  <div class="card">
    <p class="small" style="margin-top:0">Chacun son tour, changez une lettre pour former un vrai mot. Celui qui atteint le mot objectif gagne. Un mot déjà joué est interdit, et si tu es bloqué, tu perds !</p>
    <label class="l">Mode</label>
    <div class="seg"><button class="${m === 'ai' ? 'on' : ''}" data-act="ds" data-arg="mode:ai">🤖 Ordinateur</button><button class="${m === 'local' ? 'on' : ''}" data-act="ds" data-arg="mode:local">👥 À 2 ici</button><button class="${m === 'online' ? 'on' : ''}" data-act="ds" data-arg="mode:online">🌍 En ligne</button></div>
    ${m === 'ai' ? `<label class="l">Niveau de l’ordinateur</label><div class="seg">${[['easy', 'Facile'], ['mid', 'Moyen'], ['hard', 'Difficile']].map(([k, v]) => `<button class="${DS.level === k ? 'on' : ''}" data-act="ds" data-arg="level:${k}">${v}</button>`).join('')}</div>` : ''}
    <label class="l">${m === 'local' ? 'Prénoms' : 'Ton prénom'}</label>
    <div class="row"><input type="text" id="n1" maxlength="14" placeholder="${m === 'local' ? 'Joueur 1' : 'Ton prénom'}" value="${esc(n1)}">${m === 'local' ? `<input type="text" id="n2" maxlength="14" placeholder="Joueur 2" value="${esc(DS.n2)}">` : ''}</div>
    ${m !== 'online' ? `<label class="l">Choix des mots</label><div class="seg"><button class="${!DS.own ? 'on' : ''}" data-act="ds" data-arg="own:0">🎲 Au hasard</button><button class="${DS.own ? 'on' : ''}" data-act="ds" data-arg="own:1">✍️ Je les choisis</button></div>` : ''}
    ${DS.own && m !== 'online'
      ? `<div class="row"><input type="text" id="cs" placeholder="Départ" maxlength="10" value="${esc(DS.s)}"><input type="text" id="ct" placeholder="Arrivée" maxlength="10" value="${esc(DS.t)}"></div><p class="small">Deux mots de même longueur. Les accents sont ignorés.</p>`
      : `<label class="l">Distance entre les mots</label><div class="seg">${[['easy', 'Courte'], ['mid', 'Moyenne'], ['hard', 'Longue']].map(([k, v]) => `<button class="${DS.diff === k ? 'on' : ''}" data-act="ds" data-arg="diff:${k}">${v}</button>`).join('')}</div>
         <label class="l">Nombre de lettres</label><div class="seg">${[3, 4, 5, 6].map(n => `<button class="${DS.len === n ? 'on' : ''}" data-act="ds" data-arg="len:${n}">${n}</button>`).join('')}</div>`}
    <div class="msg" id="smsg">${esc(OL.err)}</div>
    ${m === 'online'
      ? `<button class="btn primary" data-act="olhost" ${navigator.onLine ? '' : 'disabled'}>🏠 Créer un salon</button>
         <p class="center small" style="margin:10px 0 4px">— ou rejoindre un ami —</p>
         <div class="row"><input type="text" class="code" id="code" maxlength="4" placeholder="CODE" value="${esc(DS.code)}" autocapitalize="characters" autocomplete="off"><button class="btn teal" data-act="oljoin" ${navigator.onLine ? '' : 'disabled'} style="flex:0 0 120px">Rejoindre</button></div>
         ${navigator.onLine ? '<p class="small center" style="margin-top:10px">Le duel en ligne relie directement les deux appareils. Il faut une connexion internet.</p>' : '<p class="msg">Tu es hors ligne : le duel en ligne n’est pas disponible. Les autres modes marchent sans connexion.</p>'}`
      : '<button class="btn primary" data-act="duelgo">Jouer</button>'}
  </div>`;
}
function duelCfgFromSetup() {
  const names = DS.mode === 'ai' ? [DS.n1 || Store.d.name || 'Joueur', 'Ordinateur'] : [DS.n1 || 'Joueur 1', DS.n2 || 'Joueur 2'];
  let start, target;
  if (DS.own) {
    const s = Engine.norm(DS.s), t = Engine.norm(DS.t);
    if (!s || !t || s === t) return { err: 'Écris deux mots différents.' };
    if (s.length !== t.length) return { err: 'Les deux mots doivent avoir le même nombre de lettres.' };
    if (!Engine.valid(s) || !Engine.valid(t)) return { err: `« ${U(!Engine.valid(s) ? s : t)} » est introuvable dans le dictionnaire.` };
    if (Engine.dist(s, t) === Infinity) return { err: 'Ces deux mots ne sont pas reliés : aucune solution possible.' };
    start = s; target = t;
  } else {
    const ch = Engine.challenge(DS.len, { easy: 3, mid: 4, hard: 5 }[DS.diff], Math.random, PREF);
    if (!ch) return { err: 'Impossible de trouver un défi, réessaie.' };
    start = ch.start; target = ch.target;
  }
  return { cfg: { mode: DS.mode, level: DS.level, names, start, target, first: 0, me: 0, own: DS.own } };
}

/* ---------- Duel en ligne ---------- */
function viewLobby() {
  const host = OL.role === 'host';
  let body;
  if (OL.status === 'error') {
    body = `<p class="msg" style="min-height:0">${esc(OL.err)}</p><button class="btn primary" data-act="ollobbyback">Retour</button>`;
  } else if (host && OL.status === 'waiting') {
    body = `<p class="center">Partage ce code avec ton adversaire :</p>
      <div class="code-big">${wordRow(OL.code)}</div>
      <p class="center small think">En attente de l’adversaire</p>
      <button class="btn teal" data-act="olshare">📤 Partager le code</button>
      <button class="btn ghost" style="margin-top:10px" data-act="ollobbyback">Annuler</button>`;
  } else {
    body = `<p class="center think">${host ? 'Création du salon' : 'Connexion au salon ' + esc(OL.code)}</p><button class="btn ghost" style="margin-top:10px" data-act="ollobbyback">Annuler</button>`;
  }
  return `<div class="hdr"><button class="ib" data-act="ollobbyback" aria-label="Retour">←</button><h2>Duel en ligne</h2><span style="width:42px"></span></div><div class="card">${body}</div>`;
}
async function olHost() {
  readInputs(); OL.err = ''; OL.role = 'host'; OL.status = 'creating'; OL.first = 0; OL.peerName = '';
  Online.on(olHandler); go('lobby');
  try { OL.code = await Online.host(); OL.status = 'waiting'; if (screen === 'lobby') render(); }
  catch (e) { OL.status = 'error'; OL.err = e && e.message ? e.message : 'Connexion impossible.'; if (screen === 'lobby') render(); }
}
async function olJoin() {
  readInputs();
  const code = (DS.code || '').toUpperCase();
  if (!/^[A-Z]{4}$/.test(code)) { OL.err = 'Entre le code à 4 lettres du salon.'; return render(); }
  OL.err = ''; OL.role = 'guest'; OL.code = code; OL.status = 'joining'; OL.first = 0;
  Online.on(olHandler); go('lobby');
  try { await Online.join(code); }
  catch (e) { OL.status = 'error'; OL.err = e && e.message ? e.message : 'Connexion impossible.'; if (screen === 'lobby') render(); }
}
function hostStart() {
  const ch = Engine.challenge(DS.len, { easy: 3, mid: 4, hard: 5 }[DS.diff], Math.random, PREF);
  if (!ch) return;
  const names = [myName(), OL.peerName || 'Adversaire'];
  const msg = { t: 'start', start: ch.start, target: ch.target, first: OL.first, names };
  Online.send(msg);
  startDuel({ mode: 'online', names, start: ch.start, target: ch.target, first: OL.first, me: 0 });
}
function olHandler(m) {
  switch (m.t) {
    case 'open': Online.send({ t: 'hi', name: myName() }); break;
    case 'hi': OL.peerName = String(m.name || 'Adversaire').slice(0, 14); if (OL.role === 'host') hostStart(); break;
    case 'start':
      if (OL.role === 'guest' && typeof m.start === 'string' && Engine.valid(m.start) && Engine.valid(m.target)) {
        closeModal(); OL.status = 'connected';
        startDuel({ mode: 'online', names: m.names, start: m.start, target: m.target, first: m.first || 0, me: 1 });
      }
      break;
    case 'move':
      if (G && G.kind === 'duel' && G.mode === 'online' && !G.over && G.turn !== G.me && typeof m.w === 'string'
        && Engine.valid(m.w) && !G.used.has(m.w) && oneLetter(G.cur, m.w)) { G.flash = diffIdx(G.cur, m.w); duelCommit(m.w); }
      break;
    case 'resign':
      if (G && G.mode === 'online' && !G.over) duelEnd(G.me, `${nameOf(1 - G.me)} abandonne.`);
      break;
    case 'rematch':
      if (OL.role === 'host') { closeModal(); OL.first = 1 - OL.first; hostStart(); }
      break;
    case 'close':
      if (G && G.mode === 'online' && !G.over && screen === 'duel') duelEnd(G.me, `${nameOf(1 - G.me)} a quitté la partie.`);
      else if (screen === 'lobby') { OL.status = 'error'; OL.err = 'La connexion a été interrompue.'; render(); }
      break;
  }
}
function olLeave() { Online.on(() => {}); Online.close(); OL.status = 'idle'; OL.role = null; }

/* ---------- Carnet & succès ---------- */
function viewNotebook() {
  const d = Store.d;
  const all = Object.keys(d.notebook).sort();
  const list = all.filter(w => !NBF || (NBF === 6 ? w.length >= 6 : w.length === NBF));
  return `
  <div class="hdr"><button class="ib" data-act="go" data-arg="home" aria-label="Retour">←</button><h2>Mon carnet</h2><span class="pill">${all.length} mots</span></div>
  <div class="card"><h3 style="margin-bottom:10px">🏅 Succès</h3><div class="bd">${Store.BADGES.map(b => `<div class="${d.badges[b.id] ? '' : 'off'}"><span class="i">${b.icon}</span><b>${esc(b.name)}</b>${esc(b.desc)}</div>`).join('')}</div></div>
  <div class="card"><h3 style="margin-bottom:6px">📖 Mots découverts</h3>
    <div class="seg">${[[0, 'Tous'], [3, '3'], [4, '4'], [5, '5'], [6, '6+']].map(([k, v]) => `<button class="${NBF === k ? 'on' : ''}" data-act="nbf" data-arg="${k}">${v}</button>`).join('')}</div>
    ${list.length ? `<div class="nb">${list.map(w => `<button data-act="word" data-arg="${w}">${esc(w)}</button>`).join('')}</div><p class="small" style="margin-top:10px">Touche un mot pour voir sa définition.</p>` : '<p class="small">Joue pour remplir ton carnet : chaque mot que tu utilises y est ajouté.</p>'}
  </div>
  <div class="card"><h3 style="margin-bottom:6px">📊 Statistiques</h3><p class="small" style="margin:0">Niveaux terminés : ${Object.keys(d.levels).length}/${LEVELS.length} · Défis du jour : ${Object.keys(d.daily).length} (meilleure série : ${d.streak.best}) · Duels : ${d.stats.duels} (${d.stats.wins} victoires)</p></div>`;
}
async function showWord(w) {
  showModal(`<h2>${esc(U(w))}</h2><p class="center small" id="wdef">Recherche de la définition…</p><button class="btn" style="margin-top:14px" data-act="close">Fermer</button>`);
  const r = await Learn.get(w);
  const el = $('#wdef'); if (!el) return;
  el.className = '';
  el.innerHTML = r ? `<span class="small">${r.acc !== w ? esc(r.acc) : ''}</span><br>${esc(r.def)}${r.fact ? `<span class="lw" style="display:block;margin-top:10px"><span class="fact">${esc(r.fact)}</span></span>` : ''}`
    : `<span class="small">${navigator.onLine ? 'Pas de définition trouvée pour ce mot.' : 'Connecte-toi pour voir la définition de ce mot.'}</span>`;
}

/* ---------- Réglages & aide ---------- */
function toggle(key, label, sub) {
  return `<div class="set"><div>${label}<small>${sub}</small></div><button class="sw ${Store.d[key] ? 'on' : ''}" role="switch" aria-checked="${!!Store.d[key]}" aria-label="${esc(label)}" data-act="tg" data-arg="${key}"></button></div>`;
}
function viewSettings() {
  return `
  <div class="hdr"><button class="ib" data-act="go" data-arg="home" aria-label="Retour">←</button><h2>Réglages</h2><span style="width:42px"></span></div>
  <div class="card">
    <label class="l" style="margin-top:0">Ton prénom</label><input type="text" id="sname" maxlength="14" value="${esc(Store.d.name)}" placeholder="Joueur">
    ${toggle('sound', '🔊 Effets sonores', 'Sons des lettres, victoires…')}
    ${toggle('music', '🎵 Musique douce', 'Une ambiance calme en fond')}
    ${toggle('vibe', '📳 Vibrations', 'Sur téléphone')}
    ${toggle('assist', '🧭 Lettres possibles', 'Met en valeur les lettres qui forment un vrai mot. Désactive pour un défi plus corsé !')}
  </div>
  <div class="card"><h3>Hors ligne</h3><p class="small">Une fois chargé, le jeu fonctionne sans connexion : parcours, défi du jour, duel contre l’ordinateur et à deux. Seuls le duel en ligne et les définitions de certains mots demandent internet.</p>
  <p class="small">Le dictionnaire est affiché sans accents (CAFE pour « café »).</p></div>
  <button class="btn" data-act="resetask" style="color:var(--bad)">Effacer ma progression</button>`;
}
function howHtml() {
  return `<h2>Comment jouer ?</h2>
  <div class="demo">${['chat', 'char', 'cher', 'chef'].map((w, i, a) => `<div class="lrow">${wordRow(w, { cls: 'small-row', chg: i ? diffIdx(a[i - 1], w) : -1 })}</div>`).join('')}</div>
  <ol class="how"><li><b>Change une seule lettre</b> à la fois pour former un nouveau mot.</li>
  <li>Chaque étape doit être <b>un vrai mot</b> : CHAT → CHAR → CHER → CHEF.</li>
  <li>Atteins le <b>mot objectif</b> en un minimum de coups pour gagner jusqu’à 3 ⭐.</li>
  <li><b>En duel</b>, chacun joue à son tour. Ne laisse pas l’adversaire à une lettre de l’objectif !</li></ol>
  <button class="btn primary" data-act="howok">C’est parti !</button>`;
}

/* ---------- Rendu ---------- */
const VIEWS = { home: viewHome, map: viewMap, solo: () => viewSolo(), duelsetup: viewDuelSetup, duel: () => viewDuel(), lobby: viewLobby, notebook: viewNotebook, settings: viewSettings };
function render() {
  const app = $('#app');
  app.innerHTML = VIEWS[screen]();
  if (G) { G.flash = -1; G.shake = false; }
  const lad = $('#ladder'); if (lad) lad.scrollTop = lad.scrollHeight;
  const sn = $('#sname'); if (sn) sn.oninput = () => { Store.d.name = sn.value.trim().slice(0, 14); Store.save(); };
}
function go(s) {
  screen = s; render();
  const app = $('#app'); app.classList.remove('x'); void app.offsetWidth; app.classList.add('x');
  window.scrollTo(0, 0);
}

/* ---------- Actions ---------- */
function press(c) { if (!G) return; if (G.kind === 'solo') soloPlay(c); else duelPlay(c); }
function setKV(obj, arg, cb) {
  const [k, v] = arg.split(':'); obj[k] = /^\d+$/.test(v) ? +v : v; if (cb) cb(k, v); render();
}
const ACT = {
  go(a) { if (screen === 'duelsetup') readInputs(); if (a === 'home') { G = null; } go(a); },
  close() { closeModal(); },
  how() { showModal(howHtml()); },
  howok() { Store.d.seenHow = true; Store.save(); closeModal(); },
  install() { if (installEvt) { installEvt.prompt(); installEvt = null; render(); } },
  level(a) { const i = +a; if (!unlocked(i)) return; startSolo({ type: 'level', i }, levelChallenge(i)); },
  daily() { const key = dayKey(); startSolo({ type: 'daily', key }, dailyChallenge(key)); },
  fp(a) { setKV(FP, a); },
  free() { startSolo({ type: 'free' }, Engine.challenge(FP.len, FP.steps, Math.random, PREF)); },
  pick(a) {
    if (!G || G.over || (G.kind === 'duel' && !duelMine())) return;
    const i = +a; G.sel = G.sel === i ? null : i; G.msg = ''; G.hintIdx = -1; Sfx.pick(); render();
  },
  key(a) { press(a); },
  undo() { soloUndo(); },
  hint() { soloHint(); },
  restart() { if (G && !G.over) { G.chain = [G.start]; G.cur = G.start; G.sel = null; G.msg = ''; G.hintStage = 0; G.hintIdx = -1; render(); } },
  leave() { if (G && !G.over && (G.kind === 'duel' || G.chain.length > 1)) ask('Quitter la partie ?', 'leaveyes', '', 'Quitter'); else ACT.leaveyes(); },
  leaveyes() {
    closeModal();
    if (G && G.kind === 'duel' && G.mode === 'online' && !G.over) Online.send({ t: 'resign' });
    if (G && G.mode === 'online') olLeave();
    const back = G && G.kind === 'solo' && G.src.type === 'level' ? 'map' : G && G.kind === 'duel' ? 'duelsetup' : 'home';
    G = null; go(back);
  },
  tomap() { closeModal(); G = null; go('map'); },
  tohome() { closeModal(); G = null; go('home'); },
  nextlevel() { closeModal(); const i = G.src.i + 1; startSolo({ type: 'level', i }, levelChallenge(i)); },
  replay() { closeModal(); startSolo(G.src, G.src.type === 'level' ? levelChallenge(G.src.i) : Engine.challenge(FP.len, FP.steps, Math.random, PREF)); },
  share() {
    const r = G.result, text = `Mot à mot · ${G.src.key}\n${U(G.start)} → ${U(G.target)}\n${'⭐'.repeat(r.stars)} en ${r.moves} coups (idéal : ${G.opt})`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Résultat copié 📋'), () => {});
  },
  dist() { G.showDist = !G.showDist; render(); },
  resign() { if (G && !G.over) ask('Abandonner la partie ?', 'resignyes', '', 'Abandonner'); },
  resignyes() {
    closeModal(); if (!G || G.over) return;
    if (G.mode === 'online') { Online.send({ t: 'resign' }); duelEnd(1 - G.me, `${nameOf(G.me)} abandonne.`); }
    else if (G.mode === 'ai') duelEnd(1, `${nameOf(0)} abandonne.`);
    else duelEnd(1 - G.turn, `${nameOf(G.turn)} abandonne.`);
  },
  ds(a) { readInputs(); OL.err = ''; setKV(DS, a, (k, v) => { if (k === 'own') DS.own = v === '1' || v === 1; }); },
  duelgo() {
    readInputs(); const r = duelCfgFromSetup();
    if (r.err) { OL.err = r.err; render(); return; }
    OL.err = ''; startDuel(r.cfg);
  },
  rematch() {
    closeModal();
    if (G.mode === 'online') {
      if (!Online.connected()) { toast('Ton adversaire n’est plus connecté.'); return; }
      if (OL.role === 'host') { OL.first = 1 - OL.first; hostStart(); }
      else { Online.send({ t: 'rematch' }); toast('Demande envoyée à ' + (G.names[0] || 'l’hôte')); }
      return;
    }
    const keep = G.own ? { start: G.start, target: G.target } : null;
    let cfg;
    if (keep) cfg = { mode: G.mode, level: G.level, names: G.names, start: keep.start, target: keep.target, first: 0, me: 0, own: true };
    else { const r = duelCfgFromSetup(); cfg = r.cfg || { mode: G.mode, level: G.level, names: G.names, ...Engine.challenge(DS.len, 4, Math.random), first: 0, me: 0 }; cfg.names = G.names; }
    startDuel(cfg);
  },
  duelend() { closeModal(); if (G && G.mode === 'online') olLeave(); G = null; go('duelsetup'); },
  olhost() { olHost(); },
  oljoin() { olJoin(); },
  ollobbyback() { olLeave(); OL.err = ''; G = null; go('duelsetup'); },
  olshare() {
    const text = `Rejoins mon duel Mot à mot ! Code du salon : ${OL.code}`;
    if (navigator.share) navigator.share({ text, url: location.href }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Code copié 📋'), () => {});
  },
  nbf(a) { NBF = +a; render(); },
  word(a) { showWord(a); },
  tg(a) {
    Store.d[a] = !Store.d[a]; Store.save();
    if (a === 'music') Sfx.music(Store.d.music);
    render();
  },
  resetask() { ask('Effacer toute ta progression ?', 'resetyes', '', 'Effacer'); },
  resetyes() { Store.reset(); closeModal(); toast('Progression effacée'); go('home'); },
};

document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('modal-bg')) return closeModal();
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { Sfx.unlock(); if (!['key', 'pick'].includes(el.dataset.act)) Sfx.tap(); fn(el.dataset.arg, el); }
}, false);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') return closeModal();
  if (!G || G.over || (screen !== 'solo' && screen !== 'duel') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  const n = G.cur.length;
  if (e.key === 'ArrowLeft') { G.sel = G.sel === null ? n - 1 : (G.sel + n - 1) % n; render(); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { G.sel = G.sel === null ? 0 : (G.sel + 1) % n; render(); e.preventDefault(); }
  else if (e.key === 'Backspace' && G.kind === 'solo') soloUndo();
  else if (/^[1-9]$/.test(e.key) && +e.key <= n) { if (G.kind === 'duel' && !duelMine()) return; G.sel = +e.key - 1; render(); }
  else if (e.key.length === 1) {
    const c = Engine.norm(e.key);
    if (/^[a-z]$/.test(c) && G.sel !== null) press(c);
  }
});
window.addEventListener('online', () => { if (screen === 'home') render(); });
window.addEventListener('offline', () => { if (screen === 'home') render(); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (screen === 'home') render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('Application installée 🎉'); });

/* ---------- Démarrage ---------- */
(function boot() {
  const bg = document.querySelector('.bg');
  if (bg) bg.innerHTML = 'MOTALETRE'.split('').concat('CHAINE'.split('')).map((c, i) =>
    `<span style="left:${(i * 7.3) % 96}%;animation-duration:${22 + (i * 5) % 18}s;animation-delay:-${(i * 3) % 20}s;font-size:${28 + (i * 7) % 30}px">${c}</span>`).join('');
  document.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });
  render();
  const app = $('#app'); app.classList.add('x');
  if (!Store.d.seenHow) setTimeout(() => { if (screen === 'home') showModal(howHtml()); }, 500);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
