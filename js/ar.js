/* =====================================================================
   PalmAR — Modo AR: cámara trasera + palmeres superpuestas en el cielo.
   · Sin cámara -> cielo estrellado simulado.
   · Brújula de orientación: con GPS + giroscopio te guía con una flecha
     hacia la palmera más cercana ("gira cap ací").
   ===================================================================== */
(function () {
  const overlay = () => document.getElementById('ar-overlay');
  const video = () => document.getElementById('ar-video');
  const canvas = () => document.getElementById('ar-canvas');
  const compass = () => document.getElementById('ar-compass');
  const arrow = () => document.getElementById('ar-arrow');
  const targetEl = () => document.getElementById('ar-target');
  const distEl = () => document.getElementById('ar-target-dist');

  let scene = null, stream = null, tapBound = null, orient = null, autoType = null;
  let geoWatch = null, userPos = null, heading = null, headingHandler = null;
  let palmeras = [], target = null;

  const toRad = (d) => d * Math.PI / 180;
  const toDeg = (r) => r * 180 / Math.PI;

  // Rumbo (bearing) inicial de A hacia B, en grados desde el norte.
  function bearing(lat1, lon1, lat2, lon2) {
    const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  // Distancia haversine en metros.
  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dφ = toRad(lat2 - lat1), dλ = toRad(lon2 - lon1);
    const a = Math.sin(dφ / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dλ / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  function fmtDist(m) {
    if (m == null) return '';
    return m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km';
  }

  function addRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'ar-ripple';
    r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once: true });
  }
  function addBurstLabel(x, y, label) {
    const l = document.createElement('div');
    l.className = 'ar-burst-label';
    l.textContent = label;
    l.style.left = x + 'px'; l.style.top = y + 'px';
    document.body.appendChild(l);
    l.addEventListener('animationend', () => l.remove(), { once: true });
  }

  function clampType(id) {
    if (window.Fireworks && Fireworks.getType(id)) return id;
    const T = window.Fireworks ? Fireworks.TYPES : [];
    return T.length ? T[(Math.random() * T.length) | 0].id : 'palmera_or';
  }

  async function start(typeId, onClose) {
    autoType = clampType(typeId);
    const ov = overlay(); if (!ov) return;
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    AR._onClose = onClose;

    // Lista de palmeres con ubicación, para la brújula.
    palmeras = (window.PalmarApp && PalmarApp.getPalmeras ? PalmarApp.getPalmeras() : [])
      .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
    target = null; userPos = null; heading = null;

    let hasCam = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, audio: false
      });
      const v = video();
      v.srcObject = stream;
      v.style.display = 'block';
      await v.play().catch(() => {});
      hasCam = true;
    } catch (e) {
      hasCam = false;
      video().style.display = 'none';
      if (window.PalmarApp) PalmarApp.toast(I18N.t('msg.ar_no_cam'));
    }

    scene = Fireworks.createScene(canvas(), { transparent: hasCam, density: 0.9 });
    scene.setTransparent(hasCam);
    scene.start();
    scene.resize();
    scene.setAuto(autoType, 2400);

    // Tocar el cielo para lanzar una palmera (con sonido + ripple).
    tapBound = (ev) => {
      if (ev.target.closest && ev.target.closest('.ar-close')) return;
      const c = canvas(), rect = c.getBoundingClientRect();
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const xFrac = Math.min(0.95, Math.max(0.05, (clientX - rect.left) / rect.width));
      const yFrac = Math.min(0.6, Math.max(0.12, (clientY - rect.top) / rect.height));
      scene.launch(autoType, xFrac, yFrac);
      if (window.Fireworks && Fireworks.Sound) Fireworks.Sound.boom(0.28);
      addRipple(clientX, clientY);
      addBurstLabel(clientX, clientY - 20, Fireworks.typeName(autoType, window.I18N ? I18N.get() : 'va'));
    };
    ov.addEventListener('pointerdown', tapBound);

    enableOrientation();
    enableGeolocation();
    if (palmeras.length) {
      compass().hidden = false;
      targetEl().textContent = I18N.t('ar.locating');
      distEl().textContent = '';
    }
  }

  function setType(typeId) { autoType = clampType(typeId); if (scene) scene.setType(autoType); }

  // ---- Geolocalización (posición del usuario) ----
  function enableGeolocation() {
    if (!('geolocation' in navigator)) { showNoGps(); return; }
    geoWatch = navigator.geolocation.watchPosition(
      (pos) => { userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }; updateCompass(); },
      () => { showNoGps(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }
  function showNoGps() {
    if (!palmeras.length) { compass().hidden = true; return; }
    targetEl().textContent = I18N.t('ar.no_gps');
    distEl().textContent = '';
    arrow().style.opacity = '0.25';
  }

  // ---- Brújula / giroscopio (hacia dónde mira el móvil) ----
  function onOrientation(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') {
      h = e.webkitCompassHeading;                 // iOS: 0 = norte, horario
    } else if (e.absolute && typeof e.alpha === 'number') {
      h = (360 - e.alpha) % 360;                   // estándar absoluto
    } else if (typeof e.alpha === 'number') {
      h = (360 - e.alpha) % 360;                   // mejor esfuerzo
    }
    if (h != null) { heading = h; updateCompass(); }
    // parallax suave de la escena
    const c = canvas(); if (c) {
      const gx = Math.max(-30, Math.min(30, e.gamma || 0)) / 30;
      const gy = Math.max(-30, Math.min(30, (e.beta || 45) - 45)) / 30;
      c.style.transform = 'scale(1.06) translate(' + (-gx * 12).toFixed(1) + 'px,' + (-gy * 12).toFixed(1) + 'px)';
    }
  }
  function enableOrientation() {
    const add = () => {
      headingHandler = onOrientation;
      window.addEventListener('deviceorientationabsolute', headingHandler, true);
      window.addEventListener('deviceorientation', headingHandler, true);
      orient = headingHandler;
    };
    try {
      if (window.DeviceOrientationEvent &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then((s) => { if (s === 'granted') add(); }).catch(() => {});
      } else { add(); }
    } catch (e) { /* sin giroscopio: sin brújula */ }
  }

  // ---- Cálculo de la flecha hacia la palmera más cercana ----
  function nearest() {
    if (!userPos || !palmeras.length) return null;
    let best = null, bd = Infinity;
    palmeras.forEach((p) => {
      const d = distance(userPos.lat, userPos.lng, p.lat, p.lng);
      if (d < bd) { bd = d; best = { p, d }; }
    });
    return best;
  }

  function updateCompass() {
    if (compass().hidden) return;
    if (!userPos) { return; }              // aún localizando
    const n = nearest();
    if (!n) { targetEl().textContent = I18N.t('ar.no_palmeras'); distEl().textContent = ''; return; }
    target = n.p;
    targetEl().textContent = n.p.name || '✦';
    distEl().textContent = fmtDist(n.d);
    arrow().style.opacity = '1';

    if (heading == null) {
      // Sin brújula: mostramos a dónde está, sin rotación fiable
      arrow().style.opacity = '0.5';
      return;
    }
    const brg = bearing(userPos.lat, userPos.lng, n.p.lat, n.p.lng);
    let rel = (brg - heading + 540) % 360 - 180;   // -180..180, 0 = al frente
    // glifo "➤" apunta a la derecha por defecto -> -90 para que 0 sea arriba
    arrow().style.transform = 'rotate(' + (rel - 90) + 'deg)';
    const aligned = Math.abs(rel) < 16;
    arrow().classList.toggle('aligned', aligned);
    targetEl().textContent = aligned
      ? I18N.t('ar.found')
      : (n.p.name || '✦');
  }

  function stop() {
    const ov = overlay();
    if (ov) {
      ov.classList.remove('open');
      ov.setAttribute('aria-hidden', 'true');
      if (tapBound) ov.removeEventListener('pointerdown', tapBound);
    }
    tapBound = null;
    if (scene) { scene.stop(); scene = null; }
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    const v = video(); if (v) { v.srcObject = null; }
    if (orient) {
      window.removeEventListener('deviceorientationabsolute', orient, true);
      window.removeEventListener('deviceorientation', orient, true);
      orient = null; headingHandler = null;
    }
    if (geoWatch != null) { navigator.geolocation.clearWatch(geoWatch); geoWatch = null; }
    const c = canvas(); if (c) c.style.transform = '';
    if (compass()) compass().hidden = true;
    if (arrow()) { arrow().style.transform = ''; arrow().classList.remove('aligned'); }
    userPos = null; heading = null; target = null;
    if (AR._onClose) { const cb = AR._onClose; AR._onClose = null; cb(); }
  }

  const AR = { start, stop, setType, _onClose: null };
  window.AR = AR;
})();
