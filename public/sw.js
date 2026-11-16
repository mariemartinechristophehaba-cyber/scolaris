// Scolaris hors connexion : l'application (pages, styles, polices, images) est gardée sur le téléphone.
// Réseau d'abord (toujours la dernière version), copie du téléphone si le réseau ne répond pas.
// Les données de l'école ne passent pas ici : l'application les garde elle-même (voir api.ts).
const CACHE = 'scolaris-app-v1';
const BASE = ['/', '/app.js', '/app.css', '/manifest.json', '/img/icone.png', '/fonts/inter-400.woff', '/fonts/inter-500.woff', '/fonts/inter-600.woff', '/fonts/inter-700.woff', '/fonts/poppins-600.woff2', '/fonts/poppins-700.woff2', '/fonts/poppins-800.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((l) => Promise.all(l.filter((k) => k.startsWith('scolaris-app-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const delai = (ms) => new Promise((_, non) => setTimeout(() => non(new Error('lent')), ms));

self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/bienvenue') || u.pathname === '/sw.js') return;
  const page = r.mode === 'navigate';
  const cle = page ? '/' : u.pathname;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      // Une page attend 6 s au plus : au-delà (réseau très lent), on ouvre la copie du téléphone.
      const rep = await Promise.race([fetch(r), delai(page || cle === '/app.js' ? 6000 : 10000)]);
      if (rep.ok) c.put(cle, rep.clone());
      return rep;
    } catch {
      const garde = await c.match(cle);
      if (garde) return garde;
      return fetch(r);
    }
  })());
});
