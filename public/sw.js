// Scolaris hors connexion : l'application (pages, styles, polices, images) est gardée sur le téléphone.
// Réseau d'abord (toujours la dernière version), copie du téléphone si le réseau ne répond pas.
// Les données de l'école ne passent pas ici : l'application les garde elle-même (voir api.ts).
const CACHE = 'scolaris-app-v2';
const BASE = ['/', '/app.js', '/app.css', '/manifest.json', '/img/icone.png', '/fonts/inter-400.woff', '/fonts/inter-500.woff', '/fonts/inter-600.woff', '/fonts/inter-700.woff', '/fonts/poppins-600.woff2', '/fonts/poppins-700.woff2', '/fonts/poppins-800.woff2',
  '/bienvenue/', '/bienvenue/page.js', '/bienvenue/demo.jpg', '/bienvenue/icone.png', '/bienvenue/serge.jpg', '/bienvenue/whatsapp.png', '/bienvenue/tiktok.png', '/bienvenue/youtube.png', '/bienvenue/facebook.png', '/bienvenue/inter-400.woff', '/bienvenue/inter-500.woff', '/bienvenue/inter-600.woff', '/bienvenue/poppins-600.woff2', '/bienvenue/poppins-700.woff2', '/bienvenue/poppins-800.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((l) => Promise.all(l.filter((k) => k.startsWith('scolaris-app-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Dernier recours (rien de gardé encore) : une page Scolaris plutôt que l'écran d'erreur du navigateur.
const HORS = '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scolaris</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0B2A78;color:#fff;font-family:sans-serif;text-align:center;padding:24px"><div><img src="/img/icone.png" width="72" height="72" alt="" style="border-radius:18px"><h1 style="font-size:20px">Pas de connexion</h1><p style="opacity:.85;max-width:300px">Ouvrez Scolaris une première fois avec du réseau : ensuite, l\'application fonctionnera même sans internet.</p></div></body></html>';
const delai = (ms) => new Promise((_, non) => setTimeout(() => non(new Error('lent')), ms));

self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname === '/sw.js' || /\.mp4$/.test(u.pathname)) return;
  const page = r.mode === 'navigate';
  const cle = page ? (u.pathname.startsWith('/bienvenue') ? '/bienvenue/' : '/') : u.pathname;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      // Une page attend 6 s au plus : au-delà (réseau très lent), on ouvre la copie du téléphone.
      const rep = await Promise.race([fetch(r), delai(page || cle === '/app.js' ? 6000 : 10000)]);
      if (rep.ok) c.put(cle, rep.clone());
      return rep;
    } catch {
      const garde = (await c.match(cle)) || (page ? (await c.match('/')) || (await c.match('/bienvenue/')) : null);
      if (garde) return garde;
      if (page) return new Response(HORS, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return fetch(r);
    }
  })());
});
