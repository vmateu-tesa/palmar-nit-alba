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

  function systemNotify(body) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Elx al Cel', { body, icon: 'icons/icon.svg', tag: 'elx-alert' });
      }
    } catch (e) {}
  }

  function fire(msg, toast) {
    if (toast) toast(msg);
    vibrate();
    systemNotify(msg);
  }

  // Llamado en cada tick del cronograma (cada ~15 s).
  function check(state, labelFor, toast) {
    if (!state || !state.items) return;
    const now = Date.now();
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

  window.Alerts = { check, requestPermission, isEnabled };
})();
