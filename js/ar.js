/* =====================================================================
   Elx al Cel — Brúixola orientativa
   Indica cap a quin punt cardinal / punt de llançament mirar. Tot el
   càlcul (rumb, distància) és local; no hi ha xarxa ni càmera implicades.
   ===================================================================== */
(function () {
  const arrowEl = () => document.getElementById('ar-arrow');
  const targetEl = () => document.getElementById('ar-target-name');
  const distEl = () => document.getElementById('ar-target-dist');
  const hintEl = () => document.getElementById('ar-hint');
  const headingEl = () => document.getElementById('ar-heading');

  let userPos = null, heading = null, target = null;
  let geoWatch = null, orientHandler = null;
  let pendingFrame = false;
  let active = false;

  const toRad = (d) => d * Math.PI / 180;
  const toDeg = (r) => r * 180 / Math.PI;

  function bearing(lat1, lon1, lat2, lon2) {
    const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dφ = toRad(lat2 - lat1), dλ = toRad(lon2 - lon1);
    const a = Math.sin(dφ / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dλ / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  function cardinal(h) { return CARDINALS[Math.round(h / 45) % 8]; }
  function renderHeading() {
    const el = headingEl();
    if (!el) return;
    el.textContent = heading == null ? '' : Math.round(heading) + '\u00B0 \u00B7 ' + cardinal(heading);
  }

  function fmtDist(m) {
    if (m == null) return '';
    return m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km';
  }

  // ---- Objetivo: el punto de lanzamiento del hito activo/proximo ----
  function setTarget(point, label) {
    target = point ? { ...point, label: label || point.name } : null;
    render();
  }

  function render() {
    const t = targetEl(), d = distEl(), h = hintEl();
    renderHeading();
    if (!target) {
      if (t) t.textContent = window.I18N ? I18N.t('ar.no_target') : '';
      if (d) d.textContent = '';
      const arrow = arrowEl();
      if (arrow) {
        if (heading != null) {
          // Mode brúixola: la fletxa apunta al nord
          const rel = (-heading + 540) % 360 - 180;
          arrow.style.transform = 'rotate(' + (rel - 90) + 'deg)';
          arrow.style.opacity = '0.75';
          arrow.classList.remove('aligned');
        } else {
          arrow.style.opacity = '0.2';
        }
      }
      return;
    }
    if (!userPos) {
      if (t) t.textContent = window.I18N ? I18N.t('ar.locating') : '';
      if (d) d.textContent = '';
      return;
    }
    const dist = distance(userPos.lat, userPos.lng, target.lat, target.lng);
    if (t) t.textContent = target.label;
    if (d) d.textContent = fmtDist(dist);

    if (heading == null) {
      if (arrowEl()) arrowEl().style.opacity = '0.4';
      if (h) h.textContent = window.I18N ? I18N.t('ar.no_compass') : '';
      return;
    }
    const brg = bearing(userPos.lat, userPos.lng, target.lat, target.lng);
    let rel = (brg - heading + 540) % 360 - 180;
    const arrow = arrowEl();
    if (arrow) {
      arrow.style.opacity = '1';
      arrow.style.transform = 'rotate(' + (rel - 90) + 'deg)';
      const aligned = Math.abs(rel) < 16;
      arrow.classList.toggle('aligned', aligned);
      if (t) t.textContent = aligned ? (window.I18N ? I18N.t('ar.aligned') : target.label) : target.label;
    }
  }

  // ---- Geolocalización ----
  function enableGeolocation() {
    if (!('geolocation' in navigator)) return;
    geoWatch = navigator.geolocation.watchPosition(
      (pos) => { userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }; render(); },
      () => { userPos = null; render(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }

  // ---- Brújula (throttled con requestAnimationFrame, no en cada evento) ----
  function onOrientation(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (typeof e.alpha === 'number') h = (360 - e.alpha) % 360;
    if (h == null) return;
    heading = h;
    if (!pendingFrame) {
      pendingFrame = true;
      requestAnimationFrame(() => { pendingFrame = false; if (active) render(); });
    }
  }

  function enableOrientation(onDenied) {
    const add = () => {
      orientHandler = onOrientation;
      window.addEventListener('deviceorientationabsolute', orientHandler, true);
      window.addEventListener('deviceorientation', orientHandler, true);
    };
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then((s) => {
          if (s === 'granted') add(); else if (onDenied) onDenied();
        }).catch(() => { if (onDenied) onDenied(); });
      } else { add(); }
    } catch (e) { if (onDenied) onDenied(); }
  }

  function start(onDenied) {
    active = true;
    userPos = null; heading = null;
    enableGeolocation();
    enableOrientation(onDenied);
    render();
  }

  function stop() {
    active = false;
    if (geoWatch != null) { navigator.geolocation.clearWatch(geoWatch); geoWatch = null; }
    if (orientHandler) {
      window.removeEventListener('deviceorientationabsolute', orientHandler, true);
      window.removeEventListener('deviceorientation', orientHandler, true);
      orientHandler = null;
    }
    userPos = null; heading = null;
  }

  window.AR = { start, stop, setTarget };
})();
