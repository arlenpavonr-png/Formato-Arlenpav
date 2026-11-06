/**
 * Prueba en navegador (sin servidores reales) del PDF que se comparte por WhatsApp y del de imprimir.
 * Datos de ejemplo de una empresa, Modo Demo y pastilla de sincronización visibles a propósito.
 *
 *   npm run test:pdf-whatsapp
 *   PDF_MOBILE=1 npm run test:pdf-whatsapp          (celular 412 px)
 *   LOGO=ruta.jpg OUT_PDF=ruta.pdf npm run test:pdf-whatsapp   (guarda el PDF del formato de ejemplo)
 *
 * Comprueba en el PDF compartido (formato y cotización): sin pastilla "Arpa Suite · Listo", sin botones
 * ("Borrar"), sin aviso de datos bancarios vacíos, sin placeholders, sin franja de Modo Demo, sin cortar
 * bloques (firmas, filas, fotos) entre hojas. En el PDF de imprimir de la cotización: sin Modo Demo ni
 * pastilla bajo el N°, encabezado azul del ancho de la tabla y "Resumen" en la misma hoja que sus totales.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MOBILE = process.env.PDF_MOBILE === '1';
const OUT = path.join(ROOT, MOBILE ? 'pdf-test-out-wa-mobile' : 'pdf-test-out-wa');
const PORT = 8769;
const BASE = `http://127.0.0.1:${PORT}`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.normalize(path.join(ROOT, u.replace(/^[/\\]+/, '')));
  if (!f.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const logoFile = process.env.LOGO && fs.existsSync(process.env.LOGO) ? process.env.LOGO : path.join(ROOT, 'icon-192x192.png');
const logoMime = /\.jpe?g$/i.test(logoFile) ? 'image/jpeg' : 'image/png';
const SETTINGS = {
  companyName: 'IECM de Colombia', nit: '901733861', address: 'KR 72 # 102-56', city: 'Bogotá',
  phone: '+57 601 527 0881', website: 'https://iecmcolombia.com/', country: 'CO', currency: 'COP',
  // Sin datos bancarios a propósito: la sección no debe salir en el PDF.
  bankName: '', accountType: 'Ahorros', accountNumber: '', accountHolder: '', accountHolderDocument: '',
  technicianName: 'Iván Martínez', technicianDocument: '', technicianCode: '',
  activeOficios: ['automatismos'], logoBase64: `data:${logoMime};base64,` + fs.readFileSync(logoFile).toString('base64'),
  appBrandName: '', appLogoBase64: '', warrantyTerms: '', clientRequirements: ''
};

const browser = await chromium.launch(process.env.PW_CHROMIUM
  ? { headless: true, executablePath: process.env.PW_CHROMIUM }
  : { headless: true });
const context = await browser.newContext(MOBILE
  ? { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, timezoneId: 'America/Bogota', locale: 'es-CO' }
  : { viewport: { width: 1280, height: 1600 }, timezoneId: 'America/Bogota', locale: 'es-CO' });
await context.addInitScript((settings) => {
  try {
    if (!localStorage.getItem('__pdfwa_init')) {
      localStorage.setItem('__pdfwa_init', '1');
      localStorage.setItem('arpa_suite_license_code', 'ARPA-PRO-PDFTEST');
      localStorage.setItem('arpa_suite_license_plan', 'PRO');
      localStorage.setItem('arpa_suite_license_vencimiento', '2099-12-31');
      localStorage.setItem('arpa_suite_had_paid_license', '1');
      localStorage.setItem('arpa_suite_settings_configured', 'true');
      localStorage.setItem('arpa_suite_user_settings', JSON.stringify(settings));
      localStorage.setItem('arpa_onboarding', 'true');
      localStorage.setItem('arpa_trial_captured', 'true');
      localStorage.setItem('arpa_active_oficios', JSON.stringify(['automatismos']));
      localStorage.setItem('arpa_suite_lang', 'es');
    }
  } catch (e) { /* ignore */ }
  const keep = () => document.documentElement.classList.add('license-ok');
  keep();
  document.addEventListener('DOMContentLoaded', () => {
    keep();
    const st = document.createElement('style');
    st.textContent = '#license-gate,#onboarding-gate,#trial-capture-gate{display:none!important}html .page,html .main-menu,html .settings-overlay{visibility:visible!important}html.onboarding-active .page{visibility:visible!important}';
    document.head.appendChild(st);
  });
  setInterval(keep, 250);
}, SETTINGS);
// Ningún servidor real: licencias/hoja, analítica, service worker y WhatsApp bloqueados.
await context.route(/script\.google\.com|googletagmanager|google-analytics|service-worker\.js|wa\.me|gumroad/, (route) => route.abort());

const page = await context.newPage();
page.on('dialog', (d) => d.dismiss());
const failures = [];
const fail = (msg) => { failures.push(msg); console.log('  ✖ ' + msg); };

async function load() {
  await page.emulateMedia({ media: 'screen' });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    document.documentElement.classList.add('license-ok');
    document.documentElement.classList.remove('license-checking');
    const g = document.getElementById('license-gate');
    if (g) { g.style.setProperty('display', 'none', 'important'); g.hidden = true; }
  });
  await page.waitForFunction(() => typeof window.ArpaCotizacion?.loadCotizacion === 'function' && typeof window.guardarPDF === 'function', null, { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => { window.applyUserSettingsToUI?.(); });
}

async function showAppNotices(numId) {
  // Lo que Arlen vio en sus PDF: Modo Demo, pastilla "Arpa Suite · Listo" y pastilla verde bajo el N°.
  await page.evaluate((numId) => {
    const b = document.getElementById('arpa-demo-banner');
    if (b) b.style.display = 'flex';
    const t = document.getElementById('validation-text');
    if (t) t.textContent = 'Arpa Suite · Listo';
    const s = document.getElementById(numId);
    if (s) { s.style.display = 'inline-block'; s.textContent = '☁️ PDFTEST'; s.style.background = 'rgba(76,175,128,0.15)'; }
  }, numId);
}

async function drawInk(id) {
  await page.evaluate((id) => {
    const c = document.getElementById(id);
    window.ArpaSignature?.initCanvas?.(id);
    const ctx = c.getContext('2d');
    ctx.strokeStyle = '#0f2044'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(40, 110); ctx.bezierCurveTo(100, 30, 150, 160, 220, 70); ctx.lineTo(420, 100); ctx.stroke();
  }, id);
}

async function sharePdf(expr, name) {
  const b64 = await page.evaluate(async (expr) => {
    const fn = expr.split('.').reduce((o, k) => o && o[k], window);
    const file = await fn();
    if (!file) return null;
    const buf = new Uint8Array(await file.arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 1) s += String.fromCharCode(buf[i]);
    return btoa(s);
  }, expr);
  if (!b64) { fail(name + ': no se generó el PDF'); return null; }
  const file = path.join(OUT, name);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  return file;
}

function checkShared(doc, debug, extraText) {
  if (!debug) { fail(doc + ': sin datos de la captura'); return; }
  const h = debug.hidden || {};
  if (h.badge !== true) fail(doc + ': sale la pastilla de estado de la app');
  if (h.buttons !== 0) fail(doc + `: salen ${h.buttons} botones`);
  if (h.demoBanner !== true) fail(doc + ': sale la franja de Modo Demo');
  if ((h.placeholders || []).length) fail(doc + ': salen textos de ayuda vacíos: ' + h.placeholders.join(', '));
  const text = String(debug.text || '');
  ['Listo', 'Borrar', 'Complete banco', 'Configure banco', 'MODO DEMO', 'PDFTEST', 'Datos bancarios', 'Restaurar mi empresa', 'Enviar por WhatsApp', 'Guardar como PDF']
    .forEach((n) => { if (text.toLowerCase().includes(n.toLowerCase())) fail(doc + ': sale "' + n + '"'); });
  (extraText || []).forEach((n) => { if (!text.toLowerCase().includes(n.toLowerCase())) fail(doc + ': falta "' + n + '"'); });
  if (Math.abs(debug.pageWidthMm - 215.9) > 0.8 || Math.abs(debug.pageHeightMm - 279.4) > 0.8) fail(doc + ': no es hoja Carta');
  const eps = 2.5;
  debug.starts.slice(1).forEach((cut) => {
    debug.ranges.forEach((r) => {
      if (r.bottom - r.top <= debug.pageCanvasH + eps && cut > r.top + eps && cut < r.bottom - eps) fail(doc + `: la hoja corta "${r.name}"`);
    });
  });
  if (!debug.ranges.some((r) => /firma/i.test(r.name))) fail(doc + ': no se midió el bloque de firmas');
  console.log(`  ${doc}: ${debug.starts.length} hojas, ${debug.ranges.length} bloques revisados`);
}

async function pdfPagesText(file) {
  const pdfjs = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), disableFontFace: true }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push(c.items.map((it) => it.str).join(' '));
  }
  return pages;
}

try {
  // ── Formato de Servicio (instalación) ──
  console.log('Formato de Servicio');
  await load();
  await page.evaluate(() => {
    window.scrollToTopMenu?.();
    const set = (id, v) => { const el = document.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } };
    set('numero-formato', 'IE-0101');
    const t1 = document.getElementById('t1'); if (t1) { t1.checked = true; t1.dispatchEvent(new Event('change', { bubbles: true })); }
    set('formato-cliente-nombre', 'Muros y Techos SAS');
    set('formato-cliente-direccion', 'Calle 80 # 20-15');
    set('formato-cliente-ciudad', 'Bogotá');
    set('formato-fecha', '2026-11-06');
    set('campo-tecnico-responsable', 'Iván Martínez');
    const c5 = document.getElementById('c5'); if (c5) { c5.checked = true; c5.dispatchEvent(new Event('change', { bubbles: true })); }
    set('formato-medida-ancho', '3.50'); set('formato-medida-alto', '4.20');
    set('formato-serie', 'AP-021-0001'); set('formato-voltaje', '110V');
    set('formato-obs-1', 'Se instaló motor en puerta seccional; se ajustaron finales de carrera.');
    set('formato-firma-cliente-nombre', 'Cliente Muros y Techos');
    set('campo-tecnico-firma', 'Iván Martínez');
    // CC / NIT del cliente e ID del técnico quedan vacíos: su texto de ayuda no debe salir.
  });
  await drawInk('canvas-firma-cliente');
  await drawInk('canvas-firma-tecnico');
  await showAppNotices('sync-status-formato');
  const fFile = await sharePdf('ArpaWhatsApp.generarFormatoPdfFile', 'formato-whatsapp.pdf');
  const fDebug = await page.evaluate(() => window.__arpaPdfCapturaDebug || null);
  checkShared('formato', fDebug, ['IECM de Colombia a través de']);
  const restored = await page.evaluate(() => ({
    printing: document.body.classList.contains('is-printing'),
    inputs: !!document.querySelector('#view-formato input#formato-cliente-nombre')
  }));
  if (restored.printing || !restored.inputs) fail('formato: la pantalla no quedó como estaba después de compartir');
  if (fFile && process.env.OUT_PDF) {
    fs.mkdirSync(path.dirname(process.env.OUT_PDF), { recursive: true });
    fs.copyFileSync(fFile, process.env.OUT_PDF);
    console.log('  copia: ' + process.env.OUT_PDF);
  }

  // ── Cotización (WhatsApp e imprimir) ──
  async function fillCot() {
    await load();
    await page.evaluate(() => { window.openCotizacionView?.(); });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const L = 'PUERTA PEATONAL DESLIZABLE EN VIDRIO TEMPLADO DE 10 MM CON PERFILERIA EN ALUMINIO ANODIZADO, 2 HOJAS MOVILES Y 2 FIJAS, 2,44 MTS DE ALTURA';
      const filas = [];
      for (let i = 1; i <= 9; i += 1) filas.push({ cod: 'IE-' + (100 + i), nom: i % 2 ? L : 'Motor para puerta seccional', pvp: 2450000 + i * 1000, cant: 1, tipo: 'producto' });
      window.ArpaCotizacion.loadCotizacion({ numero: 'IE-COT-209', cliente: 'Ingealianza SAS', ciudad: 'Bogotá', filas });
    });
    await page.waitForTimeout(400);
    await drawInk('canvas-cot-elaborado');
    await showAppNotices('sync-status-cot');
  }

  console.log('Cotización (WhatsApp)');
  await fillCot();
  await sharePdf('ArpaCotizacion.generarCotPdfFile', 'cotizacion-whatsapp.pdf');
  const cDebug = await page.evaluate(() => window.__arpaCotWhatsAppPdf || null);
  checkShared('cotización', cDebug, ['Resumen de Cotización']);
  if (cDebug) {
    // El título "Resumen de Cotización" y sus totales quedan en un solo bloque (no se separan).
    const resumen = cDebug.ranges.find((r) => /\[.*resumen/.test(r.name) && !/^titulo/.test(r.name));
    if (!resumen) fail('cotización: el resumen no quedó como un bloque entero');
  }

  console.log('Cotización (imprimir / Guardar como PDF)');
  await fillCot();
  await page.evaluate(() => { window.print = () => {}; });
  await page.evaluate(() => window.guardarCotPDF());
  await page.waitForFunction(() => document.body.classList.contains('is-printing'), null, { timeout: 15000 });
  await page.emulateMedia({ media: 'print' });
  const printDom = await page.evaluate(() => {
    const shown = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    const table = document.querySelector('#view-cotizacion .tabla-productos');
    const th = table?.querySelector('thead tr')?.getBoundingClientRect();
    const cells = Array.from(table?.querySelectorAll('thead th') || []).filter(shown).map((c) => c.getBoundingClientRect());
    const lastTh = cells.length ? Math.max(...cells.map((r) => r.right)) : 0;
    return {
      demo: shown(document.getElementById('arpa-demo-banner')),
      sync: shown(document.getElementById('sync-status-cot')),
      badge: shown(document.getElementById('validation-badge')),
      lang: shown(document.getElementById('lang-switch')),
      gap: table ? Math.round(table.getBoundingClientRect().right - lastTh) : -1,
      thWidth: th ? Math.round(th.width) : 0
    };
  });
  if (printDom.demo) fail('imprimir: sale la franja de Modo Demo');
  if (printDom.sync) fail('imprimir: sale la pastilla bajo el N°');
  if (printDom.badge || printDom.lang) fail('imprimir: sale la pastilla de estado o el selector de idioma');
  if (printDom.gap > 4) fail(`imprimir: el encabezado azul de la tabla no llega al borde (${printDom.gap}px)`);
  const pdfBuf = await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true });
  const printFile = path.join(OUT, 'cotizacion-imprimir.pdf');
  fs.writeFileSync(printFile, pdfBuf);
  await page.emulateMedia({ media: 'screen' });
  const pages = await pdfPagesText(printFile);
  const norm = (s) => s.toUpperCase().replace(/\s+/g, '');
  const allText = norm(pages.join(' '));
  ['MODODEMO', 'PDFTEST', 'LISTO', 'BORRAR'].forEach((n) => { if (allText.includes(n)) fail('imprimir: sale "' + n + '"'); });
  const pTitle = pages.findIndex((t) => norm(t).includes('RESUMENDECOTIZACI'));
  const pTotal = pages.findIndex((t) => norm(t).includes('SUBTOTAL'));
  if (pTitle < 0 || pTitle !== pTotal) fail(`imprimir: "Resumen de Cotización" (hoja ${pTitle + 1}) separado de sus totales (hoja ${pTotal + 1})`);
  console.log(`  imprimir: ${pages.length} hojas; resumen y totales en la hoja ${pTitle + 1}`);
} finally {
  await browser.close();
  server.close();
}

console.log(failures.length ? `\nFALLAS: ${failures.length}` : '\nOK: PDF compartido e impreso limpios (' + (MOBILE ? 'celular' : 'PC') + ')');
console.log('PDF de prueba en ' + OUT);
process.exit(failures.length ? 1 : 0);
