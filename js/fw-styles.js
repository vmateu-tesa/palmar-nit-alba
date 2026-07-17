/* =====================================================================
   Elx al Cel — Motor de "palmeres de foc" (partícules en canvas 2D)
   Simulació decorativa i espectacular: coet que puja amb estela,
   explosió amb centenars de partícules, gravetat, fregament i cua
   lluminosa. No pretén reproduir la pirotècnia real — és una
   representació artística.
   Cada estil té FORMA pròpia a més de paleta:
     · dorada      → palmera clàssica (branques que cauen)
     · multicolor  → peònia esfèrica multicolor
     · blanca      → salze de plata (cues llargues que degoten)
     · vermella    → corona (anell) vermella
     · blava       → blau crepitant (espurnes secundàries)
   Els ids es mantenen per compatibilitat amb les palmeres ja guardades.
   El mateix motor s'usa per a la previsualització del formulari i per a
   la simulació a pantalla completa sobre el mapa (map.js).
   ===================================================================== */
(function () {
  const STYLES = [
    { id: 'dorada', shape: 'palm', label_va: 'Palmera daurada', label_cas: 'Palmera dorada', colors: ['#ffd45c', '#f5c542', '#ffe9a8', '#fff6d8'] },
    { id: 'multicolor', shape: 'peony', label_va: 'Peònia multicolor', label_cas: 'Peonia multicolor', colors: ['#7ee8fa', '#ff6b6b', '#f5c542', '#c9a6ff', '#5dff9b'] },
    { id: 'blanca', shape: 'willow', label_va: 'Salze de plata', label_cas: 'Sauce de plata', colors: ['#ffffff', '#eef2ff', '#cfe0ff', '#f5efe0'] },
    { id: 'vermella', shape: 'ring', label_va: 'Corona vermella', label_cas: 'Corona roja', colors: ['#ff5c5c', '#ff8a5c', '#ffd0c0', '#ffffff'] },
    { id: 'blava', shape: 'crackle', label_va: 'Blau crepitant', label_cas: 'Azul chispeante', colors: ['#5ec8ff', '#7ee8fa', '#c9a6ff', '#ffffff'] }
  ];

  function get(id) { return STYLES.find((s) => s.id === id) || STYLES[0]; }
  function hashPick(seed) {
    let h = 0;
    const s = String(seed || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return STYLES[h % STYLES.length];
  }
  function label(style) {
    const lang = window.I18N ? I18N.get() : 'cas';
    return lang === 'cas' ? style.label_cas : style.label_va;
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // Partícules de l'explosió segons la forma de l'estil.
  // Coordenades en "metres de món": x lateral, y altitud (positiva amunt).
  function burstParticles(style, H) {
    const P = [];
    const add = (vx, vy, o) => P.push(Object.assign(
      { x: 0, y: H, px: 0, py: H, vx: vx, vy: vy, age: 0 }, o));

    if (style.shape === 'palm') {
      for (let i = 0; i < 90; i++) {
        const th = rand(-1.1, 1.1) * (0.3 + Math.random() * 0.7);
        const s = rand(50, 78);
        add(Math.sin(th) * s, Math.cos(th) * s,
          { life: rand(2.4, 3.3), color: pick(style.colors), drag: 0.985, grav: 26, w: 2.8 });
      }
    } else if (style.shape === 'peony') {
      for (let i = 0; i < 150; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = rand(26, 46);
        add(Math.cos(a) * s, Math.sin(a) * s,
          { life: rand(1.7, 2.4), color: pick(style.colors), drag: 0.976, grav: 18, w: 2.3 });
      }
    } else if (style.shape === 'willow') {
      for (let i = 0; i < 130; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = rand(20, 34);
        add(Math.cos(a) * s, Math.sin(a) * s,
          { life: rand(3.2, 4.5), color: pick(style.colors), drag: 0.993, grav: 11, w: 1.9 });
      }
    } else if (style.shape === 'ring') {
      const n = 110;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const s = 44 + rand(-2.5, 2.5);
        add(Math.cos(a) * s, Math.sin(a) * s,
          { life: rand(1.7, 2.2), color: pick(style.colors), drag: 0.979, grav: 14, w: 2.5 });
      }
    } else { // crackle
      for (let i = 0; i < 95; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = rand(24, 42);
        add(Math.cos(a) * s, Math.sin(a) * s,
          { life: rand(1.5, 2.1), color: pick(style.colors), drag: 0.976, grav: 16, w: 2.3, crackleAt: rand(0.45, 0.85) });
      }
    }
    return P;
  }

  /* Crea una simulació. opts: { heightM, offsetXM, delayS }.
     update(dt) → true quan ha acabat del tot.
     render(ctx, ax, ay, pxm): ax/ay = peu del llançament en píxels del
     canvas, pxm = píxels per metre. El caller fa l'esvaïment del frame. */
  function createSim(styleId, opts) {
    const style = get(styleId);
    const H = (opts && opts.heightM) || 120;
    const ox = (opts && opts.offsetXM) || 0;
    let delay = (opts && opts.delayS) || 0;
    const riseDur = 0.85 + H / 420;
    let t = 0, phase = 'delay', particles = null, sparks = [], rocketY = 0, prevRocketY = 0;
    let burstAge = -1, endPause = 0;

    function stepSpark(s, dt) {
      s.age += dt;
      s.px = s.x; s.py = s.y;
      const dr = Math.pow(s.drag, dt * 60);
      s.vx *= dr; s.vy = (s.vy - s.grav * dt) * dr;
      s.x += s.vx * dt; s.y += s.vy * dt;
    }

    function update(dt) {
      if (phase === 'delay') { delay -= dt; if (delay <= 0) phase = 'rise'; return false; }
      t += dt;
      if (burstAge >= 0) burstAge += dt;

      if (phase === 'rise') {
        prevRocketY = rocketY;
        const k = Math.min(1, t / riseDur);
        rocketY = H * (1 - Math.pow(1 - k, 2.2));
        sparks.push({
          x: ox + rand(-0.8, 0.8), y: rocketY - rand(0, 3), px: ox, py: prevRocketY,
          vx: rand(-4, 4), vy: rand(-10, -2), age: 0, life: rand(0.2, 0.45),
          color: '#ffd9a0', w: 1.3, grav: 8, drag: 0.98
        });
        if (k >= 1) {
          phase = 'burst'; burstAge = 0;
          particles = burstParticles(style, H).map((p) => { p.x += ox; p.px += ox; return p; });
        }
      } else if (phase === 'burst') {
        let alive = 0;
        for (const p of particles) {
          if (p.age >= p.life) continue;
          p.age += dt;
          p.px = p.x; p.py = p.y;
          const dr = Math.pow(p.drag, dt * 60);
          p.vx *= dr; p.vy = (p.vy - p.grav * dt) * dr;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.crackleAt != null && p.age / p.life > p.crackleAt) {
            p.crackleAt = null;
            for (let i = 0; i < 5; i++) {
              sparks.push({
                x: p.x, y: p.y, px: p.x, py: p.y,
                vx: rand(-15, 15), vy: rand(-15, 15), age: 0, life: rand(0.25, 0.5),
                color: '#ffffff', w: 1.5, grav: 10, drag: 0.96, flicker: true
              });
            }
          }
          if (p.age < p.life) alive++;
        }
        if (alive === 0) phase = 'end';
      }

      for (const s of sparks) { if (s.age < s.life) stepSpark(s, dt); }
      sparks = sparks.filter((s) => s.age < s.life);

      if (phase === 'end' && sparks.length === 0) {
        endPause += dt;
        return endPause > 0.35;
      }
      return false;
    }

    function seg(ctx, ax, ay, pxm, o, alpha) {
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.strokeStyle = o.color;
      ctx.lineWidth = o.w * Math.max(0.7, pxm * 0.34);
      ctx.beginPath();
      ctx.moveTo(ax + o.px * pxm, ay - o.py * pxm);
      ctx.lineTo(ax + o.x * pxm, ay - o.y * pxm);
      ctx.stroke();
    }

    function render(ctx, ax, ay, pxm) {
      if (phase === 'delay') return;
      ctx.lineCap = 'round';

      if (phase === 'rise') {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff6d8';
        ctx.lineWidth = Math.max(1, pxm * 0.6);
        ctx.beginPath();
        ctx.moveTo(ax + ox * pxm, ay - prevRocketY * pxm);
        ctx.lineTo(ax + ox * pxm, ay - rocketY * pxm);
        ctx.stroke();
      }

      // Flaix de l'explosió (els primers ~0.2 s)
      if (burstAge >= 0 && burstAge < 0.22) {
        const k = 1 - burstAge / 0.22;
        const r = (12 + 46 * (1 - k)) * pxm;
        const g = ctx.createRadialGradient(ax + ox * pxm, ay - H * pxm, 0, ax + ox * pxm, ay - H * pxm, Math.max(r, 1));
        g.addColorStop(0, 'rgba(255,255,240,' + (0.85 * k) + ')');
        g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ax + ox * pxm, ay - H * pxm, Math.max(r, 1), 0, Math.PI * 2); ctx.fill();
      }

      if (particles) {
        for (const p of particles) {
          if (p.age >= p.life) continue;
          seg(ctx, ax, ay, pxm, p, 1 - (p.age / p.life) * (p.age / p.life));
        }
      }
      for (const s of sparks) {
        let a = 1 - s.age / s.life;
        if (s.flicker) a *= rand(0.3, 1);
        seg(ctx, ax, ay, pxm, s, a);
      }
      ctx.globalAlpha = 1;
    }

    return { update: update, render: render };
  }

  // Previsualització en bucle per al carrusel d'estils.
  function renderPreview(canvas, styleId) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const H = 85;
    const pxm = (h * 0.82) / (H * 1.55);
    const ax = w / 2, ay = h - 6;
    let sim = createSim(styleId, { heightM: H });
    let raf = null, last = null, stopped = false, pause = 0;

    ctx.fillStyle = '#0a0e2a';
    ctx.fillRect(0, 0, w, h);

    function frame(ts) {
      if (stopped) return;
      if (last == null) last = ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(10,14,42,0.26)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) sim = createSim(styleId, { heightM: H });
      } else {
        const done = sim.update(dt);
        sim.render(ctx, ax, ay, pxm);
        if (done) pause = 0.5;
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { stop: () => { stopped = true; if (raf) cancelAnimationFrame(raf); } };
  }

  window.FWStyles = { list: STYLES, get, hashPick, label, createSim, renderPreview };
})();
