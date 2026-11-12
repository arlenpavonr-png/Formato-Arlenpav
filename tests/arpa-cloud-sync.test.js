const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { stripBase64 } = require('../js/arpa-cloud-sync.js');

describe('stripBase64', () => {
  it('anula data: como elementos de array (bug de fotosAntes)', () => {
    const input = {
      fotosAntes: ['data:image/jpeg;base64,ABC', 'data:image/jpeg;base64,XYZ']
    };
    assert.deepEqual(stripBase64(input), { fotosAntes: [null, null] });
  });

  it('anula data: como valor directo de una propiedad', () => {
    const input = { logo: 'data:image/png;base64,AAA', nombre: 'Acme' };
    assert.deepEqual(stripBase64(input), { logo: null, nombre: 'Acme' });
  });

  it('anula data: en array dentro de objeto dentro de array', () => {
    const input = {
      items: [
        { fotosDespues: ['data:image/jpeg;base64,ONE'] },
        { ok: true }
      ]
    };
    assert.deepEqual(stripBase64(input), {
      items: [
        { fotosDespues: [null] },
        { ok: true }
      ]
    });
  });

  it('deja intactos strings que no empiezan con data:', () => {
    const input = { url: 'https://example.com/foto.jpg', fotosAntes: ['https://cdn.example/a.jpg'] };
    assert.deepEqual(stripBase64(input), input);
  });
});

const { mergeHistorialRecords } = require('../js/arpa-cloud-sync.js');

describe('mergeHistorialRecords (la nube no borra el detalle de la cotización, 11-nov-2026)', () => {
  const local = {
    id: 'a1', modulo: 'cotizacion', numero: 'AP-COT-213', cliente: 'Diego Villa', total: 3177181,
    savedAt: '2026-11-10T20:00:00Z',
    fullSnapshot: { tel: '3117204944', nit: '', filas: [{ nom: 'Bulldozer 850', pvp: 1559900, cant: 1 }], cobros: [{ nom: 'Instalación', pvp: 750000, cant: 1 }] }
  };
  const cloud = {
    id: 'a1', modulo: 'cotizacion', numero: 'AP-COT-213', cliente: 'Diego Villa', total: 3177181,
    savedAt: '2026-11-11T01:00:00Z'
  };

  it('conserva el teléfono, los productos y los cobros del celular', () => {
    const [r] = mergeHistorialRecords([cloud], [local]);
    assert.equal(r.fullSnapshot.tel, '3117204944');
    assert.equal(r.fullSnapshot.filas.length, 1);
    assert.equal(r.fullSnapshot.cobros[0].pvp, 750000);
  });

  it('no duplica registros con el mismo id', () => {
    assert.equal(mergeHistorialRecords([cloud], [local]).length, 1);
  });

  it('trae de la nube lo que el celular no tiene', () => {
    const otro = { id: 'b2', numero: 'AP-COT-200', cliente: 'Otro', savedAt: '2026-11-01T00:00:00Z' };
    const out = mergeHistorialRecords([cloud, otro], [local]);
    assert.deepEqual(out.map((r) => r.id).sort(), ['a1', 'b2']);
  });

  it('si el celular no tiene detalle y la nube sí, usa el de la nube', () => {
    const conDetalle = Object.assign({}, cloud, { fullSnapshot: { tel: '999' } });
    const sinDetalle = { id: 'a1', numero: 'AP-COT-213', cliente: 'Diego Villa' };
    const [r] = mergeHistorialRecords([conDetalle], [sinDetalle]);
    assert.equal(r.fullSnapshot.tel, '999');
  });

  it('ordena del más reciente al más viejo', () => {
    const viejo = { id: 'c3', savedAt: '2026-10-01T00:00:00Z' };
    const nuevo = { id: 'd4', savedAt: '2026-11-11T00:00:00Z' };
    assert.deepEqual(mergeHistorialRecords([viejo], [nuevo]).map((r) => r.id), ['d4', 'c3']);
  });
});
