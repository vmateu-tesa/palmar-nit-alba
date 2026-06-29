/* =====================================================================
   PalmAR — Mapa de Elche (Leaflet + CartoDB dark) y selector de ubicación
   ===================================================================== */
(function () {
  const ELCHE = { lat: 38.2699, lng: -0.7126, zoom: 14 };
  const TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const ATTR = '&copy; OpenStreetMap &copy; CARTO';

  let mainMap = null, markers = [];

  function hasLeaflet() { return typeof window.L !== 'undefined'; }

  function fallback(elId, msg) {
    const el = document.getElementById(elId);
    if (el) el.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;' +
      'text-align:center;color:#a7a3cc;padding:30px;font-size:14px">' + msg + '</div>';
  }

  function markerIcon(color, official) {
    return L.divIcon({
      className: '',
      html: '<div class="palm-marker' + (official ? ' official' : '') + '" style="color:' +
        (color || '#ffce5c') + '">' + (official ? '★' : '✦') + '</div>',
      iconSize: [34, 34], iconAnchor: [17, 17]
    });
  }

  function initMain(elId) {
    if (!hasLeaflet()) {
      fallback(elId, 'No s\'ha pogut carregar el mapa (sense connexió). La resta de l\'app funciona.');
      return null;
    }
    mainMap = L.map(elId, { zoomControl: false, attributionControl: true })
      .setView([ELCHE.lat, ELCHE.lng], ELCHE.zoom);
    L.tileLayer(TILE, { attribution: ATTR, subdomains: 'abcd', maxZoom: 19 }).addTo(mainMap);
    L.control.zoom({ position: 'bottomleft' }).addTo(mainMap);
    return mainMap;
  }

  function renderPalmeras(list, onClick) {
    if (!mainMap) return;
    markers.forEach((m) => mainMap.removeLayer(m));
    markers = [];
    (list || []).forEach((p) => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
      const t = window.Fireworks && Fireworks.getType(p.firework_type);
      const color = p.color || (t && t.color) || '#ffce5c';
      const m = L.marker([p.lat, p.lng], { icon: markerIcon(color, p.is_official) }).addTo(mainMap);
      m.on('click', () => onClick && onClick(p));
      markers.push(m);
    });
  }

  function flyTo(lat, lng, zoom) {
    if (mainMap) mainMap.flyTo([lat, lng], zoom || 16, { duration: 0.8 });
  }

  function refreshMain() { if (mainMap) setTimeout(() => mainMap.invalidateSize(), 60); }

  // ---- Selector de ubicación (paso 2 del alta) ----
  function initPicker(elId) {
    if (!hasLeaflet()) { fallback(elId, 'Mapa no disponible'); return null; }
    const map = L.map(elId, { zoomControl: true, attributionControl: false })
      .setView([ELCHE.lat, ELCHE.lng], 14);
    L.tileLayer(TILE, { subdomains: 'abcd', maxZoom: 19 }).addTo(map);
    let marker = null, chosen = null, curColor = '#ffce5c';
    function place(lat, lng) {
      chosen = { lat, lng };
      if (marker) marker.setLatLng([lat, lng]);
      else marker = L.marker([lat, lng], { icon: markerIcon(curColor) }).addTo(map);
    }
    map.on('click', (e) => place(e.latlng.lat, e.latlng.lng));
    return {
      map,
      getLatLng: () => chosen,
      setColor: (c) => { curColor = c || curColor; if (marker) marker.setIcon(markerIcon(curColor)); },
      setLatLng: (lat, lng, zoom) => { place(lat, lng); map.setView([lat, lng], zoom || 16); },
      reset: () => { if (marker) { map.removeLayer(marker); marker = null; } chosen = null; },
      refresh: () => setTimeout(() => map.invalidateSize(), 60)
    };
  }

  window.PalmarMap = {
    ELCHE, initMain, renderPalmeras, flyTo, refreshMain, initPicker,
    hasLeaflet
  };
})();
