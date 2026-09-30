const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function printCssBlock(html) {
  const start = html.indexOf('@media print {');
  assert.ok(start >= 0, 'falta @media print en index.html');
  let i = start + '@media print {'.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    if (html[i] === '{') depth += 1;
    else if (html[i] === '}') depth -= 1;
    i += 1;
  }
  return html.slice(start, i);
}

describe('CSS de impresión: pie no tapa contenido', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const printBlocks = [];
  let from = 0;
  while (true) {
    const start = html.indexOf('@media print', from);
    if (start < 0) break;
    printBlocks.push(printCssBlock(html.slice(start)));
    from = start + 12;
  }
  const printCss = printBlocks.join('\n');

  it('el pie de impresión no usa position:fixed ni franja ::before', () => {
    assert.match(printCss, /\.suite-footer\s*\{[^}]*position:\s*static/s);
    assert.doesNotMatch(printCss, /\.suite-footer\s*\{[^}]*position:\s*fixed/s);
    assert.doesNotMatch(printCss, /body\.is-printing::before/);
    assert.doesNotMatch(printCss, /body\.is-printing-formato::before/);
  });

  it('CACHE_VERSION pide recarga tras cotización perfecta', () => {
    const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
    assert.match(sw, /CACHE_VERSION = 'v20261001-cot-perfecta-2'/);
  });

  it('impresión oculta buscador, casilla IVA, placeholders y observaciones vacías', () => {
    assert.match(printCss, /#cot-buscar-section/);
    assert.match(printCss, /\.iva-toggle/);
    assert.match(printCss, /::placeholder/);
    assert.match(printCss, /print-hide-empty/);
    assert.match(printCss, /cot-obs:placeholder-shown/);
  });

  it('el cierre de cotización no evita saltos de página en bloque', () => {
    assert.doesNotMatch(printCss, /\.cot-cierre-block\s*\{[^}]*break-inside:\s*avoid/s);
    assert.doesNotMatch(printCss, /\.cot-cierre-block\s*\{[^}]*page-break-inside:\s*avoid/s);
    assert.match(printCss, /\.totales-box\s*\{[^}]*break-inside:\s*avoid/s);
    assert.match(printCss, /\.cot-bank-section/);
    assert.match(printCss, /\.garantia/);
    assert.match(printCss, /\.nota-cot/);
    assert.match(printCss, /\.firmas/);
  });
});

describe('Fechas de documentos en hora local', () => {
  it('cotización y cuenta de cobro no usan toISOString para la fecha visible', () => {
    const cot = fs.readFileSync(path.join(root, 'js/arpa-cotizacion.js'), 'utf8');
    const cc = fs.readFileSync(path.join(root, 'js/arpa-cuenta-cobro.js'), 'utf8');
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.doesNotMatch(cot, /toISOString/);
    assert.doesNotMatch(cc, /toISOString/);
    assert.doesNotMatch(html, /toISOString\(\)\.slice\(0,\s*10\)/);
    assert.doesNotMatch(html, /toISOString\(\)\.split\('T'\)/);
  });
});
