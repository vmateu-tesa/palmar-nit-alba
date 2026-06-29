/* =====================================================================
   PalmAR — Motor de palmeres (Canvas 2D, sistema de partículas)
   Dibuja palmeres auténticas: cohete que sube, estalla y deja caer
   una cúpula de chispas doradas que "gotean" como las palas de una palmera.
   ===================================================================== */
(function () {

  // ---- Tipos de palmera (carrusel) ----
  const TYPES = [
    {
      id: 'palmera_or', name_va: "Palmera d'Or", name_cas: "Palmera de Oro",
      shape: 'palm', palette: ['#ffd66b', '#ffb43c', '#fff3c4', '#ffcf5c'],
      count: 90, spread: 1.15, vmin: 3.2, vmax: 6.6, life: 95, size: 2.2,
      glitter: true, secondary: false, color: '#ffce5c'
    },
    {
      id: 'palmera_verge', name_va: "Palmera de la Mare de Déu", name_cas: "Palmera de la Virgen",
      shape: 'palm', palette: ['#fff6da', '#ffe9a8', '#ffffff', '#ffd66b'],
      count: 150, spread: 1.35, vmin: 3.6, vmax: 8.2, life: 130, size: 2.6,
      glitter: true, secondary: true, color: '#fff3c4'
    },
    {
      id: 'palmera_colors', name_va: "Palmera de Colors", name_cas: "Palmera de Colores",
      shape: 'palm', palette: ['#ff5e8a', '#5ec8ff', '#9d6bff', '#5dff9b', '#ffd66b'],
      count: 110, spread: 1.25, vmin: 3.2, vmax: 7, life: 100, size: 2.3,
      glitter: false, secondary: false, color: '#9d6bff'
    },
    {
      id: 'palmera_plata', name_va: "Palmera de Plata", name_cas: "Palmera de Plata",
      shape: 'palm', palette: ['#dfeaff', '#9fc2ff', '#ffffff', '#bfe0ff'],
      count: 100, spread: 1.2, vmin: 3.2, vmax: 6.8, life: 105, size: 2.2,
      glitter: true, secondary: false, color: '#bfe0ff'
    },
    {
      id: 'carcassa', name_va: "Carcassa", name_cas: "Carcasa",
      shape: 'sphere', palette: ['#ff4d4d', '#ffd66b', '#5dff9b', '#5ec8ff'],
      count: 130, spread: 6.28, vmin: 2.4, vmax: 5.6, life: 90, size: 2.2,
      glitter: false, secondary: false, color: '#ff6b6b'
    },
    {
      id: 'palmera_doble', name_va: "Palmera Doble", name_cas: "Palmera Doble",
      shape: 'palm', palette: ['#ffd66b', '#ff8a3c', '#fff3c4', '#ff5e8a'],
      count: 120, spread: 1.3, vmin: 3.4, vmax: 7.4, life: 115, size: 2.4,
      glitter: true, secondary: true, color: '#ff8a3c'
    },
    {
      id: 'bengala', name_va: "Bengala", name_cas: "Bengala",
      shape: 'bengala', palette: ['#fffce8', '#fff8c0', '#ffec80', '#ffffff'],
      count: 70, spread: 0.28, vmin: 1.4, vmax: 3.8, life: 240, size: 1.5,
      glitter: true, secondary: false, color: '#fffce8'
    },
    {
      id: 'cortina', name_va: "Cortina d'Or", name_cas: "Cortina de Oro",
      shape: 'curtain', palette: ['#ffd66b', '#fff3c4', '#ffb43c', '#ffffff', '#ffe9a8'],
      count: 150, spread: 3.14, vmin: 2.6, vmax: 6.4, life: 130, size: 2.0,
      glitter: true, secondary: false, color: '#ffd66b'
    },
    {
      id: 'estrela', name_va: "Estrela de Mar", name_cas: "Estrella de Mar",
      shape: 'star', palette: ['#ff5e8a', '#ff8a3c', '#ffd66b', '#5ec8ff', '#9d6bff'],
      count: 110, spread: 0.22, vmin: 3.0, vmax: 7.2, life: 105, size: 2.3,
      glitter: false, secondary: true, color: '#ff5e8a'
    }
  ];

  // ---- Sistema de sonido (Web Audio API) ----
  const Sound = (function () {
    let _ctx = null;
    function ac() {
      if (!_ctx) {
        try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { return null; }
      }
      if (_ctx.state === 'suspended') _ctx.resume();
      return _ctx;
    }
    function boom(vol) {
      const c = ac(); if (!c) return;
      const now = c.currentTime;
      const osc = c.createOscillator(), g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.32);
      g.gain.setValueAtTime(vol != null ? vol : 0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(g); g.connect(c.destination);
      osc.start(now); osc.stop(now + 0.45);
      const len = Math.round(c.sampleRate * 0.12);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len);
      const ns = c.createBufferSource(), ng = c.createGain(), fl = c.createBiquadFilter();
      fl.type = 'bandpass'; fl.frequency.value = 700; fl.Q.value = 0.7;
      ng.gain.setValueAtTime((vol != null ? vol : 0.35) * 0.55, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      ns.buffer = buf; ns.connect(fl); fl.connect(ng); ng.connect(c.destination);
      ns.start(now);
    }
    return { boom };
  })();

  const byId = {};
  TYPES.forEach((t) => (byId[t.id] = t));

  function hexToRgb(h) {
    const m = h.replace('#', '');
    const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  // pre-cálculo de paletas a rgb
  TYPES.forEach((t) => (t._rgb = t.palette.map(hexToRgb)));

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // ---- Silueta (sombra casi negra) de la Basílica de Santa María d'Elx ----
  function drawBasilica(ctx, W, H) {
    const u = Math.max(0.16, Math.min(W / 640, 1.15));
    const cx = W * 0.5, g = H, sil = '#04030d';
    const body = 70 * u, bodyW = 240 * u, drumW = 96 * u, drumH = 34 * u, dr = 48 * u, domeH = 88 * u;
    const bodyTop = g - body, drumTop = bodyTop - drumH, apex = drumTop - domeH;
    const tx = cx - 150 * u, tw = 44 * u, th = 162 * u;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = sil;
    // cuerpo
    ctx.fillRect(cx - bodyW / 2, bodyTop, bodyW, body + 2);
    // tambor
    ctx.fillRect(cx - drumW / 2, drumTop, drumW, drumH);
    // cúpula
    ctx.beginPath();
    ctx.moveTo(cx - dr, drumTop);
    ctx.quadraticCurveTo(cx - dr, apex, cx, apex);
    ctx.quadraticCurveTo(cx + dr, apex, cx + dr, drumTop);
    ctx.closePath(); ctx.fill();
    // linterna + cruz
    ctx.fillRect(cx - 10 * u, apex - 18 * u, 20 * u, 18 * u);
    ctx.fillRect(cx - 1.5 * u, apex - 30 * u, 3 * u, 12 * u);
    ctx.fillRect(cx - 6 * u, apex - 24 * u, 12 * u, 3 * u);
    // campanario + aguja
    ctx.fillRect(tx, g - th, tw, th);
    ctx.beginPath();
    ctx.moveTo(tx - 3 * u, g - th);
    ctx.lineTo(tx + tw / 2, g - th - 32 * u);
    ctx.lineTo(tx + tw + 3 * u, g - th);
    ctx.closePath(); ctx.fill();
    // tenue luz cálida en los bordes (reflejo de los fuegos)
    ctx.strokeStyle = 'rgba(255,196,110,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - dr, drumTop);
    ctx.quadraticCurveTo(cx - dr, apex, cx, apex);
    ctx.quadraticCurveTo(cx + dr, apex, cx + dr, drumTop);
    ctx.stroke();
    ctx.restore();
  }

  // ---- Escena ----
  function createScene(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 1, H = 1, dpr = 1, S = 1;
    let transparent = !!opts.transparent;
    let rockets = [], parts = [], flashes = [];
    let raf = null, autoTimer = null, autoType = null, running = false;
    const MAX_PARTS = opts.maxParts || 1400;

    function resize() {
      const cw = canvas.clientWidth || canvas.width || 1;
      const ch = canvas.clientHeight || canvas.height || 1;
      if (cw < 2 || ch < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = cw; H = ch; S = Math.max(0.5, H / 620);
      if (!transparent) paintSky();
    }

    function paintSky() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a0c28');
      g.addColorStop(1, '#05030f');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // estrellas tenues
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97.13) % W, y = (i * 53.7) % (H * 0.7);
        ctx.globalAlpha = 0.15 + (i % 5) * 0.08;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
    }

    function launch(typeId, xFrac, yFrac) {
      const T = byId[typeId] || TYPES[0];
      const x = (xFrac != null ? xFrac : rand(0.25, 0.75)) * W;
      const targetY = (yFrac != null ? yFrac : rand(0.22, 0.42)) * H;
      rockets.push({
        x, y: H + 4, vx: rand(-0.4, 0.4) * S, vy: -rand(9.5, 12) * S,
        targetY, type: T
      });
    }

    // explosión directa en un punto (AR / toques)
    function burstAt(x, y, typeId) { explode({ x, y, type: byId[typeId] || TYPES[0] }); }

    function explode(r) {
      const T = r.type;
      const n = Math.round(T.count * (opts.density || 1));
      for (let i = 0; i < n; i++) {
        let ang, spd;
        if (T.shape === 'palm' || T.shape === 'bengala') {
          ang = -Math.PI / 2 + rand(-T.spread, T.spread);
          spd = rand(T.vmin, T.vmax) * S * (0.7 + 0.3 * Math.abs(Math.cos(ang)));
        } else if (T.shape === 'curtain') {
          ang = rand(-Math.PI, 0);
          spd = rand(T.vmin, T.vmax) * S;
        } else if (T.shape === 'star') {
          const arm = (i / Math.max(1, n) * 5) | 0;
          ang = -Math.PI / 2 + arm * (Math.PI * 2 / 5) + rand(-T.spread, T.spread);
          spd = rand(T.vmin, T.vmax) * S;
        } else {
          ang = Math.random() * Math.PI * 2;
          spd = rand(T.vmin, T.vmax) * S * rand(0.55, 1);
        }
        const c = pick(T._rgb);
        parts.push({
          x: r.x, y: r.y,
          vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          life: 0, max: T.life + rand(-18, 22),
          r: c.r, g: c.g, b: c.b, size: T.size, glit: T.glitter,
          sec: T.secondary && Math.random() < 0.12
        });
      }
      flashes.push({ x: r.x, y: r.y, life: 0, max: 16, R: 26 * S, c: T.palette[0] });
      if (parts.length > MAX_PARTS) parts.splice(0, parts.length - MAX_PARTS);
    }

    function childBurst(p) {
      const m = 10;
      for (let i = 0; i < m; i++) {
        const ang = Math.random() * Math.PI * 2, spd = rand(0.8, 2.4) * S;
        parts.push({
          x: p.x, y: p.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 0.4,
          life: 0, max: 42 + rand(0, 20), r: p.r, g: p.g, b: p.b,
          size: p.size * 0.8, glit: true, sec: false
        });
      }
    }

    const G = () => 0.045 * S;
    const DRAG = 0.987;

    function frame() {
      // estela: difuminar el cuadro anterior
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (transparent) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(6,6,22,0.22)';
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalCompositeOperation = 'lighter';

      // cohetes
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.vy += G() * 0.6; r.x += r.vx; r.y += r.vy;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffe9b0';
        ctx.beginPath(); ctx.arc(r.x, r.y, 2 * S, 0, 7); ctx.fill();
        if (r.y <= r.targetY || r.vy >= -0.4 * S) { explode(r); rockets.splice(i, 1); }
      }

      // partículas
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        p.vx *= DRAG; p.vy *= DRAG; p.vy += G();
        p.x += p.vx; p.y += p.vy;
        const k = p.life / p.max;
        if (k >= 1) { parts.splice(i, 1); continue; }
        if (p.sec && k > 0.55) { childBurst(p); p.sec = false; }

        let a = 1 - k;
        let size = p.size;
        if (p.glit && Math.random() < 0.22) { a = 1; size = p.size * 1.9; } // centelleo dorado
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, 7); ctx.fill();
      }

      // destellos de explosión
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i]; f.life++;
        const k = f.life / f.max;
        if (k >= 1) { flashes.splice(i, 1); continue; }
        ctx.globalAlpha = (1 - k) * 0.5;
        const rad = f.R * (0.4 + k);
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        gr.addColorStop(0, f.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(f.x, f.y, rad, 0, 7); ctx.fill();
      }

      // Silueta de la Basílica en primer plano (no en modo cámara AR)
      if (!transparent && H >= 170) {
        ctx.globalCompositeOperation = 'source-over';
        drawBasilica(ctx, W, H, S);
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      if (!transparent) paintSky();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf), (raf = null);
      if (autoTimer) clearInterval(autoTimer), (autoTimer = null);
      rockets = []; parts = []; flashes = [];
      window.removeEventListener('resize', resize);
    }
    function setAuto(typeId, every) {
      autoType = typeId;
      if (autoTimer) clearInterval(autoTimer);
      const fire = () => { if (running) launch(autoType); };
      setTimeout(fire, 250);
      autoTimer = setInterval(fire, every || 1700);
    }
    function setType(typeId) { autoType = typeId; }
    function setTransparent(v) { transparent = !!v; if (!transparent) paintSky(); }

    window.addEventListener('resize', resize);

    return {
      start, stop, launch, burstAt, setAuto, setType, setTransparent, resize,
      get running() { return running; },
      el: canvas
    };
  }

  // ---- Vista previa en bucle de un solo tipo (carrusel / detalle) ----
  function preview(canvas, typeId, opts) {
    opts = opts || {};
    const sc = createScene(canvas, { density: opts.density || 0.55, maxParts: 500 });
    sc.start();
    sc.setAuto(typeId, opts.every || 1800);
    return sc;
  }

  window.Fireworks = {
    TYPES, getType: (id) => byId[id], createScene, preview, Sound,
    typeName: (id, lang) => {
      const t = byId[id]; if (!t) return id;
      return lang === 'cas' ? t.name_cas : t.name_va;
    }
  };
})();
