/* =====================================================================
   Elx al Cel — Mapa de orientación (Leaflet)
   Capas: puntos de llançament, cortes de calle, perimetros de seguridad,
   puntos de asistencia (POIs) y ubicacion del usuario en vivo.
   ===================================================================== */
(function () {
  const BASEMAPS = {
    detail: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              attr: '&copy; OpenStreetMap contributors', maxZoom: 19 },
    dark:   { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
              attr: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19, subdomains: 'abcd' }
  };
  let baseLayer = null;
  let currentBase = localStorage.getItem('elx_basemap') || 'detail';

  const POI_GLYPH = {
    first_aid: '✚', info: 'i', water: '💧', accessible: '♿', exit: '➜'
  };

  let map = null, userMarker = null, userAccuracyCircle = null, geoWatchId = null, meetingMarker = null;
  let nextInfo = {};
  let lastSchedule = null;
  let launchMarkers = {};
  const LAYER_KEYS = ['launch','closures','perimeters','pois','viewpoints'];
  let layerLaunch = null, layerClosures = null, layerPerimeters = null, layerPois = null, layerViewpoints = null;

  function hasLeaflet() { return typeof window.L !== 'undefined'; }

  function dirLink(lat, lng) {
    const label = window.I18N ? I18N.t('map.directions') : 'Cómo llegar';
    return '<br><a class="pp-dir" target="_blank" rel="noopener" href="https://maps.google.com/?daddr=' +
      lat.toFixed(5) + ',' + lng.toFixed(5) + '">' + label + ' \u2197</a>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fallback(elId, msg) {
    const el = document.getElementById(elId);
    if (el) el.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;' +
      'text-align:center;color:#a7a3cc;padding:30px;font-size:14px">' + msg + '</div>';
  }

  function launchIcon(active) {
    return L.divIcon({
      className: '',
      html: '<div class="elx-marker' + (active ? ' active' : '') + '">★</div>',
      iconSize: [30, 30], iconAnchor: [15, 15]
    });
  }
  function poiIcon(type) {
    return L.divIcon({
      className: '',
      html: '<div class="elx-poi elx-poi-' + type + '">' + (POI_GLYPH[type] || '•') + '</div>',
      iconSize: [26, 26], iconAnchor: [13, 13]
    });
  }
  function viewIcon() {
    return L.divIcon({
      className: '',
      html: '<div class="elx-view"><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg></div>',
      iconSize: [26, 26], iconAnchor: [13, 13]
    });
  }
  function meetingIcon() {
    return L.divIcon({
      className: '',
      html: '<div class="elx-meet"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 21V4M6 4h11l-2.5 3.5L17 11H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>',
      iconSize: [30, 30], iconAnchor: [6, 28]
    });
  }
  function userIcon() {
    return L.divIcon({
      className: '',
      html: '<div class="elx-user-dot"><div class="elx-user-pulse"></div></div>',
      iconSize: [20, 20], iconAnchor: [10, 10]
    });
  }

  function init(elId, schedule) {
    if (!hasLeaflet()) { fallback(elId, "No s'ha pogut carregar el mapa. La resta de l'eina funciona igual."); return null; }
    const ev = (schedule && schedule.event) || {};
    const center = ev.center || { lat: 38.2699, lng: -0.7126 };
    const zoom = (ev.zoom && ev.zoom.default) || 15;

    map = L.map(elId, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], zoom);
    // Nota: sin maxBounds a propósito — el usuario puede estar fuera del área del evento
    setBasemap(currentBase);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    layerLaunch = L.layerGroup().addTo(map);
    layerClosures = L.layerGroup().addTo(map);
    layerPerimeters = L.layerGroup().addTo(map);
    layerPois = L.layerGroup().addTo(map);
    layerViewpoints = L.layerGroup().addTo(map);

    // Mantener pulsado el mapa = marcar punt de trobada
    map.on('contextmenu', (e) => setMeetingPoint(e.latlng));

    if (schedule) renderSchedule(schedule);
    return map;
  }

  function setNextInfo(info) {
    nextInfo = info || {};
    if (lastSchedule) renderSchedule(lastSchedule);
  }

  function renderSchedule(schedule, activeLaunchPointId) {
    if (!map) return;
    lastSchedule = schedule;
    layerLaunch.clearLayers();
    layerClosures.clearLayers();
    layerPerimeters.clearLayers();
    layerPois.clearLayers();
    layerViewpoints.clearLayers();

    launchMarkers = {};
    (schedule.launch_points || []).forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: launchIcon(p.id === activeLaunchPointId) });
      launchMarkers[p.id] = m;
      const lang = window.I18N ? I18N.get() : 'va';
      const note = lang === 'cas' ? (p.note_cas || '') : (p.note_va || '');
      const nx = nextInfo[p.id];
      const pending = p.provisional ? '<br><span class="pp-pending">' + (window.I18N ? I18N.t('map.pending') : '') + '</span>' : '';
      m.bindPopup('<strong>' + esc(p.name) + '</strong>' + (note ? '<br>' + esc(note) : '') +
        (nx ? '<br><em class="pp-next">' + esc(nx) + '</em>' : '') + pending + dirLink(p.lat, p.lng));
      m.addTo(layerLaunch);
    });

    (schedule.closures || []).forEach((c) => {
      if (!c.path || c.path.length < 2) return;
      L.polyline(c.path, { color: '#ff6b6b', weight: 4, opacity: 0.85, dashArray: '2 8' })
        .bindPopup((window.I18N ? I18N.t('map.legend.closure') : 'Carrer tallat'))
        .addTo(layerClosures);
    });

    (schedule.perimeters || []).forEach((pm) => {
      if (!pm.polygon || pm.polygon.length < 3) return;
      L.polygon(pm.polygon, { color: '#ffb43c', weight: 2, fillOpacity: 0.08 })
        .bindPopup((window.I18N ? I18N.t('map.legend.perimeter') : 'Perímetre de seguretat'))
        .addTo(layerPerimeters);
    });

    (schedule.viewpoints || []).forEach((v) => {
      const lang = window.I18N ? I18N.get() : 'va';
      const name = lang === 'cas' ? (v.name_cas || v.name_va) : (v.name_va || v.name_cas);
      const desc = lang === 'cas' ? (v.desc_cas || '') : (v.desc_va || '');
      L.marker([v.lat, v.lng], { icon: viewIcon() })
        .bindPopup('<strong>' + esc(name) + '</strong>' + (desc ? '<br>' + esc(desc) : '') + dirLink(v.lat, v.lng))
        .addTo(layerViewpoints);
    });

    (schedule.pois || []).forEach((poi) => {
      const lang = window.I18N ? I18N.get() : 'va';
      const name = lang === 'cas' ? (poi.name_cas || poi.name_va) : (poi.name_va || poi.name_cas);
      L.marker([poi.lat, poi.lng], { icon: poiIcon(poi.type) })
        .bindPopup('<strong>' + esc(name || poi.type) + '</strong>' + dirLink(poi.lat, poi.lng))
        .addTo(layerPois);
    });
  }

  function setActiveLaunchPoint(schedule, launchPointId) {
    if (schedule) renderSchedule(schedule, launchPointId);
  }

  // ---- Punt de trobada + compartir ----
  function toast(msg) { if (window.ElxApp && ElxApp.toast) ElxApp.toast(msg); }

  function setMeetingPoint(latlng) {
    if (!map) return;
    const label = window.I18N ? I18N.t('map.meeting_point') : 'Punt de trobada';
    if (!meetingMarker) {
      meetingMarker = L.marker(latlng, { icon: meetingIcon(), draggable: true, zIndexOffset: 900 }).addTo(map);
      meetingMarker.on('click', shareMeeting);
    } else {
      meetingMarker.setLatLng(latlng);
    }
    meetingMarker.bindTooltip(label, { direction: 'top', offset: [8, -26] });
    toast(window.I18N ? I18N.t('map.meeting_set') : '');
  }

  async function shareMeeting() {
    const src = meetingMarker || userMarker;
    if (!src) { toast(window.I18N ? I18N.t('map.share_no_point') : ''); return; }
    const p = src.getLatLng();
    const url = 'https://maps.google.com/?q=' + p.lat.toFixed(5) + ',' + p.lng.toFixed(5);
    const text = (window.I18N ? I18N.t('map.meeting_text') : '') + ' ' + url;
    try {
      if (navigator.share) { await navigator.share({ title: 'Elx al Cel', text }); return; }
      throw new Error('no-share');
    } catch (e) {
      if (e && e.name === 'AbortError') return; // el usuario cerró el diálogo
      try {
        await navigator.clipboard.writeText(text);
        toast(window.I18N ? I18N.t('map.shared_copied') : url);
      } catch (e2) { toast(url); }
    }
  }

  // ---- Ubicacion del usuario en vivo ----
  function startUserLocation(onUpdate) {
    if (!('geolocation' in navigator)) return;
    stopUserLocation();
    geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (map) {
          if (!userMarker) {
            userMarker = L.marker([latitude, longitude], { icon: userIcon(), zIndexOffset: 1000 }).addTo(map);
          } else {
            userMarker.setLatLng([latitude, longitude]);
          }
          if (accuracy) {
            if (!userAccuracyCircle) {
              userAccuracyCircle = L.circle([latitude, longitude], { radius: accuracy, color: '#5ec8ff', weight: 1, fillOpacity: 0.08 }).addTo(map);
            } else {
              userAccuracyCircle.setLatLng([latitude, longitude]).setRadius(accuracy);
            }
          }
        }
        if (onUpdate) onUpdate({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => { if (onUpdate) onUpdate(null, err && err.code); },
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 12000 }
    );
  }
  function stopUserLocation() {
    if (geoWatchId != null) { navigator.geolocation.clearWatch(geoWatchId); geoWatchId = null; }
  }
  function centerOnUser(zoom) {
    if (!map) return;
    if (userMarker) { map.flyTo(userMarker.getLatLng(), zoom || 17, { duration: 0.6 }); return; }
    // Aún sin posición: la pedimos una vez y volamos en cuanto llegue
    if (!('geolocation' in navigator)) { toast(window.I18N ? I18N.t('map.no_gps') : ''); return; }
    toast(window.I18N ? I18N.t('map.locating') : '');
    navigator.geolocation.getCurrentPosition(
      (p) => { map.flyTo([p.coords.latitude, p.coords.longitude], zoom || 17, { duration: 0.6 }); },
      (err) => { toast(window.I18N ? I18N.t(err && err.code === 1 ? 'map.gps_denied' : 'map.no_gps') : ''); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  function flyTo(lat, lng, zoom) { if (map) map.flyTo([lat, lng], zoom || 17, { duration: 0.8 }); }

  function setBasemap(key) {
    if (!map || !BASEMAPS[key]) return;
    if (baseLayer) map.removeLayer(baseLayer);
    const b = BASEMAPS[key];
    baseLayer = L.tileLayer(b.url, {
      attribution: b.attr, maxZoom: b.maxZoom, minZoom: 3,
      subdomains: b.subdomains || 'abc'
    }).addTo(map);
    currentBase = key;
    localStorage.setItem('elx_basemap', key);
    document.body.classList.toggle('map-light', key === 'detail');
  }
  function getBasemap() { return currentBase; }

  function focusLaunchPoint(id) {
    const m = launchMarkers[id];
    if (!m || !map) return;
    const ll = m.getLatLng();
    map.flyTo(ll, 17, { duration: 0.8 });
    setTimeout(() => { try { m.openPopup(); } catch (e) {} }, 900);
  }

  function layerByKey(key) {
    return { launch: layerLaunch, closures: layerClosures, perimeters: layerPerimeters,
             pois: layerPois, viewpoints: layerViewpoints }[key];
  }
  function setLayerVisible(key, on) {
    const l = layerByKey(key);
    if (!l || !map) return;
    if (on) { if (!map.hasLayer(l)) map.addLayer(l); }
    else { if (map.hasLayer(l)) map.removeLayer(l); }
  }
  function refresh() { if (map) setTimeout(() => map.invalidateSize(), 60); }

  window.ElxMap = {
    init, renderSchedule, setActiveLaunchPoint,
    startUserLocation, stopUserLocation, centerOnUser, flyTo, refresh,
    setMeetingPoint, shareMeeting, setNextInfo, focusLaunchPoint, setLayerVisible, setBasemap, getBasemap,
    hasLeaflet
  };
})();
