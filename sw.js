/* Elx al Cel — Service Worker
   Políticas de caché (solo recursos same-origin; Mapbox y otros recursos
   de terceros no se interceptan, ver guard en el listener de 'fetch'):
   · CORE (app-shell)   -> cache-first, precargado en la instalación
   · schedule.json      -> stale-while-revalidate (rápido + se actualiza en segundo plano)
   · status.json          -> siempre red, nunca caché persistente (avisos en vivo)
*/
const VERSION = 'v27';
const CORE_CACHE = 'elx-core-' + VERSION;

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css?v=27',
  './css/leaflet.css',
  './css/images/marker-icon.png',
  './css/images/marker-icon-2x.png',
  './css/images/marker-shadow.png',
  './css/images/layers.png',
  './css/images/layers-2x.png',
  './js/leaflet.js',
  './js/clock.js?v=27',
  './js/config.js?v=27',
  './js/palmeras-db.js?v=27',
  './js/i18n.js?v=27',
  './js/fw-styles.js?v=27',
  './js/map.js?v=27',
  './js/ar.js?v=27',
  './js/ar-camera.js?v=27',
  './js/timeline.js?v=27',
  './js/data.js?v=27',
  './js/app.js?v=27',
  './js/prefetch.js?v=27',
  './js/alerts.js?v=27',
  './js/mypalm.js?v=27',
  './icons/icon.svg',
  './data/schedule.json?v=27'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CORE_CACHE)
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CORE_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isSchedule(url) {
  return /schedule\.json/.test(url.pathname);
}
function isStatus(url) {
  return /status\.json/.test(url.pathname);
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then((res) => {
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Recursos de tercers (Mapbox, etc.): els deixem passar sense interceptar.
  // Mapbox GL JS gestiona el seu propi caching intern; interceptar-los amb
  // cache-first genèric trencava la càrrega del mapa en visites repetides.
  if (url.origin !== self.location.origin) return;

  // status.json: siempre red, sin caché persistente (avisos en vivo).
  if (isStatus(url)) {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // schedule.json: stale-while-revalidate.
  if (isSchedule(url)) {
    e.respondWith(staleWhileRevalidate(req, CORE_CACHE));
    return;
  }

  // navegación: red primero, cae a la app cacheada (offline).
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // resto del app-shell: cache-first.
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200) {
        caches.open(CORE_CACHE).then((c) => c.put(req, res.clone()));
      }
      return res;
    }))
  );
});
