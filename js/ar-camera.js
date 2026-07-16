/* =====================================================================
   Elx al Cel — Realitat Augmentada amb càmera (fase inicial)
   Des de la infografia 3D d'una palmera de foc, l'usuari pot obrir la
   càmera del mòbil i veure una fletxa que l'orienta cap al punt de
   llançament real, per a fer-hi una foto o un xicotet vídeo apuntant en
   la direcció correcta. Reutilitza el mateix càlcul de rumb que la
   brúixola (ar.js), superposat sobre el feed de la càmera.
   Fotos i vídeos porten el logo i el nom de l'app "cremats" a la imatge
   (marca d'aigua dibuixada en canvas), i es guarden/comparteixen
   directament des del dispositiu — res s'envia a cap servidor.
   ===================================================================== */
(function () {
  const REC_MAX_MS = 30000; // límit tou per a no disparar l'ús de memòria en mòbil

  let overlay = null, video = null, canvas = null, stream = null;
  let userPos = null, heading = null, target = null;
  let geoWatch = null, orientHandler = null;
  let active = false, sensorSeen = false, hasAbsolute = false, pendingFrame = false;

  let lastMediaUrl = null, lastMediaKind = null; // 'image' | 'video'
  let logoImg = null, logoReady = false;

  let composeCanvas = null, composeCtx = null, composeRAF = null;
  let mediaRecorder = null, recChunks = [], recStartTs = 0, recTimerInt = null;

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
  function smooth(prev, next) {
    if (prev == null) return next;
    const d = ((next - prev + 540) % 360) - 180;
    return (prev + d * 0.25 + 360) % 360;
  }
  function screenAngle() {
    try {
      if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
      return window.orientation || 0;
    } catch (e) { return 0; }
  }
  function t(key, vars) { return window.I18N ? I18N.t(key, vars) : key; }
  function toast(msg) { if (window.ElxApp && ElxApp.toast) ElxApp.toast(msg); }
  const pad2 = (n) => String(n).padStart(2, '0');

  function loadLogo() {
    if (logoImg) return;
    logoImg = new Image();
    logoImg.onload = () => { logoReady = true; };
    logoImg.src = 'icons/icon.svg';
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'arcam-overlay';
    overlay.innerHTML =
      '<video class="arcam-video" playsinline autoplay muted></video>' +
      '<canvas class="arcam-canvas" hidden></canvas>' +
      '<img class="arcam-preview" hidden alt="" />' +
      '<video class="arcam-preview-video" hidden controls playsinline loop></video>' +
      '<div class="arcam-top">' +
        '<button class="arcam-close" aria-label="close">✕</button>' +
        '<div class="arcam-title"></div>' +
        '<span class="arcam-rec-timer" hidden>00:00</span>' +
      '</div>' +
      '<div class="arcam-guide">' +
        '<div class="arcam-arrow"><svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true"><path d="M12 2.5l7.5 15h-15z" fill="currentColor"/></svg></div>' +
        '<div class="arcam-hint"></div>' +
      '</div>' +
      '<div class="arcam-msg" hidden></div>' +
      '<div class="arcam-bottom">' +
        '<button class="arcam-rec" aria-label="record"><span class="arcam-rec-dot"></span></button>' +
        '<button class="arcam-shot" aria-label="shot"></button>' +
        '<span class="arcam-bottom-spacer"></span>' +
      '</div>' +
      '<div class="arcam-preview-actions" hidden>' +
        '<button class="arcam-retry"></button>' +
        '<button class="arcam-save"></button>' +
        '<button class="arcam-share"></button>' +
      '</div>';
    document.body.appendChild(overlay);
    video = overlay.querySelector('.arcam-video');
    canvas = overlay.querySelector('.arcam-canvas');
    overlay.querySelector('.arcam-close').addEventListener('click', close);
    overlay.querySelector('.arcam-shot').addEventListener('click', takePhoto);
    overlay.querySelector('.arcam-rec').addEventListener('click', toggleRecording);
    overlay.querySelector('.arcam-retry').addEventListener('click', backToLive);
    overlay.querySelector('.arcam-save').addEventListener('click', saveMedia);
    overlay.querySelector('.arcam-share').addEventListener('click', shareMedia);
    loadLogo();
    return overlay;
  }

  function showMsg(msg) {
    const el = overlay.querySelector('.arcam-msg');
    el.textContent = msg;
    el.hidden = false;
  }
  function hideMsg() { if (overlay) overlay.querySelector('.arcam-msg').hidden = true; }

  // ---------- Obertura / tancament ----------
  async function open(pt) {
    if (!pt) return;
    target = { lat: pt.lat, lng: pt.lng, name: pt.name || '' };
    ensureOverlay();
    overlay.hidden = false;
    overlay.querySelector('.arcam-title').textContent = target.name;
    requestAnimationFrame(() => overlay.classList.add('is-in'));
    active = true;
    hideMsg();
    backToLive();

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, audio: true
      });
    } catch (e) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }, audio: false
        });
      } catch (e2) {
        showMsg(t('arcam.camera_denied'));
      }
    }
    if (stream) video.srcObject = stream;

    enableGeolocation();
    enableOrientation();
  }

  function close() {
    active = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    stopCompose();
    if (overlay) {
      overlay.classList.remove('is-in');
      setTimeout(() => { if (overlay) overlay.hidden = true; }, 220);
    }
    if (stream) { stream.getTracks().forEach((tr) => tr.stop()); stream = null; }
    if (geoWatch != null) { navigator.geolocation.clearWatch(geoWatch); geoWatch = null; }
    if (orientHandler) {
      window.removeEventListener('deviceorientationabsolute', orientHandler, true);
      window.removeEventListener('deviceorientation', orientHandler, true);
      orientHandler = null;
    }
    userPos = null; heading = null; sensorSeen = false; hasAbsolute = false;
    if (lastMediaUrl) { URL.revokeObjectURL(lastMediaUrl); lastMediaUrl = null; }
  }

  // ---------- Sensors (mateixa lògica que ar.js) ----------
  function enableGeolocation() {
    if (!('geolocation' in navigator)) { showMsg(t('ar.no_gps')); return; }
    geoWatch = navigator.geolocation.watchPosition(
      (p) => { userPos = { lat: p.coords.latitude, lng: p.coords.longitude }; render(); },
      () => { userPos = null; render(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }
  function onOrientation(e) {
    let h = null, absolute = false;
    if (typeof e.webkitCompassHeading === 'number') {
      h = e.webkitCompassHeading; absolute = true;
    } else if (typeof e.alpha === 'number') {
      absolute = (e.type === 'deviceorientationabsolute') || e.absolute === true;
      if (hasAbsolute && !absolute) return;
      h = (360 - e.alpha + screenAngle()) % 360;
    }
    if (h == null) return;
    if (absolute) hasAbsolute = true;
    sensorSeen = true;
    heading = smooth(heading, h);
    if (!pendingFrame) {
      pendingFrame = true;
      requestAnimationFrame(() => { pendingFrame = false; if (active) render(); });
    }
  }
  function enableOrientation() {
    const add = () => {
      orientHandler = onOrientation;
      window.addEventListener('deviceorientationabsolute', orientHandler, true);
      window.addEventListener('deviceorientation', orientHandler, true);
      setTimeout(() => { if (!sensorSeen && active) render(); }, 2500);
    };
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then((s) => { if (s === 'granted') add(); else showMsg(t('ar.permission_needed')); })
          .catch(() => showMsg(t('ar.permission_needed')));
      } else { add(); }
    } catch (e) { showMsg(t('ar.permission_needed')); }
  }

  // ---------- Render de la fletxa/text ----------
  function rotateTo(rel) {
    const arrow = overlay && overlay.querySelector('.arcam-arrow');
    if (arrow) arrow.style.transform = 'rotate(' + rel + 'deg)';
  }
  function render() {
    if (!active || !overlay || !target) return;
    const hintEl = overlay.querySelector('.arcam-hint');
    const arrowEl = overlay.querySelector('.arcam-arrow');

    if (!userPos) { hintEl.textContent = t('ar.locating'); arrowEl.style.opacity = '0.2'; return; }

    const dist = distance(userPos, target);
    const brg = bearing(userPos, target);
    const distTxt = fmtDist(dist);

    if (heading == null) {
      arrowEl.style.opacity = '0.15';
      hintEl.textContent = t('ar.text_mode', { card: cardinal(brg) }) + ' · ' + distTxt;
      return;
    }

    const rel = (brg - heading + 540) % 360 - 180;
    rotateTo(rel);
    const aligned = Math.abs(rel) < 12;
    arrowEl.style.opacity = '1';
    arrowEl.classList.toggle('aligned', aligned);
    hintEl.classList.toggle('aligned', aligned);
    hintEl.textContent = (aligned ? t('ar.aligned') : (rel > 0 ? t('ar.turn_right') : t('ar.turn_left'))) + ' · ' + distTxt;
  }

  // ---------- Marca d'aigua (logo + nom app) ----------
  function drawWatermark(ctx, w, h) {
    const barH = Math.round(h * 0.1);
    const grad = ctx.createLinearGradient(0, h - barH, 0, h);
    grad.addColorStop(0, 'rgba(7,10,32,0)');
    grad.addColorStop(1, 'rgba(7,10,32,0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - barH, w, barH);

    const pad = Math.round(w * 0.035);
    const logoSize = Math.round(barH * 0.62);
    const logoY = h - barH * 0.5 - logoSize / 2;
    let textX = pad;
    if (logoReady) {
      ctx.save();
      ctx.beginPath();
      const r = logoSize * 0.22;
      ctx.moveTo(pad + r, logoY);
      ctx.arcTo(pad + logoSize, logoY, pad + logoSize, logoY + logoSize, r);
      ctx.arcTo(pad + logoSize, logoY + logoSize, pad, logoY + logoSize, r);
      ctx.arcTo(pad, logoY + logoSize, pad, logoY, r);
      ctx.arcTo(pad, logoY, pad + logoSize, logoY, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, pad, logoY, logoSize, logoSize);
      ctx.restore();
      textX = pad + logoSize + pad * 0.6;
    }

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f5c542';
    ctx.font = '700 ' + Math.round(barH * 0.32) + 'px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Elx al Cel · ' + (target.name || ''), textX, h - barH * 0.44);
    ctx.fillStyle = '#f3f1ea';
    ctx.font = '600 ' + Math.round(barH * 0.24) + 'px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.fillText("Nit de l'Albà · 13/08", textX, h - barH * 0.15);
  }

  // ---------- Fluxe live / previsualització ----------
  function backToLive() {
    overlay.querySelector('.arcam-preview').hidden = true;
    overlay.querySelector('.arcam-preview-video').hidden = true;
    overlay.querySelector('.arcam-preview-video').pause();
    overlay.querySelector('.arcam-preview-actions').hidden = true;
    overlay.querySelector('.arcam-video').hidden = false;
    overlay.querySelector('.arcam-guide').hidden = false;
    overlay.querySelector('.arcam-bottom').hidden = false;
    if (lastMediaUrl) { URL.revokeObjectURL(lastMediaUrl); lastMediaUrl = null; }
    lastMediaKind = null;
  }

  function showPreview(url, kind) {
    lastMediaUrl = url;
    lastMediaKind = kind;
    overlay.querySelector('.arcam-video').hidden = true;
    overlay.querySelector('.arcam-guide').hidden = true;
    overlay.querySelector('.arcam-bottom').hidden = true;
    if (kind === 'video') {
      const v = overlay.querySelector('.arcam-preview-video');
      v.src = url; v.hidden = false; v.play().catch(() => {});
    } else {
      const img = overlay.querySelector('.arcam-preview');
      img.src = url; img.hidden = false;
    }
    const actions = overlay.querySelector('.arcam-preview-actions');
    actions.hidden = false;
    actions.querySelector('.arcam-retry').textContent = t('arcam.retry');
    actions.querySelector('.arcam-save').textContent = t('arcam.save');
    actions.querySelector('.arcam-share').textContent = t('arcam.share');
  }

  // ---------- Foto ----------
  function takePhoto() {
    if (!video || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawWatermark(ctx, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      showPreview(URL.createObjectURL(blob), 'image');
    }, 'image/jpeg', 0.92);
  }

  // ---------- Vídeo (compon el frame + marca d'aigua en un canvas en directe) ----------
  function startCompose() {
    composeCanvas = document.createElement('canvas');
    composeCanvas.width = video.videoWidth;
    composeCanvas.height = video.videoHeight;
    composeCtx = composeCanvas.getContext('2d');
    const loop = () => {
      if (!composeCtx) return;
      composeCtx.drawImage(video, 0, 0, composeCanvas.width, composeCanvas.height);
      drawWatermark(composeCtx, composeCanvas.width, composeCanvas.height);
      composeRAF = requestAnimationFrame(loop);
    };
    loop();
  }
  function stopCompose() {
    if (composeRAF) cancelAnimationFrame(composeRAF);
    composeRAF = null; composeCanvas = null; composeCtx = null;
  }

  function pickMimeType() {
    const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (const m of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  }

  function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording();
    else startRecording();
  }

  function startRecording() {
    if (!video || !video.videoWidth) return;
    if (!window.MediaRecorder) { showMsg(t('arcam.record_unsupported')); return; }

    startCompose();
    const canvasStream = composeCanvas.captureStream(30);
    const audioTracks = stream ? stream.getAudioTracks() : [];
    const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
    const mimeType = pickMimeType();

    try {
      mediaRecorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
    } catch (e) {
      stopCompose();
      showMsg(t('arcam.record_unsupported'));
      return;
    }

    recChunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) recChunks.push(e.data); };
    mediaRecorder.onstop = onRecordingStop;
    mediaRecorder.start();
    recStartTs = Date.now();
    setRecUI(true);
    recTimerInt = setInterval(updateRecTimer, 250);
    updateRecTimer();
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  function updateRecTimer() {
    const ms = Date.now() - recStartTs;
    const s = Math.floor(ms / 1000);
    const el = overlay.querySelector('.arcam-rec-timer');
    el.textContent = pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
    if (ms >= REC_MAX_MS) stopRecording();
  }

  function setRecUI(recording) {
    const btn = overlay.querySelector('.arcam-rec');
    const timer = overlay.querySelector('.arcam-rec-timer');
    const shot = overlay.querySelector('.arcam-shot');
    btn.classList.toggle('is-rec', recording);
    timer.hidden = !recording;
    shot.hidden = recording;
    if (!recording) { clearInterval(recTimerInt); recTimerInt = null; }
  }

  function onRecordingStop() {
    stopCompose();
    setRecUI(false);
    const type = mediaRecorder.mimeType || 'video/webm';
    const blob = new Blob(recChunks, { type });
    recChunks = [];
    if (!blob.size) return;
    showPreview(URL.createObjectURL(blob), 'video');
  }

  // ---------- Guardar / compartir ----------
  function ext() { return lastMediaKind === 'video' ? 'webm' : 'jpg'; }
  function mime() { return lastMediaKind === 'video' ? 'video/webm' : 'image/jpeg'; }
  function fileBase() { return 'elx-al-cel-' + (target.name || 'palmera').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  function saveMedia() {
    if (!lastMediaUrl) return;
    const a = document.createElement('a');
    a.href = lastMediaUrl;
    a.download = fileBase() + '.' + ext();
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast(t('arcam.saved'));
  }

  async function shareMedia() {
    if (!lastMediaUrl) return;
    try {
      const blob = await fetch(lastMediaUrl).then((r) => r.blob());
      const file = new File([blob], fileBase() + '.' + ext(), { type: mime() });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: "Nit de l'Albà · " + (target.name || '') + ' · Elx al Cel' });
        return;
      }
      throw new Error('no-share');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      saveMedia();
    }
  }

  window.ARCamera = { open, close };
})();
