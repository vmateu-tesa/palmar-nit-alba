const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function storage(seed) {
  const values = new Map(Object.entries(seed || {}));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function runBrowserFile(file, extras) {
  const context = Object.assign({
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    crypto: require('node:crypto').webcrypto
  }, extras || {});
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  return context;
}

function jsonResponse(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(JSON.stringify(body)),
    text: async () => typeof body === 'string' ? body : JSON.stringify(body)
  });
}

async function main() {
  const legacy = { dedication: 'Legacy', email: 'legacy@example.com', lat: 38.26, lng: -0.69, created: 1 };
  const localStorage = storage({ elx_my_palmera: JSON.stringify(legacy) });
  const local = runBrowserFile('js/mypalm.js', { localStorage });
  assert.equal(local.MyPalm.getAll().length, 1, 'migrates the legacy palm');
  const second = local.MyPalm.save({ dedication: 'Second', email: 'two@example.com', lat: 38.27, lng: -0.70, created: 2 });
  assert.equal(local.MyPalm.getAll().length, 2, 'allows multiple palms');
  assert.ok(second.client_id, 'assigns a stable client id');

  const rows = [];
  const fetch = async (rawUrl, options) => {
    const url = new URL(rawUrl);
    const method = (options && options.method) || 'GET';
    if (url.pathname.endsWith('/palmeras') && method === 'POST') {
      const input = JSON.parse(options.body);
      const existing = rows.find((row) => row.client_id === input.client_id);
      if (existing) return jsonResponse(200, []);
      const publicRow = {
        id: 'remote-' + (rows.length + 1), client_id: input.client_id,
        name: input.name, dedication: input.dedication, time: input.time,
        lat: input.lat, lng: input.lng, style: input.style,
        created_at: '2026-08-13T12:00:00Z'
      };
      rows.push(publicRow);
      return jsonResponse(201, [publicRow]);
    }
    if (url.pathname.endsWith('/palmeras')) {
      const clientId = url.searchParams.get('client_id');
      const selected = clientId ? rows.filter((row) => 'eq.' + row.client_id === clientId) : rows;
      return jsonResponse(200, selected);
    }
    return jsonResponse(200, []);
  };
  const config = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_KEY: 'public-test-key' };
  const clientA = runBrowserFile('js/palmeras-db.js', { ElxConfig: config, fetch, localStorage: storage(), URL });
  const palm = {
    client_id: 'local-production-smoke', name: 'Client A', email: 'private@example.com',
    dedication: 'Shared palm', time: '23:30', lat: 38.2685, lng: -0.699, style: 'dorada'
  };
  const created = await clientA.ElxPalmerasDB.create(palm);
  assert.equal(created.client_id, palm.client_id, 'publishes the stable client id');
  assert.equal(created.email, undefined, 'never returns the private email');

  const clientB = runBrowserFile('js/palmeras-db.js', { ElxConfig: config, fetch, localStorage: storage(), URL });
  const visible = await clientB.ElxPalmerasDB.list();
  assert.equal(visible.length, 1, 'a second client sees the shared palm');
  assert.equal(visible[0].dedication, palm.dedication);

  const retry = await clientA.ElxPalmerasDB.create(palm);
  assert.equal(retry.id, created.id, 'a retry recovers the original row');
  assert.equal(rows.length, 1, 'a retry does not duplicate the palm');
  console.log('production smoke: OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
