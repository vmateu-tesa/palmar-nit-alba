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

  async function list() {
    if (!ready()) return [];
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmeras?select=id,name,dedication,time,lat,lng,style,created_at&order=created_at.desc&limit=500';
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

  // ---- Votos ----
  async function voteCounts() {
    if (!ready()) return {};
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmera_vote_counts?select=palmera_id,votes';
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return {};
    const rows = await res.json();
    const map = {};
    rows.forEach((r) => { map[r.palmera_id] = r.votes; });
    return map;
  }

  async function myVotes() {
    if (!ready()) return {};
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmera_votes?select=palmera_id&voter_id=eq.' + encodeURIComponent(voterId());
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return {};
    const rows = await res.json();
    const map = {};
    rows.forEach((r) => { map[r.palmera_id] = true; });
    return map;
  }

  async function vote(palmeraId) {
    if (!ready()) throw new Error('Supabase no configurado');
    const url = ElxConfig.SUPABASE_URL + '/rest/v1/palmera_votes';
    const res = await fetch(url, {
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
