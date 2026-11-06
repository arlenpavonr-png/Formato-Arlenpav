/**
 * Lista de verificación de puertas (basada en la NTC 5926-3) en el Formato de Servicio.
 * node --test tests/checklist-ntc.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

// En producción la lista es solo para el dueño (licencia fundador, sin Modo Demo).
// Por defecto las pruebas cargan como dueño; `owner: false` simula un cliente.
function load(opts) {
  const o = opts || {};
  const saves = [];
  const owner = o.owner !== false;
  const flags = { founder: owner, demo: !!o.demo };
  const sb = {
    console,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    scheduleFormatoDraftSave: () => saves.push(1),
    ArpaDocLang: { isEnglish: () => !!o.docEnglish },
    ArpaLicense: { isFounderLicense: () => flags.founder },
    ArpaBrand: { isDemoMode: () => flags.demo }
  };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(read('js/arpa-formato-tipo.js'), sb);
  return { C: sb.ArpaChecklistNtc, saves, flags };
}

const FOTO = 'data:image/jpeg;base64,AAAA';
// Los objetos del sandbox vm son de otro contexto: se comparan como JSON.
const J = (x) => JSON.parse(JSON.stringify(x));

test('cada tipo de puerta trae los puntos comunes y los propios, con id válido y texto en ES y EN', () => {
  const { C } = load();
  assert.deepStrictEqual(J(C.DOOR_TYPES), ['corrediza', 'batiente', 'seccional', 'enrollable', 'peatonal', 'barrera']);
  const comunes = C.getItems('', 'es');
  assert.strictEqual(comunes.length, 16);
  const vistos = new Set();
  C.DOOR_TYPES.forEach((tipo) => {
    const es = C.getItems(tipo, 'es');
    const en = C.getItems(tipo, 'en');
    assert.ok(es.length > comunes.length, tipo + ' tiene puntos propios');
    assert.strictEqual(es.length, en.length);
    es.forEach((it, i) => {
      assert.match(it.id, /^[a-z]{3}_[a-z_]+$/, 'id que normalize acepta: ' + it.id);
      assert.strictEqual(it.num, i + 1);
      assert.ok(it.text.length > 10 && en[i].text.length > 10, 'texto ' + it.id);
      assert.notStrictEqual(it.text, en[i].text, 'traducido: ' + it.id);
      if (it.group !== 'comun') {
        assert.ok(!vistos.has(it.id), 'id repetido: ' + it.id);
        vistos.add(it.id);
      }
    });
  });
});

test('los textos de la lista existen en español e inglés', () => {
  const { C } = load();
  assert.deepStrictEqual(J(Object.keys(C.TEXT.es).sort()), J(Object.keys(C.TEXT.en).sort()));
  assert.strictEqual(C.TEXT.es.print_title, 'Lista de verificación basada en la NTC 5926-3');
  assert.strictEqual(C.TEXT.es.nota, 'Esta lista no reemplaza la norma; el técnico es responsable de su aplicación.');
});

test('activar y desactivar la lista; apagada no va al PDF', () => {
  const { C, saves } = load();
  assert.strictEqual(C.getState().enabled, false);
  C.setEnabled(true);
  assert.strictEqual(C.getState().enabled, true);
  assert.ok(saves.length >= 1, 'guarda el borrador');
  C.setTipo('seccional');
  C.setItem('com_paro', { r: 'ok' });
  assert.ok(C.buildPrintHtml(C.getState(), 'es').includes('ntc-pr-table'));
  C.setEnabled(false);
  assert.strictEqual(C.buildPrintHtml(C.getState(), 'es'), '');
  // Lo marcado se conserva si se vuelve a encender.
  C.setEnabled(true);
  assert.strictEqual(C.getState().items.com_paro.r, 'ok');
});

test('cambiar el tipo de puerta cambia los puntos y el resumen', () => {
  const { C } = load();
  C.setEnabled(true);
  C.setTipo('seccional');
  C.setItem('sec_cables', { r: 'no', obs: 'Cable derecho con hilos rotos' });
  C.setItem('com_paro', { r: 'ok' });
  let s = C.summarize(C.getState(), 'es');
  assert.strictEqual(s.total, 23);
  assert.strictEqual(s.no, 1);
  C.setTipo('corrediza');
  s = C.summarize(C.getState(), 'es');
  assert.strictEqual(s.total, 21);
  assert.strictEqual(s.no, 0, 'el punto de seccional no cuenta en corrediza');
  assert.strictEqual(s.ok, 1, 'los comunes se conservan');
  C.setTipo('nada');
  assert.strictEqual(C.getState().tipo, '');
  assert.strictEqual(C.summarize(C.getState(), 'es').total, 16, 'sin tipo: solo los 16 comunes');
});

// ── Filtro por tipo de puerta (2026-11-06: Arlen veía puntos de otros tipos) ──
const IDS_DE = (C, tipo) => J(C.getItems(tipo, 'es').map((i) => i.id));
const PREFIJO = { corrediza: 'cor_', batiente: 'bat_', seccional: 'sec_', enrollable: 'enr_', peatonal: 'pea_', barrera: 'bar_' };

test('filtro: cada tipo muestra solo los comunes y sus propios puntos, nunca los de otro tipo', () => {
  const { C } = load();
  C.DOOR_TYPES.forEach((tipo) => {
    const ids = IDS_DE(C, tipo);
    const otros = ids.filter((id) => !id.startsWith('com_') && !id.startsWith(PREFIJO[tipo]));
    assert.deepStrictEqual(otros, [], tipo + ' no trae puntos de otros tipos');
    const html = C.buildEditorHtml({ enabled: true, tipo, items: {} }, 'es', false);
    const enPantalla = [...html.matchAll(/data-item="([a-z_]+)"/g)].map((m) => m[1]);
    assert.deepStrictEqual(enPantalla, ids, tipo + ': en pantalla solo comunes + ' + tipo);
    const grupos = [...html.matchAll(/class="ntc-group-title">([^<]+)</g)].map((m) => m[1]);
    assert.strictEqual(grupos.length, 2, tipo + ': dos grupos');
    assert.strictEqual(grupos[0], 'Comunes a todas las puertas');
    const pdf = C.buildPrintHtml({ enabled: true, tipo, items: {} }, 'es');
    assert.strictEqual((pdf.match(/class="ntc-pr-row /g) || []).length, ids.length, tipo + ': tabla del PDF');
    assert.strictEqual((pdf.match(/class="ntc-pr-cell ntc-pr-cell-/g) || []).length, ids.length, tipo + ': cuadrícula del PDF');
  });
});

test('filtro: sin tipo se ven solo los comunes, con el aviso y el selector arriba', () => {
  const { C } = load();
  const html = C.buildEditorHtml({ enabled: true, tipo: '', items: {} }, 'es', false);
  assert.ok(html.includes('Elige el tipo de puerta para ver sus puntos.'), 'aviso corto');
  const enPantalla = [...html.matchAll(/data-item="([a-z_]+)"/g)].map((m) => m[1]);
  assert.strictEqual(enPantalla.length, 16);
  assert.ok(enPantalla.every((id) => id.startsWith('com_')), 'solo comunes');
  assert.ok(html.indexOf('data-ntc="tipo"') < html.indexOf('data-ntc-aviso') && html.indexOf('data-ntc-aviso') < html.indexOf('data-item='), 'selector y aviso arriba de la lista');
  const conTipo = C.buildEditorHtml({ enabled: true, tipo: 'barrera', items: {} }, 'es', false);
  assert.ok(!conTipo.includes('data-ntc-aviso'), 'con tipo no sale el aviso');
  assert.ok(conTipo.indexOf('data-ntc="tipo"') < conTipo.indexOf('data-item='), 'selector arriba de la lista');
  const pdf = C.buildPrintHtml({ enabled: true, tipo: '', items: { com_paro: { r: 'ok' } } }, 'es');
  assert.strictEqual((pdf.match(/class="ntc-pr-row /g) || []).length, 16, 'PDF sin tipo: solo los comunes');
  assert.ok(pdf.includes('Tipo de puerta: <strong>sin elegir</strong>'));
});

test('filtro: lo marcado en un tipo que se deja de ver no cuenta ni sale en el PDF, y vuelve al regresar', () => {
  const { C } = load();
  C.setEnabled(true);
  C.setTipo('seccional');
  C.setItem('sec_cables', { r: 'no', obs: 'Hilos rotos', foto: FOTO });
  C.setItem('com_paro', { r: 'ok' });
  C.setTipo('corrediza');
  const st = C.getState();
  const s = C.summarize(st, 'es');
  assert.deepStrictEqual([s.total, s.ok, s.no, s.fotos.length], [21, 1, 0, 0], 'contadores sin el punto de seccional');
  const pdf = C.buildPrintHtml(st, 'es');
  assert.ok(!pdf.includes('Hilos rotos') && !pdf.includes('ntc-pr-reco') && !pdf.includes('ntc-pr-foto'), 'el PDF no trae lo de seccional');
  assert.ok(!C.buildSummaryHtml(st, 'es').includes('Hilos rotos'), 'el resumen tampoco');
  assert.ok(!C.buildProgressHtml(st, 'es').includes('✗ 1'), 'ni la barra');
  C.setTipo('seccional');
  const back = C.summarize(C.getState(), 'es');
  assert.deepStrictEqual([back.total, back.no, back.fotos.length], [23, 1, 1], 'al volver a seccional se recupera');
});

test('filtro: la lista sigue al tipo de puerta marcado en el formato, al momento', () => {
  const { C, saves } = load();
  const chips = {};
  const chip = (id, checked) => { chips[id] = { id, checked }; return chips[id]; };
  // Documento mínimo: solo las casillas del formato.
  const fakeDoc = { getElementById: (id) => chips[id] || null };
  C.setEnabled(true);
  assert.strictEqual(C.getState().tipo, '');
  assert.strictEqual(C.tipoFromChips(fakeDoc), '');
  chip('c1', true);
  assert.strictEqual(C.tipoFromChips(fakeDoc), 'corrediza');
  chip('c10', true);
  chips.c1.checked = false;
  assert.strictEqual(C.tipoFromChips(fakeDoc), 'peatonal', 'la puerta de vidrio (cabezal) es peatonal');
  // syncTipoFromChip con la casilla que cambió (sin document en las pruebas: tipoFromChips da '').
  const n0 = saves.length;
  C.syncTipoFromChip({ id: 'c5', checked: true });
  assert.strictEqual(C.getState().tipo, 'seccional', 'marcar Seccional cambia la lista');
  assert.ok(saves.length > n0, 'guarda el borrador');
  C.syncTipoFromChip({ id: 'c6', checked: true });
  assert.strictEqual(C.getState().tipo, 'barrera', 'la casilla recién marcada manda');
  C.syncTipoFromChip({ id: 'c6', checked: false });
  assert.strictEqual(C.getState().tipo, '', 'sin casillas marcadas: solo comunes');
  C.setTipo('peatonal');
  C.syncTipoFromChip({ id: 'c8', checked: true });
  assert.strictEqual(C.getState().tipo, 'peatonal', '"Otra" no borra el tipo elegido a mano');
  C.syncTipoFromChip({ id: 'formato-cliente-nombre', checked: false });
  assert.strictEqual(C.getState().tipo, 'peatonal', 'otros campos no tocan la lista');
});

test('resumen: cuenta cumple / no cumple / no aplica / sin revisar y lista los "No cumple" con su observación', () => {
  const { C } = load();
  const st = {
    enabled: true,
    tipo: 'seccional',
    items: {
      com_senal: { r: 'ok' },
      com_luz: { r: 'na' },
      com_fotocelda: { r: 'no', obs: 'Fotocelda izquierda no detecta' },
      sec_resortes: { r: 'no', obs: '' },
      sec_cables: { r: 'ok', foto: FOTO },
      bat_bisagras: { r: 'no' }
    }
  };
  const s = C.summarize(st, 'es');
  assert.deepStrictEqual([s.ok, s.no, s.na, s.pending, s.total], [2, 2, 1, 18, 23]);
  assert.deepStrictEqual(J(s.noItems.map((n) => [n.num, n.id, n.obs])), [[4, 'com_fotocelda', 'Fotocelda izquierda no detecta'], [18, 'sec_resortes', '']]);
  assert.strictEqual(s.fotos.length, 1);
});

test('limpia datos raros al recuperar', () => {
  const { C } = load();
  const n = C.normalize({
    enabled: 'si', tipo: 'otra',
    items: { com_paro: { r: 'tal vez', obs: 5, foto: 'javascript:alert(1)' }, 'MAL-ID': { r: 'ok' }, com_luz: { r: 'ok', obs: 'x'.repeat(500) } }
  });
  assert.strictEqual(n.enabled, false);
  assert.strictEqual(n.tipo, '');
  assert.ok(!n.items.com_paro, 'sin datos válidos no se guarda');
  assert.ok(!n.items['MAL-ID']);
  assert.strictEqual(n.items.com_luz.obs.length, 240);
});

test('se guarda con el borrador y se recupera (historial)', () => {
  const { C } = load();
  const vacio = C.enrichDraft({ a: 1 });
  assert.ok(!('_checklistNtc' in vacio), 'apagada y vacía no ocupa espacio');
  C.setEnabled(true);
  C.setTipo('enrollable');
  C.setItem('enr_freno', { r: 'no', obs: 'Freno patina', foto: FOTO });
  const draft = JSON.parse(JSON.stringify(C.enrichDraft({ numero: 'Mant-0001' })));
  assert.strictEqual(draft._checklistNtc.tipo, 'enrollable');
  assert.strictEqual(draft._checklistNtc.items.enr_freno.obs, 'Freno patina');
  C.reset();
  assert.strictEqual(C.getState().enabled, false);
  assert.strictEqual(Object.keys(C.getState().items).length, 0);
  C.restoreFromDraft(draft);
  const st = C.getState();
  assert.strictEqual(st.enabled, true);
  assert.strictEqual(st.items.enr_freno.foto, FOTO);
  // Borrador viejo sin la lista: queda apagada.
  C.restoreFromDraft({ numero: 'x' });
  assert.strictEqual(C.getState().enabled, false);
});

test('sin espacio: se quitan solo las fotos de la lista, sin tocar el original', () => {
  const { C } = load();
  const original = { _checklistNtc: { enabled: true, tipo: 'barrera', items: { bar_brazo: { r: 'no', obs: 'Brazo doblado', foto: FOTO }, bar_apoyo: { foto: FOTO } } } };
  const copia = Object.assign({}, original);
  C.stripPhotos(copia);
  assert.strictEqual(copia._checklistNtc.items.bar_brazo.foto, '');
  assert.strictEqual(copia._checklistNtc.items.bar_brazo.obs, 'Brazo doblado');
  assert.ok(!copia._checklistNtc.items.bar_apoyo, 'punto que solo tenía foto desaparece');
  assert.strictEqual(original._checklistNtc.items.bar_brazo.foto, FOTO);
});

test('PDF: tabla con resumen, "No cumple" resaltados, recomendaciones, nota y sin HTML inyectado', () => {
  const { C } = load();
  const st = {
    enabled: true,
    tipo: 'seccional',
    items: {
      com_fotocelda: { r: 'no', obs: 'No detecta <script>x</script>' },
      sec_resortes: { r: 'no' },
      com_paro: { r: 'ok', foto: FOTO },
      com_luz: { r: 'na' }
    }
  };
  const html = C.buildPrintHtml(st, 'es');
  assert.ok(html.includes('Tipo de puerta: <strong>Seccional o levadiza</strong>'));
  assert.strictEqual((html.match(/ntc-pr-row ntc-pr-no/g) || []).length, 2);
  assert.strictEqual((html.match(/class="ntc-pr-row /g) || []).length, 23);
  assert.ok(html.includes('Recomendaciones (puntos que no cumplen)'));
  assert.ok(html.includes('Corregir antes de seguir usando la puerta'), 'texto por defecto si no hay observación');
  assert.ok(html.includes('&lt;script&gt;') && !html.includes('<script>'));
  assert.ok(html.includes('Esta lista no reemplaza la norma; el técnico es responsable de su aplicación.'));
  assert.ok(html.includes('ntc-pr-foto') && html.includes('#7 · Cumple'));
  assert.ok(html.includes('Sin revisar'));
  const en = C.buildPrintHtml(st, 'en');
  assert.ok(en.includes('Door type: <strong>Sectional or up-and-over</strong>'));
  assert.ok(en.includes('Fail') && !en.includes('No cumple'));
});

test('index.html: sección después de las fotos y antes de las firmas, y enganches de borrador y PDF', () => {
  const html = read('index.html');
  const pos = (s) => {
    const i = html.indexOf(s);
    assert.ok(i > 0, 'falta ' + s);
    return i;
  };
  const sec = pos('id="formato-checklist-ntc-section"');
  assert.ok(sec > pos('id="after-preview"') && sec < pos('id="canvas-firma-cliente"'));
  ['ArpaChecklistNtc?.enrichDraft?.(data)', 'ArpaChecklistNtc?.restoreFromDraft?.(data)', 'ArpaChecklistNtc?.reset?.()',
    'ArpaChecklistNtc?.stripPhotos?.(fallback)', 'ArpaChecklistNtc?.prepareForPrint?.()', 'ArpaChecklistNtc?.restoreAfterPrint?.()']
    .forEach(pos);
  // El PDF se arma antes de que guardarPDF cambie los campos por texto
  // (desde el 6-nov-2026 esos pasos viven en prepararFormatoParaPdf, compartidos con WhatsApp).
  const g = html.slice(pos('function prepararFormatoParaPdf()'), pos('function forzarSaltoSiSeCorta()'));
  assert.ok(g.indexOf('prepareForPrint') < g.indexOf('replaceChild(span, el)'));
  assert.ok(read('js/arpa-historial.js').includes('ArpaChecklistNtc?.stripPhotos?.(next.fullSnapshot)'));
});

// ── Diseño "Semáforo" (2026-11-06) ─────────────────────────────────────────
function seccionalCompleta(overrides) {
  const { C } = load();
  const items = {};
  C.getItems('seccional', 'es').forEach((it) => { items[it.id] = { r: 'ok' }; });
  return { C, st: { enabled: true, tipo: 'seccional', items: Object.assign(items, overrides || {}) } };
}

test('semáforo: cada punto de cada tipo tiene un nombre corto de 1 o 2 palabras (ES y EN)', () => {
  const { C } = load();
  const ids = new Set();
  C.DOOR_TYPES.forEach((tipo) => {
    ['es', 'en'].forEach((l) => C.getItems(tipo, l).forEach((it) => {
      ids.add(it.id);
      assert.ok(it.short, 'falta nombre corto: ' + it.id + ' ' + l);
      assert.ok(it.short.split(/\s+/).length <= 2, 'más de 2 palabras: ' + it.short);
    }));
  });
  assert.deepStrictEqual(J(Object.keys(C.SHORT).sort()), J([...ids].sort()), 'sin nombres cortos sobrantes');
  const es = C.getItems('seccional', 'es');
  assert.strictEqual(es.find((i) => i.id === 'com_fotocelda').short, 'Fotocelda');
  assert.strictEqual(es.find((i) => i.id === 'com_paro').short, 'Paro');
  assert.strictEqual(es.find((i) => i.id === 'sec_cables').short, 'Cables');
});

test('semáforo: veredicto del PDF en los 3 casos', () => {
  // 1) Algún "No cumple" → requiere atención (aunque falten puntos).
  let { C, st } = seccionalCompleta({ com_fotocelda: { r: 'no', obs: 'No detecta' }, sec_cables: { r: 'no' }, com_bateria: { r: 'na' }, com_borde: { r: 'na' } });
  let html = C.buildPrintHtml(st, 'es');
  assert.strictEqual(C.verdict(C.summarize(st, 'es')), 'no');
  assert.ok(html.includes('ntc-pr-verdict-no') && html.includes('⚠ REQUIERE ATENCIÓN'));
  assert.ok(html.includes('19 ✓ · 2 ✗ · 2 N/A'), 'cuenta a la derecha de la franja');
  delete st.items.com_paro;
  assert.strictEqual(C.verdict(C.summarize(st, 'es')), 'no', 'con pendientes y un "No cumple" sigue siendo atención');
  // 2) Todo revisado sin "No cumple" → buen estado.
  ({ C, st } = seccionalCompleta({ com_bateria: { r: 'na' } }));
  html = C.buildPrintHtml(st, 'es');
  assert.strictEqual(C.verdict(C.summarize(st, 'es')), 'ok');
  assert.ok(html.includes('ntc-pr-verdict-ok') && html.includes('✓ PUERTA EN BUEN ESTADO') && html.includes('22 ✓ · 0 ✗ · 1 N/A'));
  assert.ok(!html.includes('ntc-pr-reco'), 'sin recomendaciones si no hay "No cumple"');
  // 3) Faltan puntos y ningún "No cumple" → incompleta.
  delete st.items.com_paro;
  delete st.items.sec_sellos;
  html = C.buildPrintHtml(st, 'es');
  assert.strictEqual(C.verdict(C.summarize(st, 'es')), 'pend');
  assert.ok(html.includes('ntc-pr-verdict-pend') && html.includes('REVISIÓN INCOMPLETA') && html.includes('2 sin revisar'));
  assert.ok(C.buildPrintHtml(st, 'en').includes('INCOMPLETE CHECK'));
  // Sin ningún punto marcado también es incompleta.
  assert.strictEqual(C.verdict(C.summarize({ enabled: true, tipo: 'barrera', items: {} }, 'es')), 'pend');
});

test('semáforo: cuadrícula del PDF con un cuadrito por punto, en orden y con su color', () => {
  const { C, st } = seccionalCompleta({ com_fotocelda: { r: 'no' }, sec_cables: { r: 'no' }, com_bateria: { r: 'na' }, com_borde: { r: 'na' } });
  delete st.items.sec_sellos;
  const html = C.buildPrintHtml(st, 'es');
  const grid = html.slice(html.indexOf('class="ntc-pr-grid"'), html.indexOf('class="ntc-pr-legend"'));
  const cells = [...grid.matchAll(/ntc-pr-cell ntc-pr-cell-(\w+)"[^>]*><span class="ntc-pr-cell-num">(\d+)<\/span><span class="ntc-pr-cell-name">([^<]+)</g)];
  assert.strictEqual(cells.length, 23);
  assert.deepStrictEqual(cells.map((c) => Number(c[2])), Array.from({ length: 23 }, (_, i) => i + 1));
  const by = Object.fromEntries(cells.map((c) => [c[3], c[1]]));
  assert.strictEqual(by.Fotocelda, 'no');
  assert.strictEqual(by.Cables, 'no');
  assert.strictEqual(by['Batería'], 'na');
  assert.strictEqual(by.Empaques, 'pending');
  assert.strictEqual(by.Paro, 'ok');
  // Orden: veredicto y cuadrícula juntos, luego recomendaciones, tabla y nota.
  const order = ['ntc-pr-top', 'ntc-pr-verdict', 'ntc-pr-grid', 'ntc-pr-reco', 'ntc-pr-table', 'ntc-pr-nota'].map((k) => html.indexOf(k));
  assert.deepStrictEqual(order.slice().sort((a, b) => a - b), order);
  assert.ok(html.includes('</div></div><div class="ntc-pr-reco"'), 'la cuadrícula queda dentro del bloque que no se corta');
});

test('semáforo: barra de progreso y contadores en el celular', () => {
  const { C } = load();
  C.setEnabled(true);
  C.setTipo('seccional');
  assert.ok(C.buildProgressHtml(C.getState(), 'es').includes('0 de 23 revisados'));
  C.setItem('com_senal', { r: 'ok' });
  C.setItem('com_luz', { r: 'ok' });
  C.setItem('com_fotocelda', { r: 'no' });
  C.setItem('com_borde', { r: 'na' });
  const p = C.buildProgressHtml(C.getState(), 'es');
  assert.ok(p.includes('4 de 23 revisados'));
  assert.ok(p.includes('data-count="ok">✓ 2<') && p.includes('data-count="no">✗ 1<') && p.includes('data-count="na">N/A 1<'));
  assert.ok(p.includes('aria-valuenow="4"'));
  // Desmarcar baja el progreso.
  C.setItem('com_luz', { r: '' });
  assert.ok(C.buildProgressHtml(C.getState(), 'es').includes('3 de 23 revisados'));
  assert.ok(C.buildProgressHtml(C.getState(), 'en').includes('3 of 23 checked'));
});

test('semáforo: tarjeta "No cumple" con observación y foto ya abiertas; Cumple / No aplica discretas', () => {
  const { C } = load();
  const st = { enabled: true, tipo: 'barrera', items: { bar_brazo: { r: 'no' }, bar_balance: { r: 'ok' }, bar_apoyo: { r: 'na', obs: 'No tiene apoyo' } } };
  const html = C.buildEditorHtml(st, 'es', false);
  const card = (id) => {
    const i = html.indexOf('data-item="' + id + '"');
    const j = html.indexOf('data-item=', i + 10);
    return html.slice(i, j > 0 ? j : undefined);
  };
  assert.ok(html.indexOf('data-ntc-progress') < html.indexOf('data-item='), 'progreso arriba de la lista');
  assert.ok(card('bar_brazo').includes('ntc-extra-no') && card('bar_brazo').includes('<textarea') && card('bar_brazo').includes('data-ntc="foto"'));
  assert.ok(card('bar_brazo').includes('¿Qué falla y qué recomienda?'));
  assert.ok(card('bar_balance').includes('data-ntc="more"') && !card('bar_balance').includes('data-ntc="obs"'), 'Cumple: solo el enlace discreto');
  assert.ok(card('bar_apoyo').includes('ntc-extra-soft') && card('bar_apoyo').includes('No tiene apoyo'), 'si ya tiene nota se muestra');
  assert.ok(!card('bar_detector').includes('data-ntc="more"'), 'sin marcar: nada extra');
  assert.ok(C.buildEditorHtml(st, 'es', false, { bar_balance: true }).includes('ntc-extra-soft'), 'abierto con "+ Nota o foto"');
  const locked = C.buildEditorHtml(st, 'es', true);
  assert.ok(!locked.includes('data-ntc="more"') && !locked.includes('data-ntc="foto"'), 'OT cerrada: sin enlace ni foto');
  assert.strictEqual((html.match(/aria-pressed="true"/g) || []).length, 3);
});

// ── Solo para el dueño (producción, 2026-11-06) ────────────────────────────
const ST_LLENO = { enabled: true, tipo: 'seccional', items: { com_paro: { r: 'ok' }, sec_cables: { r: 'no', obs: 'Hilos rotos', foto: FOTO } } };

test('solo dueño: un cliente no ve la lista ni en la app ni en el PDF, y no guarda nada', () => {
  const { C, saves } = load({ owner: false });
  assert.strictEqual(C.isOwner(), false);
  assert.strictEqual(C.buildEditorHtml(ST_LLENO, 'es', false), '', 'sin interruptor ni puntos en la app');
  assert.strictEqual(C.buildPrintHtml(ST_LLENO, 'es'), '', 'nada en el PDF');
  assert.strictEqual(C.buildPrintHtml(ST_LLENO, 'en'), '');
  C.setEnabled(true);
  C.setTipo('seccional');
  C.setItem('com_paro', { r: 'ok' });
  assert.strictEqual(C.getState().enabled, false, 'no se puede encender');
  assert.strictEqual(Object.keys(C.getState().items).length, 0);
  assert.strictEqual(saves.length, 0, 'no toca el borrador');
  const draft = C.enrichDraft({ numero: 'Mant-0001', _checklistNtc: ST_LLENO });
  assert.ok(!('_checklistNtc' in draft), 'no va al borrador ni al historial');
  C.restoreFromDraft({ _checklistNtc: ST_LLENO });
  assert.strictEqual(C.getState().enabled, false, 'un borrador con lista no la revive');
});

test('solo dueño: con Modo Demo activo la lista se oculta aunque sea la licencia fundador', () => {
  const { C, flags } = load({ owner: true, demo: true });
  assert.strictEqual(C.isOwner(), false);
  assert.strictEqual(C.buildPrintHtml(ST_LLENO, 'es'), '');
  flags.demo = false;
  assert.strictEqual(C.isOwner(), true);
  assert.ok(C.buildPrintHtml(ST_LLENO, 'es').includes('ntc-pr-table'), 'al salir del demo vuelve');
});

test('solo dueño: la regla es la licencia fundador del servidor, no una opción de Ajustes', () => {
  const src = read('js/arpa-formato-tipo.js');
  const i = src.indexOf('function isOwner()');
  const body = src.slice(i, src.indexOf('function pickLang', i));
  assert.ok(body.includes('ArpaLicense?.isFounderLicense?.() === true'));
  assert.ok(body.includes('isDemoMode'));
  const lic = read('js/arpa-license.js');
  assert.ok(/function isFounderLicense[\s\S]*getActiveLicenseCode\(\)[\s\S]*LICENSE_FOUNDER_KEY\) === '1'/.test(lic),
    'fundador = código activo + respuesta founder:true del servidor');
  const html = read('index.html');
  assert.ok(html.includes('<div class="section" id="formato-checklist-ntc-section" hidden></div>'), 'la sección nace oculta y vacía');
  const ajustes = html.indexOf('id="settings-modal"');
  assert.ok(ajustes > 0 && !/checklist|NTC 5926/i.test(html.slice(ajustes, html.indexOf('<script', ajustes))), 'sin interruptor en Ajustes');
});
