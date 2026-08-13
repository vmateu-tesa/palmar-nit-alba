/* =====================================================================
   Elx al Cel — Avisos de proximitat
   Tot local: es compara el rellotge del dispositiu amb el programa.
   · Avís "En X min" quan falta ≤5 min per a un hite.
   · Avís "Ara" quan comença un hite destacat (p. ex. la Palmera de la
     Mare de Déu). Vibració + notificació del sistema si l'usuari ho permet.
   Sense servidor de push: si l'app està oberta (o instal·lada en pantalla),
   funciona encara que la xarxa estiga saturada.
   ===================================================================== */
(function () {
  const warned = {};   // avisos "en X min" ja mostrats (per id)
  const started = {};  // avisos "ara" ja mostrats (per id)
  const WINDOW_MS = 5 * 60000;

  function vibrate() {
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  }

  function systemNotify(body, tag) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Elx al Cel', { body, icon: 'icons/icon.svg', tag: tag || 'elx-alert' });
      }
    } catch (e) {}
  }

  function fire(msg, toast, tag) {
    if (toast) toast(msg);
    vibrate();
    systemNotify(msg, tag);
  }

  // Llamado en cada tick del cronograma (cada ~15 s).
  function check(state, labelFor, toast) {
    if (!state || !state.items) return;
    const now = (window.Clock ? Clock.now() : Date.now());
    state.items.forEach((it) => {
      const dt = it._start - now;
      if (dt > 0 && dt <= WINDOW_MS && !warned[it.id]) {
        warned[it.id] = true;
        const min = Math.max(1, Math.round(dt / 60000));
        fire(I18N.t('alert.soon', { min, name: labelFor(it) }), toast);
      }
      if (it.highlight && dt <= 0 && dt > -60000 && !started[it.id]) {
        started[it.id] = true;
        fire(I18N.t('alert.now', { name: labelFor(it) }), toast);
      }
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function minuteKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  function minuteLabel(date) {
    return date.toLocaleTimeString((window.I18N && I18N.get() === 'va') ? 'ca-ES' : 'es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  function officialBuckets(palmeras, delayMinutes) {
    const delayMs = (delayMinutes || 0) * 60000;
    const buckets = {};
    (palmeras || []).forEach((p) => {
      const raw = Date.parse(p.start);
      if (!isFinite(raw)) return;
      const startMs = raw + delayMs;
      const d = new Date(startMs);
      const key = minuteKey(d);
      if (!buckets[key]) buckets[key] = { key, startMs, time: minuteLabel(d), count: 0, first: p.number, last: p.number };
      buckets[key].count += 1;
      buckets[key].first = Math.min(buckets[key].first, p.number);
      buckets[key].last = Math.max(buckets[key].last, p.number);
    });
    return Object.keys(buckets).map((k) => buckets[k]).sort((a, b) => a.startMs - b.startMs);
  }
  function rangeLabel(bucket) {
    const a = '#' + String(bucket.first).padStart(3, '0');
    const b = '#' + String(bucket.last).padStart(3, '0');
    return bucket.first === bucket.last ? a : a + '–' + b;
  }

  // Avisos opt-in para el listado oficial de palmeras: se agrupan por minuto
  // para evitar bombardear al usuario con 312 notificaciones separadas.
  function checkOfficialPalmeras(schedule, delayMinutes, toast) {
    if (!schedule || !schedule.official_palmeras || !schedule.official_palmeras.length) return;
    if (!isEnabled()) return;
    const now = (window.Clock ? Clock.now() : Date.now());
    officialBuckets(schedule.official_palmeras, delayMinutes).forEach((b) => {
      const dt = b.startMs - now;
      const key = 'official-' + b.key + '-d' + (delayMinutes || 0);
      const vars = { min: Math.max(1, Math.round(dt / 60000)), count: b.count, range: rangeLabel(b), time: b.time };
      if (dt > 0 && dt <= WINDOW_MS && !warned[key]) {
        warned[key] = true;
        fire(I18N.t('official.notify.soon', vars), toast, key + '-soon');
      }
      if (dt <= 0 && dt > -60000 && !started[key]) {
        started[key] = true;
        fire(I18N.t('official.notify.now', vars), toast, key + '-now');
      }
    });
  }

  function requestPermission(toast) {
    if (!('Notification' in window)) { if (toast) toast(I18N.t('notify.denied')); return; }
    if (Notification.permission === 'granted') { if (toast) toast(I18N.t('notify.enabled')); return; }
    Notification.requestPermission().then((p) => {
      if (toast) toast(I18N.t(p === 'granted' ? 'notify.enabled' : 'notify.denied'));
      window.dispatchEvent(new CustomEvent('elx-notify-changed'));
    }).catch(() => {});
  }

  function isEnabled() {
    return ('Notification' in window) && Notification.permission === 'granted';
  }

  window.Alerts = { check, checkOfficialPalmeras, requestPermission, isEnabled };
})();
