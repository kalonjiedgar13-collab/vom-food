// Service Worker pour l'Application Web Progressive (PWA) VOM FOOD
const CACHE_NAME = 'vom-food-webapp-v1.53.0';
// NOTE : la vidéo ./public/assets/loading-video.mp4 n'est PAS pré-cachée
// (fichier ajouté par le gérant, parfois lourd) : elle est mise en cache
// automatiquement à la première lecture grâce au gestionnaire fetch ci-dessous.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './welcome.html',
  './admin.html',
  './profil.html',
  './creer-compte.html',
  './manifest.json',
  './css/styles.css',
  './css/admin.css',
  './css/auth.css',
  './js/app.js',
  './js/admin.js',
  './js/sync.js',
  './public/icons/favicon-32x32.png',
  './public/icons/apple-touch-icon.png',
  './public/icons/icon-192x192.png',
  './public/icons/icon-512x512.png',
  './public/assets/chef.jpg',
  './public/assets/vom_logo_transparent.png',
  './public/assets/plate_icon_transparent.png',
  './public/assets/hero1.jpg',
  './public/assets/hero2.jpg',
  './public/assets/hero3.jpg',
  './public/assets/hero4.jpg',
  './public/assets/thumb_hero1.jpg',
  './public/assets/thumb_hero2.jpg',
  './public/assets/thumb_hero3.jpg',
  './public/assets/thumb_hero4.jpg',
  './public/assets/loading-animation.svg'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[VOM FOOD WebApp] Mise en cache des ressources');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[VOM FOOD WebApp] Avertissement cache initial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation & Nettoyage
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[VOM FOOD WebApp] Nettoyage ancien cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch (Réseau d'abord → toujours la dernière version ; cache en secours hors-ligne)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Ne jamais intercepter l'API temps réel (synchronisation client ⇄ admin)
  if (event.request.url.indexOf('/api/') !== -1) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
