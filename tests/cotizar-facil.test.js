/**
 * Cotizar fácil (caso de un técnico de tablaroca que no logró cotizar):
 * ítem adicional con cantidad, cobros de ejemplo solo en automatismos, m² y precios libres,
 * PDF sin aviso de banco y plafón reticular en el catálogo de construcción.
 * node --test tests/cotizar-facil.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function loadCobros(oficios) {
  const store = {};
  const win = {
    console,
    Intl,
    navigator: { language: 'es-MX' },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    document: { getElementById: () => null },
    ArpaI18n: { t: (k) => k, translateIn: (k) => k, getLang: () => 'es' },
    ArpaOficios: oficios === null ? undefined : { getActiveOficiosFromSettings: () => oficios }
  };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(read('js/arpa-pricing.js'), win, { filename: 'arpa-pricing.js' });
  vm.runInContext(read('js/arpa-cobros.js'), win, { filename: 'arpa-cobros.js' });
  return win.ArpaCobros;
}

test('construcción: la cotización nueva arranca sin cobros de ejemplo', () => {
  const c = loadCobros(['construccion']);
  c.seedFromPriceList('cot');
  assert.strictEqual(c.getLines('cot').length, 0);
  c.addLine('cot', 'Plafón reticular 61x61', 950);
  c.seedFromPriceList('cot');
  assert.strictEqual(c.getLines('cot').length, 1, 'volver a la vista no siembra encima de lo del usuario');
});

test('automatismos (y sin datos de oficio) conserva los 5 cobros de ejemplo', () => {
  for (const oficios of [['automatismos'], ['automatismos', 'cctv'], null]) {
    const c = loadCobros(oficios);
    c.seedFromPriceList('cot');
    assert.strictEqual(c.getLines('cot').length, 5, JSON.stringify(oficios));
  }
});

test('ítem adicional con cantidad decimal: 287.25 m² × 950', () => {
  const c = loadCobros(['construccion']);
  c.setLines('cot', [{ nom: 'Plafón reticular 61x61', pvp: 950, cant: '287,25' }]);
  const [line] = c.getLines('cot');
  assert.strictEqual(line.cant, 287.25);
  assert.strictEqual(c.getSubtotal('cot'), 272887.5);
});

test('ítems guardados antes (sin cantidad) valen 1', () => {
  const c = loadCobros(['construccion']);
  c.setLines('cot', [{ nom: 'Visita', pvp: 390 }]);
  assert.strictEqual(c.getLines('cot')[0].cant, 1);
  assert.strictEqual(c.getSubtotal('cot'), 390);
});

test('la tabla y el borrador de la cotización usan la cantidad del ítem', () => {
  const src = read('js/arpa-cotizacion.js');
  assert.ok(src.includes('${formatoPesos(f.pvp * f.cant)}</td>\n        <td class="td-action"></td>'), 'total de la fila = cant × valor');
  assert.ok(/cobros:\s+getCobrosLineas\(\)/.test(src), 'el borrador guarda los ítems adicionales');
  assert.ok(src.includes(':not(.cobro-cant)'), 'el campo de cantidad no se reemplaza al imprimir');
});

test('m² y precios con cualquier valor en el formulario de producto', () => {
  const html = read('index.html');
  assert.ok(/id="cat-form-pvp" min="0" step="any"/.test(html), 'precio sin step de 1000');
  assert.ok(/value: 'm2', key: 'prod_modal\.unidad\.m2'/.test(read('js/arpa-mi-catalogo.js')), 'opción m²');
  assert.ok(html.includes('.cobro-row .cobro-cant-field'), 'fila del ítem con cantidad');
});

test('el PDF no imprime el aviso de banco ni el recuadro vacío', () => {
  const brand = read('js/arpa-brand.js');
  assert.ok(/classList\.toggle\('print-hide-empty', !hasBankData\(s\)\)/.test(brand));
  assert.ok(!/\$\{val\(s\.nit, '—'\)\}/.test(brand), 'sin "RFC: —" cuando no hay RFC');
  assert.ok(read('js/arpa-cuenta-cobro.js').includes('if (d.pago.bankName || d.pago.accountNumber) {'));
});

test('construcción trae plafón reticular en m² y llega a quienes ya tenían el catálogo', () => {
  const src = read('js/arpa-oficios.js');
  assert.ok(/cod: 'CON-021', nom: 'Plafón reticular suspendido 61 x 61 cm[^']*\(m²\)', categoria: 'Drywall \/ Tablaroca', pvp: \d+, unidad: 'm2'/.test(src));
  assert.ok(/SEED_UPDATES = \{[^}]*construccion: '2026-10-plafon-reticular'/.test(src));
});
