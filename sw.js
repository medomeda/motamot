/* Service worker : met le jeu en cache pour qu'il fonctionne sans connexion.
   Une nouvelle version s'installe en arrière-plan puis attend que le joueur accepte la mise à jour. */
importScripts('js/version.js');
const VERSION = 'motamot-' + APP_VERSION;
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/version.js', 'js/words.js', 'js/engine.js', 'js/store.js', 'js/learn.js', 'js/fx.js', 'js/online.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
const PEER = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';

self.addEventListener('install', e => {
  // cache:'reload' : on récupère les fichiers frais, pas ceux du cache HTTP du navigateur
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' }))))));
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && req.url !== PEER) return;          // Wiktionnaire, signalisation PeerJS… : réseau direct
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;                                  // cache d'abord, mise à jour en arrière-plan
    }).catch(() => caches.match('index.html'))
  );
});
