/* =====================================================================
   PalmAR — Capa de datos
   Usa Supabase si hay claves en config.js; si no, cae a almacenamiento
   local (localStorage) con datos de ejemplo, para que la demo funcione.
   ===================================================================== */
(function () {
  const cfg = window.PalmarConfig || {};
  const useSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const EMOJIS = ['❤️', '✨', '👏', '🔥'];

  const uid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let authListeners = [];
  let cachedUser = null;
  let resettingEmail = null;   // (modo local) correo en proceso de recuperación

  function emitAuth() { authListeners.forEach((cb) => cb(cachedUser)); }

  // -------------------------------------------------------------------
  //  Generador de "foto" de palmera (SVG en data URL) para el seed.
  //  Auto-contenido y offline: no depende de archivos ni de la red.
  // -------------------------------------------------------------------
  // Silueta (en sombra, casi negra) de la Basílica de Santa María d'Elx:
  // cuerpo + tambor + cúpula con linterna + campanari amb agulla.
  function basilicaSVG(W, H) {
    const sil = '#04030d', cx = W * 0.5, g = H;
    const body = 70, bodyW = 240, drumW = 96, drumH = 34, dr = 48, domeH = 88;
    const bodyTop = g - body, drumTop = bodyTop - drumH, apex = drumTop - domeH;
    const tx = cx - 150, tw = 44, th = 162;
    const dome = 'M' + (cx - dr) + ' ' + drumTop + ' Q ' + (cx - dr) + ' ' + apex + ' ' + cx + ' ' + apex +
      ' Q ' + (cx + dr) + ' ' + apex + ' ' + (cx + dr) + ' ' + drumTop + ' Z';
    const spire = 'M' + (tx - 3) + ' ' + (g - th) + ' L ' + (tx + tw / 2) + ' ' + (g - th - 32) +
      ' L ' + (tx + tw + 3) + ' ' + (g - th) + ' Z';
    return '<g fill="' + sil + '">' +
      '<rect x="' + (cx - bodyW / 2) + '" y="' + bodyTop + '" width="' + bodyW + '" height="' + (body + 2) + '"/>' +
      '<rect x="' + (cx - drumW / 2) + '" y="' + drumTop + '" width="' + drumW + '" height="' + drumH + '"/>' +
      '<path d="' + dome + '"/>' +
      '<rect x="' + (cx - 10) + '" y="' + (apex - 18) + '" width="20" height="18"/>' +     // linterna
      '<rect x="' + (cx - 1.5) + '" y="' + (apex - 30) + '" width="3" height="12"/>' +      // agulla
      '<rect x="' + (cx - 6) + '" y="' + (apex - 24) + '" width="12" height="3"/>' +        // creu
      '<rect x="' + tx + '" y="' + (g - th) + '" width="' + tw + '" height="' + th + '"/>' + // campanari
      '<path d="' + spire + '"/>' +
      '</g>' +
      '<g fill="none" stroke="rgba(255,196,110,0.14)" stroke-width="1">' +   // tènue llum càlida
      '<path d="' + dome + '"/>' +
      '<path d="M' + tx + ' ' + (g - th) + ' L ' + (tx + tw / 2) + ' ' + (g - th - 32) + ' L ' + (tx + tw + 3) + ' ' + (g - th) + '"/>' +
      '</g>';
  }

  function fwPhoto(colors, opts) {
    opts = opts || {};
    const W = 640, H = 420, cx = 320, cy = opts.cy || 168;
    const n = opts.n || 34, spread = opts.spread || 2.2;
    const r = (a, b) => a + Math.random() * (b - a);
    let strokes = '';
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const len = 80 + Math.random() * 140;
      const ex = cx + Math.cos(ang) * len;
      const eyTop = cy + Math.sin(ang) * len;
      const ey = eyTop + 50 + Math.random() * 80;          // caída (gota de palmera)
      const col = colors[(Math.random() * colors.length) | 0];
      const mx = (cx + ex) / 2;
      strokes += '<path d="M' + cx + ' ' + cy + ' Q ' + mx.toFixed(0) + ' ' + eyTop.toFixed(0) +
        ' ' + ex.toFixed(0) + ' ' + ey.toFixed(0) + '" stroke="' + col + '" stroke-width="' +
        r(1, 2.4).toFixed(1) + '" fill="none" opacity="' + r(0.45, 1).toFixed(2) +
        '" stroke-linecap="round"/>';
      strokes += '<circle cx="' + ex.toFixed(0) + '" cy="' + ey.toFixed(0) + '" r="' +
        r(1, 2.6).toFixed(1) + '" fill="#fff" opacity="0.85"/>';
    }
    let stars = '';
    for (let i = 0; i < 44; i++) {
      stars += '<circle cx="' + ((Math.random() * W) | 0) + '" cy="' + ((Math.random() * H * 0.78) | 0) +
        '" r="' + r(0.4, 1.3).toFixed(1) + '" fill="#fff" opacity="' + r(0.15, 0.6).toFixed(2) + '"/>';
    }
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs>' +
      '<radialGradient id="g" cx="50%" cy="32%" r="85%">' +
      '<stop offset="0%" stop-color="#1a1648"/><stop offset="100%" stop-color="#05030f"/></radialGradient>' +
      '<linearGradient id="c" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#0a0820"/><stop offset="100%" stop-color="#000"/></linearGradient>' +
      '</defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#g)"/>' + stars + strokes +
      '<rect x="0" y="' + (H - 60) + '" width="' + W + '" height="60" fill="url(#c)"/>' +
      basilicaSVG(W, H) + '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  // -------------------------------------------------------------------
  //  SEED de ejemplo (solo modo local)
  // -------------------------------------------------------------------
  function seed() {
    if (lsGet('palmar_seeded_v4')) return;
    const now = Date.now();
    const palmeras = [
      // ---- Palmeres OFICIALS de l'Ajuntament d'Elx (llocs i hores reals) ----
      { id: uid(), owner_id: 'official', owner_name: "Ajuntament d'Elx", name: 'Palmera de la Mare de Déu',
        firework_type: 'palmera_verge', lat: 38.2659, lng: -0.6986, ignite_at: '00:00',
        family_note: "La gran palmera blanca llançada des del campanar de la Basílica de Santa María.",
        description: "El moment més esperat de la Nit de l'Albà: més de 1.300 coets ascendeixen verticalment fins als 300 metres des de la torre de la Basílica, il·luminant tot Elx en honor a la Mare de Déu de l'Assumpció. Tota la ciutat es queda en silenci i foscor abans del seu llançament.",
        dedication: "A la Mare de Déu de l'Assumpció, patrona d'Elx.",
        color: '#fff3c4', is_official: true, is_paid: true, created_at: now - 200000 },
      { id: uid(), owner_id: 'official', owner_name: "Ajuntament d'Elx", name: 'Glorieta · Plaça de Baix',
        firework_type: 'palmera_or', lat: 38.2668, lng: -0.6996, ignite_at: '23:15',
        family_note: "Inici de la Nit de l'Albà al cor de la ciutat.",
        description: "Una de les primeres palmeres en encendre's, al costat de l'Ajuntament, donant el tret d'eixida a la nit de foc.",
        color: '#ffce5c', is_official: true, is_paid: true, created_at: now - 199000 },
      { id: uid(), owner_id: 'official', owner_name: "Ajuntament d'Elx", name: 'Pont del Bimil·lenari',
        firework_type: 'palmera_colors', lat: 38.2680, lng: -0.7012, ignite_at: '23:30',
        family_note: "Des d'ací es veuen totes les palmeres de la ciutat.",
        description: "El millor mirador de la Nit de l'Albà: la seua perspectiva permet contemplar els focs llançats des de tots els punts d'Elx.",
        color: '#9d6bff', is_official: true, is_paid: true, created_at: now - 198000 },
      { id: uid(), owner_id: 'official', owner_name: "Ajuntament d'Elx", name: 'Parc Municipal',
        firework_type: 'palmera_plata', lat: 38.2708, lng: -0.7000, ignite_at: '23:20',
        family_note: "Palmeres sobre les palmeres del Palmeral.",
        description: "Llançament des del Parc Municipal, envoltat del Palmeral Històric, Patrimoni de la Humanitat.",
        color: '#bfe0ff', is_official: true, is_paid: true, created_at: now - 197000 },
      { id: uid(), owner_id: 'official', owner_name: "Ajuntament d'Elx", name: 'Pont Nou',
        firework_type: 'carcassa', lat: 38.2650, lng: -0.6975, ignite_at: '23:40',
        family_note: "Carcasses de color sobre el llit del Vinalopó.",
        description: "Un dels punts amb més públic, sobre el cauce del riu Vinalopó.",
        color: '#ff6b6b', is_official: true, is_paid: true, created_at: now - 196000 },
      // ---- Palmeres de famílies (exemple) ----
      { id: uid(), owner_id: 'seed', owner_name: 'Família Mas', name: 'Família Mas',
        firework_type: 'palmera_or', lat: 38.2682, lng: -0.7126, ignite_at: '23:30',
        family_note: "En memòria de l'iaio Vicent, que mai es perdia una Albà.",
        color: '#ffce5c', is_paid: true, created_at: now - 90000 },
      { id: uid(), owner_id: 'seed', owner_name: 'Penya El Tro', name: 'Penya El Tro',
        firework_type: 'carcassa', lat: 38.2655, lng: -0.7050, ignite_at: '23:45',
        family_note: "Visca Elx i la Mare de Déu de l'Assumpció!",
        color: '#ff6b6b', is_paid: true, created_at: now - 80000 },
      { id: uid(), owner_id: 'seed', owner_name: 'Els Quatre Cantons', name: 'Els Quatre Cantons',
        firework_type: 'palmera_colors', lat: 38.2731, lng: -0.7008, ignite_at: '00:00',
        family_note: "Per molts anys, Marina! La teua primera Albà.",
        color: '#9d6bff', is_paid: true, created_at: now - 70000 },
      { id: uid(), owner_id: 'seed', owner_name: 'Casa Antón', name: 'Casa Antón',
        firework_type: 'palmera_plata', lat: 38.2620, lng: -0.7180, ignite_at: '23:15',
        family_note: "La nostra primera Albà junts.",
        color: '#bfe0ff', is_paid: true, created_at: now - 60000 },
      { id: uid(), owner_id: 'seed', owner_name: 'Comparsa La Vila', name: 'Comparsa La Vila',
        firework_type: 'palmera_verge', lat: 38.2700, lng: -0.6990, ignite_at: '00:30',
        family_note: "Per tots els que ja no hi són però seguixen mirant el cel.",
        color: '#fff3c4', is_paid: true, created_at: now - 50000 }
    ];
    // Fotos de ejemplo (SVG) para les palmeres oficials
    palmeras.filter((p) => p.is_official).forEach((p) => {
      const t = window.Fireworks && Fireworks.getType(p.firework_type);
      const pal = (t && t.palette) || ['#ffd66b', '#fff3c4', '#ffb43c'];
      p.media = [
        { type: 'image', url: fwPhoto(pal, { spread: 2.3, n: 36 }) },
        { type: 'image', url: fwPhoto(pal, { spread: 1.5, cy: 150, n: 28 }) }
      ];
    });
    const comments = [
      { id: uid(), palmera_id: palmeras[0].id, author_name: 'Toni', body: 'La més emocionant de tota la nit 😭✨', created_at: now - 40000 },
      { id: uid(), palmera_id: palmeras[5].id, author_name: 'Carmen', body: 'La més bonica del barri ✨', created_at: now - 30000 },
      { id: uid(), palmera_id: palmeras[7].id, author_name: 'Lluís', body: 'Felicitats Marina!!', created_at: now - 20000 }
    ];
    lsSet('palmar_palmeras', palmeras);
    lsSet('palmar_comments', comments);
    lsSet('palmar_reactions', []);
    lsSet('palmar_seeded_v4', true);
  }

  // -------------------------------------------------------------------
  //  Backend SUPABASE
  // -------------------------------------------------------------------
  let sb = null;
  function initSupabase() {
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    sb.auth.getUser().then(({ data }) => {
      if (data && data.user) { cachedUser = mapUser(data.user); emitAuth(); }
    });
    sb.auth.onAuthStateChange((event, session) => {
      cachedUser = session && session.user ? mapUser(session.user) : null;
      emitAuth();
      // El usuario ha pulsat l'enllaç de recuperació del correu
      if (event === 'PASSWORD_RECOVERY') window.dispatchEvent(new CustomEvent('palmar-recovery'));
    });
  }
  function mapUser(u) {
    const m = u.user_metadata || {};
    return {
      id: u.id, email: u.email,
      name: m.display_name || u.email.split('@')[0],
      avatar: m.avatar_url || null
    };
  }

  const SB = {
    async signUp(name, email, password) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { display_name: name } } });
      if (error) throw error;
      cachedUser = data.user ? mapUser(data.user) : null; emitAuth();
      return cachedUser;
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      cachedUser = mapUser(data.user); emitAuth(); return cachedUser;
    },
    async signOut() { await sb.auth.signOut(); cachedUser = null; emitAuth(); },
    async resetPassword(email) {
      const redirectTo = location.origin + location.pathname;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      return { sent: true };
    },
    async updatePassword(newPassword) {
      const { data, error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw error;
      cachedUser = data && data.user ? mapUser(data.user) : cachedUser; emitAuth();
      return cachedUser;
    },
    async updateProfile(name, avatar) {
      const meta = { display_name: name };
      if (avatar !== undefined) meta.avatar_url = avatar;
      const { data, error } = await sb.auth.updateUser({ data: meta });
      if (error) throw error;
      if (cachedUser) {
        const row = { display_name: name };
        if (avatar !== undefined) row.avatar_url = avatar;
        await sb.from('profiles').update(row).eq('id', cachedUser.id);
      }
      cachedUser = data && data.user ? mapUser(data.user) : cachedUser; emitAuth();
      return cachedUser;
    },
    async getToken() { const { data } = await sb.auth.getSession(); return data && data.session && data.session.access_token; },
    async listPalmeras() {
      const { data, error } = await sb.from('palmeras').select('*').eq('is_paid', true).order('created_at', { ascending: false });
      if (error) throw error; return data || [];
    },
    async createPalmera(p) {
      // Camino de cliente (sin Stripe): publica directamente. Con Stripe real,
      // la palmera la crea la Edge Function y la confirma el webhook.
      const row = Object.assign({ is_paid: true }, p, { owner_id: cachedUser && cachedUser.id, owner_name: cachedUser && cachedUser.name });
      const { data, error } = await sb.from('palmeras').insert(row).select().single();
      if (error) throw error; return data;
    },
    async getComments(id) {
      const { data, error } = await sb.from('comments').select('*').eq('palmera_id', id).order('created_at');
      if (error) throw error; return data || [];
    },
    async addComment(id, body) {
      const row = { palmera_id: id, author_id: cachedUser && cachedUser.id,
        author_name: cachedUser && cachedUser.name, author_avatar: cachedUser && cachedUser.avatar, body };
      const { data, error } = await sb.from('comments').insert(row).select().single();
      if (error) throw error; return data;
    },
    async getReactions(id) {
      const { data } = await sb.from('reactions').select('*').eq('palmera_id', id);
      return countReactions(data || []);
    },
    async toggleReaction(id, emoji) {
      const me = cachedUser && cachedUser.id;
      const { data } = await sb.from('reactions').select('*').eq('palmera_id', id).eq('user_id', me).eq('emoji', emoji);
      if (data && data.length) await sb.from('reactions').delete().eq('id', data[0].id);
      else await sb.from('reactions').insert({ palmera_id: id, user_id: me, emoji });
      return SB.getReactions(id);
    },
    async deletePalmera(id) {
      const me = cachedUser && cachedUser.id;
      const { error } = await sb.from('palmeras').delete().eq('id', id).eq('owner_id', me);
      if (error) throw error;
    },
    async updatePalmera(id, data) {
      const me = cachedUser && cachedUser.id;
      const { data: row, error } = await sb.from('palmeras').update(data).eq('id', id).eq('owner_id', me).select().single();
      if (error) throw error; return row;
    }
  };

  // -------------------------------------------------------------------
  //  Backend LOCAL (demo)
  // -------------------------------------------------------------------
  const LOCAL = {
    async signUp(name, email, password) {
      const users = lsGet('palmar_users', {});
      if (users[email]) throw new Error('exists');
      users[email] = { id: uid(), name, email, pass: btoa(password) };
      lsSet('palmar_users', users);
      cachedUser = { id: users[email].id, name, email };
      lsSet('palmar_session', cachedUser); emitAuth(); return cachedUser;
    },
    async signIn(email, password) {
      const users = lsGet('palmar_users', {});
      const u = users[email];
      if (!u || u.pass !== btoa(password)) throw new Error('invalid');
      cachedUser = { id: u.id, name: u.name, email, avatar: u.avatar || null };
      lsSet('palmar_session', cachedUser); emitAuth(); return cachedUser;
    },
    async signOut() { cachedUser = null; localStorage.removeItem('palmar_session'); emitAuth(); },
    async resetPassword(email) {
      const users = lsGet('palmar_users', {});
      if (!users[email]) throw new Error('nouser');
      resettingEmail = email;          // sin servidor de correo: se define en el acto
      return { sent: false, local: true };
    },
    async updatePassword(newPassword) {
      const users = lsGet('palmar_users', {});
      const email = resettingEmail || (cachedUser && cachedUser.email);
      if (!email || !users[email]) throw new Error('nouser');
      users[email].pass = btoa(newPassword);
      lsSet('palmar_users', users);
      resettingEmail = null;
      cachedUser = { id: users[email].id, name: users[email].name, email };
      lsSet('palmar_session', cachedUser); emitAuth();   // login automático
      return cachedUser;
    },
    async updateProfile(name, avatar) {
      if (!cachedUser) throw new Error('no-session');
      const users = lsGet('palmar_users', {});
      if (users[cachedUser.email]) {
        users[cachedUser.email].name = name;
        if (avatar !== undefined) users[cachedUser.email].avatar = avatar;
        lsSet('palmar_users', users);
      }
      cachedUser = Object.assign({}, cachedUser, { name });
      if (avatar !== undefined) cachedUser.avatar = avatar;
      lsSet('palmar_session', cachedUser); emitAuth();
      return cachedUser;
    },
    async getToken() { return null; },
    async listPalmeras() {
      return lsGet('palmar_palmeras', []).filter((p) => p.is_paid).sort((a, b) => b.created_at - a.created_at);
    },
    async createPalmera(p) {
      const list = lsGet('palmar_palmeras', []);
      const row = Object.assign({ id: uid(), created_at: Date.now(), is_paid: true }, p, {
        owner_id: cachedUser && cachedUser.id, owner_name: cachedUser && cachedUser.name
      });
      list.push(row); lsSet('palmar_palmeras', list); return row;
    },
    async getComments(id) {
      return lsGet('palmar_comments', []).filter((c) => c.palmera_id === id).sort((a, b) => a.created_at - b.created_at);
    },
    async addComment(id, body) {
      const list = lsGet('palmar_comments', []);
      const row = { id: uid(), palmera_id: id, author_id: cachedUser && cachedUser.id,
        author_name: cachedUser && cachedUser.name, author_avatar: cachedUser && cachedUser.avatar, body, created_at: Date.now() };
      list.push(row); lsSet('palmar_comments', list); return row;
    },
    async getReactions(id) {
      return countReactions(lsGet('palmar_reactions', []).filter((r) => r.palmera_id === id));
    },
    async toggleReaction(id, emoji) {
      const me = cachedUser && cachedUser.id;
      let list = lsGet('palmar_reactions', []);
      const i = list.findIndex((r) => r.palmera_id === id && r.user_id === me && r.emoji === emoji);
      if (i >= 0) list.splice(i, 1); else list.push({ id: uid(), palmera_id: id, user_id: me, emoji });
      lsSet('palmar_reactions', list); return countReactions(list.filter((r) => r.palmera_id === id));
    },
    async deletePalmera(id) {
      const me = cachedUser && cachedUser.id;
      let list = lsGet('palmar_palmeras', []);
      list = list.filter((p) => !(p.id === id && p.owner_id === me));
      lsSet('palmar_palmeras', list);
    },
    async updatePalmera(id, data) {
      const me = cachedUser && cachedUser.id;
      const list = lsGet('palmar_palmeras', []);
      const idx = list.findIndex((p) => p.id === id && p.owner_id === me);
      if (idx < 0) throw new Error('not-found');
      Object.assign(list[idx], data);
      lsSet('palmar_palmeras', list); return list[idx];
    }
  };

  function countReactions(rows) {
    const me = cachedUser && cachedUser.id;
    const counts = {}, mine = {};
    EMOJIS.forEach((e) => { counts[e] = 0; mine[e] = false; });
    rows.forEach((r) => {
      if (counts[r.emoji] == null) counts[r.emoji] = 0;
      counts[r.emoji]++;
      if (r.user_id && r.user_id === me) mine[r.emoji] = true;
    });
    return { counts, mine, emojis: EMOJIS };
  }

  // -------------------------------------------------------------------
  //  Inicialización + API pública
  // -------------------------------------------------------------------
  let backend;
  if (useSupabase) { initSupabase(); backend = SB; }
  else { seed(); backend = LOCAL; cachedUser = lsGet('palmar_session', null); }

  window.DB = {
    mode: useSupabase ? 'supabase' : 'local',
    EMOJIS,
    user: () => cachedUser,
    onAuthChange: (cb) => { authListeners.push(cb); cb(cachedUser); },
    signUp: (...a) => backend.signUp(...a),
    signIn: (...a) => backend.signIn(...a),
    signOut: () => backend.signOut(),
    resetPassword: (email) => backend.resetPassword(email),
    updatePassword: (pass) => backend.updatePassword(pass),
    updateProfile: (name, avatar) => backend.updateProfile(name, avatar),
    getToken: () => backend.getToken(),
    listPalmeras: () => backend.listPalmeras(),
    createPalmera: (p) => backend.createPalmera(p),
    getComments: (id) => backend.getComments(id),
    addComment: (id, b) => backend.addComment(id, b),
    getReactions: (id) => backend.getReactions(id),
    toggleReaction: (id, e) => backend.toggleReaction(id, e),
    deletePalmera: (id) => backend.deletePalmera(id),
    updatePalmera: (id, d) => backend.updatePalmera(id, d)
  };
})();
