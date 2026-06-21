const CACHE_NAME = 'arpa-suite-cache-v66';
const BASE = self.location.pathname.replace(/service-worker\.js$/, '');
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192x192.png',
  BASE + 'logo-arpa-suite.png',
  BASE + 'js/arpa-brand.js',
  BASE + 'js/arpa-trial-capture.js',
  BASE + 'js/arpa-cloud-sync.js',
  BASE + 'js/arpa-license.js',
  BASE + 'js/arpa-numeracion.js',
  BASE + 'js/arpa-catalogo.js',
  BASE + 'js/arpa-pricing.js',
  BASE + 'js/arpa-cobros.js',
  BASE + 'js/arpa-signature.js',
  BASE + 'js/arpa-cotizacion.js',
  BASE + 'js/catalogo-bft-nas.js',
  BASE + 'js/arpa-mi-catalogo.js',
  BASE + 'js/arpa-cuenta-cobro.js',
  BASE + 'js/arpa-views.js',
  BASE + 'js/arpa-onboarding.js',
  BASE + 'js/arpa-historial.js',
  BASE + 'js/arpa-whatsapp.js',
  BASE + 'js/html2canvas.min.js',
  BASE + 'js/jspdf.umd.min.js',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  BASE + 'icon-maskable-192.png',
  BASE + 'icon-maskable-512.png',
  BASE + 'apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js'
];

function isNetworkFirst(url) {
  return url.includes('/js/') || url.endsWith('.html') || url.endsWith('/');
}

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
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  if (
    url.includes('script.google.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('arpa-license.js')
  ) {
    return;
  }

  if (url.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  if (isNetworkFirst(url)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && url.startsWith(self.location.origin)) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if ((event.request.headers.get('accept') || '').includes('text/html')) {
            return caches.match(BASE + 'index.html');
          }
        }))
    );
    return;
  }

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
          (url.startsWith(self.location.origin) ||
            url.includes('fonts.googleapis.com') ||
            url.includes('fonts.gstatic.com'))
        ) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        const accept = event.request.headers.get('accept') || '';
        if (accept.includes('text/html')) {
          return caches.match(BASE + 'index.html');
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
    );
  }
});
