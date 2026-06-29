/* =====================================================================
   PalmAR — Configuración
   La app funciona en MODO DEMO sin tocar nada (datos locales + pago
   simulado). Para activar el backend real, rellena las claves.
   ===================================================================== */
window.PalmarConfig = {
  // === Supabase — déjalo vacío para usar datos locales (demo) ===
  SUPABASE_URL: "",            // p.ej. "https://xxxx.supabase.co"
  SUPABASE_ANON_KEY: "",       // clave pública anon

  // === Stripe — déjalo vacío para usar el pago simulado (demo) ===
  // ¿A QUÉ CUENTA LLEGAN LOS PAGOS? A la cuenta de Stripe cuya clave SECRETA
  // (STRIPE_SECRET_KEY) se configura en la Edge Function de Supabase
  // (supabase secrets set STRIPE_SECRET_KEY=sk_live_...). La clave de aquí abajo
  // es solo la PÚBLICA. Mientras estén vacías, NO se cobra nada: pago simulado.
  STRIPE_PUBLISHABLE_KEY: "",  // pk_test_... / pk_live_...
  CHECKOUT_FUNCTION_URL: "",   // URL de la Edge Function "create-checkout"

  // === Negocio ===
  PRICE_EUR: 2.99,
  CURRENCY: "EUR",

  // === Nit de l'Albà: noche del 13 al 14 de agosto ===
  ALBA_MONTH: 8,   // agosto
  ALBA_DAY: 13,
  ALBA_HOUR: 22,
  ALBA_MIN: 0
};
