/* =====================================================================
   Elx al Cel — Capa de datos
   No hay base de datos ni cuentas. Dos ficheros:
   · schedule.json  -> "base de datos" inmutable (puntos, cronograma, mapa)
   · status.json    -> avisos en vivo (retrasos, incidencias), TTL corto
   ===================================================================== */
(function () {
  const cfg = window.ElxConfig || {};
  let schedule = null;
  let status = null;
  let statusTimer = null;
  const listeners = [];

  function emit() { listeners.forEach((cb) => cb({ schedule, status })); }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts || {});
    if (!res.ok) throw new Error('http-' + res.status);
    return res.json();
  }

  // schedule.json: se pide una vez; el Service Worker decide cache-first /
  // stale-while-revalidate, asi que esta llamada es barata incluso offline.
  async function loadSchedule() {
    // 3 intentos con espera creciente: la red del evento puede fallar a rachas.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        schedule = await fetchJSON(cfg.SCHEDULE_URL);
        break;
      } catch (e) {
        if (attempt === 2) console.warn('[data] no se pudo cargar schedule.json', e);
        else await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    emit();
    return schedule;
  }

  // status.json: peticion ligera y repetida, sin cache persistente.
  async function pollStatus() {
    try {
      status = await fetchJSON(cfg.STATUS_URL, { cache: 'no-store' });
    } catch (e) {
      // sin red: mantenemos el ultimo estado conocido (o null si nunca llego)
    }
    emit();
  }

  function startStatusPolling() {
    pollStatus();
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = setInterval(pollStatus, cfg.STATUS_POLL_MS || 30000);
  }

  function onUpdate(cb) { listeners.push(cb); }

  function getSchedule() { return schedule; }
  function getStatus() { return status; }
  function getDelayMinutes() { return (status && status.delay_minutes) || 0; }

  window.DB = {
    loadSchedule, startStatusPolling, onUpdate,
    getSchedule, getStatus, getDelayMinutes
  };
})();
