/* =====================================================================
   Elx al Cel — Cronograma en tiempo real
   Todo el calculo es local: se compara la hora del dispositivo contra los
   timestamps absolutos de schedule.json (mas el retraso de status.json).
   Un hito se considera "activo" desde su hora de inicio hasta la hora de
   inicio del siguiente (o +20 min si es el ultimo).
   ===================================================================== */
(function () {
  const ACTIVE_WINDOW_FALLBACK_MS = 20 * 60 * 1000;

  function withDelay(items, delayMin) {
    const offset = (delayMin || 0) * 60000;
    return items.map((it) => ({
      ...it,
      _start: new Date(it.start).getTime() + offset
    }));
  }

  // Devuelve { current, next, items } con los tiempos ya ajustados por el retraso.
  function computeState(schedule, delayMin) {
    if (!schedule || !Array.isArray(schedule.schedule)) return null;
    const items = withDelay(schedule.schedule, delayMin)
      .sort((a, b) => a._start - b._start);

    const now = (window.Clock ? Clock.now() : Date.now());
    let current = null, next = null;
    for (let i = 0; i < items.length; i++) {
      const start = items[i]._start;
      const end = (i + 1 < items.length) ? items[i + 1]._start : start + ACTIVE_WINDOW_FALLBACK_MS;
      if (now >= start && now < end) { current = items[i]; next = items[i + 1] || null; break; }
      if (now < start) { next = items[i]; break; }
    }
    const allDone = !current && !next && items.length && now >= items[items.length - 1]._start;
    const notStarted = !current && next === items[0];

    return { items, current, next, allDone, notStarted, now };
  }

  function launchPointOf(schedule, item) {
    if (!schedule || !item) return null;
    return (schedule.launch_points || []).find((p) => p.id === item.launch_point) || null;
  }

  window.Timeline = { computeState, launchPointOf };
})();
