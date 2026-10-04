const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Entorno mínimo: localStorage en memoria y una "nube" que tarda en responder,
// con la misma regla que Apps Script: max(actual, clienteUltimo) + 1.
let store;
let cloud;
let cloudCalls;
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
global.ArpaCloudSync = {
  obtenerSiguienteNumeroCloud: (tipo, clienteUltimo) => new Promise((resolve) => {
    cloudCalls++;
    setTimeout(() => {
      cloud[tipo] = Math.max(cloud[tipo] || 0, clienteUltimo) + 1;
      resolve(cloud[tipo]);
    }, 30);
  })
};

require('../js/arpa-numeracion.js');
const N = global.ArpaNumeracion;

beforeEach(() => {
  store = { arpa_suite_license_code: 'ARPA-TEST-2026', arpa_ultimo_cot: '3', arpa_cc_num: '7' };
  cloud = { cot: 3, cc: 7, formato: 0 };
  cloudCalls = 0;
});

describe('nextNumberAsync — sin saltos de numeración', () => {
  it('dos pedidos simultáneos de cotización dan el MISMO número (no salta)', async () => {
    const [a, b] = await Promise.all([
      N.nextNumberAsync('cot', ''),
      N.nextNumberAsync('cot', '')
    ]);
    assert.equal(a.value, 'COT-004');
    assert.equal(b.value, 'COT-004');
    assert.equal(cloudCalls, 1);
    assert.equal(cloud.cot, 4);
  });

  it('un pedido después de terminado el anterior sí avanza al siguiente', async () => {
    const a = await N.nextNumberAsync('cot', '');
    const b = await N.nextNumberAsync('cot', a.value);
    assert.equal(a.value, 'COT-004');
    assert.equal(b.value, 'COT-005');
  });

  it('cotización y cuenta de cobro no se bloquean entre sí', async () => {
    const [cot, cc] = await Promise.all([
      N.nextNumberAsync('cot', ''),
      N.nextNumberAsync('cc', '')
    ]);
    assert.equal(cot.value, 'COT-004');
    assert.equal(cc.value, 'CC-008');
  });

  it('con prefijo de técnico (AP) tampoco salta', async () => {
    store.arpa_suite_user_settings = JSON.stringify({ technicianCode: 'AP' });
    store.arpa_ultimo_cot = '158';
    cloud.cot = 158;
    const [a, b] = await Promise.all([
      N.nextNumberAsync('cot', ''),
      N.nextNumberAsync('cot', '')
    ]);
    assert.equal(a.value, 'AP-159');
    assert.equal(b.value, 'AP-159');
  });

  it('sin nube (offline) sigue dando número local sin saltar', async () => {
    const original = global.ArpaCloudSync.obtenerSiguienteNumeroCloud;
    global.ArpaCloudSync.obtenerSiguienteNumeroCloud = () => Promise.reject(new Error('offline'));
    try {
      const [a, b] = await Promise.all([
        N.nextNumberAsync('cot', ''),
        N.nextNumberAsync('cot', '')
      ]);
      assert.equal(a.value, 'COT-004');
      assert.equal(b.value, 'COT-004');
      assert.equal(a.sincronizado, false);
    } finally {
      global.ArpaCloudSync.obtenerSiguienteNumeroCloud = original;
    }
  });

  it('sin licencia sigue bloqueado', async () => {
    delete store.arpa_suite_license_code;
    const r = await N.nextNumberAsync('cot', '');
    assert.equal(r.blocked, true);
  });
});
