/**
 * Tocar una foto del formato (antes/después o de la lista NTC) pregunta antes de quitarla.
 * Antes un toque la borraba sin aviso (AP-031, 16-nov-2026).
 * node --test tests/foto-confirmar-quitar.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('antes/después: confirm antes del splice', () => {
  const html = read('index.html');
  const fn = html.slice(html.indexOf('function renderFormatoFotos'), html.indexOf('function applyFormatoFotosFromDraft'));
  const iConfirm = fn.indexOf('window.confirm(');
  const iSplice = fn.indexOf('store[slot].splice(index, 1)');
  assert.ok(iConfirm > 0 && iSplice > iConfirm, 'pregunta y después quita');
  assert.match(fn, /if \(!window\.confirm\(msg\)\) return;/);
});

test('lista NTC: confirm antes de quitar la foto del punto', () => {
  const js = read('js/arpa-formato-tipo.js');
  const i = js.indexOf("kind === 'foto-del'");
  const bloque = js.slice(i, i + 400);
  assert.ok(bloque.indexOf('global.confirm(') < bloque.indexOf("setItemRaw(id, { foto: '' })"));
});

test('el mensaje está en español e inglés', () => {
  const i18n = read('js/arpa-i18n.js');
  assert.match(i18n, /'confirm\.foto_quitar': '¿Quitar esta foto del formato\?'/);
  assert.match(i18n, /'confirm\.foto_quitar': 'Remove this photo from the work order\?'/);
});
