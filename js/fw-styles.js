/* =====================================================================
   Elx al Cel — Estils visuals de "palmera de foc"
   Paletes purament decoratives per a la simulació 3D del mapa i per a
   la previsualització de "Mi palmera". No representen tipus reals de
   pirotecnia (carcasses, cohetà...) — són variants estètiques perquè
   cada palmera es veja diferent i espectacular, sense pretendre ser
   una reconstrucció exacta del castell real.
   ===================================================================== */
(function () {
  const STYLES = [
    { id: 'dorada', label_va: 'Daurada clàssica', label_cas: 'Dorada clásica', colors: ['#ffe9a8', '#f5c542', '#ffb43c', '#fff6d8'] },
    { id: 'multicolor', label_va: 'Multicolor', label_cas: 'Multicolor', colors: ['#7ee8fa', '#ff6b6b', '#f5c542', '#c9a6ff', '#5dff9b'] },
    { id: 'blanca', label_va: 'Blanca cascada', label_cas: 'Blanca cascada', colors: ['#ffffff', '#fff6d8', '#dfe9ff', '#cfe0ff'] },
    { id: 'vermella', label_va: 'Vermella intensa', label_cas: 'Roja intensa', colors: ['#ff6b6b', '#ff8a5c', '#ffd45c', '#ffffff'] },
    { id: 'blava', label_va: 'Blava nit', label_cas: 'Azul noche', colors: ['#5ec8ff', '#7ee8fa', '#c9a6ff', '#ffffff'] }
  ];

  function get(id) { return STYLES.find((s) => s.id === id) || STYLES[0]; }

  // Previsualització animada (canvas 2D, en bucle) per al selector d'estil.
  function renderPreview(canvas, styleId) {
    const style = get(styleId);
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, groundY = h * 0.82, peakY = h * 0.32;
    const DURATION = 1900, RISE = 550;
    let raf = null, start = null, stopped = false;

    function frame(ts) {
      if (stopped) return;
      if (start == null) start = ts;
      const t = (ts - start) % DURATION;

      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0a0e2a'); g.addColorStop(1, '#1a1648');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      if (t < RISE) {
        const rt = t / RISE;
        const y = groundY - (groundY - peakY) * rt;
        ctx.strokeStyle = '#fff6d8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(cx, groundY); ctx.lineTo(cx, y); ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        const bt = (t - RISE) / (DURATION - RISE); // 0..1
        const fadeIn = Math.min(1, bt / 0.12);
        const fade = Math.max(0, 1 - bt);
        ctx.strokeStyle = style.colors[0]; ctx.lineCap = 'round';
        ctx.shadowColor = style.colors[0]; ctx.shadowBlur = 14 * fade;
        const branches = 14;
        for (let i = 0; i < branches; i++) {
          const a = (i / (branches - 1) - 0.5) * 2.7;
          const len = (46 + (i % 3) * 8) * (0.5 + bt * 0.6);
          const ex = cx + Math.sin(a) * len;
          const ey = peakY - Math.cos(a) * len * 0.35 + Math.abs(a) * 22 * bt;
          ctx.lineWidth = 3;
          ctx.globalAlpha = fadeIn * fade;
          ctx.strokeStyle = style.colors[i % style.colors.length];
          ctx.beginPath();
          ctx.moveTo(cx, peakY);
          ctx.quadraticCurveTo(cx + Math.sin(a) * len * 0.55, peakY - Math.cos(a) * len * 0.6, ex, ey);
          ctx.stroke();
          ctx.fillStyle = style.colors[(i + 1) % style.colors.length];
          ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { stop: () => { stopped = true; if (raf) cancelAnimationFrame(raf); } };
  }

  // Selecció determinista (mateix id -> mateix estil) per a donar varietat
  // visual als punts de llançament sense necessitat de guardar preferència.
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

  window.FWStyles = { list: STYLES, get, hashPick, label, renderPreview };
})();
