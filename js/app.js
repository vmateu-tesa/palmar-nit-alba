/* =====================================================================
   Elx al Cel — Orquestación v2
   ===================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let timelineTick = null;
  let expandedId = null;   // hito desplegado en el programa
  let deferredInstall = null;

  // Saneamiento: todo texto de datos que se inyecta via innerHTML pasa por aqui.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    const card = $('#install-card'), btn = $('#install-btn');
    if (card) card.hidden = false;
    if (btn) btn.hidden = false;
  });

  function toast(msg) {
    const t = $('#toast'); if (!t || !msg) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  function setView(name) {
    $$('.view').forEach((v) => v.classList.toggle('is-active', v.dataset.view === name));
    $$('.nav-item').forEach((b) => b.classList.toggle('is-active', b.dataset.nav === name));
    if (name === 'map' && window.ElxMap) ElxMap.refresh();
    if (name === 'ar') { AR.start(); }
    else { AR.stop(); }
    showHint(name);
  }

  function showHint(view) {
    const el = document.querySelector('.view-hint[data-hint="' + view + '"]');
    if (!el) return;
    if (localStorage.getItem('elx_hint_' + view)) return;
    el.hidden = false;
  }
  function initHints() {
    $$('.view-hint-x').forEach((b) => b.addEventListener('click', () => {
      const box = b.closest('.view-hint');
      box.hidden = true;
      localStorage.setItem('elx_hint_' + box.dataset.hint, '1');
    }));
  }

  function initWelcome() {
    const w = $('#welcome');
    if (!w) return;
    if (!localStorage.getItem('elx_welcome')) {
      w.hidden = false;
      const cta = $('#welcome-cta');
      if (cta) cta.addEventListener('click', () => {
        w.hidden = true;
        w.style.display = 'none';
        localStorage.setItem('elx_welcome', '1');
        showHint('map');
      });
    } else {
      showHint('map');
    }
  }

  function renderStatusBanner() {
    const banner = $('#status-banner');
    if (!banner) return;
    const status = DB.getStatus();
    const lang = I18N.get();
    const delay = (status && status.delay_minutes) || 0;
    const notice = status ? (lang === 'cas' ? status.notice_cas : status.notice_va) : '';
    const parts = [];
    if (delay > 0) parts.push(I18N.t('status.delay', { min: delay }));
    if (notice) parts.push(notice);
    if (parts.length) { banner.textContent = parts.join(' · '); banner.hidden = false; }
    else { banner.hidden = true; }
  }

  function fmtCountdown(ms) {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? (h + ':' + pad(m) + ':' + pad(s)) : (pad(m) + ':' + pad(s));
  }

  function labelFor(item) {
    const lang = I18N.get();
    return lang === 'cas' ? (item.type_cas || item.type_va) : (item.type_va || item.type_cas);
  }
  function noteFor(item) {
    const lang = I18N.get();
    return lang === 'cas' ? (item.note_cas || '') : (item.note_va || '');
  }

  function renderProgress(state) {
    const bar = $('#tl-progress-bar');
    const pctEl = $('#tl-progress-pct');
    if (!bar || !state.items.length) return;
    const first = state.items[0]._start;
    const last = state.items[state.items.length - 1]._start + 20 * 60000;
    let pct = (((window.Clock ? Clock.now() : Date.now()) - first) / (last - first)) * 100;
    pct = Math.max(0, Math.min(100, pct));
    bar.style.width = pct.toFixed(1) + '%';
    if (pctEl) pctEl.textContent = pct > 0 && pct < 100 ? Math.round(pct) + '%' : '';
  }

  function renderTimeline() {
    const schedule = DB.getSchedule();
    const listEl = $('#timeline-list');
    const nowCard = $('#timeline-now-card');
    if (!schedule || !listEl) return;

    const delay = DB.getDelayMinutes();
    const state = Timeline.computeState(schedule, delay);
    if (!state) return;

    if (nowCard) {
      if (state.current) {
        const lp = Timeline.launchPointOf(schedule, state.current);
        const note = noteFor(state.current);
        nowCard.innerHTML =
          '<span class="tl-badge">' + I18N.t('timeline.now') + '</span>' +
          '<h3>' + esc(labelFor(state.current)) + '</h3>' +
          (lp ? '<p class="tl-place">' + esc(lp.name) + '</p>' : '') +
          (note ? '<p class="tl-note">' + esc(note) + '</p>' : '');
        if (window.ElxMap && lp) ElxMap.setActiveLaunchPoint(schedule, lp.id);
        AR.setTarget(lp, labelFor(state.current));
      } else if (state.notStarted && state.next) {
        const untilStart = state.next._start - (window.Clock ? Clock.now() : Date.now());
        nowCard.innerHTML =
          '<span class="tl-badge tl-badge-muted">' + I18N.t('timeline.not_started') + '</span>' +
          '<h3>' + esc(labelFor(state.next)) + '</h3>' +
          '<p class="tl-countdown">' + fmtCountdown(untilStart) + '</p>';
        AR.setTarget(Timeline.launchPointOf(schedule, state.next), labelFor(state.next));
      } else if (state.allDone) {
        nowCard.innerHTML = '<p class="tl-done">' + I18N.t('timeline.all_done') + '</p>';
        AR.setTarget(null);
      }
    }

    renderProgress(state);

    // "Próximo desde aquí" por punto de lanzamiento (para los popups del mapa)
    const nextByPoint = {};
    state.items.forEach((it) => {
      if (it._start >= (window.Clock ? Clock.now() : Date.now()) && it.launch_point && !nextByPoint[it.launch_point]) {
        const time = new Date(it._start).toLocaleTimeString(I18N.get() === 'cas' ? 'es-ES' : 'ca-ES', { hour: '2-digit', minute: '2-digit' });
        nextByPoint[it.launch_point] = I18N.t('map.next_here') + ': ' + labelFor(it) + ' \u00B7 ' + time;
      }
    });
    if (window.ElxMap) ElxMap.setNextInfo(nextByPoint);

    if (window.Alerts) Alerts.check(state, labelFor, toast);

    listEl.innerHTML = state.items.map((it) => {
      const isNow = state.current && state.current.id === it.id;
      const isPast = it._start < (window.Clock ? Clock.now() : Date.now()) && !isNow;
      const cls = isNow ? 'is-now' : (isPast ? 'is-past' : 'is-upcoming');
      const time = new Date(it._start).toLocaleTimeString(I18N.get() === 'cas' ? 'es-ES' : 'ca-ES',
        { hour: '2-digit', minute: '2-digit' });
      const note = noteFor(it);
      const lp = Timeline.launchPointOf(schedule, it);
      const open = expandedId === it.id;
      return '<li class="tl-item ' + cls + (open ? ' is-open' : '') + '" data-id="' + it.id + '">' +
        '<div class="tl-row">' +
          '<span class="tl-time">' + time + '</span>' +
          '<span class="tl-name">' + esc(labelFor(it)) + (it.highlight ? ' <span class="tl-star">\u2726</span>' : '') + '</span>' +
          '<span class="tl-caret" aria-hidden="true">\u25BE</span>' +
        '</div>' +
        (open ? '<div class="tl-detail">' +
            (note ? '<p>' + esc(note) + '</p>' : '') +
            (lp ? '<button class="tl-map-btn" data-point="' + lp.id + '">' + I18N.t('timeline.see_map') + ' \u00B7 ' + esc(lp.name) + '</button>' : '') +
          '</div>' : '') +
        '</li>';
    }).join('');
  }

  function initMapView(schedule) {
    if (!window.ElxMap) return;
    try { ElxMap.init('map', schedule); } catch (e) { console.warn('[map]', e); return; }
    applyLayerPrefs();
    let gpsToastShown = false;
    ElxMap.startUserLocation((pos, errCode) => {
      if (!pos && !gpsToastShown) {
        gpsToastShown = true;
        toast(errCode === 1 ? I18N.t('map.gps_denied') : I18N.t('map.no_gps'));
      }
    });
  }

  function initTimelineInteractions() {
    const listEl = $('#timeline-list');
    if (!listEl) return;
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.tl-map-btn');
      if (btn) { setView('map'); ElxMap.focusLaunchPoint(btn.dataset.point); return; }
      const li = e.target.closest('.tl-item');
      if (li) { expandedId = expandedId === li.dataset.id ? null : li.dataset.id; renderTimeline(); }
    });
  }

  function loadLayerPrefs() {
    try { return JSON.parse(localStorage.getItem('elx_layers')) || {}; } catch (e) { return {}; }
  }
  function initLayers() {
    const btn = $('#layers-btn'), panel = $('#layers-panel');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => { panel.hidden = !panel.hidden; });
    const prefs = loadLayerPrefs();
    $$('#layers-panel input[data-layer]').forEach((cb) => {
      const key = cb.dataset.layer;
      if (prefs[key] === false) cb.checked = false;
      cb.addEventListener('change', () => {
        ElxMap.setLayerVisible(key, cb.checked);
        const p = loadLayerPrefs(); p[key] = cb.checked;
        localStorage.setItem('elx_layers', JSON.stringify(p));
      });
    });
  }
  function applyLayerPrefs() {
    const prefs = loadLayerPrefs();
    Object.keys(prefs).forEach((k) => ElxMap.setLayerVisible(k, prefs[k] !== false));
  }

  function initInstall() {
    const btn = $('#install-btn');
    if (btn) btn.addEventListener('click', async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      deferredInstall = null;
      const card = $('#install-card');
      if (card) card.hidden = true;
    });
    // iOS no dispara beforeinstallprompt: instrucciones manuales
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (isIOS && !standalone) {
      const card = $('#install-card'), ios = $('#install-ios');
      if (card) card.hidden = false;
      if (ios) ios.hidden = false;
    }
  }

  function initConnectivity() {
    const badge = $('#offline-badge');
    const paint = () => { if (badge) badge.hidden = navigator.onLine; };
    window.addEventListener('online', paint);
    window.addEventListener('offline', paint);
    paint();
  }

  function initNav() {
    $$('.nav-item').forEach((b) => b.addEventListener('click', () => setView(b.dataset.nav)));
    const locateBtn = $('#locate-btn');
    if (locateBtn) locateBtn.addEventListener('click', () => ElxMap.centerOnUser());
    const langBtn = $('#lang-toggle');
    if (langBtn) langBtn.addEventListener('click', () => { I18N.toggle(); refreshTexts(); });
    const shareBtn = $('#share-btn');
    if (shareBtn) shareBtn.addEventListener('click', () => ElxMap.shareMeeting());
    const notifyBtn = $('#notify-btn');
    if (notifyBtn) {
      const paint = () => {
        notifyBtn.classList.toggle('is-on', window.Alerts && Alerts.isEnabled());
        const lbl = notifyBtn.querySelector('span');
        if (lbl) lbl.textContent = I18N.t(Alerts.isEnabled() ? 'notify.enabled' : 'notify.enable');
      };
      notifyBtn.addEventListener('click', () => Alerts.requestPermission(toast));
      window.addEventListener('elx-notify-changed', paint);
      window.addEventListener('elx-lang-changed', paint);
      paint();
    }
  }

  function refreshTexts() {
    I18N.applyToDom();
    renderStatusBanner();
    renderTimeline();
  }

  function initDemo(schedule) {
    try {
      const q = new URLSearchParams(location.search);
      if (!q.has('demo') || !schedule || !schedule.schedule || !schedule.schedule.length) return;
      const times = schedule.schedule.map((i) => new Date(i.start).getTime());
      const highlights = schedule.schedule.filter((i) => i.highlight).map((i) => new Date(i.start).getTime());
      // Ancla: 7 min antes del gran hito (Palmera de la Mare de Déu) para un arco de demo perfecto.
      const anchor = (highlights.length ? Math.max.apply(null, highlights) : Math.min.apply(null, times)) - 7 * 60000;
      Clock.setOffset(anchor - Date.now());
      const badge = $('#demo-badge');
      if (badge) badge.hidden = false;
      setTimeout(() => toast(I18N.t('demo.on')), 800);
    } catch (e) { /* nunca bloquear el arranque por el modo demo */ }
  }

  async function boot() {
    I18N.applyToDom();
    initNav();
    initHints();
    initWelcome();
    initTimelineInteractions();
    initLayers();
    initInstall();
    initConnectivity();
    const arBtn = $('#ar-enable-btn');
    if (arBtn) arBtn.addEventListener('click', () => AR.enable(() => toast(I18N.t('ar.permission_needed'))));

    const schedule = await DB.loadSchedule();
    initDemo(schedule);
    if (schedule) {
      initMapView(schedule);
      AR.setTargets(schedule.launch_points || []);
      renderTimeline();
    } else {
      toast(I18N.t('common.offline_bad'));
    }

    if (schedule && window.TilePrefetch) TilePrefetch.schedule(schedule);

    DB.startStatusPolling();
    DB.onUpdate(() => { renderStatusBanner(); renderTimeline(); });

    if (timelineTick) clearInterval(timelineTick);
    timelineTick = setInterval(renderTimeline, 15000);

    setView('map');

    if (!localStorage.getItem('elx_meet_hint')) {
      setTimeout(() => { toast(I18N.t('map.meeting_hint')); localStorage.setItem('elx_meet_hint', '1'); }, 2500);
    }

    // Recuperación: al volver del bloqueo del móvil, repintar el programa al instante.
    document.addEventListener('visibilitychange', () => { if (!document.hidden) renderTimeline(); });
    // Recuperación: si la primera carga falló sin red, reintentar al recuperarla.
    window.addEventListener('online', async () => {
      if (!DB.getSchedule()) {
        const s = await DB.loadSchedule();
        if (s) { initDemo(s); initMapView(s); renderTimeline(); }
      }
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.ElxApp = { toast, setView };
})();
