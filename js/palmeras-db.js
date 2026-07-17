/* =====================================================================
   Elx al Cel — Palmeras ciudadanas públicas (Supabase)
   Cliente mínimo contra la API REST de Supabase (PostgREST) via fetch,
   sin sumar la librería completa de supabase-js (coherente con el
   enfoque static-first / 0 KB de dependencias innecesarias del proyecto).
   La tabla y las políticas RLS están en supabase/schema.sql: lectura e
   inserción públicas, sin update/delete anónimo.
   ===================================================================== */
(function () {
  function ready() {
    const cfg = window.ElxConfig || {};
    return !!(cfg.SUPABASE_URL && cfg.SUPABASE_KEY);
  }
  function headers(extra) {
    const cfg = window.ElxConfig;
    return Object.assign({
      apikey: cfg.SUPABASE_KEY,
      Authorization: 'Bearer ' + cfg.SUPABASE_KEY
    }, extra || {});
  }

  async function list() {
    if (!ready()) return [];
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmeras?select=name,dedication,time,lat,lng,style,created_at&order=created_at.desc&limit=500';
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error('palmeras list failed: ' + res.status);
    return res.json();
  }

  async function create(p) {
    if (!ready()) throw new Error('Supabase no configurado');
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmeras';
    const res = await fetch(url, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({
        name: p.name || null,
        dedication: p.dedication,
        time: p.time,
        lat: p.lat,
        lng: p.lng,
        style: p.style || 'dorada'
      })
    });
    if (!res.ok) throw new Error('palmeras insert failed: ' + res.status + ' ' + (await res.text()));
    const data = await res.json();
    return data && data[0];
  }

  window.ElxPalmerasDB = { ready, list, create };
})();
