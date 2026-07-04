/* Elx al Cel — Service Worker
   3 políticas de caché:
   · CORE (app-shell)   -> cache-first, precargado en la instalación
   · schedule.json      -> stale-while-revalidate (rápido + se actualiza en segundo plano)
   · tiles del mapa      -> stale-while-revalidate con caché LRU acotada (evita crecer sin límite)
   · status.json          -> siempre red, nunca caché persistente (avisos en vivo)
*/
const VERSION = 'v7';
const CORE_CACHE = 'elx-core-' + VERSION;
const TILE_CACHE = 'elx-tiles-' + VERSION;
const MAX_TILES = 400; // límite duro de tiles guardados (evita saturar el almacenamiento del móvil)

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css?v=7',
  './css/leaflet.css',
  './css/images/marker-icon.png',
  './css/images/marker-icon-2x.png',
  './css/images/marker-shadow.png',
  './css/images/layers.png',
  './css/images/layers-2x.png',
  './js/leaflet.js',
  './js/clock.js?v=7',
  './js/config.js?v=7',
  './js/i18n.js?v=7',
  './js/map.js?v=7',
  './js/ar.js?v=7',
  './js/timeline.js?v=7',
  './js/data.js?v=7',
  './js/app.js?v=7',
  './js/prefetch.js?v=7',
  './js/alerts.js?v=7',
  './icons/icon.svg',
  './data/schedule.json?v=7'
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
      Promise.all(keys.filter((k) => k !== CORE_CACHE && k !== TILE_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isTile(url) {
  return /basemaps\.cartocdn\.com/.test(url.hostname);
}
function isSchedule(url) {
  return /schedule\.json/.test(url.pathname);
}
function isStatus(url) {
  return /status\.json/.test(url.pathname);
}

// Mantiene la caché de tiles por debajo de MAX_TILES (política simple FIFO).
async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  const excess = keys.length - MAX_TILES;
  if (excess > 0) {
    for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
  }
}

async function staleWhileRevalidate(req, cacheName, trim) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then((res) => {
    // Los tiles llegan como respuestas "opacas" (sin CORS): status 0 pero validas.
    if (res && (res.status === 200 || res.type === 'opaque')) {
      cache.put(req, res.clone());
      if (trim) trimTileCache();
    }
    return res;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // status.json: siempre red, sin caché persistente (avisos en vivo).
  if (isStatus(url)) {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // schedule.json: stale-while-revalidate.
  if (isSchedule(url)) {
    e.respondWith(staleWhileRevalidate(req, CORE_CACHE, false));
    return;
  }

  // tiles del mapa: stale-while-revalidate con caché acotada.
  if (isTile(url)) {
    e.respondWith(staleWhileRevalidate(req, TILE_CACHE, true));
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
