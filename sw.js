const CACHE = 'ecoliers-v5';

const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  // Fonds & jeux
  './fond bois.png',
  './Gobang.png',
  './CarreDas.png',
  './TTT.png',
  './P4.png',
  './Othello.png',
  './PFC_carte.png',
  './Croix.png',
  './Cercle.png',
  './Cercle_rouge.png',
  './Eau.png',
  './Boum.png',
  './Pierre.png',
  './feuille.png',
  './Ciseaux.png',
  './pierre-papier-ciseaux.png',
  './01PorteAvions.png',
  './01Croiseur.png',
  './01Fregate.png',
  './01Destroyer.png',
  './01SousMarin.png',
  // Avatars
  './avatars/g0.jpg',
  './avatars/g1.jpg',
  './avatars/g2.jpg',
  './avatars/g3.jpg',
  './avatars/g5.jpg',
  './avatars/g6.jpg',
  './avatars/f1.jpg',
  './avatars/f2.jpg',
  './avatars/f3.jpg',
  './avatars/f5.jpg',
  './avatars/f6.jpg',
  './avatars/f7.jpg',
];

// Installation : mise en cache de tous les assets statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : cache-first pour les assets locaux, network-first pour Supabase & Google Fonts
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase et APIs externes : toujours réseau
  if (url.hostname.includes('supabase') || url.hostname.includes('googleapis')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Google Fonts CSS : stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open('ecoliers-fonts').then(async c => {
        const cached = await c.match(e.request);
        const fresh = fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }).catch(() => null);
        return cached || fresh;
      })
    );
    return;
  }

  // index.html : toujours réseau (pour recevoir les mises à jour immédiatement)
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(r => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Assets locaux : cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      });
    })
  );
});
