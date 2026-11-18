'use strict';
/* Duel en ligne : connexion directe entre les deux appareils (WebRTC via PeerJS).
   Seule la mise en relation passe par le service public de PeerJS ; les coups circulent ensuite de joueur à joueur. */
const Online = (function () {
  const PEER_URL = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  const PREFIX = 'motamot-';
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I ni O pour éviter les confusions
  let peer = null, conn = null, listener = () => {};

  const emit = m => { try { listener(m); } catch (e) { console.error(e); } };

  function loadLib() {
    return new Promise((res, rej) => {
      if (window.Peer) return res();
      const s = document.createElement('script');
      const t = setTimeout(() => rej(new Error('Délai dépassé : connexion requise.')), 9000);
      s.src = PEER_URL;
      s.onload = () => { clearTimeout(t); res(); };
      s.onerror = () => { clearTimeout(t); rej(new Error('Impossible de charger le service en ligne. Vérifie ta connexion.')); };
      document.head.appendChild(s);
    });
  }

  function wire(c) {
    conn = c;
    c.on('open', () => emit({ t: 'open' }));
    if (c.open) emit({ t: 'open' });
    c.on('data', m => { if (m && typeof m === 'object') emit(m); });
    c.on('close', () => { if (conn === c) { conn = null; emit({ t: 'close' }); } });
    c.on('error', () => emit({ t: 'close' }));
  }

  function newPeer(id) {
    return new Promise((res, rej) => {
      const p = id ? new Peer(id) : new Peer();
      const t = setTimeout(() => { p.destroy(); rej(new Error('Le service de mise en relation ne répond pas.')); }, 10000);
      p.on('open', () => { clearTimeout(t); res(p); });
      p.on('error', e => { clearTimeout(t); rej(e); });
    });
  }

  function randomCode() {
    let s = '';
    for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  }

  return {
    available: () => navigator.onLine,
    on(fn) { listener = fn; },
    async host() {
      this.close();
      await loadLib();
      for (let k = 0; k < 6; k++) {
        const code = randomCode();
        try {
          peer = await newPeer(PREFIX + code);
          peer.on('connection', c => { if (conn) { c.on('open', () => c.close()); return; } wire(c); });
          peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* ignore */ } });
          return code;
        } catch (e) {
          if (!(e && e.type === 'unavailable-id')) throw e;
        }
      }
      throw new Error('Impossible de créer un salon, réessaie.');
    },
    async join(code) {
      this.close();
      await loadLib();
      peer = await newPeer();
      return new Promise((res, rej) => {
        const c = peer.connect(PREFIX + code.toUpperCase(), { reliable: true });
        const t = setTimeout(() => { rej(new Error('Salon introuvable.')); }, 10000);
        peer.on('error', e => { clearTimeout(t); rej(e && e.type === 'peer-unavailable' ? new Error('Salon introuvable : vérifie le code.') : e); });
        c.on('open', () => { clearTimeout(t); wire(c); res(); });
      });
    },
    send(m) { if (conn && conn.open) { conn.send(m); return true; } return false; },
    connected: () => !!(conn && conn.open),
    close() {
      const c = conn, p = peer; conn = null; peer = null;
      try { c && c.close(); } catch (e) { /* ignore */ }
      try { p && p.destroy(); } catch (e) { /* ignore */ }
    },
  };
})();
