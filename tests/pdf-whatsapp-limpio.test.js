// PDF que se comparte por WhatsApp: igual al de "Guardar como PDF", sin avisos ni controles de la app,
// y sin partir bloques entre hojas (6-nov-2026, formato real de IECM de Colombia e Ingealianza).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

function loadCaptura() {
  const sb = { window: null, console };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read('js/arpa-pdf-captura.js'), sb, { filename: 'arpa-pdf-captura.js' });
  return sb.ArpaPdfCaptura;
}

function printCss(html) {
  const out = [];
  let from = 0;
  for (;;) {
    const start = html.indexOf('@media print', from);
    if (start < 0) break;
    let i = html.indexOf('{', start) + 1;
    let depth = 1;
    while (i < html.length && depth > 0) {
      if (html[i] === '{') depth += 1;
      else if (html[i] === '}') depth -= 1;
      i += 1;
    }
    out.push(html.slice(start, i));
    from = i;
  }
  return out.join('\n');
}

test('cortes de hoja: ningún bloque (fila, firmas, foto, resumen) queda partido', () => {
  const C = loadCaptura();
  const pageH = 1000;
  const blocks = [
    { name: 'encabezado', top: 0, bottom: 300 },
    { name: 'fila-1', top: 300, bottom: 620 },
    { name: 'fila-2', top: 620, bottom: 940 },
    { name: 'firmas', top: 940, bottom: 1260 }, // cruza el borde de la hoja 1
    { name: 'titulo-resumen', top: 1260, bottom: 1700, title: true },
    { name: 'foto', top: 1700, bottom: 2150 }, // cruza el borde de la hoja 2
    { name: 'pie', top: 2150, bottom: 2300 }
  ];
  const starts = C.computePageStarts(blocks, pageH, 2300);
  assert.deepEqual(Array.from(starts), [0, 940, 1700]);
  starts.slice(1).forEach((cut) => {
    blocks.forEach((b) => {
      assert.ok(!(cut > b.top + 1 && cut < b.bottom - 1), `el corte ${cut} parte ${b.name}`);
    });
  });
  // Cada hoja mide como máximo una hoja.
  const ends = Array.from(starts).slice(1).concat(2300);
  Array.from(starts).forEach((s, i) => assert.ok(ends[i] - s <= pageH));
});

test('cortes de hoja: bloques uno al lado del otro y uno más alto que la hoja', () => {
  const C = loadCaptura();
  const starts = C.computePageStarts([
    { name: 'firma-cliente', top: 800, bottom: 1100 },
    { name: 'firma-tecnico', top: 820, bottom: 1080 },
    { name: 'gigante', top: 1100, bottom: 2600 } // más alto que una hoja: se puede cortar
  ], 1000, 2600);
  assert.equal(starts[1], 800, 'las dos firmas pasan juntas a la hoja siguiente');
  assert.ok(starts.length >= 3);
});

test('se activan las reglas @media print de la página (y no @page) para la captura', () => {
  const C = loadCaptura();
  const media = (text, rules) => ({ type: 4, media: { mediaText: text }, cssRules: rules });
  const rule = (css) => ({ type: 1, cssText: css });
  const doc = {
    styleSheets: [
      { media: { mediaText: '' }, cssRules: [
        rule('.a { color: red; }'),
        media('print', [rule('button { display: none !important; }'), { type: 6, cssText: '@page { margin: 1cm; }' }]),
        media('(max-width: 520px)', [media('print', [rule('.b { display: none; }')])]),
        media('screen', [rule('.c { color: blue; }')])
      ] },
      { get cssRules() { throw new Error('cross-origin'); }, media: { mediaText: '' } }
    ]
  };
  const css = C.collectPrintCss(doc);
  assert.match(css, /button \{ display: none !important; \}/);
  assert.match(css, /@media \(max-width: 520px\) \{\s*\.b \{ display: none; \}/);
  assert.doesNotMatch(css, /@page/);
  assert.doesNotMatch(css, /\.a \{|\.c \{/);
});

test('la captura oculta pastilla de estado, botones, avisos, placeholders y la sección bancaria vacía', () => {
  const css = loadCaptura().CAPTURE_CSS;
  ['button', '#validation-badge', '[id^="sync-status-"]', '#arpa-demo-banner', '.btn-firma-clear',
    '.print-hide-empty', '::placeholder', '.no-print'].forEach((sel) => {
    assert.ok(css.includes(sel), 'falta ocultar ' + sel);
  });
  assert.match(css, /font-kerning:none/, 'evita palabras pegadas al capturar');
});

test('impresión ("Guardar como PDF"): sin Modo Demo, pastillas, idioma ni columna de acciones; títulos con su bloque', () => {
  const css = printCss(read('index.html'));
  ['#arpa-demo-banner', '#arpa-install-banner', '#validation-badge', '[id^="sync-status-"]', '.lang-switch',
    '.btn-firma-clear', 'button { display: none !important; }', '#pdf-actions-cot', '.trial-days-banner'].forEach((s) => {
    assert.ok(css.includes(s), 'impresión no oculta ' + s);
  });
  assert.match(css, /colgroup col:last-child[^{]*\{[^}]*width: 0/, 'encabezado azul del ancho de la tabla');
  assert.match(css, /\.section-title \{[^}]*break-after: avoid/);
  assert.match(css, /\.cot-cierre-block > \.section:first-child \{[^}]*break-inside: avoid/, 'RESUMEN junto a sus totales');
  assert.match(css, /print-hide-empty/, 'Datos bancarios vacíos no se imprimen');
});

test('WhatsApp usa los mismos pasos y estilos que "Guardar como PDF" (formato y cotización)', () => {
  const html = read('index.html');
  const wa = read('js/arpa-whatsapp.js');
  const cot = read('js/arpa-cotizacion.js');
  assert.ok(html.includes('<script src="./js/arpa-pdf-captura.js"></script>'));
  assert.ok(html.indexOf('arpa-pdf-captura.js') < html.indexOf('arpa-whatsapp.js'));
  // Formato: guardarPDF y WhatsApp comparten prepararFormatoParaPdf.
  const g = html.slice(html.indexOf('function guardarPDF()'), html.indexOf('function forzarSaltoSiSeCorta()'));
  assert.match(g, /prepararFormatoParaPdf\(\)/);
  const fw = wa.slice(wa.indexOf('async function generarFormatoPdfFile'), wa.indexOf('async function compartirFormatoWhatsApp'));
  assert.match(fw, /prepararFormatoParaPdf\(\)/);
  assert.match(fw, /ArpaPdfCaptura\.capturarPdf/);
  assert.match(fw, /prep\.restore\(\)/);
  assert.doesNotMatch(fw, /html2canvas\(/, 'ya no captura la pantalla tal cual');
  // Cotización: mismos pasos que imprimir (beginCotPdfExport) y la misma captura.
  const fc = cot.slice(cot.indexOf('async function generarCotPdfFile'), cot.indexOf('async function guardarCotPDF'));
  assert.match(fc, /beginCotPdfExport\(\)/);
  assert.match(fc, /ArpaPdfCaptura\.capturarPdf/);
  assert.match(fc, /endCotPdfExport\(ctx\)/);
  // Cuenta de cobro: compartir y "Generar PDF" usan el mismo documento (jsPDF), sin banco vacío.
  const cc = read('js/arpa-cuenta-cobro.js');
  const env = cc.slice(cc.indexOf('async function enviarWhatsApp'), cc.indexOf('function loadImageDataUrl'));
  assert.match(env, /renderCcToPdf\(d, jsPDF\)/);
  assert.match(cc, /if \(d\.pago\.bankName \|\| d\.pago\.accountNumber\)/);
});

test('la captura arma hoja Carta con el ancho de impresión', () => {
  const C = loadCaptura();
  assert.equal(C.LETTER.widthMm, 215.9);
  assert.equal(C.LETTER.heightMm, 279.4);
  assert.equal(C.PRINT_WIDTH_PX, 725);
  assert.match(read('js/arpa-pdf-captura.js'), /format: 'letter'/);
});
