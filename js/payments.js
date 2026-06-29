/* =====================================================================
   PalmAR — Pagos
   · Si hay claves de Stripe + Edge Function -> Stripe Checkout real (test).
   · Si no -> pasarela SIMULADA (tarjeta de prueba) para la demo.
   checkout(draft) -> Promise<{paid:boolean, id?}>
   ===================================================================== */
(function () {
  const cfg = window.PalmarConfig || {};
  const realMode = !!(cfg.STRIPE_PUBLISHABLE_KEY && cfg.CHECKOUT_FUNCTION_URL && window.Stripe);

  function euros() {
    const n = (cfg.PRICE_EUR != null ? cfg.PRICE_EUR : 2.99);
    return n.toFixed(2).replace('.', ',') + ' €';
  }

  // ---------- Stripe real (modo test) ----------
  async function realCheckout(draft) {
    const token = await DB.getToken();
    const res = await fetch(cfg.CHECKOUT_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
      body: JSON.stringify({ palmera: draft, price_eur: cfg.PRICE_EUR, currency: cfg.CURRENCY })
    });
    if (!res.ok) throw new Error('checkout-failed');
    const data = await res.json();          // { url } o { sessionId }
    if (data.url) { window.location.href = data.url; return { paid: false, redirect: true }; }
    const stripe = window.Stripe(cfg.STRIPE_PUBLISHABLE_KEY);
    await stripe.redirectToCheckout({ sessionId: data.sessionId });
    return { paid: false, redirect: true };
  }

  // ---------- Pasarela simulada (demo) ----------
  function simulatedCheckout(draft) {
    return new Promise((resolve) => {
      const ov = document.createElement('div');
      ov.className = 'modal open';
      ov.style.zIndex = 90;
      ov.innerHTML =
        '<div class="modal-card" style="max-width:360px;position:relative;overflow:hidden">' +
        '<button class="sheet-close" data-x>✕</button>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="font-weight:800;font-size:19px">Pagar</span>' +
        '<span style="margin-left:auto;font-size:11px;color:#a7a3cc;border:1px solid #ffffff22;padding:3px 8px;border-radius:999px">TEST · Stripe</span></div>' +
        '<p style="color:#a7a3cc;font-size:13px;margin:0 0 14px">' + lbl('summary') + ' · <b style="color:#ffce5c">' + euros() + '</b></p>' +
        '<label class="field"><span>' + lbl('card') + '</span>' +
        '<input id="pc-num" inputmode="numeric" maxlength="19" autocomplete="cc-number" value="4242 4242 4242 4242"></label>' +
        '<div style="display:flex;gap:10px">' +
        '<label class="field" style="flex:1"><span>' + lbl('exp') + '</span>' +
        '<input id="pc-exp" inputmode="numeric" maxlength="7" autocomplete="cc-exp" value="12 / 34"></label>' +
        '<label class="field" style="flex:1"><span>CVC</span>' +
        '<input id="pc-cvc" inputmode="numeric" maxlength="4" autocomplete="cc-csc" value="123"></label></div>' +
        '<button class="btn btn-gold btn-wide" id="pc-pay">' + lbl('pay') + ' ' + euros() + '</button>' +
        '<p class="legal" style="margin-top:12px">' + lbl('note') + '</p>' +
        '</div>';
      document.body.appendChild(ov);

      // Formateo automático del número de tarjeta
      const numInput = ov.querySelector('#pc-num');
      numInput.addEventListener('input', () => {
        const v = numInput.value.replace(/\D/g, '').slice(0, 16);
        numInput.value = v.replace(/(.{4})/g, '$1 ').trim();
      });
      // Formateo de caducidad
      const expInput = ov.querySelector('#pc-exp');
      expInput.addEventListener('input', (e) => {
        let v = expInput.value.replace(/\D/g, '').slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + ' / ' + v.slice(2);
        expInput.value = v;
      });
      // CVC solo dígitos
      const cvcInput = ov.querySelector('#pc-cvc');
      cvcInput.addEventListener('input', () => {
        cvcInput.value = cvcInput.value.replace(/\D/g, '').slice(0, 4);
      });

      const done = (paid) => { ov.remove(); resolve({ paid }); };
      ov.querySelector('[data-x]').onclick = () => done(false);
      ov.addEventListener('click', (e) => { if (e.target === ov) done(false); });

      const card = ov.querySelector('.modal-card');
      const payBtn = ov.querySelector('#pc-pay');
      payBtn.onclick = () => {
        const num = (numInput.value || '').replace(/\s/g, '');
        if (num.length < 12) { numInput.style.outline = '2px solid #ff6b6b'; return; }
        payBtn.disabled = true; payBtn.textContent = lbl('processing'); payBtn.style.opacity = .7;
        setTimeout(() => {
          const tick = document.createElement('div');
          tick.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;' +
            'background:linear-gradient(180deg,#1c1550,#110c33);border-radius:24px;font-size:64px;' +
            'color:#ffce5c;animation:pay-success-in .38s ease-out';
          tick.textContent = '✓';
          card.appendChild(tick);
          setTimeout(() => done(true), 680);
        }, 950);
      };
    });
  }

  function lbl(k) {
    const t = window.I18N ? I18N.get() : 'va';
    const M = {
      va: { summary: "Apadrinament de palmera", card: "Número de targeta", exp: "Caducitat",
            pay: "Pagar", note: "Targeta de prova — no es cobra res de veritat.", processing: "Processant…" },
      cas: { summary: "Apadrinamiento de palmera", card: "Número de tarjeta", exp: "Caducidad",
            pay: "Pagar", note: "Tarjeta de prueba — no se cobra nada de verdad.", processing: "Procesando…" }
    };
    return (M[t] || M.va)[k];
  }

  async function checkout(draft) {
    if (realMode) {
      try { return await realCheckout(draft); }
      catch (e) { console.warn('Stripe real falló, uso simulado:', e); return simulatedCheckout(draft); }
    }
    return simulatedCheckout(draft);
  }

  window.Payments = { checkout, mode: realMode ? 'stripe' : 'simulated', priceLabel: euros };
})();
