/* =====================================================================
   Elx al Cel — Mapa de orientación (Mapbox GL JS 3D)
   Capas: puntos de llançament, cortes de calle, perimetros de seguridad,
   puntos de asistencia (POIs) y ubicacion del usuario en vivo.
   ===================================================================== */
(function () {
  const BASEMAPS = {
    standard: { url: 'mapbox://styles/mapbox/standard' }
  };

  const POI_GLYPH = {
    first_aid: '✚', info: 'i', water: '💧', accessible: '♿', exit: '➜'
  };

  let map = null, userMarker = null, userAccuracyCircle = null, geoWatchId = null, meetingMarker = null;
  let nextInfo = {};
  let lastSchedule = null;
  let myPalmMarker = null;
  let lastPublicPalmeras = null;
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

  // ---- Rumb i distancia des de la ubicacio de l'usuari (informatiu, per als popups) ----
  const toRad = (d) => d * Math.PI / 180;
  const toDeg = (r) => r * 180 / Math.PI;
  const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  function bearingTo(a, b) {
    const phi1 = toRad(a.lat), phi2 = toRad(b.lat), dLambda = toRad(b.lng - a.lng);
    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  function distanceTo(a, b) {
    const R = 6371000, dphi = toRad(b.lat - a.lat), dLambda = toRad(b.lng - a.lng);
    const s = Math.sin(dphi / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLambda / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function bearingHtml(lat, lng) {
    if (!userMarker) return '';
    const u = userMarker.getLngLat();
    const dist = distanceTo({ lat: u.lat, lng: u.lng }, { lat: lat, lng: lng });
    const brg = bearingTo({ lat: u.lat, lng: u.lng }, { lat: lat, lng: lng });
    const card = CARDINALS[Math.round(((brg % 360) + 360) % 360 / 45) % 8];
    const distTxt = dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(1) + ' km';
    return '<br><span class="pp-bearing">🧭 ' + distTxt + ' al ' + card + '</span>';
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
    mapboxgl.accessToken = 'pk.eyJ1Ijoidm1hdGV1IiwiYSI' + '6ImNrMjR6bnRmNjFmcDIzbm55aHRkeDZmYXMifQ.zumQNOFYrIh6fmpS5xxSVg';
    
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

      // Nota: 'fill-extrusion-opacity' no admet expressions basades en dades
      // (a diferència de color/height), així que s'anima amb setPaintProperty
      // per capa sencera en compte de per feature (vore runBurst).
      map.addSource('fw-trail', { type: 'geojson', data: emptyFC() });
      map.addLayer({
        id: 'fw-trail-layer', type: 'fill-extrusion', source: 'fw-trail', slot: 'top',
        paint: {
          'fill-extrusion-color': ['coalesce', ['get', 'color'], '#fff6d8'],
          'fill-extrusion-height': ['coalesce', ['get', 'h'], 0],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0
        }
      });
      map.addSource('fw-burst', { type: 'geojson', data: emptyFC() });
      map.addLayer({
        id: 'fw-burst-layer', type: 'fill-extrusion', source: 'fw-burst', slot: 'top',
        paint: {
          'fill-extrusion-color': ['coalesce', ['get', 'color'], '#f5c542'],
          'fill-extrusion-height': ['coalesce', ['get', 'h'], 0],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0
        }
      });

      if (schedule) renderSchedule(schedule);

      ['closures-layer', 'perimeters-layer'].forEach((layerId) => {
        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
        map.on('click', layerId, (e) => {
          const f = e.features && e.features[0];
          const name = (f && f.properties && f.properties.name) || '';
          const label = window.I18N ? I18N.t('map.unofficial_note') : '';
          new mapboxgl.Popup({ offset: 6 }).setLngLat(e.lngLat)
            .setHTML((name ? '<strong>' + esc(name) + '</strong><br>' : '') + '<span class="pp-pending">' + esc(label) + '</span>')
            .addTo(map);
        });
      });
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
      const fwLabel = window.I18N ? I18N.t('fw.cta') : 'Veure en 3D';
      const camLabel = window.I18N ? I18N.t('fw.camera_cta') : '';
      const fwBtn = '<div class="pp-fw-actions">' +
        '<button class="tl-map-btn fw-cta-btn" onclick="window.ElxMap && window.ElxMap.playFirework(\'' + p.id + '\')">🎆 ' + esc(fwLabel) + '</button>' +
        '<button class="tl-map-btn fw-cta-btn" onclick="window.ARCamera && window.ARCamera.open({lat:' + p.lat + ',lng:' + p.lng + ',name:\'' + esc(p.name).replace(/'/g, '&#39;') + '\'})">📷 ' + esc(camLabel) + '</button>' +
        '</div>';

      const popup = new mapboxgl.Popup({ offset: 15, className: 'elx-popup' })
        .setHTML('<strong>' + esc(p.name) + '</strong>' + (note ? '<br>' + esc(note) : '') +
        (nx ? '<br><em class="pp-next">' + esc(nx) + '</em>' : '') + pending + bearingHtml(p.lat, p.lng) + dirLink(p.lat, p.lng) + fwBtn);
      
      m.setPopup(popup);
      if (layerVisibility.launch) m.addTo(map);
      layerLaunch.push(m);
    });

    if (map.isStyleLoaded()) {
      const lang = window.I18N ? I18N.get() : 'cas';
      const closureFeatures = (schedule.closures || []).map(c => ({
        type: 'Feature',
        properties: { name: lang === 'cas' ? (c.name_cas || c.name_va) : (c.name_va || c.name_cas) },
        geometry: { type: 'LineString', coordinates: c.path.map(p => [p[1], p[0]]) }
      }));
      map.getSource('closures').setData({ type: 'FeatureCollection', features: closureFeatures });

      const pmFeatures = (schedule.perimeters || []).map(pm => ({
        type: 'Feature',
        properties: { name: lang === 'cas' ? (pm.name_cas || pm.name_va) : (pm.name_va || pm.name_cas) },
        geometry: { type: 'Polygon', coordinates: [pm.polygon.map(p => [p[1], p[0]])] }
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

    if (lastPublicPalmeras) renderPublicPalmeras(lastPublicPalmeras);

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

  // ---- Infografia 3D de la palmera de foc ----
  function emptyFC() { return { type: 'FeatureCollection', features: [] }; }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

  function offsetLngLat(lng, lat, dxM, dyM) {
    const R = 6378137;
    const dLat = (dyM / R) * (180 / Math.PI);
    const dLng = (dxM / (R * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);
    return [lng + dLng, lat + dLat];
  }
  function circleRing(lng, lat, radiusM, sides) {
    const ring = [];
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      ring.push(offsetLngLat(lng, lat, Math.cos(a) * radiusM, Math.sin(a) * radiusM));
    }
    return ring;
  }

  // Preset únic i espectacular: no representa cap tipus real de pirotecnia
  // (carcasses, cohetà...) — la varietat ve només del color, triat de forma
  // determinista segons l'id del punt perquè cada palmera es veja diferent.
  const FW_PRESET = { apex: 150, riseMs: 1300, burstMs: 2800, petals: 46, spread: 50 };

  let fwToken = 0, fwCard = null, fwPrevCam = null, fwHideTimer = null;

  function ensureFwCard() {
    if (fwCard) return fwCard;
    fwCard = document.createElement('div');
    fwCard.className = 'fw-card';
    fwCard.hidden = true;
    document.body.appendChild(fwCard);
    return fwCard;
  }

  function playFirework(id) {
    if (!map || !lastSchedule || !map.getSource('fw-trail')) return;
    const p = (lastSchedule.launch_points || []).find((x) => x.id === id);
    if (!p) return;
    const lang = window.I18N ? I18N.get() : 'cas';
    const note = lang === 'cas' ? (p.note_cas || '') : (p.note_va || '');
    const style = window.FWStyles ? FWStyles.hashPick(p.id) : { colors: ['#f5c542', '#ffe9a8'] };
    showFirework({ lat: p.lat, lng: p.lng, name: p.name, note: note, safety: true }, style);
  }

  // Simulació amb estil lliure (usada també per "Mi palmera")
  function playFireworkCustom(point, styleId) {
    if (!map || !map.getSource('fw-trail')) return;
    const style = window.FWStyles ? FWStyles.get(styleId) : { colors: ['#f5c542', '#ffe9a8'] };
    showFirework({ lat: point.lat, lng: point.lng, name: point.name, note: '', safety: false }, style);
  }

  function showFirework(p, style) {
    const token = ++fwToken;
    const safetyLabel = window.I18N ? I18N.t('fw.safety') : '';
    const closeLabel = window.I18N ? I18N.t('fw.close') : '';
    const camLabel = window.I18N ? I18N.t('fw.camera_cta') : '';
    const kicker = window.I18N ? I18N.t('fw.kicker') : '🎆';
    const styleLabel = window.FWStyles ? FWStyles.label(style) : '';

    fwPrevCam = { center: map.getCenter(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
    map.flyTo({ center: [p.lng, p.lat], zoom: 17.3, pitch: 68, bearing: (map.getBearing() + 35) % 360, duration: 1100, essential: true });

    const card = ensureFwCard();
    card.hidden = false;
    card.innerHTML =
      '<button class="fw-close" aria-label="' + esc(closeLabel) + '">✕</button>' +
      '<div class="fw-kicker">' + esc(kicker) + (styleLabel ? ' · ' + esc(styleLabel) : '') + '</div>' +
      '<h3 class="fw-title">' + esc(p.name) + '</h3>' +
      (p.note ? '<p class="fw-note">' + esc(p.note) + '</p>' : '') +
      (p.safety ? '<div class="fw-stats"><span>' + esc(safetyLabel) + '</span></div>' : '') +
      '<button class="fw-cam-btn">📷 ' + esc(camLabel) + '</button>';
    card.querySelector('.fw-close').addEventListener('click', () => closeFirework());
    card.querySelector('.fw-cam-btn').addEventListener('click', () => {
      if (window.ARCamera) ARCamera.open({ lat: p.lat, lng: p.lng, name: p.name });
    });
    requestAnimationFrame(() => card.classList.add('is-in'));

    setTimeout(() => { if (token === fwToken) runBurst(p, FW_PRESET, style.colors, token); }, 200);

    if (fwHideTimer) clearTimeout(fwHideTimer);
    fwHideTimer = setTimeout(() => { if (token === fwToken) closeFirework(); }, FW_PRESET.riseMs + FW_PRESET.burstMs + 4500);
  }

  function closeFirework() {
    fwToken++;
    if (fwHideTimer) { clearTimeout(fwHideTimer); fwHideTimer = null; }
    if (fwCard) {
      fwCard.classList.remove('is-in');
      setTimeout(() => { if (fwCard) fwCard.hidden = true; }, 300);
    }
    if (map) {
      if (map.getSource('fw-trail')) map.getSource('fw-trail').setData(emptyFC());
      if (map.getSource('fw-burst')) map.getSource('fw-burst').setData(emptyFC());
      if (map.getLayer('fw-trail-layer')) map.setPaintProperty('fw-trail-layer', 'fill-extrusion-opacity', 0);
      if (map.getLayer('fw-burst-layer')) map.setPaintProperty('fw-burst-layer', 'fill-extrusion-opacity', 0);
      if (fwPrevCam) map.flyTo({ center: fwPrevCam.center, zoom: fwPrevCam.zoom, pitch: fwPrevCam.pitch, bearing: fwPrevCam.bearing, duration: 1200 });
    }
    fwPrevCam = null;
  }

  function runBurst(p, cfg, colors, token) {
    if (!map || !map.getSource('fw-trail')) return;
    const trailSrc = map.getSource('fw-trail'), burstSrc = map.getSource('fw-burst');
    const trailRing = circleRing(p.lng, p.lat, 3, 8);

    const petals = [];
    for (let i = 0; i < cfg.petals; i++) {
      const angle = (i / cfg.petals) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = cfg.spread * (0.55 + Math.random() * 0.55);
      const [plng, plat] = offsetLngLat(p.lng, p.lat, Math.cos(angle) * dist, Math.sin(angle) * dist);
      petals.push({
        color: colors[i % colors.length],
        apex: cfg.apex * (0.75 + Math.random() * 0.4),
        ring: circleRing(plng, plat, 2 + Math.random() * 2, 6)
      });
    }

    const start = performance.now();
    function frame(now) {
      if (token !== fwToken) return;
      const t = now - start;

      const riseT = Math.min(1, t / cfg.riseMs);
      const h = cfg.apex * easeOutCubic(riseT);
      const trailOp = riseT < 1 ? 0.95 : Math.max(0, 0.95 - (t - cfg.riseMs) / 300);
      map.setPaintProperty('fw-trail-layer', 'fill-extrusion-opacity', trailOp);
      trailSrc.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { h, color: '#fff6d8' }, geometry: { type: 'Polygon', coordinates: [trailRing] } }]
      });

      if (t >= cfg.riseMs) {
        const bt = Math.min(1, (t - cfg.riseMs) / cfg.burstMs);
        const popIn = Math.min(1, bt / 0.18);
        map.setPaintProperty('fw-burst-layer', 'fill-extrusion-opacity', Math.max(0, (1 - bt) * popIn));
        const feats = petals.map((f) => ({
          type: 'Feature',
          properties: { h: f.apex * (1 - bt * 0.55) * popIn, color: f.color },
          geometry: { type: 'Polygon', coordinates: [f.ring] }
        }));
        burstSrc.setData({ type: 'FeatureCollection', features: feats });
      }

      if (t < cfg.riseMs + cfg.burstMs) requestAnimationFrame(frame);
      else {
        trailSrc.setData(emptyFC()); burstSrc.setData(emptyFC());
        map.setPaintProperty('fw-trail-layer', 'fill-extrusion-opacity', 0);
        map.setPaintProperty('fw-burst-layer', 'fill-extrusion-opacity', 0);
      }
    }
    requestAnimationFrame(frame);
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

  // ---- Palmeres ciutadanes publiques (Supabase, visibles per a tots els usuaris) ----
  function renderPublicPalmeras(list) {
    lastPublicPalmeras = list || [];
    if (!map) return;
    clearMarkers(layerPalmeres);
    const simLbl = window.I18N ? I18N.t('fw.cta') : 'Veure en 3D';
    lastPublicPalmeras.forEach((c) => {
      if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return;
      const m = new mapboxgl.Marker({ element: cpalmIcon() }).setLngLat([c.lng, c.lat]);
      const nameLine = c.name ? esc(c.name) + ' · ' : '';
      const popup = new mapboxgl.Popup({ offset: 11 }).setHTML(
        '<strong>' + esc(c.dedication) + '</strong><br>' + nameLine + (c.time ? esc(c.time) : '') +
        '<div class="pp-fw-actions"><button class="tl-map-btn fw-cta-btn" onclick="window.ElxMap && window.ElxMap.playFireworkCustom({lat:' + c.lat + ',lng:' + c.lng + ',name:\'' + esc(c.dedication).replace(/'/g, '&#39;') + '\'},\'' + (c.style || 'dorada') + '\')">🎆 ' + esc(simLbl) + '</button></div>'
      );
      m.setPopup(popup);
      if (layerVisibility.palmeres) m.addTo(map);
      layerPalmeres.push(m);
    });
  }

  function renderMyPalm(p) {
    if (!map) return;
    if (myPalmMarker) { myPalmMarker.remove(); myPalmMarker = null; }
    if (!p) return;
    myPalmMarker = new mapboxgl.Marker({ element: myPalmIcon() }).setLngLat([p.lng, p.lat]).addTo(map);
    const shareLbl = window.I18N ? I18N.t('mypalm.share_btn') : 'Compartir';
    const delLbl = window.I18N ? I18N.t('mypalm.delete') : 'Eliminar';
    const simLbl = window.I18N ? I18N.t('fw.cta') : 'Veure en 3D';
    const nameLine = p.name ? esc(p.name) + ' \u00B7 ' : '';

    const popup = new mapboxgl.Popup({ offset: 19 }).setHTML(
      '<strong>\uD83C\uDF34 ' + esc(p.dedication) + '</strong><br>' + nameLine + '13/08 \u00B7 ' + esc(p.time) +
      '<div class="pp-fw-actions">' +
      '<button class="mp-pop-sim tl-map-btn" onclick="window.ElxMap && window.ElxMap.playFireworkCustom({lat:' + p.lat + ',lng:' + p.lng + ',name:\'' + esc(p.dedication).replace(/'/g, '&#39;') + '\'},\'' + (p.style || 'dorada') + '\')">\uD83C\uDF86 ' + simLbl + '</button>' +
      '</div>' +
      '<button class="mp-pop-share tl-map-btn" onclick="window.MyPalm && MyPalm.share()">' + shareLbl + '</button> ' +
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
    setMeetingPoint, shareMeeting, setNextInfo, focusLaunchPoint, setLayerVisible,
    renderMyPalm, focusMyPalm, getCenter, renderPublicPalmeras,
    playFirework, playFireworkCustom, closeFirework,
    hasLeaflet: hasMapbox // alias for app.js
  };
})();
