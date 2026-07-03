/* =====================================================================
   Elx al Cel — Brújula orientativa v6 (rediseño UX)
   Flujo: pantalla explicativa → botón "Activar" (gesto de usuario,
   necesario en iOS) → brújula con objetivo elegible.
   Degradación elegante:
   · Sin sensor de orientación pero con GPS → modo texto:
     "La Basílica está a 450 m al NE de ti".
   · Sin GPS → mensaje claro y sugerencia de usar el mapa.
   Todo el cálculo es local (sin red).
   ===================================================================== */
(function () {
  const $ = (id) => document.getElementById(id);

  let userPos = null, heading = null, target = null, targets = [];
  let autoTarget = null;            // el objetivo que marca el programa
  let manualTargetId = null;        // si el usuario eligió uno a mano
  let geoWatch = null, orientHandler = null;
  let pendingFrame = false, active = false, enabled = false;
  let sensorSeen = false;

  const toRad = (d) => d * Math.PI / 180;
  const toDeg = (r) => r * 180 / Math.PI;
  const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const cardinal = (h) => CARDINALS[Math.round(((h % 360) + 360) % 360 / 45) % 8];

  function bearing(a, b) {
    const φ1 = toRad(a.lat), φ2 = toRad(b.lat), Δλ = toRad(b.lng - a.lng);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  function distance(a, b) {
    const R = 6371000, dφ = toRad(b.lat - a.lat), dλ = toRad(b.lng - a.lng);
    const s = Math.sin(dφ / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dλ / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  const fmtDist = (m) => m == null ? '' : (m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km');

  // ---------- Objetivos ----------
  function setTargets(points) { targets = points || []; renderChips(); pickTarget(); }
  function setAutoTarget(point, label) {
    autoTarget = point ? { ...point, label: label || point.name } : null;
    pickTarget();
  }
  function pickTarget() {
    if (manualTargetId) {
      const p = targets.find((t) => t.id === manualTargetId);
      target = p ? { ...p, label: p.name } : null;
    } else {
      target = autoTarget;
    }
    render();
  }
  function renderChips() {
    const box = $('ar-targets');
    if (!box) return;
    const chips = [
      { id: null, label: I18N.t('ar.target_auto') }
    ].concat(targets.map((t) => ({ id: t.id, label: t.name })));
    box.innerHTML = chips.map((c) =>
      '<button class="ar-chip' + ((c.id || null) === manualTargetId ? ' is-active' : '') + '" data-target="' + (c.id || '') + '">' +
      c.label.replace(/</g, '&lt;') + '</button>').join('');
    Array.from(box.querySelectorAll('.ar-chip')).forEach((b) => {
      b.addEventListener('click', () => { manualTargetId = b.dataset.target || null; renderChips(); pickTarget(); });
    });
  }

  // ---------- Render ----------
  function show(id, on) { const el = $(id); if (el) el.hidden = !on; }

  function render() {
    if (!active) return;
    show('ar-intro', !enabled);
    show('ar-live', enabled);
    if (!enabled) return;

    const nameEl = $('ar-target-name'), distEl = $('ar-target-dist'),
          headEl = $('ar-heading'), stateEl = $('ar-state'), arrow = $('ar-arrow');

    if (headEl) headEl.textContent = heading == null ? '' : Math.round(heading) + '\u00B0 \u00B7 ' + cardinal(heading);

    if (!target) {
      if (nameEl) nameEl.textContent = I18N.t('ar.no_target');
      if (distEl) distEl.textContent = '';
      if (stateEl) stateEl.textContent = '';
      if (arrow) { arrow.style.opacity = heading == null ? '0.2' : '0.7'; if (heading != null) rotateTo(-heading); }
      return;
    }
    if (nameEl) nameEl.textContent = target.label;

    if (!userPos) {
      if (distEl) distEl.textContent = '';
      if (stateEl) stateEl.textContent = I18N.t('ar.locating');
      if (arrow) arrow.style.opacity = '0.25';
      return;
    }

    const dist = distance(userPos, target);
    const brg = bearing(userPos, target);
    if (distEl) distEl.textContent = fmtDist(dist);

    if (heading == null) {
      // Modo texto (sin sensor): dirección cardinal absoluta
      if (arrow) arrow.style.opacity = '0.15';
      if (stateEl) stateEl.textContent = I18N.t('ar.text_mode', { card: cardinal(brg) });
      return;
    }

    const rel = (brg - heading + 540) % 360 - 180;
    rotateTo(rel);
    const aligned = Math.abs(rel) < 15;
    if (arrow) { arrow.style.opacity = '1'; arrow.classList.toggle('aligned', aligned); }
    if (stateEl) {
      stateEl.textContent = aligned ? I18N.t('ar.aligned')
        : I18N.t(rel > 0 ? 'ar.turn_right' : 'ar.turn_left');
    }
  }
  function rotateTo(rel) {
    const arrow = $('ar-arrow');
    if (arrow) arrow.style.transform = 'rotate(' + (rel - 90) + 'deg)';
  }

  // ---------- Sensores ----------
  function enableGeolocation() {
    if (!('geolocation' in navigator)) { render(); return; }
    geoWatch = navigator.geolocation.watchPosition(
      (p) => { userPos = { lat: p.coords.latitude, lng: p.coords.longitude }; render(); },
      () => { userPos = null; render(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }
  function onOrientation(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (typeof e.alpha === 'number') h = (360 - e.alpha) % 360;
    if (h == null) return;
    sensorSeen = true;
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
      // Si en 3 s no ha llegado ningún dato, avisamos del modo texto
      setTimeout(() => { if (!sensorSeen && active) render(); }, 3000);
    };
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then((s) => { if (s === 'granted') add(); else if (onDenied) onDenied(); })
          .catch(() => { if (onDenied) onDenied(); });
      } else { add(); }
    } catch (e) { if (onDenied) onDenied(); }
  }

  // ---------- Ciclo de vida ----------
  // enable(): llamado por el botón "Activar" (gesto de usuario, clave en iOS)
  function enable(onDenied) {
    if (enabled) return;
    enabled = true;
    enableGeolocation();
    enableOrientation(onDenied);
    render();
  }
  function start() { active = true; render(); }
  function stop() {
    active = false; enabled = false; sensorSeen = false;
    if (geoWatch != null) { navigator.geolocation.clearWatch(geoWatch); geoWatch = null; }
    if (orientHandler) {
      window.removeEventListener('deviceorientationabsolute', orientHandler, true);
      window.removeEventListener('deviceorientation', orientHandler, true);
      orientHandler = null;
    }
    userPos = null; heading = null;
  }

  window.AR = { start, stop, enable, setTargets, setAutoTarget,
    setTarget: setAutoTarget /* compatibilidad */ };
})();
