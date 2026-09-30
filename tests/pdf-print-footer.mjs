/**
 * Genera PDFs Letter con Chromium (media print + is-printing) y rasteriza cada página.
 * Prioridad: pie en flujo normal. La ruta WhatsApp/html2canvas queda para otro PR.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'pdf-test-out');
const PORT = 8768;
const BASE = `http://127.0.0.1:${PORT}`;

const LONG_DESC =
  'Motor corredizo 1500 kg para portón residencial de 6 metros con riel de aluminio, fin de carrera y dos controles. Incluye configuración de fuerza y prueba en sitio.';

const SETTINGS = {
  companyName: 'Puertas del Norte SAS',
  nit: '900.111.222-3',
  address: 'Cra 50 #12-34',
  city: 'Bogotá',
  phone: '3001234567',
  website: 'https://puertasdelnorte.example',
  country: 'CO',
  bankName: 'Bancolombia',
  accountType: 'Ahorros',
  accountNumber: '123-456-789',
  accountHolder: 'Puertas del Norte SAS',
  accountHolderDocument: '900.111.222-3',
  technicianName: 'Carlos Ruiz',
  technicianDocument: '10101010',
  technicianCode: '',
  activeOficios: ['automatismos']
};

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.map': 'application/json'
  }[ext] || 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const file = path.normalize(path.join(ROOT, urlPath.replace(/^[/\\]+/, '')));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': mime(file) });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

function countNeedle(text, needle) {
  if (!needle) return 0;
  return text.split(needle).length - 1;
}

function compactText(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9ÁÉÍÓÚÑ]/gi, '');
}

function hasCompact(hay, needle) {
  return compactText(hay).includes(compactText(needle));
}

function analyzePdfText(allText, labels) {
  const compacted = compactText(allText);
  const footerHits = countNeedle(compacted, compactText('Generado con ARPA Suite'))
    || countNeedle(compacted, compactText('ARPA Technology Global'));
  const missing = [];
  labels.forEach((t) => {
    if (!hasCompact(allText, t)) missing.push(t);
  });
  if (footerHits !== 1) missing.push(`pie x${footerHits} (se espera 1)`);
  return { footerHits, missing };
}

function productCatalog(count) {
  const filas = [];
  for (let i = 1; i <= count; i += 1) {
    const long = i === 2 || i === 4 || i === count;
    filas.push({
      cod: `P-${String(i).padStart(2, '0')}`,
      nom: long
        ? `PROD-${String(i).padStart(2, '0')} ${LONG_DESC}`
        : `PROD-${String(i).padStart(2, '0')} Kit de riel corto`,
      pvp: 150000 + i * 10000,
      cant: i % 3 === 0 ? 2 : 1,
      tipo: 'producto'
    });
  }
  return filas;
}

async function unlockApp(page) {
  await page.evaluate(() => {
    document.documentElement.classList.add('license-ok');
    document.documentElement.classList.remove('license-checking');
    const gate = document.getElementById('license-gate');
    if (gate) {
      gate.style.setProperty('display', 'none', 'important');
      gate.setAttribute('hidden', '');
    }
  });
  await page.waitForFunction(() => typeof window.ArpaCotizacion?.loadCotizacion === 'function', null, { timeout: 20000 });
}

async function drawInk(page, canvasId) {
  await page.evaluate((id) => {
    const canvas = document.getElementById(id);
    if (!canvas) throw new Error('no canvas ' + id);
    window.ArpaSignature?.initCanvas?.(id);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f2044';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 80);
    ctx.lineTo(220, 40);
    ctx.lineTo(360, 110);
    ctx.stroke();
  }, canvasId);
}

async function assertPrintLayout(page, { view, rowSelector, extraSelectors, labels }) {
  const report = await page.evaluate(({ rowSelector, extraSelectors, labels }) => {
    const footer = document.getElementById('suite-footer');
    const cs = footer ? getComputedStyle(footer) : null;
    const footerBox = footer ? {
      left: footer.getBoundingClientRect().left,
      right: footer.getBoundingClientRect().right,
      top: footer.getBoundingClientRect().top,
      bottom: footer.getBoundingClientRect().bottom
    } : null;
    const overlaps = [];
    const check = (el, name) => {
      if (!el || !footerBox) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const hit = r.left < footerBox.right && r.right > footerBox.left && r.top < footerBox.bottom && r.bottom > footerBox.top;
      if (hit) overlaps.push({ name, top: r.top, bottom: r.bottom, footerTop: footerBox.top });
    };
    document.querySelectorAll(rowSelector).forEach((el, i) => check(el, 'row-' + i));
    extraSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => check(el, sel));
    });
    const pageText = (document.querySelector('.page')?.innerText || document.body.textContent || '').toUpperCase();
    const missing = labels.filter((t) => !pageText.includes(String(t).toUpperCase()));
    const rowCount = document.querySelectorAll(rowSelector).length;
    return {
      footerPosition: cs ? cs.position : 'missing',
      footerTop: footerBox && footerBox.top,
      overlaps,
      missing,
      rowCount,
      sample: (document.querySelector('.page')?.innerText || '').slice(0, 240),
      footerOnce: (pageText.split('GENERADO CON ARPA SUITE').length - 1)
    };
  }, { rowSelector, extraSelectors, labels });

  if (report.footerPosition !== 'static' && report.footerPosition !== 'relative') {
    throw new Error(`[${view}] pie position=${report.footerPosition}, se esperaba static`);
  }
  if (report.overlaps.length) {
    throw new Error(`[${view}] superposición con el pie: ${JSON.stringify(report.overlaps, null, 2)}`);
  }
  if (report.missing.length) {
    throw new Error(`[${view}] faltan textos en el layout: ${report.missing.join(', ')} | rows=${report.rowCount} | sample=${JSON.stringify(report.sample)}`);
  }
  return report;
}

async function extractPdfTextAndPngs(page, pdfBuffer, stem) {
  const pdfjsPath = '/node_modules/pdfjs-dist/build/pdf.mjs';
  const workerPath = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
  await page.goto(`${BASE}/tests/pdf-raster.html`, { waitUntil: 'domcontentloaded' });
  const b64 = pdfBuffer.toString('base64');
  const meta = await page.evaluate(async ({ b64, pdfjsPath, workerPath }) => {
    const pdfjs = await import(pdfjsPath);
    pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    window.__pdfDoc = doc;
    window.__pdfjs = pdfjs;
    const texts = [];
    for (let i = 1; i <= doc.numPages; i += 1) {
      const p = await doc.getPage(i);
      const content = await p.getTextContent();
      texts.push(content.items.map((it) => it.str).join(' '));
    }
    return { pages: doc.numPages, texts };
  }, { b64, pdfjsPath, workerPath });

  for (let i = 1; i <= meta.pages; i += 1) {
    const size = await page.evaluate(async (n) => {
      const p = await window.__pdfDoc.getPage(n);
      const viewport = p.getViewport({ scale: 2 });
      const canvas = document.getElementById('c');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await p.render({ canvasContext: ctx, viewport }).promise;
      return { w: canvas.width, h: canvas.height };
    }, i);
    await page.setViewportSize({
      width: Math.max(400, Math.ceil(size.w)),
      height: Math.max(400, Math.ceil(size.h))
    });
    const file = path.join(OUT, `${stem}-p${String(i).padStart(2, '0')}.png`);
    await page.locator('#c').screenshot({ path: file, type: 'png' });
  }
  return meta;
}

async function makePdf(page) {
  await page.emulateMedia({ media: 'print' });
  return page.pdf({
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: true
  });
}

async function fillCotizacion(page, productCount) {
  const filas = productCatalog(productCount);
  const names = filas.map((_, i) => `PROD-${String(i + 1).padStart(2, '0')}`);
  await page.evaluate(({ filas, settings }) => {
    window.openCotizacionView();
    window.ArpaCotizacion.loadCotizacion({
      numero: 'AP-TEST-' + filas.length,
      cliente: 'Cliente PDF Test',
      ciudad: 'Bogotá',
      fecha: '2026-09-30',
      nit: '900.111.222-3',
      tel: '3001234567',
      email: 'cliente@test.com',
      filas,
      cobros: [{ desc: 'Instalación', nom: 'Instalación', value: 180000, pvp: 180000, userEdited: true }]
    });
    const obs = document.getElementById('cot-obs');
    if (obs) obs.value = 'Observación de prueba: revisar riel y fin de carrera en sitio.';
    const elab = document.getElementById('cot-elaborado-nombre');
    if (elab) elab.value = settings.technicianName;
    const tel = document.getElementById('cot-elaborado-tel');
    if (tel) tel.value = settings.phone;
    const firmaCliente = document.querySelector('#view-cotizacion .firma-name');
    if (firmaCliente) firmaCliente.value = 'Cliente PDF Test';
    window.applyUserSettingsToUI?.();
    window.ArpaCotizacion.renderTablaCot();
  }, { filas, settings: SETTINGS });
  await drawInk(page, 'canvas-cot-cliente');
  await drawInk(page, 'canvas-cot-elaborado');
  return names;
}

async function printCotizacion(page) {
  await page.evaluate(() => {
    window.print = () => {};
    window.guardarCotPDF();
  });
  await page.waitForFunction(() => document.body.classList.contains('is-printing'));
}

async function fillCuentaCobro(page) {
  const items = [
    { desc: 'CC-01 Mantenimiento preventivo', cant: 1, unit: 120000 },
    { desc: 'CC-02 Revisión de motor y riel', cant: 1, unit: 90000 },
    { desc: 'CC-03 Cambio de controles', cant: 2, unit: 45000 },
    { desc: 'CC-04 Instalación de fotoceldas', cant: 1, unit: 160000 },
    { desc: `CC-05 ${LONG_DESC}`, cant: 1, unit: 250000 },
    { desc: 'CC-06 Ajuste de fin de carrera', cant: 1, unit: 70000 }
  ];
  await page.evaluate((items) => {
    window.openCuentaCobroView();
    const add = document.getElementById('btn-cc-add-servicio');
    while (document.querySelectorAll('#cc-servicios-body tr').length < items.length) {
      add.click();
    }
    const rows = document.querySelectorAll('#cc-servicios-body tr');
    items.forEach((item, i) => {
      const tr = rows[i];
      const desc = tr.querySelector('.cc-svc-desc');
      const cant = tr.querySelector('.cc-svc-cant');
      const unit = tr.querySelector('.cc-svc-unit');
      desc.value = item.desc;
      cant.value = String(item.cant);
      unit.value = String(item.unit);
      desc.dispatchEvent(new Event('input', { bubbles: true }));
      cant.dispatchEvent(new Event('input', { bubbles: true }));
      unit.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('cc-numero', 'CC-TEST-6');
    set('cc-ciudad', 'Bogotá');
    set('cc-cliente-nombre', 'Cliente Cuenta Cobro');
    set('cc-cliente-doc', '900.111.222-3');
    set('cc-obs', 'Observación CC: pago contra entrega.');
    window.ArpaCuentaCobro?.recalcularTotales?.();
  }, items);
  await drawInk(page, 'canvas-cc-cobrador');
  await drawInk(page, 'canvas-cc-cliente');
  return items.map((x) => x.desc.slice(0, 8));
}

async function printCuentaCobro(page) {
  await page.evaluate(() => {
    const cc = document.getElementById('view-cuenta-cobro');
    cc?.removeAttribute('hidden');
    document.body.classList.add('is-printing', 'is-printing-cc');
    window.ArpaBrand?.prepareForPrint?.();
    window.ArpaI18n?.preparePdfSpanish?.('view-cuenta-cobro');
    const root = document.getElementById('view-cuenta-cobro');
    const elementos = root.querySelectorAll('input:not([type=file]):not([type=checkbox]), select, textarea');
    elementos.forEach((el) => {
      const valor = el.tagName === 'SELECT'
        ? el.options[el.selectedIndex]?.text || ''
        : el.value || '';
      const span = document.createElement('span');
      span.className = 'pdf-valor';
      span.textContent = valor;
      span.style.cssText = 'display:inline-block;width:100%;font-size:13px;padding:4px;';
      el.parentNode.replaceChild(span, el);
    });
    window.ArpaSignature?.prepareForPrint?.(['canvas-cc-cobrador', 'canvas-cc-cliente']);
  });
}

async function fillFormato(page) {
  await page.evaluate(() => {
    window.scrollToTopMenu();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('formato-cliente-nombre', 'Cliente Formato Completo');
    set('formato-cliente-nit', '900.111.222-3');
    set('formato-cliente-tel', '3001234567');
    set('formato-cliente-direccion', 'Cra 7 # 12-34 Conjunto Alameda');
    set('formato-cliente-ciudad', 'Bogotá');
    set('formato-fecha', '2026-09-30');
    set('campo-tecnico-responsable', 'Carlos Ruiz');
    document.getElementById('c1').checked = true;
    document.querySelectorAll('#formato-medidas-section input').forEach((el, i) => {
      el.value = i < 4 ? '3.20' : (i === 4 ? '280' : 'Hierro');
    });
    const marca = document.getElementById('sel-marca');
    if (marca && marca.options.length > 1) marca.selectedIndex = 1;
    document.querySelectorAll('#formato-section-observaciones input').forEach((el, i) => {
      el.value = `Obs formato ${i + 1}: riel alineado y lubricado.`;
    });
    set('campo-tecnico-firma', 'Carlos Ruiz');
  });
  await drawInk(page, 'canvas-firma-cliente');
  await drawInk(page, 'canvas-firma-tecnico');
}

async function printFormato(page) {
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.evaluate(() => window.guardarPDF());
  await page.waitForFunction(() => document.body.classList.contains('is-printing-formato'), null, { timeout: 10000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
}

async function run() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const failures = [];

  const context = await browser.newContext({
    viewport: { width: 1280, height: 1600 }
  });
  await context.addInitScript((settings) => {
    try {
      localStorage.setItem('arpa_suite_license_code', 'ARPA-PRO-PDFTEST');
      localStorage.setItem('arpa_suite_license_plan', 'PRO');
      localStorage.setItem('arpa_suite_license_vencimiento', '2099-12-31');
      localStorage.setItem('arpa_suite_had_paid_license', '1');
      localStorage.setItem('arpa_suite_settings_configured', 'true');
      localStorage.setItem('arpa_suite_user_settings', JSON.stringify(settings));
      localStorage.setItem('arpa_onboarding', 'true');
      localStorage.setItem('arpa_trial_captured', 'true');
      localStorage.setItem('arpa_active_oficios', JSON.stringify(['automatismos']));
    } catch (e) { /* ignore */ }
    document.documentElement.classList.add('license-ok');
    const keepUnlocked = () => document.documentElement.classList.add('license-ok');
    keepUnlocked();
    document.addEventListener('DOMContentLoaded', () => {
      keepUnlocked();
      const style = document.createElement('style');
      style.textContent = '#license-gate,#onboarding-gate,#trial-capture-gate{display:none!important}html .page,html .main-menu,html .settings-overlay{visibility:visible!important}html.onboarding-active .page{visibility:visible!important}';
      document.head.appendChild(style);
    });
    setInterval(keepUnlocked, 250);
  }, SETTINGS);
  await context.route('**/*script.google.com/**', (route) => route.abort());
  await context.route('**/service-worker.js', (route) => route.abort());

  const rasterPage = await context.newPage();
  const work = await context.newPage();
  work.on('dialog', (d) => d.dismiss());

  async function loadApp() {
    await work.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await unlockApp(work);
  }

  try {
    const counts = [1, 2, 3, 4, 5, 6, 8, 12];
    for (const n of counts) {
      await loadApp();
      const stem = `cot-${n}`;
      const names = await fillCotizacion(work, n);
      await printCotizacion(work);
      const layout = await assertPrintLayout(work, {
        view: stem,
        rowSelector: '#view-cotizacion .tabla-productos tbody tr:not(.empty-row)',
        extraSelectors: [
          '#view-cotizacion .totales-box',
          '#view-cotizacion .cot-bank-section',
          '#view-cotizacion .section:has(#cot-obs)',
          '#view-cotizacion .nota-cot',
          '#view-cotizacion .cot-cierre-block',
          '#view-cotizacion .firmas'
        ],
        labels: ['Subtotal', 'TOTAL', 'Datos Bancarios', 'Observaciones', 'Nota', 'Instalación', ...names]
      });
      const pdf = await makePdf(work);
      fs.writeFileSync(path.join(OUT, `${stem}.pdf`), pdf);
      const meta = await extractPdfTextAndPngs(rasterPage, pdf, stem);
      const allText = meta.texts.join('\n');
      fs.writeFileSync(path.join(OUT, `${stem}-text.txt`), allText);
      const checked = analyzePdfText(allText, ['Subtotal', 'TOTAL', 'Datos Bancarios', 'Observaciones', 'Nota', 'Instalación', ...names]);
      const missing = checked.missing;
      const footerHits = checked.footerHits;
      const ok = missing.length === 0;
      results.push({
        doc: stem,
        pages: meta.pages,
        footerHits,
        layoutOverlaps: layout.overlaps.length,
        missing,
        ok
      });
      if (!ok) failures.push(`${stem}: ${missing.join(', ')}`);
      await work.evaluate(() => {
        document.body.classList.remove('is-printing', 'is-printing-formato', 'is-printing-cc');
        window.ArpaBrand?.restoreAfterPrint?.();
        window.ArpaSignature?.restoreAfterPrint?.();
      });
    }

    {
      await loadApp();
      const stem = 'cc-6';
      const names = await fillCuentaCobro(work);
      await printCuentaCobro(work);
      const layout = await assertPrintLayout(work, {
        view: stem,
        rowSelector: '#view-cuenta-cobro .tabla-productos tbody tr',
        extraSelectors: [
          '#view-cuenta-cobro .totales-box',
          '#view-cuenta-cobro .firmas'
        ],
        labels: ['CC-01', 'CC-06', 'TOTAL']
      });
      const pdf = await makePdf(work);
      fs.writeFileSync(path.join(OUT, `${stem}.pdf`), pdf);
      const meta = await extractPdfTextAndPngs(rasterPage, pdf, stem);
      const allText = meta.texts.join('\n');
      fs.writeFileSync(path.join(OUT, `${stem}-text.txt`), allText);
      const checked = analyzePdfText(allText, names.concat(['TOTAL']));
      const missing = checked.missing;
      const footerHits = checked.footerHits;
      const ok = missing.length === 0 && layout.overlaps.length === 0;
      results.push({
        doc: stem,
        pages: meta.pages,
        footerHits,
        layoutOverlaps: layout.overlaps.length,
        missing,
        ok
      });
      if (!ok) failures.push(`${stem}: ${missing.join(', ') || 'overlap'}`);
      await work.evaluate(() => {
        document.body.classList.remove('is-printing', 'is-printing-formato', 'is-printing-cc');
        window.ArpaBrand?.restoreAfterPrint?.();
        window.ArpaSignature?.restoreAfterPrint?.();
      });
    }

    {
      await loadApp();
      const stem = 'formato-completo';
      await fillFormato(work);
      await printFormato(work);
      const layout = await assertPrintLayout(work, {
        view: stem,
        rowSelector: '#view-formato .dims-table tbody tr, #view-formato .dims-extra tbody tr',
        extraSelectors: [
          '#view-formato #formato-section-observaciones',
          '#view-formato .nota',
          '#view-formato .firmas'
        ],
        labels: ['Cliente Formato Completo', 'Observaciones', 'Nota']
      });
      const pdf = await makePdf(work);
      fs.writeFileSync(path.join(OUT, `${stem}.pdf`), pdf);
      const meta = await extractPdfTextAndPngs(rasterPage, pdf, stem);
      const allText = meta.texts.join('\n');
      fs.writeFileSync(path.join(OUT, `${stem}-text.txt`), allText);
      const checked = analyzePdfText(allText, ['Cliente Formato Completo', 'Observaciones', 'Nota']);
      const missing = checked.missing;
      const footerHits = checked.footerHits;
      const ok = missing.length === 0 && layout.overlaps.length === 0;
      results.push({
        doc: stem,
        pages: meta.pages,
        footerHits,
        layoutOverlaps: layout.overlaps.length,
        missing,
        ok
      });
      if (!ok) failures.push(`${stem}: ${missing.join(', ') || 'overlap'}`);
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  const summary = { ok: failures.length === 0, failures, results };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(summary, null, 2));
  const lines = [
    'Resultado pruebas PDF (Letter + media print + is-printing)',
    summary.ok ? 'OK: ningún contenido quedó bajo el pie; el texto del pie aparece una vez.' : 'FALLÓ: ' + failures.join(' | '),
    ...results.map((r) => `${r.doc}: páginas=${r.pages} pie=${r.footerHits} overlaps=${r.layoutOverlaps} ${r.ok ? 'OK' : 'FAIL ' + r.missing.join(',')}`)
  ];
  fs.writeFileSync(path.join(OUT, 'RESULTADO.txt'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  if (failures.length) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
