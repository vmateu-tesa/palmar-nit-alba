/* =====================================================================
   Elx al Cel — Palmeras ciudadanas públicas + votos (Supabase)
   Cliente mínimo contra la API REST de Supabase (PostgREST) via fetch,
   sin sumar la librería completa de supabase-js (coherente con el
   enfoque static-first / 0 KB de dependencias innecesarias del proyecto).
   Tablas y políticas RLS: supabase/schema.sql (palmeras) y
   supabase/02_votes.sql (palmera_votes) — lectura e inserción públicas,
   sin update/delete anónimo. Un voto por dispositivo y palmera, con un
   id de "votante" anónimo generado en el navegador (sin login).
   ===================================================================== */
(function () {
  const VOTER_KEY = 'elx_voter_id';
  const REQUEST_TIMEOUT_MS = 9000;

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

  function voterId() {
    let id = localStorage.getItem(VOTER_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'v-' + Date.now() + '-' + Math.random().toString(16).slice(2));
      localStorage.setItem(VOTER_KEY, id);
    }
    return id;
  }

  async function request(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try { return await fetch(url, Object.assign({}, options || {}, { signal: controller.signal })); }
    finally { clearTimeout(timer); }
  }

  const PUBLIC_FIELDS = 'id,client_id,name,dedication,time,lat,lng,style,created_at';

  async function list() {
    if (!ready()) return [];
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmeras?select=' + PUBLIC_FIELDS + '&order=created_at.desc,id.desc&limit=1000';
    const res = await request(url, { headers: headers(), cache: 'no-store' });
    if (!res.ok) throw new Error('palmeras list failed: ' + res.status);
    return res.json();
  }

  async function create(p) {
    if (!ready()) throw new Error('Supabase no configurado');
    // select= limita lo que devuelve el INSERT: el email nunca vuelve en la
    // respuesta (además de estar bloqueado a nivel de columna para "anon").
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmeras?on_conflict=client_id&select=' + PUBLIC_FIELDS;
    const res = await request(url, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=representation' }),
      body: JSON.stringify({
        client_id: p.client_id || null,
        name: p.name || null,
        email: p.email,
        dedication: p.dedication,
        time: p.time,
        lat: p.lat,
        lng: p.lng,
        style: p.style || 'dorada'
      })
    });
    if (!res.ok) throw new Error('palmeras insert failed: ' + res.status + ' ' + (await res.text()));
    const data = await res.json();
    if (data && data[0]) return data[0];
    if (p.client_id) {
      const findUrl = ElxConfig.SUPABASE_URL + '/rest/v1/palmeras?select=' + PUBLIC_FIELDS +
        '&client_id=eq.' + encodeURIComponent(p.client_id) + '&limit=1';
      const found = await request(findUrl, { headers: headers(), cache: 'no-store' });
      if (!found.ok) throw new Error('palmeras recovery failed: ' + found.status);
      const rows = await found.json();
      return rows && rows[0];
    }
    return null;
  }

  // ---- Votos ----
  async function voteCounts() {
    if (!ready()) return {};
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmera_vote_counts?select=palmera_id,votes';
    const res = await request(url, { headers: headers(), cache: 'no-store' });
    if (!res.ok) return {};
    const rows = await res.json();
    const map = {};
    rows.forEach((r) => { map[r.palmera_id] = r.votes; });
    return map;
  }

  async function myVotes() {
    if (!ready()) return {};
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmera_votes?select=palmera_id&voter_id=eq.' + encodeURIComponent(voterId());
    const res = await request(url, { headers: headers(), cache: 'no-store' });
    if (!res.ok) return {};
    const rows = await res.json();
    const map = {};
    rows.forEach((r) => { map[r.palmera_id] = true; });
    return map;
  }

  async function vote(palmeraId) {
    if (!ready()) throw new Error('Supabase no configurado');
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmera_votes';
    const res = await request(url, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ palmera_id: palmeraId, voter_id: voterId() })
    });
    // 409 = ya habías votado esta palmera (restricción UNIQUE) — no es un error real.
    if (!res.ok && res.status !== 409) throw new Error('vote failed: ' + res.status + ' ' + (await res.text()));
    return res.status !== 409;
  }

  window.ElxPalmerasDB = { ready, list, create, voteCounts, myVotes, vote, voterId };
})();
