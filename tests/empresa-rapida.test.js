/**
 * Primer PDF sin empresa configurada: se pide solo el nombre (y teléfono opcional),
 * el resto de la configuración es opcional y el PDF no imprime textos de ayuda.
 * node --test tests/empresa-rapida.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function loadBrand(initial) {
  const data = { ...(initial || {}) };
  const sb = {
    console,
    localStorage: {
      getItem: (k) => (k in data ? data[k] : null),
      setItem: (k, v) => { data[k] = String(v); },
      removeItem: (k) => { delete data[k]; }
    },
    CustomEvent: class { constructor(type) { this.type = type; } },
    dispatchEvent: () => true
  };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(read('js/arpa-brand.js'), sb, { filename: 'arpa-brand.js' });
  return { brand: sb.ArpaBrand, data };
}

test('guardado rápido: solo nombre y teléfono dejan la empresa configurada', () => {
  const { brand, data } = loadBrand({});
  assert.strictEqual(brand.isCompanyConfigured(), false);
  assert.strictEqual(brand.quickSaveCompany({ companyName: '  ', phone: '811' }), false, 'sin nombre no guarda');
  assert.strictEqual(brand.quickSaveCompany({ companyName: 'Remodelaciones Murillo', phone: '811 530 1999' }), true);
  assert.strictEqual(data.arpa_suite_settings_configured, 'true');
  const s = brand.getSettings();
  assert.strictEqual(s.companyName, 'Remodelaciones Murillo');
  assert.strictEqual(s.phone, '811 530 1999');
  assert.strictEqual(brand.isCompanyConfigured(), true);
});

test('con empresa configurada no se pide nada antes del PDF', async () => {
  const { brand } = loadBrand({
    arpa_suite_user_settings: JSON.stringify({ companyName: 'Climas Alex' }),
    arpa_suite_settings_configured: 'true'
  });
  assert.strictEqual(await brand.ensureCompanyName(), true);
});

test('Configuración: solo el nombre de la empresa es obligatorio', () => {
  const src = read('js/arpa-brand.js');
  assert.ok(/\n    if \(!companyName\) \{\n      showError\(window\.ArpaI18n\.t\('alert\.brand\.campos_obligatorios'\)\);/.test(src));
  assert.ok(!/!nit \|\| !address/.test(src));
  const html = read('index.html');
  ['nit', 'address', 'phone', 'bank', 'account-type', 'account-number'].forEach((id) => {
    const label = html.match(new RegExp(`<label for="settings-${id}">.*?</label>`))[0];
    assert.ok(!label.includes('class="req"'), `settings-${id} sin asterisco`);
  });
});

test('los 6 botones de PDF/WhatsApp piden el nombre si falta', () => {
  const gate = 'if (!(await global.ArpaBrand?.ensureCompanyName?.() ?? true)) return;';
  const count = (rel) => read(rel).split(gate).length - 1;
  assert.strictEqual(count('js/arpa-cotizacion.js'), 2);
  assert.strictEqual(count('js/arpa-cuenta-cobro.js'), 2);
  assert.strictEqual(count('js/arpa-whatsapp.js'), 1);
  assert.strictEqual(count('js/arpa-historial.js'), 1);
});

test('el PDF no imprime los textos de ayuda ni datos vacíos', () => {
  const html = read('index.html');
  assert.ok(/html\.brand-unconfigured #brand-company-name,[\s\S]*?visibility: hidden !important;/.test(html));
  const brandSrc = read('js/arpa-brand.js');
  assert.ok(!brandSrc.includes("Tel: ${phone}<br>${val(s.address, '—')}"));
  assert.ok(!read('js/arpa-cuenta-cobro.js').includes("d.cobrador.nombre || '—'"));
});

test('referencia opcional en el catálogo: código automático único', () => {
  const src = read('js/arpa-mi-catalogo.js');
  const fnSrc = src.match(/function nextProductCode\(products\) \{[\s\S]*?\n  \}/)[0];
  const nextProductCode = vm.runInNewContext(`(${fnSrc})`);
  assert.strictEqual(nextProductCode([]), 'MIO-001');
  assert.strictEqual(nextProductCode([{ cod: 'CON-001' }, { cod: 'MIO-003' }]), 'MIO-004');
  assert.strictEqual(nextProductCode([{ cod: 'MIO-002' }, { cod: 'mio-003' }]), 'MIO-004');
});
