/* =====================================================================
   Elx al Cel — Precarga offline del mapa del evento
   Tras la primera carga con red, descarga en segundo plano los tiles del
   área del evento (bbox, zooms 13–16, ≈100 tiles) para que el mapa del
   centre d'Elx funcione sense connexió la nit del 13 d'agost.
   El Service Worker intercepta cada fetch y los guarda en la caché de
   tiles (acotada). Se ejecuta una sola vez por versión de datos.
   ===================================================================== */
(function () {
  const ZOOMS = [13, 14, 15, 16];
  const MAX_PRECACHE = 250;   // techo de seguridad (por debajo del límite del SW)
  const BATCH = 6;            // peticiones simultáneas (suave con la red)
  const FLAG = 'elx_tiles_prefetch_v';

  const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * Math.pow(2, z));
  const lat2y = (lat, z) => {
    const r = lat * Math.PI / 180;
    return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
  };

  async function run(schedule) {
    try {
      if (!schedule || !schedule.event || !schedule.event.bbox) return;
      if (!('serviceWorker' in navigator) || !navigator.onLine) return;
      const version = String(schedule.version || 1);
      if (localStorage.getItem(FLAG) === version) return; // ya hecho para esta versión

      // Esperar a que el SW controle la página (si no, no se cachea nada).
      if (!navigator.serviceWorker.controller) {
        await new Promise((res) => {
          const t = setTimeout(res, 8000);
          navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(t); res(); }, { once: true });
        });
        if (!navigator.serviceWorker.controller) return; // primera visita: lo hará la próxima
      }

      const [[south, west], [north, east]] = schedule.event.bbox;
      const retina = (window.devicePixelRatio || 1) > 1 ? '@2x' : '';
      const subs = ['a', 'b', 'c', 'd'];
      const urls = [];
      let i = 0;
      for (const z of ZOOMS) {
        const x1 = lon2x(west, z), x2 = lon2x(east, z);
        const y1 = lat2y(north, z), y2 = lat2y(south, z);
        for (let x = x1; x <= x2; x++) {
          for (let y = y1; y <= y2; y++) {
            urls.push('https://' + subs[i++ % 4] + '.basemaps.cartocdn.com/dark_all/' + z + '/' + x + '/' + y + retina + '.png');
            if (urls.length >= MAX_PRECACHE) break;
          }
          if (urls.length >= MAX_PRECACHE) break;
        }
        if (urls.length >= MAX_PRECACHE) break;
      }

      for (let b = 0; b < urls.length; b += BATCH) {
        if (!navigator.onLine) return; // la red ha caído: reintentará otro día
        await Promise.allSettled(urls.slice(b, b + BATCH).map((u) => fetch(u, { mode: 'no-cors' })));
      }

      localStorage.setItem(FLAG, version);
    } catch (e) { /* silencioso: la precarga es una mejora, nunca un bloqueo */ }
  }

  function schedule(scheduleData) {
    const kick = () => run(scheduleData);
    if ('requestIdleCallback' in window) requestIdleCallback(kick, { timeout: 10000 });
    else setTimeout(kick, 4000);
  }

  window.TilePrefetch = { schedule };
})();
