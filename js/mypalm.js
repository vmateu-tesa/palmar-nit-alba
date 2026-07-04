/* =====================================================================
   Elx al Cel — La meua palmera de foc
   El usuario dedica una palmera simbólica (dedicatoria + hora + lugar),
   se guarda EN SU DISPOSITIVO (sin backend, coherente con static-first),
   aparece en el mapa y se comparte en redes como tarjeta-imagen generada
   en canvas (Web Share API con imagen → texto → portapapeles).
   Puente institucional: el formulario enlaza al patrocinio real del Ajuntament.
   ===================================================================== */
(function () {
  const KEY = 'elx_my_palmera';

  function get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(p) { localStorage.setItem(KEY, JSON.stringify(p)); }
  function clear() { localStorage.removeItem(KEY); }

  // ---------- Tarjeta-imagen para redes (1080x1080, canvas) ----------
  function wrapText(x, text, cx, y, maxW, lh) {
    const words = text.split(' ');
    let line = '', lines = [];
    words.forEach((w) => {
      const t = line ? line + ' ' + w : w;
      if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    });
    lines.push(line);
    lines.slice(0, 3).forEach((l, i) => x.fillText(l, cx, y + i * lh));
    return lines.length;
  }

  function buildCard(p) {
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1080;
    const x = c.getContext('2d');

    // Cielo nocturno
    const g = x.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, '#070a20'); g.addColorStop(0.7, '#10142f'); g.addColorStop(1, '#1a1648');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);

    // Estrellas
    for (let i = 0; i < 90; i++) {
      x.globalAlpha = Math.random() * 0.6 + 0.1;
      x.fillStyle = '#ffffff';
      x.beginPath(); x.arc(Math.random() * 1080, Math.random() * 640, Math.random() * 2 + 0.6, 0, 7); x.fill();
    }
    x.globalAlpha = 1;

    // Cabecera
    x.textAlign = 'center';
    x.fillStyle = '#9c99c0';
    x.font = '700 34px -apple-system, "Segoe UI", Roboto, sans-serif';
    x.fillText((window.I18N ? I18N.t('mypalm.card_kicker') : "NIT DE L'ALBÀ · ELX").toUpperCase(), 540, 96);

    // Palmera de foc (trazos dorados con brillo)
    const cx = 540, cy = 470;
    x.strokeStyle = '#f5c542'; x.lineCap = 'round';
    x.shadowColor = '#f5c542'; x.shadowBlur = 26;
    x.lineWidth = 7;
    x.beginPath(); x.moveTo(cx, 790); x.lineTo(cx, cy); x.stroke(); // ascenso
    for (let a = -84; a <= 84; a += 12) {
      const rad = a * Math.PI / 180;
      const len = 250 + Math.random() * 50;
      const ex = cx + Math.sin(rad) * len;
      const ey = cy - Math.cos(rad) * len * 0.5 + Math.abs(a) * 2.1;
      x.lineWidth = 4.5;
      x.beginPath(); x.moveTo(cx, cy);
      x.quadraticCurveTo(cx + Math.sin(rad) * len * 0.55, cy - Math.cos(rad) * len * 0.85, ex, ey);
      x.stroke();
      x.fillStyle = '#ffe9a8';
      x.beginPath(); x.arc(ex, ey, 6.5, 0, 7); x.fill();
    }
    x.shadowBlur = 0;

    // Dedicatoria
    x.fillStyle = '#f3f1ea';
    x.font = '700 40px -apple-system, "Segoe UI", Roboto, sans-serif';
    x.fillText(window.I18N ? I18N.t('mypalm.card_title') : 'La meua palmera de foc', 540, 872);
    x.fillStyle = '#f5c542';
    x.font = '800 56px -apple-system, "Segoe UI", Roboto, sans-serif';
    wrapText(x, '\u201C' + (p.dedication || '') + '\u201D', 540, 946, 920, 64);

    // Pie
    x.fillStyle = '#9c99c0';
    x.font = '600 28px -apple-system, "Segoe UI", Roboto, sans-serif';
    x.fillText('13/08 \u00B7 ' + p.time + '  \u00B7  Elx al Cel', 540, 1046);

    return new Promise((res) => c.toBlob(res, 'image/png'));
  }

  // ---------- Compartir (imagen → texto → portapapeles) ----------
  async function share() {
    const p = get();
    if (!p) return;
    const url = location.origin + location.pathname;
    const text = I18N.t('mypalm.share_text', { ded: p.dedication, time: p.time }) + ' ' + url;
    try {
      const blob = await buildCard(p);
      const file = new File([blob], 'palmera-elx-al-cel.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
      if (navigator.share) { await navigator.share({ text }); return; }
      throw new Error('no-share');
    } catch (e) {
      if (e && e.name === 'AbortError') return; // el usuario cerró el diálogo
      try {
        await navigator.clipboard.writeText(text);
        if (window.ElxApp) ElxApp.toast(I18N.t('map.shared_copied'));
      } catch (e2) { if (window.ElxApp) ElxApp.toast(url); }
    }
  }

  window.MyPalm = { get, save, clear, share, buildCard };
})();
