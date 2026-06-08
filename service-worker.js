const CACHE_NAME = 'arpa-suite-cache-v2';
const ASSETS = [
  './',
  './arpa-suite.html',
  './manifest.json',
  './js/arpa-brand.js',
  './js/arpa-pricing.js',
  './js/arpa-cobros.js',
  './js/arpa-signature.js',
  './js/arpa-cotizacion.js',
  './js/arpa-views.js',
  './icon-192.png',
  './icon-512.png',
  './Logo oficial 1.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
  'https://fonts.gstatic.com/s/dmsans/v11/rP2Fp2ywvt0Dh3JNDUNy72GPut4EPVF_.woff2',
  'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.automatismosarpa.com'
];

// Instalar el Service Worker y almacenar en caché los recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Almacenando recursos en caché...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar el Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Offline-First (Cache First, Fallback to Network)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET (como envíos de formularios o APIs externas que no queremos cachear)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retornar la respuesta en caché inmediatamente
        console.log('[Service Worker] Sirviendo desde caché:', event.request.url);
        
        // Opcional: Actualizar el recurso en caché en segundo plano (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignorar errores de red en segundo plano */});
        
        return cachedResponse;
      }

      // Si no está en caché, intentar red
      return fetch(event.request).then((networkResponse) => {
        // Guardar en caché dinámicamente nuevas peticiones del mismo origen o de fuentes de Google
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.startsWith(self.location.origin) ||
           event.request.url.includes('fonts.googleapis.com') ||
           event.request.url.includes('fonts.gstatic.com'))
        ) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[Service Worker] Error al buscar en red y no estaba en caché:', err);
        // Si falla la red y es una página HTML, podemos retornar index.html como fallback
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./arpa-suite.html');
        }
      });
    })
  );
});
