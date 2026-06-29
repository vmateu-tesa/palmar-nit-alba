/* =====================================================================
   PalmAR — Orquestación de la interfaz
   ===================================================================== */
(function () {
  const cfg = window.PalmarConfig || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  let palmeras = [];
  let selectedIndex = 0;
  let carouselBuilt = false;
  let carScenes = [];
  let detailScene = null;
  let simScene = null, simTimer = null;
  let pickCtl = null;
  let currentDetailId = null;
  let currentDetailPalmera = null;
  let authMode = 'signin';
  let pendingAuthAction = null;
  let draftMedia = [];   // [{type:'image'|'video', url:dataURL}]

  // ---------------- utilidades UI ----------------
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function openSheet(id) {
    $('#' + id).classList.add('open');
    $('#' + id).setAttribute('aria-hidden', 'false');
    const sc = $('#scrim'); sc.hidden = false;
  }
  function closeSheet(id) {
    const el = $('#' + id); if (!el) return;
    el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
    if (!$$('.sheet.open').length) $('#scrim').hidden = true;
    if (id === 'detail-sheet' && detailScene) { detailScene.stop(); detailScene = null; }
    if (id === 'add-sheet') stopCarousel();
    setNav('map');
  }
  function openModal(id) { $('#' + id).classList.add('open'); $('#' + id).setAttribute('aria-hidden', 'false'); }
  function closeModal(id) { $('#' + id).classList.remove('open'); $('#' + id).setAttribute('aria-hidden', 'true'); }
  function needLogin() { toast(I18N.t('msg.need_login')); openModal('auth-modal'); setAuthMode('signin'); }

  function setNav(name) {
    $$('.nav-item').forEach((b) => b.classList.toggle('is-active', b.dataset.nav === name));
  }

  // ---------------- palmeras / mapa ----------------
  async function loadPalmeras() {
    try {
      palmeras = await DB.listPalmeras();
      PalmarMap.renderPalmeras(palmeras, openDetail);
    } catch (e) { console.warn(e); }
  }

  // ---------------- detalle ----------------
  async function openDetail(p) {
    currentDetailId = p.id;
    currentDetailPalmera = p;
    $('#detail-name').textContent = p.name || '—';
    $('#detail-type').textContent = Fireworks.typeName(p.firework_type, I18N.get());
    $('#detail-time').textContent = '🕛 ' + I18N.t('common.at') + ' ' + (p.ignite_at || '--:--');
    $('#detail-note').textContent = p.family_note || '';
    $('#detail-official').hidden = !p.is_official;

    // descripción
    const desc = (p.description || '').trim();
    $('#detail-desc-wrap').hidden = !desc;
    $('#detail-desc').textContent = desc;
    // dedicatoria
    const ded = (p.dedication || '').trim();
    $('#detail-dedication-wrap').hidden = !ded;
    $('#detail-dedication').textContent = ded;
    // galería
    renderGallery(p.media || []);

    openSheet('detail-sheet');

    if (detailScene) detailScene.stop();
    setTimeout(() => {
      detailScene = Fireworks.preview($('#detail-preview'), p.firework_type, { density: 0.5, every: 1700 });
    }, 80);

    $('#detail-simulate').onclick = () => openSim(p);
    $('#detail-share').onclick = () => openShare(p);
    renderComments(p.id);
    renderReactions(p.id);
  }

  function renderGallery(media) {
    const box = $('#detail-gallery');
    box.innerHTML = '';
    (media || []).forEach((m) => {
      const cell = document.createElement('div');
      cell.className = 'media-cell';
      if (m.type === 'video') {
        cell.innerHTML = '<video src="' + m.url + '" muted playsinline></video><span class="play-ico">▶</span>';
        cell.onclick = () => openMediaViewer(m);
      } else {
        cell.innerHTML = '<img src="' + m.url + '" alt="" loading="lazy">';
        cell.onclick = () => openMediaViewer(m);
      }
      box.appendChild(cell);
    });
  }

  function openMediaViewer(m) {
    const ov = document.createElement('div');
    ov.className = 'modal open';
    ov.style.zIndex = 95;
    const inner = m.type === 'video'
      ? '<video src="' + m.url + '" controls autoplay playsinline style="max-width:100%;max-height:80vh;border-radius:14px"></video>'
      : '<img src="' + m.url + '" style="max-width:100%;max-height:80vh;border-radius:14px" alt="">';
    ov.innerHTML = '<div style="position:relative;max-width:92vw">' +
      '<button class="sheet-close" data-x style="top:-44px;right:0">✕</button>' + inner + '</div>';
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector('[data-x]').onclick = close;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  }

  async function renderComments(id) {
    const box = $('#comments-list');
    const list = await DB.getComments(id);
    if (!list.length) { box.innerHTML = '<p class="comment-empty">' + I18N.t('detail.no_comments') + '</p>'; return; }
    box.innerHTML = list.map((c) =>
      '<div class="comment">' + avatarMini(c.author_name, c.author_avatar) +
      '<div class="comment-body"><b>' + esc(c.author_name || '—') + '</b><p>' + esc(c.body) + '</p></div></div>'
    ).join('');
  }

  async function renderReactions(id) {
    const box = $('#detail-reactions');
    const r = await DB.getReactions(id);
    box.innerHTML = '';
    r.emojis.forEach((e) => {
      const b = document.createElement('button');
      b.className = 'react' + (r.mine[e] ? ' on' : '');
      b.textContent = e + ' ' + (r.counts[e] || 0);
      b.onclick = async () => {
        if (!DB.user()) return needLogin();
        await DB.toggleReaction(id, e); renderReactions(id);
      };
      box.appendChild(b);
    });
  }

  $('#comment-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!DB.user()) return needLogin();
    const inp = $('#comment-input'); const body = inp.value.trim();
    if (!body || !currentDetailId) return;
    await DB.addComment(currentDetailId, body);
    inp.value = ''; renderComments(currentDetailId); toast(I18N.t('msg.comment_added'));
  });

  const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

  // avatar pequeño: foto si existe, si no la inicial sobre círculo dorado
  function avatarMini(name, avatar) {
    if (avatar) return '<div class="comment-av has-photo" style="background-image:url(' + avatar + ')"></div>';
    return '<div class="comment-av">' + esc(((name || '·').trim().charAt(0) || '·').toUpperCase()) + '</div>';
  }

  // ---------------- compartir en redes ----------------
  function palmeraLink(p) {
    return location.origin + location.pathname + '?palmera=' + encodeURIComponent(p.id);
  }
  function shareText(p) {
    return I18N.t('share.text', { name: p.name || 'Palmera', time: p.ignite_at || '--:--' });
  }

  async function copyText(txt) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(txt); return true; }
    } catch (e) { /* fallback */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      return true;
    } catch (e) { return false; }
  }

  async function openShare(p) {
    const url = palmeraLink(p);
    const text = shareText(p);
    // API nativa de compartir (móvil): la mejor experiencia
    if (navigator.share) {
      try { await navigator.share({ title: I18N.t('share.title'), text, url }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; /* si falla, mostramos el panel */ }
    }
    // Panel propio con enlaces a redes
    const enc = encodeURIComponent, full = enc(text + ' ' + url);
    // Instagram no admite compartir por URL: copiamos el enllaç i obrim Instagram.
    const nets = [
      { k: 'whatsapp', ico: '🟢', href: 'https://wa.me/?text=' + full },
      { k: 'instagram', ico: '📸', ig: true },
      { k: 'facebook', ico: '🔵', href: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url) },
      { k: 'x', ico: '✖️', href: 'https://twitter.com/intent/tweet?text=' + full }
    ];
    const ov = document.createElement('div');
    ov.className = 'modal open'; ov.style.zIndex = 92;
    ov.innerHTML = '<div class="modal-card" style="max-width:380px">' +
      '<button class="sheet-close" data-x>✕</button>' +
      '<h2 class="sheet-title" style="margin-bottom:4px">' + I18N.t('share.sheet_title') + '</h2>' +
      '<p class="auth-sub">' + esc(p.name || '') + '</p>' +
      '<div class="share-grid">' +
      nets.map((n) => n.ig
        ? '<button type="button" class="share-opt share-ig" data-ig><span class="ico">' + n.ico + '</span>' + I18N.t('share.' + n.k) + '</button>'
        : '<a class="share-opt" href="' + n.href + '" target="_blank" rel="noopener">' +
          '<span class="ico">' + n.ico + '</span>' + I18N.t('share.' + n.k) + '</a>').join('') +
      '</div>' +
      '<p class="field"><span style="display:block;font-size:13px;color:var(--muted);margin-bottom:6px;font-weight:600">' +
      I18N.t('share.your_link') + '</span></p>' +
      '<div class="share-link-row">' +
      '<input id="share-url" readonly value="' + esc(url) + '">' +
      '<button class="btn btn-gold btn-sm" id="share-copy">' + I18N.t('share.copy_link') + '</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector('[data-x]').onclick = close;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('#share-url').onclick = (e) => e.target.select();
    ov.querySelector('#share-copy').onclick = async () => {
      if (await copyText(url)) toast(I18N.t('share.copied'));
    };
    const igBtn = ov.querySelector('[data-ig]');
    if (igBtn) igBtn.onclick = async () => {
      await copyText(text + ' ' + url);
      toast(I18N.t('share.ig_copied'));
      window.open('https://www.instagram.com/', '_blank', 'noopener');
    };
  }

  // ---------------- carrusel + alta ----------------
  function buildCarousel() {
    if (carouselBuilt) return;
    const wrap = $('#carousel');
    Fireworks.TYPES.forEach((t, i) => {
      const card = document.createElement('div');
      card.className = 'car-card'; card.dataset.idx = i;
      card.appendChild(document.createElement('canvas'));
      card.onclick = () => selectType(i, true);
      wrap.appendChild(card);
    });
    let raf = 0;
    wrap.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wr = wrap.getBoundingClientRect(); const mid = wr.left + wr.width / 2;
        let best = 0, bd = 1e9;
        [...wrap.children].forEach((c, i) => {
          const r = c.getBoundingClientRect(); const cc = r.left + r.width / 2;
          const d = Math.abs(cc - mid); if (d < bd) { bd = d; best = i; }
        });
        if (best !== selectedIndex) selectType(best, false);
      });
    });
    carouselBuilt = true;
  }
  function startCarousel() {
    stopCarousel();
    [...$('#carousel').children].forEach((card, i) => {
      const sc = Fireworks.preview(card.querySelector('canvas'), Fireworks.TYPES[i].id, { density: 0.5, every: 1900 + i * 110 });
      carScenes.push(sc);
    });
    setTimeout(() => selectType(selectedIndex, true), 60);
  }
  function stopCarousel() { carScenes.forEach((s) => s.stop()); carScenes = []; }

  function selectType(i, scroll) {
    i = Math.max(0, Math.min(Fireworks.TYPES.length - 1, i));
    selectedIndex = i;
    const t = Fireworks.TYPES[i];
    [...$('#carousel').children].forEach((c, idx) => c.classList.toggle('sel', idx === i));
    $('#carousel-name').textContent = Fireworks.typeName(t.id, I18N.get());
    if (pickCtl) pickCtl.setColor(t.color);
    if (window.AR) AR.setType(t.id);
    if (scroll) {
      const card = $('#carousel').children[i];
      if (card) card.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }
  const selectedType = () => Fireworks.TYPES[selectedIndex].id;

  function openAddSheet() {
    if (!DB.user()) { pendingAuthAction = openAddSheet; return needLogin(); }
    draftMedia = [];
    renderMediaThumbs();
    buildCarousel();
    gotoStep(1);
    $('#price-amount').textContent = Payments.priceLabel();
    openSheet('add-sheet');
    setTimeout(startCarousel, 140);
  }

  function gotoStep(n) {
    if (n === 3) {
      if (!$('#f-name').value.trim()) { toast(I18N.t('msg.name_required')); n = 2; }
      else if (!(pickCtl && pickCtl.getLatLng())) { toast(I18N.t('msg.pick_location')); n = 2; }
    }
    $$('.add-step').forEach((s) => s.classList.toggle('is-hidden', s.dataset.step !== String(n)));
    $$('[data-step-dot]').forEach((d) => d.classList.toggle('is-active', +d.dataset.stepDot <= n));
    if (n === 2) {
      if (!pickCtl) pickCtl = PalmarMap.initPicker('pick-map');
      if (pickCtl) { pickCtl.refresh(); pickCtl.setColor(Fireworks.TYPES[selectedIndex].color); }
    }
    if (n === 3) buildSummary();
  }

  function buildSummary() {
    const t = Fireworks.TYPES[selectedIndex];
    const ll = pickCtl && pickCtl.getLatLng();
    const note = $('#f-note').value.trim();
    $('#summary').innerHTML =
      '<b>' + esc($('#f-name').value || '—') + '</b><br>' +
      '✦ ' + esc(Fireworks.typeName(t.id, I18N.get())) + '<br>' +
      '🕛 ' + I18N.t('common.at') + ' ' + ($('#f-time').value || '--:--') + '<br>' +
      '📍 ' + (ll ? ll.lat.toFixed(4) + ', ' + ll.lng.toFixed(4) : '—') +
      (note ? '<br>📝 ' + esc(note) : '');
  }

  function collectDraft() {
    const t = Fireworks.TYPES[selectedIndex];
    const ll = pickCtl && pickCtl.getLatLng();
    return {
      name: $('#f-name').value.trim(),
      ignite_at: $('#f-time').value,
      family_note: $('#f-note').value.trim(),
      description: $('#f-desc').value.trim(),
      dedication: $('#f-dedication').value.trim(),
      media: draftMedia.slice(),
      firework_type: t.id,
      color: t.color,
      lat: ll ? ll.lat : null,
      lng: ll ? ll.lng : null
    };
  }

  // ---------------- subida de fotos/vídeos ----------------
  const MAX_MEDIA = 5;
  const MAX_BYTES = 3 * 1024 * 1024;   // 3 MB por archivo (tras compresión de imágenes)

  function renderMediaThumbs() {
    const box = $('#media-thumbs');
    box.innerHTML = '';
    draftMedia.forEach((m, i) => {
      const th = document.createElement('div');
      th.className = 'media-thumb';
      th.innerHTML = (m.type === 'video'
        ? '<video src="' + m.url + '" muted></video><span class="play-ico">▶</span>'
        : '<img src="' + m.url + '" alt="">') +
        '<button type="button" class="media-del" data-i="' + i + '" aria-label="x">✕</button>';
      box.appendChild(th);
    });
    box.querySelectorAll('.media-del').forEach((b) => {
      b.onclick = () => { draftMedia.splice(+b.dataset.i, 1); renderMediaThumbs(); };
    });
  }

  // Comprime imágenes a JPEG para no reventar el almacenamiento
  function compressImage(file, maxPx) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = maxPx || 1280;
        let { width: w, height: h } = img;
        if (w > max || h > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  const fileToDataURL = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
  });

  async function handleMediaFiles(files) {
    for (const file of files) {
      if (draftMedia.length >= MAX_MEDIA) { toast(I18N.t('media.max_reached')); break; }
      const isVideo = file.type.startsWith('video');
      try {
        let url;
        if (isVideo) {
          if (file.size > MAX_BYTES) { toast(I18N.t('media.too_big')); continue; }
          url = await fileToDataURL(file);
        } else {
          url = await compressImage(file);
        }
        draftMedia.push({ type: isVideo ? 'video' : 'image', url });
        renderMediaThumbs();
      } catch (e) { console.warn('media error', e); }
    }
  }

  async function doPay() {
    const draft = collectDraft();
    if (!draft.name) { toast(I18N.t('msg.name_required')); return gotoStep(2); }
    if (draft.lat == null) { toast(I18N.t('msg.pick_location')); return gotoStep(2); }
    toast(I18N.t('msg.paying'));
    const res = await Payments.checkout(draft);
    if (res.redirect) return;                 // Stripe real redirige
    if (res.paid) {
      try {
        const created = await DB.createPalmera(draft);
        closeSheet('add-sheet');
        if (pickCtl) pickCtl.reset();
        $('#f-name').value = ''; $('#f-note').value = '';
        $('#f-desc').value = ''; $('#f-dedication').value = '';
        draftMedia = []; renderMediaThumbs();
        await loadPalmeras();
        if (created.lat) PalmarMap.flyTo(created.lat, created.lng, 16);
        setTimeout(() => { openSim(created); toast(I18N.t('msg.palmera_published')); }, 500);
      } catch (e) { toast('Error: ' + (e.message || e)); }
    } else {
      toast(I18N.t('msg.pay_cancel'));
    }
  }

  // ---------------- simulación a pantalla completa ----------------
  function openSim(palmera) {
    if (simScene || simTimer) stopSim();
    const ov = $('#sim-overlay');
    ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false');
    simScene = Fireworks.createScene($('#sim-canvas'), { density: 1 });
    simScene.start(); simScene.resize();
    const ids = Fireworks.TYPES.map((t) => t.id);
    const main = palmera ? palmera.firework_type : null;
    const fire = () => {
      if (!simScene) return;
      const id = (main && Math.random() < 0.6) ? main : ids[(Math.random() * ids.length) | 0];
      simScene.launch(id, Math.random() * 0.7 + 0.15, Math.random() * 0.22 + 0.16);
    };
    fire(); simTimer = setInterval(fire, 1050);
    $('#sim-caption').textContent = palmera
      ? (palmera.name + ' — ' + Fireworks.typeName(palmera.firework_type, I18N.get()))
      : I18N.t('hero.kicker');
  }
  function stopSim() {
    if (simTimer) { clearInterval(simTimer); simTimer = null; }
    if (simScene) { simScene.stop(); simScene = null; }
    const ov = $('#sim-overlay');
    ov.classList.remove('open'); ov.setAttribute('aria-hidden', 'true');
    setNav('map');
  }

  // ---------------- AR ----------------
  function startAR() {
    setNav('ar');
    AR.start(selectedType(), () => setNav('map'));
  }

  // ---------------- auth ----------------
  function setAuthMode(mode) {
    authMode = mode;
    const signin = mode === 'signin', signup = mode === 'signup',
          reset = mode === 'reset', newpass = mode === 'newpass';
    $('#field-name').hidden = !signup;
    $('#field-email').hidden = !(signin || signup || reset);
    $('#field-pass').hidden = !(signin || signup);
    $('#field-newpass').hidden = !newpass;
    $('#auth-title').textContent = I18N.t(
      signup ? 'auth.title_signup' : reset ? 'auth.title_reset' : newpass ? 'auth.title_newpass' : 'auth.title');
    $('#auth-sub').textContent = I18N.t(reset ? 'auth.reset_sub' : 'auth.sub');
    $('#auth-submit').textContent = I18N.t(
      signup ? 'auth.signup' : reset ? 'auth.reset_btn' : newpass ? 'auth.newpass_btn' : 'auth.signin');
    $('#auth-forgot').hidden = !signin;
    const sw = $('#auth-switch');
    sw.hidden = newpass;
    sw.textContent = I18N.t(signup ? 'auth.to_signin' : reset ? 'auth.back_signin' : 'auth.to_signup');
  }

  $('#auth-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = $('#a-email').value.trim();
    const pass = $('#a-pass').value;
    const name = $('#a-name').value.trim() || (email ? email.split('@')[0] : '');

    // --- recuperar contraseña: pedir enlace / correo ---
    if (authMode === 'reset') {
      if (!email) return toast(I18N.t('auth.email'));
      try {
        const r = await DB.resetPassword(email);
        if (r && r.local) { toast(I18N.t('msg.reset_local')); setAuthMode('newpass'); }
        else { toast(I18N.t('msg.reset_sent')); setAuthMode('signin'); }
      } catch (e) { toast(I18N.t('msg.reset_nouser')); }
      return;
    }

    // --- fijar nueva contraseña ---
    if (authMode === 'newpass') {
      const np = $('#a-newpass').value;
      if (!np || np.length < 6) return toast(I18N.get() === 'cas' ? 'Mínimo 6 caracteres' : 'Mínim 6 caràcters');
      try {
        await DB.updatePassword(np);
        closeModal('auth-modal');
        toast(I18N.t('msg.reset_done'));
        if (pendingAuthAction) { const a = pendingAuthAction; pendingAuthAction = null; setTimeout(a, 200); }
      } catch (e) { toast('Error: ' + (e.message || e)); }
      return;
    }

    // --- entrar / registrarse ---
    if (!email || !pass) return toast(I18N.t('msg.need_login'));
    try {
      const u = (authMode === 'signup') ? await DB.signUp(name, email, pass) : await DB.signIn(email, pass);
      closeModal('auth-modal');
      toast(I18N.t('msg.welcome', { name: (u && u.name) || name }));
      if (pendingAuthAction) { const a = pendingAuthAction; pendingAuthAction = null; setTimeout(a, 200); }
    } catch (e) {
      toast(authMode === 'signup' ? (I18N.get() === 'cas' ? 'No se pudo registrar' : 'No s\'ha pogut registrar')
                                  : (I18N.get() === 'cas' ? 'Correo o contraseña incorrectos' : 'Correu o contrasenya incorrectes'));
    }
  });

  function updateAccountUI(user) {
    const btn = $('#account-btn');
    if (user) {
      const av = user.avatar ? '<img src="' + user.avatar + '" class="acct-av" alt="">' : '👤';
      btn.innerHTML = '<span>' + av + ' ' + esc(user.name) + '</span>';
    } else btn.innerHTML = '<span>' + I18N.t('nav.login') + '</span>';
  }

  // ---------------- perfil ----------------
  function fillProfileHeader(count) {
    const u = DB.user(); if (!u) return;
    const av = $('#profile-avatar');
    const cam = '<span class="avatar-cam">📷</span>';
    if (u.avatar) {
      av.classList.add('has-photo');
      av.style.backgroundImage = 'url(' + u.avatar + ')';
      av.innerHTML = cam;
    } else {
      av.classList.remove('has-photo');
      av.style.backgroundImage = '';
      av.innerHTML = esc(((u.name || u.email || '·').trim().charAt(0) || '·').toUpperCase()) + cam;
    }
    $('#profile-name').textContent = u.name || '—';
    $('#profile-email').textContent = u.email || '';
    if (count != null) {
      $('#profile-count').textContent = I18N.t(
        count === 0 ? 'profile.count_zero' : count === 1 ? 'profile.count_one' : 'profile.count', { n: count });
    }
  }

  function editProfileName() {
    const u = DB.user(); if (!u) return;
    if ($('#profile-name-input')) return;
    const nameEl = $('#profile-name'), editBtn = $('#profile-edit-name');
    nameEl.hidden = true; editBtn.hidden = true;
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:flex;gap:6px;align-items:center;flex:1';
    wrap.innerHTML =
      '<input id="profile-name-input" type="text" maxlength="40" value="' + esc(u.name || '') + '" ' +
      'style="flex:1;min-width:0;padding:8px 10px;border-radius:10px;background:var(--glass-2);border:1px solid var(--line);color:var(--ink);font-size:16px;font-weight:700">' +
      '<button id="profile-name-save" class="btn btn-sm btn-gold">' + I18N.t('profile.save') + '</button>';
    nameEl.parentNode.appendChild(wrap);
    const inp = $('#profile-name-input'); inp.focus(); inp.select();
    const finish = () => { wrap.remove(); nameEl.hidden = false; editBtn.hidden = false; };
    $('#profile-name-save').onclick = async () => {
      const v = inp.value.trim();
      if (!v) return toast(I18N.t('msg.name_required'));
      try {
        await DB.updateProfile(v);
        toast(I18N.t('msg.profile_saved'));
        finish(); fillProfileHeader();
        await loadPalmeras(); openProfile();
      } catch (e) { toast('Error: ' + (e.message || e)); finish(); }
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#profile-name-save').click(); if (e.key === 'Escape') finish(); });
  }

  function renderMyList(mine) {
    const box = $('#my-list');
    if (!mine.length) {
      box.innerHTML = '<p class="comment-empty" style="text-align:center;padding:18px 0">' + I18N.t('my.empty') + '</p>';
      return;
    }
    box.innerHTML = mine.map((p) =>
      '<div class="my-palm-item" data-id="' + esc(p.id) + '">' +
      '<div><b>' + esc(p.name) + '</b>' +
      '<p>✦ ' + esc(Fireworks.typeName(p.firework_type, I18N.get())) +
      (p.ignite_at ? ' · 🕛 ' + p.ignite_at : '') + '</p></div>' +
      '<div class="my-palm-actions">' +
      '<button class="btn btn-sm btn-ghost my-share-btn" data-id="' + esc(p.id) + '" title="' + I18N.t('detail.share') + '">↗</button>' +
      '<button class="btn btn-sm btn-ghost my-edit-btn" data-id="' + esc(p.id) + '">' + I18N.t('my.edit') + '</button>' +
      '<button class="btn btn-sm btn-danger my-del-btn" data-id="' + esc(p.id) + '">' + I18N.t('my.delete') + '</button>' +
      '</div></div>'
    ).join('');

    box.querySelectorAll('.my-share-btn').forEach((btn) => {
      btn.onclick = () => { const p = mine.find((x) => x.id === btn.dataset.id); if (p) openShare(p); };
    });
    box.querySelectorAll('.my-del-btn').forEach((btn) => {
      btn.onclick = async () => {
        if (!window.confirm(I18N.t('my.delete_confirm'))) return;
        btn.disabled = true;
        await DB.deletePalmera(btn.dataset.id);
        toast(I18N.t('my.deleted'));
        await loadPalmeras(); openProfile();
      };
    });
    box.querySelectorAll('.my-edit-btn').forEach((btn) => {
      btn.onclick = () => {
        const p = mine.find((x) => x.id === btn.dataset.id);
        if (p) { closeSheet('profile-sheet'); openEditPalmera(p); }
      };
    });
  }

  async function openProfile() {
    const u = DB.user();
    if (!u) return needLogin();
    fillProfileHeader();
    $('#my-list').innerHTML = '<p class="comment-empty" style="text-align:center;padding:18px 0">' + I18N.t('msg.loading') + '</p>';
    $('#profile-add').onclick = () => { closeSheet('profile-sheet'); openAddSheet(); };
    $('#profile-logout').onclick = async () => { await DB.signOut(); closeSheet('profile-sheet'); toast(I18N.t('msg.bye')); };
    $('#profile-edit-name').onclick = editProfileName;
    $('#profile-avatar').onclick = () => $('#avatar-input').click();
    $('#avatar-input').onchange = async (ev) => {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = '';
      if (!f || !f.type.startsWith('image')) return;
      if (f.size > MAX_BYTES) return toast(I18N.t('media.too_big'));
      try {
        const url = await compressImage(f, 256);
        await DB.updateProfile(DB.user().name, url);
        fillProfileHeader();
        updateAccountUI(DB.user());
        toast(I18N.t('msg.profile_saved'));
      } catch (e) { toast('Error: ' + (e.message || e)); }
    };
    openSheet('profile-sheet');
    const all = await DB.listPalmeras();
    const mine = all.filter((p) => p.owner_id === u.id);
    fillProfileHeader(mine.length);
    renderMyList(mine);
  }

  function openEditPalmera(p) {
    const isCas = I18N.get() === 'cas';
    const ov = document.createElement('div');
    ov.className = 'modal open';
    ov.style.zIndex = 90;
    ov.innerHTML =
      '<div class="modal-card" style="max-width:380px">' +
      '<button class="sheet-close" data-ex>✕</button>' +
      '<h2 class="sheet-title" style="margin-bottom:14px">' + I18N.t('my.edit_title') + '</h2>' +
      '<label class="field"><span>' + I18N.t('add.name') + '</span>' +
      '<input id="ep-name" type="text" maxlength="40" value="' + esc(p.name || '') + '"></label>' +
      '<label class="field"><span>' + I18N.t('add.note') + '</span>' +
      '<textarea id="ep-note" rows="2" maxlength="160">' + esc(p.family_note || '') + '</textarea></label>' +
      '<label class="field"><span>' + I18N.t('add.desc') + '</span>' +
      '<textarea id="ep-desc" rows="3" maxlength="500">' + esc(p.description || '') + '</textarea></label>' +
      '<label class="field"><span>' + I18N.t('add.dedication') + '</span>' +
      '<input id="ep-dedication" type="text" maxlength="100" value="' + esc(p.dedication || '') + '"></label>' +
      '<button class="btn btn-gold btn-wide" id="ep-save">' + I18N.t('my.save') + '</button>' +
      '</div>';
    document.body.appendChild(ov);
    const done = () => { ov.remove(); openProfile(); };
    ov.querySelector('[data-ex]').onclick = done;
    ov.addEventListener('click', (e) => { if (e.target === ov) done(); });
    ov.querySelector('#ep-save').onclick = async () => {
      const name = ov.querySelector('#ep-name').value.trim();
      const note = ov.querySelector('#ep-note').value.trim();
      const description = ov.querySelector('#ep-desc').value.trim();
      const dedication = ov.querySelector('#ep-dedication').value.trim();
      if (!name) { toast(I18N.t('msg.name_required')); return; }
      const btn = ov.querySelector('#ep-save');
      btn.disabled = true; btn.style.opacity = .7;
      try {
        await DB.updatePalmera(p.id, { name, family_note: note, description, dedication });
        await loadPalmeras();
        toast(I18N.t('my.saved'));
        done();
      } catch (e) { toast('Error: ' + (e.message || e)); btn.disabled = false; btn.style.opacity = 1; }
    };
  }

  // ---------------- cuenta atrás Nit de l'Albà ----------------
  function nextAlba() {
    const now = new Date();
    let y = now.getFullYear();
    let target = new Date(y, (cfg.ALBA_MONTH || 8) - 1, cfg.ALBA_DAY || 13, cfg.ALBA_HOUR || 22, cfg.ALBA_MIN || 0, 0);
    if (target.getTime() < now.getTime()) target = new Date(y + 1, (cfg.ALBA_MONTH || 8) - 1, cfg.ALBA_DAY || 13, cfg.ALBA_HOUR || 22, cfg.ALBA_MIN || 0, 0);
    return target;
  }
  function tickCountdown() {
    const diff = nextAlba().getTime() - Date.now();
    const s = Math.max(0, Math.floor(diff / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
          m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    $('#cd-days').textContent = d;
    $('#cd-hours').textContent = pad(h);
    $('#cd-min').textContent = pad(m);
    $('#cd-sec').textContent = pad(sec);
  }

  // ---------------- enlaces de eventos ----------------
  function wire() {
    $('#lang-toggle').onclick = () => { I18N.toggle(); };
    $('#account-btn').onclick = () => { DB.user() ? openProfile() : (openModal('auth-modal'), setAuthMode('signin')); };
    $('#auth-switch').onclick = () => setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    $('#auth-forgot').onclick = () => setAuthMode('reset');
    window.addEventListener('palmar-recovery', () => { openModal('auth-modal'); setAuthMode('newpass'); });

    $('#cta-add').onclick = openAddSheet;
    $('#cta-ar').onclick = startAR;
    $('#fab-sim').onclick = () => { setNav('sim'); openSim(null); };
    $('#hero-collapse').onclick = () => {
      const hero = $('#hero'); const col = hero.classList.toggle('collapsed');
      $('#hero-collapse').textContent = col ? '▴' : '▾';
      $('#hero-collapse').style.position = 'fixed';
      $('#hero-collapse').style.top = col ? '60px' : '';
    };

    $$('.nav-item').forEach((b) => b.onclick = () => {
      const n = b.dataset.nav;
      if (n === 'map') { stopSim(); setNav('map'); }
      else if (n === 'ar') startAR();
      else if (n === 'add') openAddSheet();
      else if (n === 'sim') { setNav('sim'); openSim(null); }
      else if (n === 'info') openModal('info-modal');
    });

    $$('[data-close-sheet]').forEach((b) => b.onclick = () => closeSheet(b.dataset.closeSheet));
    $$('[data-close-modal]').forEach((b) => b.onclick = () => closeModal(b.dataset.closeModal));
    $$('[data-close-full]').forEach((b) => b.onclick = () => {
      const id = b.dataset.closeFull;
      if (id === 'ar-overlay') AR.stop();
      else if (id === 'sim-overlay') stopSim();
    });
    $$('[data-step-next]').forEach((b) => b.onclick = () => gotoStep(+b.dataset.stepNext));
    $$('[data-step-prev]').forEach((b) => b.onclick = () => gotoStep(+b.dataset.stepPrev));
    $('#car-prev').onclick = () => selectType(selectedIndex - 1, true);
    $('#car-next').onclick = () => selectType(selectedIndex + 1, true);
    $('#pay-btn').onclick = doPay;

    $('#media-add-btn').onclick = () => $('#media-input').click();
    $('#media-input').onchange = (e) => { handleMediaFiles([...e.target.files]); e.target.value = ''; };

    $('#scrim').onclick = () => { $$('.sheet.open').forEach((s) => closeSheet(s.id)); };

    window.addEventListener('langchange', () => {
      updateAccountUI(DB.user());
      setAuthMode(authMode);
      $('#price-amount').textContent = Payments.priceLabel();
      if (carouselBuilt) $('#carousel-name').textContent = Fireworks.typeName(selectedType(), I18N.get());
    });
  }

  // ---------------- handle vuelta de Stripe ----------------
  function handleReturn() {
    const q = new URLSearchParams(location.search);
    if (q.get('paid') === '1') { toast(I18N.t('msg.pay_ok')); }
    if (q.get('canceled') === '1') { toast(I18N.t('msg.pay_cancel')); }
    if (q.has('paid') || q.has('canceled')) history.replaceState({}, '', location.pathname);
  }

  // ---------------- enlace profundo a una palmera ----------------
  function handleDeepLink() {
    const q = new URLSearchParams(location.search);
    const id = q.get('palmera');
    if (!id) return;
    const p = palmeras.find((x) => x.id === id);
    history.replaceState({}, '', location.pathname);
    if (!p) return;
    if (p.lat != null) PalmarMap.flyTo(p.lat, p.lng, 16);
    setTimeout(() => openDetail(p), 400);
  }

  // ---------------- init ----------------
  function init() {
    I18N.apply(document);
    wire();
    PalmarMap.initMain('map');
    DB.onAuthChange(updateAccountUI);
    loadPalmeras().then(handleDeepLink);
    tickCountdown(); setInterval(tickCountdown, 1000);
    handleReturn();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    window.PalmarApp = { toast, openSim, loadPalmeras, openProfile, getPalmeras: () => palmeras };
    console.log('PalmAR · modo datos:', DB.mode, '· pago:', Payments.mode);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
