/**
 * E2E en navegador local: Lista de verificación NTC 5926-3 (diseño "Semáforo") en el Formato de
 * Servicio, SOLO PARA EL DUEÑO (licencia fundador).
 *
 * - Servidor estático propio en 127.0.0.1; se bloquea toda petición a otro host (no toca el
 *   servidor de licencias, la hoja ni la nube) y el service worker.
 * - Parte A (dueño: licencia con founder:true guardado, como lo deja el servidor): llena una
 *   puerta seccional con 2 "No cumple", guarda / recupera el borrador, historial y PDF con la
 *   impresión real de la app (guardarPDF → window.print).
 * - Parte B (cliente: licencia PRO sin founder): no ve la sección, no sale en el PDF y no se
 *   guarda nada, aunque el borrador traiga una lista de antes.
 * - Parte C (dueño con Modo Demo activo): la sección se oculta.
 *
 * Uso: node tests/checklist-ntc-e2e.mjs [ruta-del-pdf] [ruta-captura-celular.png]
 * Requiere Chrome instalado (o CHROME=ruta) y playwright (devDependency del repo).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.NTC_PORT || 8775);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT_PDF = process.argv[2] || path.join(root, 'pdf-test-out', 'checklist-ntc.pdf');
const OUT_SHOT = process.argv[3] || OUT_PDF.replace(/\.pdf$/i, '-celular.png');
const OUT_CLIENT_PDF = OUT_PDF.replace(/\.pdf$/i, '-cliente.pdf');
const chrome = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));

const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

function assert(cond, msg) {
  if (!cond) throw new Error('FALLO: ' + msg);
  console.log('  ok -', msg);
}

const SETTINGS = {
  companyName: 'Automatismos de prueba',
  nit: '900.000.000-0',
  address: 'Calle 1 #2-3',
  city: 'Medellín',
  phone: '3000000000',
  country: 'CO',
  technicianName: 'Técnico de ejemplo',
  activeOficios: ['automatismos'],
};

// Foto de prueba generada en el navegador (sin archivos externos).
const PHOTO_JS = `(() => { const c = document.createElement('canvas'); c.width = 320; c.height = 240;
  const g = c.getContext('2d'); g.fillStyle = '#8a9bb0'; g.fillRect(0, 0, 320, 240);
  g.fillStyle = '#c0392b'; g.fillRect(40, 60, 240, 30); g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif';
  g.fillText('Cable con hilos rotos', 45, 160); return c.toDataURL('image/jpeg', 0.7); })()`;

function mime(file) {
  return {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  }[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const file = path.normalize(path.join(root, urlPath.replace(/^[/\\]+/, '')));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': mime(file) });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

/**
 * Contexto con licencia guardada. founder=true simula lo que deja el servidor de licencias para
 * el código fundador (no se usa ni se escribe el código real del dueño).
 */
async function newContext(browser, { founder, demo, draft }) {
  const context = await browser.newContext(MOBILE);
  await context.addInitScript(({ settings, founder, demo, draft }) => {
    try {
      if (!sessionStorage.getItem('__ntc_seeded')) {
        sessionStorage.setItem('__ntc_seeded', '1');
        localStorage.setItem('arpa_suite_license_code', founder ? 'ARPA-E2E-DUENO' : 'ARPA-PRO-E2ECLIENTE');
        localStorage.setItem('arpa_suite_license_plan', founder ? 'Founder' : 'PRO');
        if (founder) localStorage.setItem('arpa_suite_license_founder', '1');
        else localStorage.removeItem('arpa_suite_license_founder');
        localStorage.setItem('arpa_suite_had_paid_license', '1');
        localStorage.setItem('arpa_suite_settings_configured', 'true');
        localStorage.setItem('arpa_suite_user_settings', JSON.stringify(settings));
        localStorage.setItem('arpa_onboarding', 'true');
        localStorage.setItem('arpa_trial_captured', 'true');
        localStorage.setItem('arpa_active_oficios', JSON.stringify(['automatismos']));
      }
      if (demo) sessionStorage.setItem('__ntc_demo', '1');
    } catch (e) { /* ignore */ }
    if (document.documentElement) document.documentElement.classList.add('license-ok');
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.classList.add('license-ok');
      const style = document.createElement('style');
      style.textContent = '#license-gate,#onboarding-gate,#trial-capture-gate{display:none!important}html .page,html .main-menu,html .settings-overlay{visibility:visible!important}';
      document.head.appendChild(style);
    });
  }, { settings: SETTINGS, founder: !!founder, demo: !!demo, draft: draft || null });
  const blocked = new Set();
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(ORIGIN) && !url.includes('service-worker.js')) return route.continue();
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    try { blocked.add(new URL(url).host || url); } catch (e) { blocked.add(url); }
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 3).join(' / ')));
  page.on('dialog', (d) => d.accept().catch(() => {}));
  return { context, page, blocked, errors };
}

async function openFormato(page) {
  await page.goto(ORIGIN + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ArpaChecklistNtc && window.ArpaBrand && typeof window.guardarPDF === 'function');
  await page.evaluate(() => {
    document.documentElement.classList.add('license-ok');
    document.documentElement.classList.remove('license-checking');
    window.ArpaViews?.showView?.('formato');
  });
}

async function fillHeader(page) {
  await page.evaluate(() => {
    const t2 = document.getElementById('t2');
    if (t2) { t2.checked = true; t2.dispatchEvent(new Event('change', { bubbles: true })); }
    const set = (id, v) => { const el = document.getElementById(id); if (!el) return; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('formato-cliente-nombre', 'Bodega industrial (ejemplo)');
    set('formato-cliente-ciudad', 'Medellín');
    set('formato-cliente-direccion', 'Muelle 3, bodega principal');
    set('campo-tecnico-responsable', 'Técnico de ejemplo');
    const c5 = document.getElementById('c5');
    if (c5 && !c5.checked) { c5.checked = true; c5.dispatchEvent(new Event('change', { bubbles: true })); }
  });
}

async function signAndPrint(page) {
  const canvas = page.locator('#canvas-firma-cliente');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 20, box.y + 30);
  await page.mouse.down();
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(box.x + 20 + i * 18, box.y + 30 + (i % 2) * 25);
  await page.mouse.up();
  await page.evaluate(() => {
    window.__ntcPrinted = new Promise((resolve) => { window.print = () => resolve(true); });
  });
  await page.evaluate(() => window.guardarPDF());
  await page.evaluate(() => window.__ntcPrinted);
}

function sectionInfo(page) {
  return page.evaluate(() => {
    const sec = document.getElementById('formato-checklist-ntc-section');
    const r = sec ? sec.getBoundingClientRect() : null;
    return {
      exists: !!sec,
      hidden: sec ? sec.hidden : true,
      display: sec ? getComputedStyle(sec).display : 'none',
      height: r ? r.height : 0,
      html: sec ? sec.innerHTML : '',
      toggle: !!document.querySelector('[data-ntc="toggle"]'),
      css: !!document.getElementById('arpa-checklist-ntc-css'),
      bodyText: document.body.innerText,
    };
  });
}

const server = await startServer();
let browser;
try {
  browser = await chromium.launch({ executablePath: chrome, headless: true });

  // ── A) Dueño ────────────────────────────────────────────────────────────
  console.log('A) DUEÑO (licencia fundador)');
  const A = await newContext(browser, { founder: true });
  const page = A.page;
  console.log('A1) Abrir el formato');
  await openFormato(page);
  await page.waitForSelector('#formato-checklist-ntc-section [data-ntc="toggle"]', { state: 'attached' });
  assert(await page.evaluate(() => window.ArpaChecklistNtc.isOwner() === true), 'la app reconoce al dueño');
  await fillHeader(page);
  const visible = await page.$eval('#formato-checklist-ntc-section', (el) => !el.hidden);
  assert(visible, 'la sección aparece en Automatismos');

  console.log('A2) Activar / desactivar');
  await page.locator('#formato-checklist-ntc-section .ntc-switch').click();
  let st = await page.evaluate(() => window.ArpaChecklistNtc.getState());
  assert(st.enabled === true, 'el interruptor la activa');
  assert(st.tipo === 'seccional', 'toma el tipo de puerta marcado arriba (Seccional)');
  await page.locator('#formato-checklist-ntc-section .ntc-switch').click();
  st = await page.evaluate(() => window.ArpaChecklistNtc.getState());
  assert(st.enabled === false && (await page.locator('.ntc-item').count()) === 0, 'el interruptor la apaga y esconde los puntos');
  await page.locator('#formato-checklist-ntc-section .ntc-switch').click();

  console.log('A3) Cambiar tipo de puerta');
  await page.selectOption('#formato-checklist-ntc-section select[data-ntc="tipo"]', 'corrediza');
  assert((await page.locator('.ntc-item').count()) === 21, 'corrediza: 21 puntos (16 comunes + 5)');
  await page.selectOption('#formato-checklist-ntc-section select[data-ntc="tipo"]', 'seccional');
  assert((await page.locator('.ntc-item').count()) === 23, 'seccional: 23 puntos (16 comunes + 7)');

  console.log('A4) Marcar puntos con los botones');
  const items = await page.$$eval('.ntc-item', (els) => els.map((e) => e.getAttribute('data-item')));
  const NO = { com_fotocelda: 'La fotocelda del lado derecho no detecta; limpiar o cambiar.', sec_cables: 'Cable derecho con hilos rotos; cambiar los dos cables.' };
  const NA = ['com_bateria', 'com_borde'];
  const progress = () => page.$eval('[data-ntc-progress]', (el) => ({
    text: el.innerText.replace(/\s+/g, ' '),
    ok: el.querySelector('[data-count="ok"]').textContent, no: el.querySelector('[data-count="no"]').textContent,
    na: el.querySelector('[data-count="na"]').textContent,
  }));
  let shotTaken = false;
  for (const [i, id] of items.entries()) {
    const v = NO[id] ? 'no' : NA.includes(id) ? 'na' : 'ok';
    await page.$eval(`.ntc-item[data-item="${id}"] [data-v="${v}"]`, (b) => { b.scrollIntoView({ block: 'center' }); b.click(); });
    if (NO[id]) {
      const openNo = await page.$eval(`.ntc-item[data-item="${id}"]`, (el) => ({
        box: !!el.querySelector('.ntc-extra-no textarea[data-ntc="obs"]'), foto: !!el.querySelector('.ntc-extra-no [data-ntc="foto"]'),
        stripe: getComputedStyle(el).borderLeftColor,
      }));
      assert(openNo.box && openNo.foto, `"No cumple" abre observación y foto (${id})`);
      assert(openNo.stripe === 'rgb(220, 38, 38)', 'franja roja a la izquierda de la tarjeta');
      await page.locator(`.ntc-item[data-item="${id}"] [data-ntc="obs"]`).pressSequentially(NO[id]);
    }
    if (i === 5 && !shotTaken) {
      shotTaken = true;
      const pr = await progress();
      assert(pr.text.includes('6 de 23 revisados') && pr.ok === '✓ 4' && pr.no === '✗ 1' && pr.na === 'N/A 1', 'progreso y contadores a mitad de camino: ' + pr.text);
      const btnH = await page.$eval('.ntc-btn', (b) => b.getBoundingClientRect().height);
      assert(btnH >= 44, 'botones de al menos 44 px de alto (' + Math.round(btnH) + ' px)');
      await page.setViewportSize({ width: 390, height: 1240 });
      await page.$eval('[data-ntc-progress]', (el) => el.scrollIntoView({ block: 'start' }));
      await page.evaluate(() => window.scrollBy(0, -12));
      fs.mkdirSync(path.dirname(OUT_SHOT), { recursive: true });
      await page.screenshot({ path: OUT_SHOT });
      console.log('  captura del celular:', OUT_SHOT);
      await page.setViewportSize({ width: 390, height: 844 });
    }
  }
  const okToggle = await page.$eval('.ntc-item[data-item="com_senal"] [data-v="ok"]', (b) => b.getAttribute('aria-pressed'));
  assert(okToggle === 'true', 'botón elegido queda marcado');
  const photo = await page.evaluate(PHOTO_JS);
  await page.evaluate((src) => window.ArpaChecklistNtc.setItem('sec_cables', { foto: src }), photo);
  const pr0 = await progress();
  assert(pr0.text.includes('23 de 23 revisados') && pr0.ok === '✓ 19' && pr0.no === '✗ 2' && pr0.na === 'N/A 2', 'contadores en pantalla: 19 / 2 / 2');
  const sumText = await page.$eval('[data-ntc-summary]', (el) => el.innerText);
  assert(sumText.includes('Cable derecho con hilos rotos'), 'abajo se listan los "No cumple" con la observación');
  await page.$eval('.ntc-item[data-item="com_paro"] [data-v="ok"]', (b) => b.click());
  assert((await progress()).text.includes('22 de 23 revisados'), 'tocar de nuevo desmarca y el progreso baja');
  await page.$eval('.ntc-item[data-item="com_paro"] [data-v="ok"]', (b) => b.click());
  await page.$eval('.ntc-item[data-item="com_zona"] [data-ntc="more"]', (b) => b.click());
  assert((await page.locator('.ntc-item[data-item="com_zona"] .ntc-extra-soft [data-ntc="obs"]').count()) === 1, '"+ Nota o foto" abre la nota en un punto que cumple');

  console.log('A5) Guardar y recuperar (borrador)');
  await page.waitForTimeout(900);
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem(window.ArpaBrand.FORMATO_DRAFT_KEY) || '{}'));
  assert(draft._checklistNtc && draft._checklistNtc.enabled && draft._checklistNtc.tipo === 'seccional', 'el borrador guarda la lista');
  assert(draft._checklistNtc.items.sec_cables.foto.startsWith('data:image/'), 'el borrador guarda la foto del punto');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.ArpaViews?.showView?.('formato'));
  await page.waitForFunction(() => document.querySelectorAll('.ntc-item').length === 23);
  st = await page.evaluate(() => window.ArpaChecklistNtc.getState());
  assert(st.items.com_fotocelda.r === 'no' && st.items.com_fotocelda.obs.startsWith('La fotocelda'), 'al recargar la app se recupera todo');
  assert((await page.locator('.ntc-btn[aria-pressed="true"]').count()) === 23, 'los 23 botones marcados se ven al recuperar');

  console.log('A6) Historial: guardar y abrir el informe');
  await page.evaluate(() => { document.getElementById('numero-formato').value = '0001'; });
  const recId = await page.evaluate(() => {
    window.ArpaHistorial.captureFromFormato();
    const recs = JSON.parse(localStorage.getItem('arpa_suite_servicio_historial') || '[]');
    const r = recs.find((x) => x.fullSnapshot && x.fullSnapshot._checklistNtc);
    return r ? r.id : null;
  });
  assert(!!recId, 'el informe queda en el historial con su lista');
  await page.evaluate(() => window.clearFormatoForm());
  st = await page.evaluate(() => window.ArpaChecklistNtc.getState());
  assert(st.enabled === false && Object.keys(st.items).length === 0, 'formato nuevo: la lista arranca apagada y vacía');
  await page.evaluate((id) => window.ArpaHistorial.verDocumento(id), recId);
  await page.waitForFunction(() => window.ArpaChecklistNtc.getState().enabled === true, null, { timeout: 5000 });
  st = await page.evaluate(() => window.ArpaChecklistNtc.getState());
  assert(st.tipo === 'seccional' && st.items.sec_cables.r === 'no', 'abrir el informe desde el historial recupera la lista');
  await page.evaluate(() => window.ArpaViews?.showView?.('formato'));
  await fillHeader(page);

  console.log('A7) PDF (impresión real de la app)');
  await signAndPrint(page);
  const pr = await page.evaluate(() => {
    const sec = document.getElementById('formato-checklist-ntc-section');
    const t = sec.querySelector('[data-ntc-print]');
    return {
      title: sec.querySelector('[data-ntc-title]').textContent,
      rows: t.querySelectorAll('.ntc-pr-row').length,
      no: t.querySelectorAll('.ntc-pr-row.ntc-pr-no').length,
      reco: !!t.querySelector('.ntc-pr-reco'),
      nota: t.querySelector('.ntc-pr-nota')?.textContent || '',
      fotos: t.querySelectorAll('.ntc-pr-foto img').length,
      verdict: t.querySelector('.ntc-pr-verdict')?.getAttribute('data-verdict'),
      verdictText: t.querySelector('.ntc-pr-verdict')?.textContent || '',
      cells: t.querySelectorAll('.ntc-pr-cell').length,
      cellsNo: [...t.querySelectorAll('.ntc-pr-cell.ntc-pr-cell-no')].map((c) => c.textContent),
      shown: getComputedStyle(t).display !== 'none',
    };
  });
  assert(pr.title === 'Lista de verificación basada en la NTC 5926-3', 'título del PDF');
  assert(pr.rows === 23 && pr.no === 2, 'tabla del PDF: 23 filas, 2 "No cumple" resaltados');
  assert(pr.reco, 'recomendaciones con los "No cumple"');
  assert(pr.nota.includes('no reemplaza la norma'), 'nota de responsabilidad');
  assert(pr.fotos === 1, 'foto del punto en el PDF');
  assert(pr.verdict === 'no' && pr.verdictText.includes('REQUIERE ATENCIÓN') && pr.verdictText.includes('19 ✓ · 2 ✗ · 2 N/A'), 'veredicto rojo con la cuenta');
  assert(pr.cells === 23 && pr.cellsNo.join('|') === '4Fotocelda|17Cables', 'cuadrícula: 23 cuadritos, rojos Fotocelda y Cables');
  assert(pr.shown, 'la tabla se muestra al imprimir');
  await page.emulateMedia({ media: 'print' });
  const editorPrintDisplay = await page.$eval('#formato-checklist-ntc-section [data-ntc-editor]', (el) => getComputedStyle(el).display);
  assert(editorPrintDisplay === 'none', 'los botones del editor no salen en el PDF');
  fs.mkdirSync(path.dirname(OUT_PDF), { recursive: true });
  await page.pdf({ path: OUT_PDF, format: 'letter', printBackground: true, preferCSSPageSize: true });
  assert(fs.statSync(OUT_PDF).size > 20000, 'PDF del dueño generado: ' + OUT_PDF);
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.waitForFunction(() => !document.body.classList.contains('is-printing-formato'));
  const after = await page.evaluate(() => ({
    print: document.querySelector('#formato-checklist-ntc-section [data-ntc-print]').innerHTML,
    items: document.querySelectorAll('.ntc-item').length,
    obsInputs: document.querySelectorAll('.ntc-item [data-ntc="obs"]').length,
  }));
  assert(after.print === '' && after.items === 23 && after.obsInputs >= 2, 'después del PDF el formato vuelve a quedar editable');

  console.log('A8) Celular: la sección cabe sin scroll horizontal');
  for (const w of [360, 375, 390]) {
    await page.setViewportSize({ width: w, height: 800 });
    const o = await page.$eval('#formato-checklist-ntc-section', (el) => {
      const r = el.getBoundingClientRect();
      const bad = [...el.querySelectorAll('.ntc-item, .ntc-btn, .ntc-progress')].filter((x) => x.getBoundingClientRect().right > r.right + 1).length;
      return { diff: el.scrollWidth - el.clientWidth, bad };
    });
    assert(o.diff <= 1 && o.bad === 0, `sin desborde horizontal en ${w} px`);
  }
  const ownA = A.errors.filter((e) => /ntc|checklist/i.test(e));
  assert(ownA.length === 0, 'sin errores de la lista en la consola' + (ownA.length ? ': ' + ownA.join(' | ') : ''));
  if (A.errors.length) console.log('  (otros errores de la página, no de la lista):', A.errors.slice(0, 5).join(' | '));
  console.log('  hosts externos bloqueados:', [...A.blocked].join(', ') || 'ninguno');
  await A.context.close();

  // ── D) Filtro por tipo de puerta en Instalación, Mantenimiento y Reparación ──
  console.log('D) DUEÑO: solo comunes + el tipo de puerta elegido');
  for (const [radio, nombre] of [['t1', 'Instalación'], ['t2', 'Mantenimiento'], ['t3', 'Reparación']]) {
    const D = await newContext(browser, { founder: true });
    const pd = D.page;
    await openFormato(pd);
    await pd.waitForSelector('#formato-checklist-ntc-section [data-ntc="toggle"]', { state: 'attached' });
    await pd.click(`label[for="${radio}"]`);
    await pd.locator('#formato-checklist-ntc-section .ntc-switch').click();
    const ver = () => pd.evaluate(() => ({
      ids: [...document.querySelectorAll('.ntc-item')].map((e) => e.getAttribute('data-item')),
      grupos: [...document.querySelectorAll('.ntc-group-title')].map((g) => g.textContent),
      aviso: document.querySelector('[data-ntc-aviso]')?.textContent || '',
      sel: document.querySelector('[data-ntc="tipo"]')?.value,
      selArriba: (() => {
        const s = document.querySelector('[data-ntc="tipo"]'); const i = document.querySelector('.ntc-item');
        return !!(s && i && s.getBoundingClientRect().top < i.getBoundingClientRect().top);
      })(),
    }));
    const solo = (v, pref) => v.ids.every((id) => id.startsWith('com_') || id.startsWith(pref));
    let v = await ver();
    assert(v.ids.length === 16 && solo(v, 'com_') && v.aviso.includes('Elige el tipo de puerta'), `${nombre}: sin tipo, solo 16 comunes y el aviso`);
    assert(v.selArriba, `${nombre}: el selector de tipo está arriba de la lista`);
    await pd.click('label[for="c1"]');
    v = await ver();
    assert(v.sel === 'corrediza' && v.ids.length === 21 && solo(v, 'cor_') && v.grupos.length === 2 && !v.aviso, `${nombre}: marcar Corrediza en el formato → 21 puntos, solo de corrediza`);
    await pd.$eval('.ntc-item[data-item="cor_riel"] [data-v="no"]', (b) => b.click());
    await pd.click('label[for="c1"]');
    await pd.click('label[for="c5"]');
    v = await ver();
    assert(v.sel === 'seccional' && v.ids.length === 23 && solo(v, 'sec_'), `${nombre}: cambiar a Seccional en el formato actualiza al momento (23 puntos)`);
    const cnt = await pd.$eval('[data-count="no"]', (el) => el.textContent);
    assert(cnt === '✗ 0', `${nombre}: el "No cumple" de corrediza no cuenta en seccional`);
    await pd.selectOption('#formato-checklist-ntc-section select[data-ntc="tipo"]', 'barrera');
    v = await ver();
    assert(v.ids.length === 21 && solo(v, 'bar_'), `${nombre}: el selector de la lista también filtra (barrera)`);
    await pd.selectOption('#formato-checklist-ntc-section select[data-ntc="tipo"]', 'corrediza');
    assert((await pd.$eval('.ntc-item[data-item="cor_riel"]', (el) => el.getAttribute('data-r'))) === 'no', `${nombre}: al volver a corrediza se recupera lo marcado`);
    await pd.selectOption('#formato-checklist-ntc-section select[data-ntc="tipo"]', 'seccional');
    await fillHeader(pd);
    await pd.click(`label[for="${radio}"]`);
    await signAndPrint(pd);
    const p = await pd.evaluate(() => {
      const t = document.querySelector('#formato-checklist-ntc-section [data-ntc-print]');
      const ids = [...t.querySelectorAll('.ntc-pr-cell-name')].map((c) => c.textContent);
      return { rows: t.querySelectorAll('.ntc-pr-row').length, cells: ids.length, text: t.textContent };
    });
    assert(p.rows === 23 && p.cells === 23 && !p.text.includes('Riel') && !/REQUIERE ATENCI/.test(p.text), `${nombre}: PDF con 23 filas y 23 cuadritos, nada de corrediza`);
    await pd.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    const ownD = D.errors.filter((e) => /ntc|checklist/i.test(e));
    assert(ownD.length === 0, `${nombre}: sin errores de la lista en la consola`);
    await D.context.close();
  }

  // ── B) Cliente (no dueño) ───────────────────────────────────────────────
  console.log('B) CLIENTE (licencia PRO, sin founder)');
  const B = await newContext(browser, { founder: false });
  const pb = B.page;
  await openFormato(pb);
  await fillHeader(pb);
  // Aunque el borrador traiga una lista (p. ej. un respaldo del dueño), al cliente no le aparece.
  await pb.evaluate((d) => {
    const key = window.ArpaBrand.FORMATO_DRAFT_KEY;
    const cur = JSON.parse(localStorage.getItem(key) || '{}');
    cur._checklistNtc = d;
    localStorage.setItem(key, JSON.stringify(cur));
    window.applyFormatoDraft();
  }, draft._checklistNtc);
  await pb.waitForTimeout(300);
  assert(await pb.evaluate(() => window.ArpaChecklistNtc.isOwner() === false), 'la app NO reconoce al cliente como dueño');
  let sb = await sectionInfo(pb);
  assert(sb.exists && sb.hidden && sb.display === 'none' && sb.height === 0, 'la sección está oculta (no ocupa espacio)');
  assert(sb.html === '' && !sb.toggle, 'sin interruptor ni puntos en la pantalla');
  assert(!sb.css, 'ni siquiera se cargan los estilos de la lista');
  assert(!/NTC 5926|Lista de verificaci/i.test(sb.bodyText), 'ningún texto de la lista en la pantalla');
  const stB = await pb.evaluate(() => window.ArpaChecklistNtc.getState());
  assert(stB.enabled === false && Object.keys(stB.items).length === 0, 'el borrador con lista no la revive');
  // Intentos por consola de un cliente curioso: no hacen nada.
  await pb.evaluate(() => {
    window.ArpaChecklistNtc.setEnabled(true);
    window.ArpaChecklistNtc.setTipo('seccional');
    window.ArpaChecklistNtc.setItem('com_paro', { r: 'ok' });
    window.ArpaChecklistNtc.render();
  });
  sb = await sectionInfo(pb);
  assert(sb.hidden && sb.html === '' && (await pb.evaluate(() => window.ArpaChecklistNtc.getState().enabled)) === false, 'llamar las funciones a mano no la enciende');
  await pb.evaluate(() => window.scheduleFormatoDraftSave && window.scheduleFormatoDraftSave());
  await pb.waitForTimeout(900);
  const draftB = await pb.evaluate(() => JSON.parse(localStorage.getItem(window.ArpaBrand.FORMATO_DRAFT_KEY) || '{}'));
  assert(!('_checklistNtc' in draftB), 'el borrador del cliente no guarda la lista');
  await pb.evaluate(() => { document.getElementById('numero-formato').value = '0002'; window.ArpaHistorial.captureFromFormato(); });
  const histB = await pb.evaluate(() => JSON.parse(localStorage.getItem('arpa_suite_servicio_historial') || '[]'));
  assert(histB.length > 0 && histB.every((r) => !r.fullSnapshot || !('_checklistNtc' in r.fullSnapshot)), 'el historial del cliente no guarda la lista');
  console.log('B2) PDF del cliente');
  await signAndPrint(pb);
  const prB = await pb.evaluate(() => {
    const sec = document.getElementById('formato-checklist-ntc-section');
    return { hidden: sec.hidden, html: sec.innerHTML, display: getComputedStyle(sec).display, text: document.getElementById('view-formato').innerText };
  });
  assert(prB.hidden && prB.html === '' && prB.display === 'none', 'al imprimir la sección sigue oculta y vacía');
  await pb.emulateMedia({ media: 'print' });
  fs.mkdirSync(path.dirname(OUT_CLIENT_PDF), { recursive: true });
  await pb.pdf({ path: OUT_CLIENT_PDF, format: 'letter', printBackground: true, preferCSSPageSize: true });
  const printText = await pb.evaluate(() => document.body.innerText);
  assert(!/NTC 5926|Lista de verificaci|REQUIERE ATENCI|PUERTA EN BUEN ESTADO/i.test(printText), 'el PDF del cliente no trae nada de la lista');
  const pdfBytes = fs.readFileSync(OUT_CLIENT_PDF).toString('latin1');
  assert(fs.statSync(OUT_CLIENT_PDF).size > 20000 && !pdfBytes.includes('ntc-pr'), 'PDF del cliente generado: ' + OUT_CLIENT_PDF);
  await pb.emulateMedia({ media: 'screen' });
  await pb.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  sb = await sectionInfo(pb);
  assert(sb.hidden && sb.html === '', 'después del PDF sigue oculta');
  const ownB = B.errors.filter((e) => /ntc|checklist/i.test(e));
  assert(ownB.length === 0, 'sin errores de la lista en la consola (cliente)');
  await B.context.close();

  // ── C) Dueño con Modo Demo ──────────────────────────────────────────────
  console.log('C) DUEÑO con Modo Demo activo');
  const C = await newContext(browser, { founder: true });
  const pc = C.page;
  await openFormato(pc);
  await pc.waitForSelector('#formato-checklist-ntc-section [data-ntc="toggle"]', { state: 'attached' });
  const demoOk = await pc.evaluate(() => {
    const B = window.ArpaBrand;
    // Simula el Modo Demo solo en esta página (sin tocar datos): isDemoMode() → true.
    B.isDemoMode = () => true;
    window.dispatchEvent(new CustomEvent('arpa-demo-mode-changed'));
    return true;
  });
  await pc.waitForTimeout(100);
  let sc = await sectionInfo(pc);
  assert(demoOk && sc.hidden && sc.html === '', 'en Modo Demo la lista se oculta (la ve el cliente al que se le muestra la app)');
  await pc.evaluate(() => {
    window.ArpaBrand.isDemoMode = () => false;
    window.dispatchEvent(new CustomEvent('arpa-demo-mode-changed'));
  });
  await pc.waitForTimeout(100);
  sc = await sectionInfo(pc);
  assert(!sc.hidden && sc.toggle, 'al salir del Modo Demo vuelve a aparecer');
  await C.context.close();

  console.log('\nOK: lista de verificación NTC 5926-3 solo para el dueño (e2e)');
} finally {
  if (browser) await browser.close();
  server.close();
}
