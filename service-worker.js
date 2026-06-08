const CACHE_NAME = 'arpa-suite-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/arpa-brand.js',
  './js/arpa-pricing.js',
  './js/arpa-cobros.js',
  './js/arpa-signature.js',
  './js/arpa-cotizacion.js',
  './js/arpa-views.js',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n.startsWith('arpa-suite-cache-') && n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        fetch(event.request).then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(event.request).then((res) => {
        if (
          res &&
          res.status === 200 &&
          (event.request.url.startsWith(self.location.origin) ||
            event.request.url.includes('fonts.googleapis.com') ||
            event.request.url.includes('fonts.gstatic.com'))
        ) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        const accept = event.request.headers.get('accept') || '';
        if (accept.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
