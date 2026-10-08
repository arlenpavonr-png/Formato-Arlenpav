/**
 * Respaldo automático de la suite en la nube (cliente).
 * node --test tests/respaldo-nube.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function memStorage(init) {
  const data = { ...(init || {}) };
  return {
    get length() { return Object.keys(data).length; },
    key: (i) => Object.keys(data)[i] ?? null,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    data,
  };
}

function load(local, opts) {
  const o = opts || {};
  const calls = [];
  const sb = {
    console, JSON, Date, Math, Promise, setTimeout, setInterval,
    localStorage: local,
    sessionStorage: memStorage(o.session),
    location: { hostname: o.hostname || 'example.org', pathname: '/' },
    ArpaCloudSync: {
      postJson: (body) => {
        calls.push(body);
        if (o.reply) return Promise.resolve(o.reply(body));
        return Promise.resolve(body.accion === 'respaldolistar' ? { ok: true, archivos: [] } : { ok: true });
      },
    },
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/arpa-respaldo-nube.js'), 'utf8'), sb);
  const saves = () => calls.filter((c) => c.accion === 'respaldoguardar');
  return { api: sb.ArpaRespaldoNube, calls, saves };
}

const LIC = { arpa_suite_license_code: 'ARPA-PRO-AAA111', arpa_suite_device_id: 'ab12cd34-ef56-7890' };

test('copia datos de la suite y deja fuera licencia, celular y prueba', () => {
  const local = memStorage({
    ...LIC,
    arpa_suite_license_founder: '1',
    arpa_suite_servicio_historial: '[{"numero":"AP-001"}]',
    arpa_suite_user_settings: '{"companyName":"X"}',
    arpa_catalog_automatismos: '[]',
    arpa_trial_id: 't',
    arpa_next_ultima_copia: '2026',
    otra_app: 'no',
  });
  const { api } = load(local);
  const snap = api.snapshotSuite(local, new Date('2026-10-08T12:00:00Z'));
  assert.deepStrictEqual(Object.keys(snap.keys).sort(), ['arpa_catalog_automatismos', 'arpa_suite_servicio_historial', 'arpa_suite_user_settings']);
});

test('sube la copia del celular y la copia del día con nombres propios del celular', async () => {
  const local = memStorage({ ...LIC, arpa_suite_servicio_historial: '[1]' });
  const { api, calls, saves } = load(local);
  const r = await api.backupSuite({ now: new Date(2026, 9, 8, 10, 0) });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(calls[0].accion, 'respaldolistar', 'primero comprueba que el servidor tenga respaldos');
  assert.deepStrictEqual(saves().map((c) => c.nombre), ['suite-ab12cd34-ultimo.json', 'suite-ab12cd34-2026-10-08.json']);
  assert.strictEqual(saves()[0].licencia, 'ARPA-PRO-AAA111');
  assert.match(saves()[0].contenido, /arpa-suite-respaldo/);
});

test('no vuelve a subir si nada cambió, y espera 10 minutos entre cambios del mismo día', async () => {
  const local = memStorage({ ...LIC, arpa_suite_servicio_historial: '[1]' });
  const { api, saves } = load(local);
  await api.backupSuite({ now: new Date(2026, 9, 8, 10, 0) });
  assert.strictEqual((await api.backupSuite({ now: new Date(2026, 9, 8, 10, 30) })).skipped, 'sin_cambios');
  local.setItem('arpa_suite_servicio_historial', '[1,2]');
  assert.strictEqual((await api.backupSuite({ now: new Date(2026, 9, 8, 10, 5) })).skipped, 'reciente');
  await api.backupSuite({ now: new Date(2026, 9, 8, 10, 20) });
  assert.strictEqual(saves().length, 3, 'solo sube la copia del celular, la del día ya estaba');
  await api.backupSuite({ now: new Date(2026, 9, 9, 8, 0) });
  assert.strictEqual(saves().at(-1).nombre, 'suite-ab12cd34-2026-10-09.json', 'al otro día guarda una copia nueva del día');
});

test('si falla la subida lo vuelve a intentar después', async () => {
  const local = memStorage({ ...LIC, arpa_suite_servicio_historial: '[1]' });
  let fail = true;
  const { api, saves } = load(local, {
    reply: (b) => (b.accion === 'respaldolistar' ? { ok: true, archivos: [] } : (fail ? { ok: false, mensaje: 'sin red' } : { ok: true })),
  });
  const r = await api.backupSuite({ now: new Date(2026, 9, 8, 10, 0) });
  assert.strictEqual(r.ok, false);
  assert.match(api.status().suiteError, /sin red/);
  fail = false;
  const r2 = await api.backupSuite({ now: new Date(2026, 9, 8, 10, 1) });
  assert.strictEqual(r2.ok, true);
  assert.strictEqual(saves().length, 3);
});

test('con el servidor viejo (sin respaldos) no manda copias grandes y prueba de nuevo a las 6 horas', async () => {
  const local = memStorage({ ...LIC, arpa_suite_servicio_historial: '[1]' });
  let nuevo = false;
  const { api, calls, saves } = load(local, {
    reply: (b) => (nuevo ? (b.accion === 'respaldolistar' ? { ok: true, archivos: [] } : { ok: true }) : { ok: false, mensaje: 'Acción desconocida.' }),
  });
  await api.backupSuite({ now: new Date(2026, 9, 8, 10, 0) });
  await api.backupSuite({ now: new Date(2026, 9, 8, 12, 0) });
  assert.strictEqual(saves().length, 0, 'nunca manda la copia al servidor viejo');
  assert.strictEqual(calls.length, 1, 'no insiste antes de 6 horas');
  nuevo = true;
  await api.backupSuite({ now: new Date(2026, 9, 8, 16, 30) });
  assert.strictEqual(saves().length, 2, 'cuando el servidor se actualiza, sube sola');
});

test('no sube sin licencia paga ni en la demo del LAB', async () => {
  for (const [local, opts] of [
    [memStorage({}), {}],
    [memStorage({ arpa_suite_license_code: 'ARPA-FREE-X1' }), {}],
    [memStorage(LIC), { hostname: 'localhost', session: { arpa_lab_demo: '1' } }],
  ]) {
    const { api, calls } = load(local, opts);
    const r = await api.backupSuite({ now: new Date(2026, 9, 8) });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(calls.length, 0);
  }
});

test('restaurar escribe los datos y nunca toca la licencia ni el celular', () => {
  const origen = memStorage({ ...LIC, arpa_suite_servicio_historial: '[9]', arpa_logo: 'data:x' });
  const { api } = load(origen);
  const text = JSON.stringify(api.snapshotSuite(origen));
  const nuevo = memStorage({ arpa_suite_license_code: 'ARPA-PRO-AAA111', arpa_suite_device_id: 'nuevo999' });
  const evil = JSON.parse(text);
  evil.keys.arpa_suite_license_code = 'ARPA-PRO-OTRA';
  evil.keys.arpa_suite_device_id = 'robado';
  const r = api.restoreSuite(JSON.stringify(evil), nuevo);
  assert.strictEqual(r.keys, 2);
  assert.strictEqual(nuevo.getItem('arpa_suite_servicio_historial'), '[9]');
  assert.strictEqual(nuevo.getItem('arpa_suite_license_code'), 'ARPA-PRO-AAA111');
  assert.strictEqual(nuevo.getItem('arpa_suite_device_id'), 'nuevo999');
  assert.throws(() => api.restoreSuite('{"x":1}', nuevo), /no es un respaldo/);
});
