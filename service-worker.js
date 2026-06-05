// ══════════════════════════════════════════════════════════════
// SERVICE WORKER - SUITE CRM ARPA
// Estrategia: Cache-First (100% Offline)
// Versión: 5.0.0
// ══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'crm-arpa-v5.0.0';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// ══════════════════════════════════════════════════════════════
// ARCHIVOS PARA CACHÉ ESTÁTICO (Precache en instalación)
// ══════════════════════════════════════════════════════════════
const STATIC_ASSETS = [
  './',
  './CRM-ARPA-v5.html',
  './manifest.json',
  
  // Google Fonts (se cachean al cargar)
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap',
  
  // Librerías jsPDF (esenciales para PDFs)
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

// ══════════════════════════════════════════════════════════════
// INSTALACIÓN DEL SERVICE WORKER
// ══════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando CRM ARPA v5.0.0...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precacheando archivos estáticos...');
        
        // Cachear archivos uno por uno para mejor manejo de errores
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[Service Worker] No se pudo cachear: ${url}`, err);
              return Promise.resolve(); // Continuar aunque falle uno
            })
          )
        );
      })
      .then(() => {
        console.log('[Service Worker] ✅ Instalación completada');
        // Activar inmediatamente sin esperar
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Error en instalación:', error);
      })
  );
});

// ══════════════════════════════════════════════════════════════
// ACTIVACIÓN DEL SERVICE WORKER
// ══════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Eliminar cachés antiguos
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('crm-arpa-') && cacheName !== CACHE_NAME && cacheName !== DATA_CACHE) {
              console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] ✅ Activado correctamente');
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
  );
});

// ══════════════════════════════════════════════════════════════
// ESTRATEGIA DE CACHÉ: CACHE-FIRST (Offline-First)
// ══════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // ────────────────────────────────────────────────────────────
  // 1. IGNORAR: Requests que no debemos cachear
  // ────────────────────────────────────────────────────────────
  
  // Ignorar solicitudes no HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignorar chrome-extension y otros protocolos
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Ignorar solicitudes POST (guardado de datos)
  if (request.method !== 'GET') {
    return;
  }
  
  // ────────────────────────────────────────────────────────────
  // 2. GOOGLE FONTS: Cache con fallback a red
  // ────────────────────────────────────────────────────────────
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            return cached;
          }
          
          return fetch(request)
            .then(response => {
              // Cachear fuentes descargadas
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Offline: devolver algo genérico si no hay caché
              return new Response('/* Fuente no disponible offline */', {
                headers: { 'Content-Type': 'text/css' }
              });
            });
        })
    );
    return;
  }
  
  // ────────────────────────────────────────────────────────────
  // 3. CDN (jsPDF, etc): Cache-First con Network Fallback
  // ────────────────────────────────────────────────────────────
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            console.log('[Service Worker] 📦 Sirviendo desde caché:', request.url);
            return cached;
          }
          
          console.log('[Service Worker] 🌐 Descargando desde red:', request.url);
          return fetch(request)
            .then(response => {
              // Cachear solo respuestas exitosas
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              console.error('[Service Worker] ❌ No se pudo obtener:', request.url);
              return new Response('console.error("Librería no disponible offline");', {
                headers: { 'Content-Type': 'application/javascript' }
              });
            });
        })
    );
    return;
  }
  
  // ────────────────────────────────────────────────────────────
  // 4. ARCHIVOS LOCALES: Cache-First (100% Offline)
  // ────────────────────────────────────────────────────────────
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          console.log('[Service Worker] 📦 Caché:', request.url);
          
          // Actualizar caché en segundo plano (stale-while-revalidate)
          fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {}); // Ignorar errores de actualización
          
          return cached;
        }
        
        // No está en caché, intentar obtener de red
        console.log('[Service Worker] 🌐 Red:', request.url);
        return fetch(request)
          .then((response) => {
            // Cachear respuesta exitosa
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] ❌ Error de red:', error);
            
            // Si es la página principal, devolver desde caché o página de error
            if (request.mode === 'navigate') {
              return caches.match('./CRM-ARPA-v5.html')
                .then(response => {
                  if (response) {
                    return response;
                  }
                  
                  // Página de error offline
                  return new Response(
                    `<!DOCTYPE html>
                    <html lang="es">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width,initial-scale=1.0">
                      <title>Sin conexión - CRM ARPA</title>
                      <style>
                        body{margin:0;padding:0;font-family:sans-serif;background:#1A2B4A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;}
                        .container{padding:20px;}
                        h1{font-size:48px;margin:0 0 20px 0;}
                        p{font-size:18px;margin:10px 0;}
                        button{background:#E8820C;color:#fff;border:none;padding:12px 24px;font-size:16px;border-radius:8px;cursor:pointer;margin-top:20px;}
                        button:hover{background:#F5A030;}
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <h1>📡</h1>
                        <h2>Sin conexión</h2>
                        <p>No se puede cargar CRM ARPA.</p>
                        <p>Verifica tu conexión a Internet.</p>
                        <button onclick="location.reload()">🔄 Reintentar</button>
                      </div>
                    </body>
                    </html>`,
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
            
            throw error;
          });
      })
  );
});

// ══════════════════════════════════════════════════════════════
// SINCRONIZACIÓN EN SEGUNDO PLANO (Opcional - Futuro)
// ══════════════════════════════════════════════════════════════
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sincronización en segundo plano:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Aquí podrías sincronizar datos con un servidor cuando haya conexión
      Promise.resolve()
    );
  }
});

// ══════════════════════════════════════════════════════════════
// MANEJO DE MENSAJES (Para comunicación con la app)
// ══════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('crm-arpa-')) {
              console.log('[Service Worker] Limpiando caché:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// ══════════════════════════════════════════════════════════════
// NOTIFICACIONES PUSH (Opcional - Futuro)
// ══════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'CRM ARPA';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: './icon-192.png',
    badge: './icon-96.png',
    vibrate: [200, 100, 200],
    data: data.url || './'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || './')
  );
});

console.log('[Service Worker] 🚀 Script cargado - CRM ARPA v5.0.0');
