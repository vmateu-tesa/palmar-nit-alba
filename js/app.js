/* =====================================================================
   Elx al Cel — Orquestación v2
   ===================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let timelineTick = null;

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
    if (name === 'ar') { AR.start(() => toast(I18N.t('ar.permission_needed'))); }
    else { AR.stop(); }
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
    let pct = ((Date.now() - first) / (last - first)) * 100;
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
          '<h3>' + labelFor(state.current) + '</h3>' +
          (lp ? '<p class="tl-place">' + lp.name + '</p>' : '') +
          (note ? '<p class="tl-note">' + note + '</p>' : '');
        if (window.ElxMap && lp) ElxMap.setActiveLaunchPoint(schedule, lp.id);
        AR.setTarget(lp, labelFor(state.current));
      } else if (state.notStarted && state.next) {
        const untilStart = state.next._start - Date.now();
        nowCard.innerHTML =
          '<span class="tl-badge tl-badge-muted">' + I18N.t('timeline.not_started') + '</span>' +
          '<h3>' + labelFor(state.next) + '</h3>' +
          '<p class="tl-countdown">' + fmtCountdown(untilStart) + '</p>';
        AR.setTarget(Timeline.launchPointOf(schedule, state.next), labelFor(state.next));
      } else if (state.allDone) {
        nowCard.innerHTML = '<p class="tl-done">' + I18N.t('timeline.all_done') + '</p>';
        AR.setTarget(null);
      }
    }

    renderProgress(state);

    if (window.Alerts) Alerts.check(state, labelFor, toast);

    listEl.innerHTML = state.items.map((it) => {
      const isNow = state.current && state.current.id === it.id;
      const isPast = it._start < Date.now() && !isNow;
      const cls = isNow ? 'is-now' : (isPast ? 'is-past' : 'is-upcoming');
      const time = new Date(it._start).toLocaleTimeString(I18N.get() === 'cas' ? 'es-ES' : 'ca-ES',
        { hour: '2-digit', minute: '2-digit' });
      return '<li class="tl-item ' + cls + '">' +
        '<span class="tl-time">' + time + '</span>' +
        '<span class="tl-name">' + labelFor(it) + (it.highlight ? ' <span class="tl-star">✦</span>' : '') + '</span>' +
        '</li>';
    }).join('');
  }

  function initMapView(schedule) {
    if (!window.ElxMap) return;
    ElxMap.init('map', schedule);
    ElxMap.startUserLocation((pos, errCode) => {
      const label = $('#map-locate-label');
      if (!label) return;
      if (pos) { label.textContent = I18N.t('map.you_are_here'); return; }
      // 1 = permiso denegado, 2 = sin señal, 3 = timeout
      label.textContent = errCode === 1 ? I18N.t('map.gps_denied') : I18N.t('map.no_gps');
    });
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

  async function boot() {
    I18N.applyToDom();
    initNav();

    const schedule = await DB.loadSchedule();
    if (schedule) {
      initMapView(schedule);
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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.ElxApp = { toast, setView };
})();
