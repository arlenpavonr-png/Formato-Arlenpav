/**
 * Módulo: Cotización, ítems dinámicos y PDF
 */
(function (global) {
  const PRODUCT_CATALOG_KEY = 'arpa_suite_product_catalog';

  function formatoPesos(n) {
    return global.ArpaPricing?.formatoPesos(n) || ('$ ' + (Number(n) || 0).toLocaleString('es-CO'));
  }

  function getCatalogoConfigurado() {
    try {
      const saved = JSON.parse(localStorage.getItem(PRODUCT_CATALOG_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) { /* usar catálogo integrado */ }
    return null;
  }

  function getCatalogoActivo() {
    return getCatalogoConfigurado() || COT_CATALOGO;
  }

  function updateCatalogHint() {
    const hint = document.getElementById('cot-catalog-hint');
    if (!hint) return;
    hint.hidden = getCatalogoActivo().length > 0;
  }

  const COT_CATALOGO = [
    { cod: 'AUACSC901', nom: 'Accessmatic Scorpion 901 – ½ HP 24V 110V', pvp: 999900 },
    { cod: 'AUACFX1000', nom: 'Accessmatic Fox 1000 Pro – ¾ HP 110V (sin riel)', pvp: 799900 },
    { cod: 'AUACKFOX1000C', nom: 'Accessmatic Fox 1000 Pro + Riel C correa – ¾ HP', pvp: 1049900 },
    { cod: 'AUACKFOX1000T', nom: 'Accessmatic Fox 1000 Pro + Riel T metálico – ¾ HP', pvp: 1149900 },
    { cod: 'AUACFX1100WS', nom: 'Accessmatic Fox 1100 Pro WiFi – ¾ HP 110V', pvp: 1119900 },
    { cod: 'AUACKFOX1050HS', nom: 'Accessmatic Fox 1050 High Speed – ¾ HP alta velocidad', pvp: 1219900 },
    { cod: 'AUACKFOX1100WS', nom: 'Accessmatic Fox 1100 Pro WiFi + Riel T', pvp: 1399900 },
    { cod: 'AUACSH1000', nom: 'Accessmatic Shark 1000 – ¾ HP silencioso 110V', pvp: 1095900 },
    { cod: 'AUACRP120', nom: 'Accessmatic Raptor 1200 – 1 HP 110V', pvp: 1399900 },
    { cod: 'AUACPUMA1200', nom: 'Accessmatic Puma 1200 WiFi – 1 HP 110V', pvp: 1369900 },
    { cod: 'AUACKSC1800C', nom: 'Accessmatic Scorpion 1800 – 1.5 HP + Riel C 4m', pvp: 1999900 },
    { cod: 'AUACKSC1800T', nom: 'Accessmatic Scorpion 1800 – 1.5 HP + Riel T 4m', pvp: 1999900 },
    { cod: 'AUELMC4', nom: 'Elite Slide 400 – 400 kg corrediza 110V', pvp: 1069900 },
    { cod: 'AUACKPB400', nom: 'Accessmatic Pitbull 400 – 400 kg corrediza 110V', pvp: 1099900 },
    { cod: 'AUELMC5', nom: 'Elite Slide 500 – 500 kg corrediza 110V', pvp: 1199900 },
    { cod: 'AUELMC8', nom: 'Elite Slide 800 – 800 kg corrediza 110V', pvp: 1549900 },
    { cod: 'AUELMC8FV', nom: 'Elite Slide 800 FV – 800 kg + lámpara destellante', pvp: 1899900 },
    { cod: 'AUACKBD850', nom: 'Accessmatic Bulldozer 850 – 850 kg corrediza 110V', pvp: 1599900 },
    { cod: 'AUACKBD1024BL', nom: 'Accessmatic Bulldog 1024BL – 1000 kg sin escobillas', pvp: 3399900 },
    { cod: 'AUACKBD1100', nom: 'Accessmatic Bulldog 1100 – 1100 kg corrediza 110V', pvp: 1999900 },
    { cod: 'AUELMC12', nom: 'Elite Slide 1200 – 1200 kg industrial 110V', pvp: 1999900 },
    { cod: 'AUACKBD1522', nom: 'Accessmatic Bulldog 1522 – 1500 kg 220V industrial', pvp: 2629900 },
    { cod: 'AUACKBD1824BL', nom: 'Accessmatic Bulldog 1824BL – 1800 kg sin escobillas', pvp: 3999900 },
    { cod: 'AUACKBD2024', nom: 'Accessmatic Bulldog 2024 – 2000 kg industrial 110V', pvp: 3599900 },
    { cod: 'AUELTW25', nom: 'Elite Twist 250 – 2 hojas batiente / 250 kg / 2.5m', pvp: 1799900 },
    { cod: 'AUACEG250', nom: 'Accessmatic Eagle 250 – 2 hojas / 250 kg / 3m', pvp: 2519900 },
    { cod: 'AUACFC300', nom: 'Accessmatic Falcon 300 – 2 hojas / 300 kg / 3m', pvp: 2199900 },
    { cod: 'AUACFC350', nom: 'Accessmatic Falcon 350 – 2 hojas / 350 kg / 4m', pvp: 3749900 },
    { cod: 'AUACEG500', nom: 'Accessmatic Eagle 500 – 2 hojas / 350 kg / 5m', pvp: 3889900 },
    { cod: 'AUACFENIX600', nom: 'Accessmatic Fénix 600 – 2 hojas / 600 kg / 5.5m', pvp: 6719900 },
    { cod: 'AUACFC351', nom: 'Accessmatic Falcon 351 – 1 hoja / 350 kg / 4m', pvp: 2719900 },
    { cod: 'AUACEG501', nom: 'Accessmatic Eagle 501 – 1 hoja / 350 kg / 5m', pvp: 2729900 },
    { cod: 'AUACFENIX601', nom: 'Accessmatic Fénix 601 – 1 hoja / 600 kg / 5.5m', pvp: 4159900 },
    { cod: 'AUACKAR201B', nom: 'Accessmatic Armadillo 200 sin control – 200 kg cortina', pvp: 1249900 },
    { cod: 'AUACKAR382B', nom: 'Accessmatic Armadillo 380 sin control – 380 kg cortina', pvp: 1699900 },
    { cod: 'AUACKAR201F', nom: 'Accessmatic Armadillo 200 con control – 200 kg cortina', pvp: 1349900 },
    { cod: 'AUACKAR382F', nom: 'Accessmatic Armadillo 380 con control – 380 kg cortina', pvp: 1889900 },
    { cod: 'AUELKME611', nom: 'Elite ME622 – 600 kg cortina industrial 110V', pvp: 1169900 },
    { cod: 'AUELKME624DC', nom: 'Elite Spin 624DC – 600 kg cortina con batería 24V', pvp: 1649900 },
    { cod: 'AUELKME8511', nom: 'Elite Spin ME8511 – 800 kg cortina 110V', pvp: 1759900 },
    { cod: 'AUELKME824DC', nom: 'Elite Spin ME824DC – 800 kg cortina con batería', pvp: 2469900 },
    { cod: 'AUACKHULK500S', nom: 'Accessmatic Hulk 500S – 500 kg cortina industrial', pvp: 1399900 },
    { cod: 'AUACKHULK624DC', nom: 'Accessmatic Hulk 624DC – 600 kg cortina con batería', pvp: 1729900 },
    { cod: 'AUACKHULK750', nom: 'Accessmatic Hulk 750 – 750 kg cortina industrial', pvp: 1999900 },
    { cod: 'AUACKHULK950', nom: 'Accessmatic Hulk 950 – 950 kg cortina industrial', pvp: 2249900 },
    { cod: 'AUACKHULK1024DC', nom: 'Accessmatic Hulk 1024DC – 1000 kg cortina con batería', pvp: 2699900 },
    { cod: 'AUACKHULK1500', nom: 'Accessmatic Hulk 1500 – 1500 kg cortina 220V', pvp: 4249900 },
    { cod: 'AUACMTD224', nom: 'Accessmatic Mastodon 224 – barrera vehicular 220V', pvp: 2999900 },
    { cod: 'AUCKMTD224', nom: 'Kit Mastodon 224 + asta metálica 2m', pvp: 3499900 },
    { cod: 'AUACMTD624', nom: 'Accessmatic Mastodon 624 – barrera alta velocidad 110/220V', pvp: 4599900 },
    { cod: 'AUACKMTD624', nom: 'Kit Mastodon 624 + asta telescópica 3-6m', pvp: 5399900 },
    { cod: 'AUACKMTD624ART', nom: 'Kit Mastodon 624 + asta articulada 4m', pvp: 6199900 },
    { cod: 'AUACALW4', nom: 'Control remoto Accessmatic 4 botones verdes 433MHz', pvp: 39900 },
    { cod: 'AUACALH3', nom: 'Control remoto Accessmatic 3 botones visor 433MHz', pvp: 69900 },
    { cod: 'AUACALT2', nom: 'Control remoto Accessmatic 2 botones visor 433MHz', pvp: 69900 },
    { cod: 'AUACALS4', nom: 'Control remoto Accessmatic 4 canales – Pitbull/Bulldozer', pvp: 69900 },
    { cod: 'AUACALM4', nom: 'Control remoto Accessmatic 4 canales – Eagle/Falcon', pvp: 69900 },
    { cod: 'AUACAL3900U', nom: 'Control remoto universal Accessmatic 300-868MHz', pvp: 199900 },
    { cod: 'AUACAF24Li', nom: 'Batería respaldo Accessmatic 24V litio', pvp: 249900 },
    { cod: 'AUACAE20', nom: 'Fotoceldas Accessmatic 20m interior 12-24V', pvp: 55900 },
    { cod: 'AUACAE30', nom: 'Fotoceldas Accessmatic 30m intemperie 12-24V', pvp: 129900 },
    { cod: 'AUACAH45', nom: 'Receptora universal Accessmatic AccessHub 500 controles', pvp: 194900 },
    { cod: 'AUACACCESSCAM', nom: 'Cámara WiFi Accesscam universal 1280p visión nocturna', pvp: 589900 },
    { cod: 'AUELEP100240', nom: 'Módulo WiFi Elite Pulse universal con sensor magnético', pvp: 199900 },
    { cod: 'AUACSONAR', nom: 'Sistema apertura remoto WiFi Accessmatic 2.4GHz', pvp: 149900 },
    { cod: 'AUACFL1224', nom: 'Lámpara LED destellante 12-240V naranja', pvp: 159900 },
    { cod: 'AUACRIM4F', nom: 'Cremallera acero galvanizado 1m – hasta 1200 kg', pvp: 89900 },
    { cod: 'AUACRIM4Z', nom: 'Cremallera gruesa para soldar 1m – hasta 2000 kg', pvp: 129900 },
    { cod: 'AUACRT2415U', nom: 'Fotoceldas Reflex15 – 15m para barreras y comerciales', pvp: 379900 },
    { cod: 'AUELSL3000L', nom: 'Cerradura inteligente Elite Lock SL3000 – 5 métodos', pvp: 329900 },
    { cod: 'AUELSL5000', nom: 'Cerradura inteligente Elite Lock SL5000 WiFi – 5 métodos', pvp: 369900 },
    { cod: 'AUELSL5500L', nom: 'Cerradura inteligente Elite Lock SL5500L WiFi', pvp: 399900 },
    { cod: 'AUACOWL504', nom: 'Cerradura inteligente digital 5 métodos + huella', pvp: 699900 },
    { cod: 'AUACOWL608', nom: 'Cerradura inteligente digital 6 métodos NFC', pvp: 899900 }
  ];

  let filas = [];

  function getCobrosLineas() {
    return global.ArpaCobros?.getLines('cot') || [];
  }

  function buscarProductoCot() {
    const q = document.getElementById('buscador-cot')?.value.toLowerCase().trim();
    const res = document.getElementById('resultados-cot');
    if (!res) return;
    if (!q || q.length < 2) {
      res.style.display = 'none';
      updateCatalogHint();
      return;
    }
    const catalogo = getCatalogoActivo();
    if (!catalogo.length) {
      res.style.display = 'none';
      updateCatalogHint();
      return;
    }
    const encontrados = catalogo.filter((p) =>
      p.nom.toLowerCase().includes(q) || p.cod.toLowerCase().includes(q)
    ).slice(0, 10);
    if (!encontrados.length) {
      res.innerHTML = '<div class="resultado-item"><span class="resultado-nom" style="color:var(--muted)">Sin resultados</span></div>';
      res.style.display = 'block';
      return;
    }
    res.innerHTML = encontrados.map((p) =>
      `<div class="resultado-item" data-cod="${p.cod}">
        <span class="resultado-cod">${p.cod}</span>
        <span class="resultado-nom">${p.nom}</span>
        <span class="resultado-pvp">${formatoPesos(p.pvp)}</span>
      </div>`
    ).join('');
    res.style.display = 'block';
    res.querySelectorAll('.resultado-item[data-cod]').forEach((el) => {
      el.addEventListener('click', () => seleccionarProductoCot(el.dataset.cod));
    });
  }

  function seleccionarProductoCot(cod) {
    const prod = getCatalogoActivo().find((p) => p.cod === cod);
    if (!prod) return;
    const cant = parseInt(document.getElementById('cant-input-cot')?.value, 10) || 1;
    const existente = filas.find((f) => f.cod === prod.cod);
    if (existente) existente.cant += cant;
    else filas.push({ cod: prod.cod, nom: prod.nom, pvp: prod.pvp, cant, tipo: 'producto' });
    document.getElementById('buscador-cot').value = '';
    document.getElementById('resultados-cot').style.display = 'none';
    document.getElementById('cant-input-cot').value = '1';
    renderTablaCot();
  }

  function renderTablaCot() {
    const tbody = document.getElementById('cot-tabla-body');
    if (!tbody) return;

    const cobros = getCobrosLineas();
    const lineas = filas.length + cobros.length;

    if (!lineas) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Agregue productos o ítems de cobro</td></tr>';
      recalcularCotizacion();
      return;
    }

    let html = '';
    filas.forEach((f, idx) => {
      html += `<tr>
        <td class="td-cod">${f.cod}</td>
        <td class="td-desc">${f.nom}</td>
        <td class="td-cant"><input type="number" class="cot-cant-input" min="1" value="${f.cant}" data-fila="${idx}"></td>
        <td class="td-precio">${formatoPesos(f.pvp)}</td>
        <td class="td-total">${formatoPesos(f.pvp * f.cant)}</td>
        <td class="td-action"><button type="button" class="btn-quitar no-print" data-quitar="${idx}">✕</button></td>
      </tr>`;
    });
    cobros.forEach((f) => {
      html += `<tr class="row-cobro">
        <td class="td-cod">${f.cod}</td>
        <td class="td-desc">${f.nom}</td>
        <td class="td-cant"><span class="cot-cant-static">1</span></td>
        <td class="td-precio">${formatoPesos(f.pvp)}</td>
        <td class="td-total">${formatoPesos(f.pvp)}</td>
        <td class="td-action"></td>
      </tr>`;
    });

    tbody.innerHTML = html;
    tbody.querySelectorAll('.cot-cant-input').forEach((input) => {
      input.addEventListener('change', () => {
        const idx = Number(input.dataset.fila);
        filas[idx].cant = parseInt(input.value, 10) || 1;
        renderTablaCot();
      });
    });
    tbody.querySelectorAll('[data-quitar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        filas.splice(Number(btn.dataset.quitar), 1);
        renderTablaCot();
      });
    });
    recalcularCotizacion();
  }

  function recalcularCotizacion() {
    const subtotalProductos = filas.reduce((s, f) => s + f.pvp * f.cant, 0);
    const subtotalCobros = getCobrosLineas().reduce((s, f) => s + f.pvp * f.cant, 0);
    const subtotal = subtotalProductos + subtotalCobros;
    const conIva = document.getElementById('iva-check-cot')?.checked;
    const iva = conIva ? subtotal * 0.19 : 0;
    const total = subtotal + iva;
    const subEl = document.getElementById('subtotal-val-cot');
    const ivaEl = document.getElementById('iva-val-cot');
    const totalEl = document.getElementById('total-val-cot');
    const ivaRow = document.getElementById('iva-row-cot');
    if (subEl) subEl.textContent = formatoPesos(subtotal);
    if (ivaEl) ivaEl.textContent = formatoPesos(iva);
    if (totalEl) totalEl.textContent = formatoPesos(total);
    if (ivaRow) ivaRow.style.display = conIva ? 'flex' : 'none';
  }

  function formatCotNumero(n) {
    return 'COT-' + String(n).padStart(3, '0');
  }

  function parseCotNumero(value) {
    const match = String(value || '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function getUltimoCot() {
    try {
      const stored = parseInt(localStorage.getItem('arpa_ultimo_cot') || '0', 10);
      const fieldNum = parseCotNumero(document.getElementById('numero-cot')?.value);
      return Math.max(stored, fieldNum);
    } catch (e) { return 0; }
  }

  function nuevoCotNumero() {
    const nuevo = getUltimoCot() + 1;
    try { localStorage.setItem('arpa_ultimo_cot', String(nuevo)); } catch (e) {}
    const num = formatCotNumero(nuevo);
    const numField = document.getElementById('numero-cot');
    if (numField) numField.value = num;
    const hoy = new Date();
    const fecha = document.getElementById('cot-fecha');
    const validez = document.getElementById('cot-validez');
    if (fecha) fecha.value = hoy.toISOString().split('T')[0];
    if (validez) {
      const v = new Date(hoy);
      v.setDate(v.getDate() + 15);
      validez.value = v.toISOString().split('T')[0];
    }
    const cliente = document.getElementById('cot-nombre')?.value || '';
    const nc = cliente ? '-' + cliente.replace(/\s+/g, '-').substring(0, 20) : '';
    document.title = `${num}${nc}-${hoy.toISOString().slice(0, 10)}`;
  }

  function ensureCotNumero() {
    const numField = document.getElementById('numero-cot');
    if (numField && !numField.value.trim()) nuevoCotNumero();
  }

  function guardarCotPDF() {
    global.applyUserSettingsToUI?.();
    renderTablaCot();
    document.body.classList.add('is-printing');

    const viewRoot = document.getElementById('view-cotizacion');
    const elementos = viewRoot.querySelectorAll(
      'input:not([type=file]):not([type=checkbox]):not(.cot-cant-input):not(.cobro-desc):not(.cobro-valor), select, textarea'
    );
    const respaldos = [];
    elementos.forEach((el) => {
      const valor = el.tagName === 'SELECT'
        ? el.options[el.selectedIndex]?.text || ''
        : el.value || '';
      const span = document.createElement('span');
      span.className = 'pdf-valor';
      span.textContent = valor || el.placeholder || '';
      span.style.cssText = `display:inline-block;width:100%;font-size:13px;color:${valor ? '#1e293b' : '#9ca3af'};padding:8px 10px;font-family:'DM Sans',sans-serif;border-bottom:1px solid #d1d5db;min-height:36px;`;
      respaldos.push({ el, parent: el.parentNode });
      el.parentNode.replaceChild(span, el);
    });

    viewRoot.querySelectorAll('.cot-cant-input').forEach((input) => {
      const span = document.createElement('span');
      span.className = 'pdf-valor';
      span.textContent = input.value;
      span.style.cssText = 'display:inline-block;width:100%;text-align:center;font-size:13px;padding:4px;';
      respaldos.push({ el: input, parent: input.parentNode });
      input.parentNode.replaceChild(span, input);
    });

    const btnWrap = document.getElementById('pdf-actions-cot');
    if (btnWrap) btnWrap.style.display = 'none';
    document.getElementById('cobros-actions-cot')?.style.setProperty('display', 'none');
    document.getElementById('settings-modal')?.classList.remove('open');

    window.ArpaSignature?.prepareForPrint?.([
      'canvas-cot-cliente',
      'canvas-cot-elaborado'
    ]);

    window.print();

    setTimeout(() => {
      document.body.classList.remove('is-printing');
      global.ArpaSignature?.restoreAfterPrint?.();
      respaldos.forEach(({ el, parent }) => {
        const span = parent.querySelector('.pdf-valor');
        if (span) parent.replaceChild(el, span);
      });
      if (btnWrap) btnWrap.style.display = '';
      document.getElementById('cobros-actions-cot')?.style.removeProperty('display');
      renderTablaCot();
    }, 1000);
  }

  function refreshCobros() {
    global.ArpaCobros?.renderEditor('cot');
    renderTablaCot();
  }

  function initCotizacion() {
    global.ArpaCobros?.init('cot');
    global.ArpaCobros?.seedFromPriceList('cot');

    const hoy = new Date();
    const fecha = document.getElementById('cot-fecha');
    const validez = document.getElementById('cot-validez');
    if (fecha && !fecha.value) fecha.value = hoy.toISOString().split('T')[0];
    if (validez && !validez.value) {
      const v = new Date(hoy);
      v.setDate(v.getDate() + 15);
      validez.value = v.toISOString().split('T')[0];
    }
    const numField = document.getElementById('numero-cot');
    if (numField && !numField.value.trim()) {
      ensureCotNumero();
    }

    document.getElementById('buscador-cot')?.addEventListener('input', buscarProductoCot);
    document.getElementById('buscador-cot')?.addEventListener('focus', updateCatalogHint);
    document.getElementById('iva-check-cot')?.addEventListener('change', recalcularCotizacion);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.buscador-wrap-cot')) {
        const res = document.getElementById('resultados-cot');
        if (res) res.style.display = 'none';
      }
    });
    renderTablaCot();
    updateCatalogHint();
  }

  global.ArpaCotizacion = {
    initCotizacion,
    refreshCobros,
    renderTablaCot,
    nuevoCotNumero,
    ensureCotNumero,
    guardarCotPDF,
    getCatalogoActivo,
    updateCatalogHint,
    PRODUCT_CATALOG_KEY
  };

  global.guardarCotPDF = guardarCotPDF;
  global.nuevoCotNumero = nuevoCotNumero;
  global.ensureCotNumero = ensureCotNumero;
})(window);
