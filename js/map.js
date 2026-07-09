/* =====================================================================
   Elx al Cel — Mapa de orientación (Mapbox GL JS 3D)
   Capas: puntos de llançament, cortes de calle, perimetros de seguridad,
   puntos de asistencia (POIs) y ubicacion del usuario en vivo.
   ===================================================================== */
(function () {
  const BASEMAPS = {
    standard: { url: 'mapbox://styles/mapbox/standard' }
  };
  let currentBase = 'standard';

  const POI_GLYPH = {
    first_aid: '✚', info: 'i', water: '💧', accessible: '♿', exit: '➜'
  };

  let map = null, userMarker = null, userAccuracyCircle = null, geoWatchId = null, meetingMarker = null;
  let nextInfo = {};
  let lastSchedule = null;
  let myPalmMarker = null;
  let launchMarkers = {};
  
  // Layer arrays (Mapbox doesn't have LayerGroups for markers, we keep them in arrays)
  let layerLaunch = [], layerClosures = [], layerPerimeters = [], layerPois = [], layerViewpoints = [], layerFesta = [], layerPalmeres = [];

  // Visibility state
  let layerVisibility = { launch: true, closures: true, perimeters: true, pois: true, viewpoints: true, festa: true, palmeres: true };

  function hasMapbox() { return typeof window.mapboxgl !== 'undefined'; }

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
      'text-align:center;color:#a7a3cc;padding:30px;font-size:14px;z-index:9999">' + msg + '</div>';
  }

  function createHtmlElement(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
  }

  function launchIcon(active) {
    return createHtmlElement('<div class="elx-marker' + (active ? ' active' : '') + '">★</div>');
  }
  function poiIcon(type) {
    return createHtmlElement('<div class="elx-poi elx-poi-' + type + '">' + (POI_GLYPH[type] || '•') + '</div>');
  }
  function viewIcon() {
    return createHtmlElement('<div class="elx-view"><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg></div>');
  }
  function festaIcon() {
    return createHtmlElement('<div class="elx-festa"><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M12 3l2.2 4.9 5.3.5-4 3.6 1.2 5.2L12 14.5 7.3 17.2l1.2-5.2-4-3.6 5.3-.5z" fill="currentColor"/></svg></div>');
  }
  function cpalmIcon() {
    return createHtmlElement('<div class="elx-cpalm">\uD83C\uDF34</div>');
  }
  function myPalmIcon() {
    return createHtmlElement('<div class="elx-mypalm">\uD83C\uDF34</div>');
  }
  function meetingIcon() {
    return createHtmlElement('<div class="elx-meet" style="transform:translate(0,-14px)"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 21V4M6 4h11l-2.5 3.5L17 11H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>');
  }
  function userIcon() {
    return createHtmlElement('<div class="elx-user-dot"><div class="elx-user-pulse"></div></div>');
  }

  function init(elId, schedule) {
    if (!hasMapbox()) { fallback(elId, "No s'ha pogut carregar el mapa. La resta de l'eina funciona igual."); return null; }
    
    // User's provided Mapbox token
    // PLEASE NOTE: GitHub blocked pushing the 'sk...' secret token for security reasons.
    // Please provide a PUBLIC token ('pk...') from your Mapbox account.
    mapboxgl.accessToken = 'pk.YOUR_MAPBOX_PUBLIC_TOKEN_HERE';
    
    const ev = (schedule && schedule.event) || {};
    const center = ev.center || { lat: 38.2699, lng: -0.7126 };
    const zoom = (ev.zoom && ev.zoom.default) || 15;

    map = new mapboxgl.Map({
      container: elId,
      style: BASEMAPS.standard.url,
      center: [center.lng, center.lat],
      zoom: zoom,
      pitch: 60,
      bearing: -15,
      attributionControl: true
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'bottom-left');

    map.on('style.load', () => {
      // Configure Mapbox Standard style to use the "night" theme for fireworks
      map.setConfigProperty('basemap', 'lightPreset', 'night');
    });

    map.on('load', () => {
      // We manage polygons/lines here, markers elsewhere
      map.addSource('closures', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'closures-layer', type: 'line', source: 'closures',
        paint: { 'line-color': '#ff6b6b', 'line-width': 4, 'line-opacity': 0.85, 'line-dasharray': [2, 2] }
      });

      map.addSource('perimeters', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'perimeters-layer', type: 'fill', source: 'perimeters',
        paint: { 'fill-color': '#ffb43c', 'fill-opacity': 0.08, 'fill-outline-color': '#ffb43c' }
      });

      if (schedule) renderSchedule(schedule);
    });

    map.on('contextmenu', (e) => setMeetingPoint(e.lngLat));

    return map;
  }

  function setNextInfo(info) {
    nextInfo = info || {};
    if (lastSchedule) renderSchedule(lastSchedule);
  }
  
  function clearMarkers(arr) {
    arr.forEach(m => m.remove());
    arr.length = 0;
  }

  function renderSchedule(schedule, activeLaunchPointId) {
    if (!map) return;
    lastSchedule = schedule;
    
    clearMarkers(layerLaunch);
    clearMarkers(layerPois);
    clearMarkers(layerViewpoints);
    clearMarkers(layerFesta);
    clearMarkers(layerPalmeres);

    launchMarkers = {};
    (schedule.launch_points || []).forEach((p) => {
      const el = launchIcon(p.id === activeLaunchPointId);
      const m = new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]);
      launchMarkers[p.id] = m;
      
      const lang = window.I18N ? I18N.get() : 'va';
      const note = lang === 'cas' ? (p.note_cas || '') : (p.note_va || '');
      const nx = nextInfo[p.id];
      const pending = p.provisional ? '<br><span class="pp-pending">' + (window.I18N ? I18N.t('map.pending') : '') + '</span>' : '';
      
      const popup = new mapboxgl.Popup({ offset: 15, className: 'elx-popup' })
        .setHTML('<strong>' + esc(p.name) + '</strong>' + (note ? '<br>' + esc(note) : '') +
        (nx ? '<br><em class="pp-next">' + esc(nx) + '</em>' : '') + pending + dirLink(p.lat, p.lng));
      
      m.setPopup(popup);
      if (layerVisibility.launch) m.addTo(map);
      layerLaunch.push(m);
    });

    if (map.isStyleLoaded()) {
      const closureFeatures = (schedule.closures || []).map(c => ({
        type: 'Feature', geometry: { type: 'LineString', coordinates: c.path.map(p => [p[1], p[0]]) }
      }));
      map.getSource('closures').setData({ type: 'FeatureCollection', features: closureFeatures });

      const pmFeatures = (schedule.perimeters || []).map(pm => ({
        type: 'Feature', geometry: { type: 'Polygon', coordinates: [pm.polygon.map(p => [p[1], p[0]])] }
      }));
      map.getSource('perimeters').setData({ type: 'FeatureCollection', features: pmFeatures });
    }

    (schedule.viewpoints || []).forEach((v) => {
      const lang = window.I18N ? I18N.get() : 'va';
      const name = lang === 'cas' ? (v.name_cas || v.name_va) : (v.name_va || v.name_cas);
      const desc = lang === 'cas' ? (v.desc_cas || '') : (v.desc_va || '');
      
      const m = new mapboxgl.Marker({ element: viewIcon() }).setLngLat([v.lng, v.lat]);
      const popup = new mapboxgl.Popup({ offset: 13 }).setHTML('<strong>' + esc(name) + '</strong>' + (desc ? '<br>' + esc(desc) : '') + dirLink(v.lat, v.lng));
      m.setPopup(popup);
      if (layerVisibility.viewpoints) m.addTo(map);
      layerViewpoints.push(m);
    });

    (schedule.festa_pois || []).forEach((f) => {
      const lang = window.I18N ? I18N.get() : 'cas';
      const name = lang === 'cas' ? (f.name_cas || f.name_va) : (f.name_va || f.name_cas);
      const desc = lang === 'cas' ? (f.desc_cas || '') : (f.desc_va || '');
      const pending = f.provisional ? '<br><span class="pp-pending">' + (window.I18N ? I18N.t('map.pending') : '') + '</span>' : '';
      
      const m = new mapboxgl.Marker({ element: festaIcon() }).setLngLat([f.lng, f.lat]);
      const popup = new mapboxgl.Popup({ offset: 13 }).setHTML('<strong>' + esc(name) + '</strong>' + (desc ? '<br>' + esc(desc) : '') + pending + dirLink(f.lat, f.lng));
      m.setPopup(popup);
      if (layerVisibility.festa) m.addTo(map);
      layerFesta.push(m);
    });

    const cpNote = window.I18N && schedule['citizen_note_' + (I18N.get() === 'cas' ? 'cas' : 'va')];
    (schedule.citizen_palmeras || []).forEach((c) => {
      const m = new mapboxgl.Marker({ element: cpalmIcon() }).setLngLat([c.lng, c.lat]);
      const popup = new mapboxgl.Popup({ offset: 11 }).setHTML('<strong>' + esc(c.name) + '</strong>' + (c.time ? ' \u00B7 ' + esc(c.time) : '') +
          (cpNote ? '<br><span class="pp-pending">' + esc(cpNote) + '</span>' : ''));
      m.setPopup(popup);
      if (layerVisibility.palmeres) m.addTo(map);
      layerPalmeres.push(m);
    });

    (schedule.pois || []).forEach((poi) => {
      const lang = window.I18N ? I18N.get() : 'va';
      const name = lang === 'cas' ? (poi.name_cas || poi.name_va) : (poi.name_va || poi.name_cas);
      
      const m = new mapboxgl.Marker({ element: poiIcon(poi.type) }).setLngLat([poi.lng, poi.lat]);
      const popup = new mapboxgl.Popup({ offset: 13 }).setHTML('<strong>' + esc(name || poi.type) + '</strong>' + dirLink(poi.lat, poi.lng));
      m.setPopup(popup);
      if (layerVisibility.pois) m.addTo(map);
      layerPois.push(m);
    });
  }

  function setActiveLaunchPoint(schedule, launchPointId) {
    if (schedule) renderSchedule(schedule, launchPointId);
  }

  // ---- Punt de trobada + compartir ----
  function toast(msg) { if (window.ElxApp && ElxApp.toast) ElxApp.toast(msg); }

  function setMeetingPoint(lngLat) {
    if (!map) return;
    const label = window.I18N ? I18N.t('map.meeting_point') : 'Punt de trobada';
    if (!meetingMarker) {
      meetingMarker = new mapboxgl.Marker({ element: meetingIcon(), draggable: true })
        .setLngLat([lngLat.lng, lngLat.lat]).addTo(map);
      meetingMarker.getElement().addEventListener('click', shareMeeting);
    } else {
      meetingMarker.setLngLat([lngLat.lng, lngLat.lat]);
    }
    toast(window.I18N ? I18N.t('map.meeting_set') : '');
  }

  async function shareMeeting() {
    const src = meetingMarker || userMarker;
    if (!src) { toast(window.I18N ? I18N.t('map.share_no_point') : ''); return; }
    const p = src.getLngLat();
    const url = 'https://maps.google.com/?q=' + p.lat.toFixed(5) + ',' + p.lng.toFixed(5);
    const text = (window.I18N ? I18N.t('map.meeting_text') : '') + ' ' + url;
    try {
      if (navigator.share) { await navigator.share({ title: 'Elx al Cel', text }); return; }
      throw new Error('no-share');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
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
            userMarker = new mapboxgl.Marker({ element: userIcon() }).setLngLat([longitude, latitude]).addTo(map);
          } else {
            userMarker.setLngLat([longitude, latitude]);
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
    if (userMarker) { map.flyTo({ center: userMarker.getLngLat(), zoom: zoom || 17, duration: 800 }); return; }
    if (!('geolocation' in navigator)) { toast(window.I18N ? I18N.t('map.no_gps') : ''); return; }
    toast(window.I18N ? I18N.t('map.locating') : '');
    navigator.geolocation.getCurrentPosition(
      (p) => { map.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: zoom || 17, duration: 800 }); },
      (err) => { toast(window.I18N ? I18N.t(err && err.code === 1 ? 'map.gps_denied' : 'map.no_gps') : ''); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  function flyTo(lat, lng, zoom) { if (map) map.flyTo({ center: [lng, lat], zoom: zoom || 17, duration: 1000 }); }

  function renderMyPalm(p) {
    if (!map) return;
    if (myPalmMarker) { myPalmMarker.remove(); myPalmMarker = null; }
    if (!p) return;
    myPalmMarker = new mapboxgl.Marker({ element: myPalmIcon() }).setLngLat([p.lng, p.lat]).addTo(map);
    const shareLbl = window.I18N ? I18N.t('mypalm.share_btn') : 'Compartir';
    const delLbl = window.I18N ? I18N.t('mypalm.delete') : 'Eliminar';
    
    const popup = new mapboxgl.Popup({ offset: 19 }).setHTML(
      '<strong>\uD83C\uDF34 ' + esc(p.dedication) + '</strong><br>13/08 \u00B7 ' + esc(p.time) +
      '<br><button class="mp-pop-share tl-map-btn" onclick="window.MyPalm && MyPalm.share()">' + shareLbl + '</button> ' +
      '<button class="mp-pop-del pp-dir-btn" onclick="if(window.MyPalm) MyPalm.clear(); window.ElxMap.renderMyPalm(null);">' + delLbl + '</button>'
    );
    myPalmMarker.setPopup(popup);
  }
  function focusMyPalm() {
    if (myPalmMarker && map) {
      map.flyTo({ center: myPalmMarker.getLngLat(), zoom: 16, duration: 900 });
      setTimeout(() => { if (myPalmMarker.getPopup()) myPalmMarker.togglePopup(); }, 1000);
    }
  }
  function getCenter() {
    if (!map) return null;
    const c = map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  function setBasemap(key) { }
  function getBasemap() { return currentBase; }

  function focusLaunchPoint(id) {
    const m = launchMarkers[id];
    if (!m || !map) return;
    const ll = m.getLngLat();
    map.flyTo({ center: ll, zoom: 17, duration: 1000 });
    setTimeout(() => { if (m.getPopup()) m.togglePopup(); }, 1100);
  }

  function layerByKey(key) {
    return { launch: layerLaunch, pois: layerPois, viewpoints: layerViewpoints, festa: layerFesta, palmeres: layerPalmeres }[key];
  }
  function setLayerVisible(key, on) {
    layerVisibility[key] = on;
    if (key === 'closures' || key === 'perimeters') {
      if (map && map.getLayer(key + '-layer')) {
        map.setLayoutProperty(key + '-layer', 'visibility', on ? 'visible' : 'none');
      }
      return;
    }
    const arr = layerByKey(key);
    if (!arr || !map) return;
    arr.forEach(m => {
      if (on) m.addTo(map);
      else m.remove();
    });
  }
  function refresh() { if (map) setTimeout(() => map.resize(), 60); }

  window.ElxMap = {
    init, renderSchedule, setActiveLaunchPoint,
    startUserLocation, stopUserLocation, centerOnUser, flyTo, refresh,
    setMeetingPoint, shareMeeting, setNextInfo, focusLaunchPoint, setLayerVisible, setBasemap, getBasemap,
    renderMyPalm, focusMyPalm, getCenter,
    hasLeaflet: hasMapbox // alias for app.js
  };
})();
