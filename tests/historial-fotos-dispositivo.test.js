/**
 * Fotos del Formato en el dispositivo (IndexedDB), no en localStorage (AP-031, 16-nov-2026).
 * Sin IndexedDB (como aquí, en node) todo sigue como antes. La prueba con IndexedDB real
 * se hizo en el navegador (ver el PR). Igual que en el LAB (PR #41).
 * node --test tests/historial-fotos-dispositivo.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function cargar() {
  const store = {};
  const sb = {
    console: { log() {}, warn() {}, error() {} }, setTimeout, Promise,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} }) },
    addEventListener() {}, alert() {}, ArpaI18n: { t: (k) => k }
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/arpa-historial.js'), 'utf8'), sb);
  return { H: sb.ArpaHistorial, sb, store };
}
const F = (c) => 'data:image/jpeg;base64,' + c.repeat(50);
const conFotos = () => ({
  fotosAntes: [F('A'), F('B')], fotosDespues: [F('C')],
  _checklistNtc: { tipo: 'corrediza', items: { com_tierra: { r: 'si', foto: F('D') }, com_avisos: { r: 'na', foto: '' } } }
});

test('separarFotos y unirFotos: ida y vuelta sin perder nada', () => {
  const { H } = cargar();
  const original = conFotos();
  const sep = H.separarFotos(original);
  assert.equal(JSON.stringify(sep.snapshot).indexOf('data:image'), -1);
  assert.equal(sep.fotos.antes.length, 2);
  assert.equal(sep.fotos.ntc.com_tierra, F('D'));
  assert.deepEqual(JSON.parse(JSON.stringify(H.unirFotos(sep.snapshot, sep.fotos))), original);
});

test('unirFotos no pisa fotos que ya estén', () => {
  const { H } = cargar();
  const s = conFotos();
  const r = H.unirFotos(s, { antes: [F('Z')], despues: [], ntc: { com_tierra: F('Z') } });
  assert.deepEqual(r.fotosAntes, s.fotosAntes);
  assert.equal(r._checklistNtc.items.com_tierra.foto, F('D'));
});

test('sin IndexedDB no hay migración y el registro conserva sus fotos', async () => {
  const { H } = cargar();
  assert.equal(H.separarFotos({ fotosAntes: [], fotosDespues: [] }), null);
  assert.equal(await H.migrarFotosAlDispositivo(), 0);
});
