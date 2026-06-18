/**
 * Módulo: Cotización, ítems dinámicos y PDF
 */
(function (global) {
  var COT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyV0-C_XACD5suCh9gm1JkiKvrI3mket-z5GSFGFc6Y87HZaqFyCtVz7jmtQMayNEUeJg/exec';

  function guardarEnSheets(numCot, cliente, telefono, total, fecha) {
    return new Promise(function (resolve, reject) {
      var cb = '_arpaCotSheet_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var script = document.createElement('script');
      var settled = false;

      function finish(fn, val) {
        if (settled) return;
        settled = true;
        try { delete global[cb]; } catch (e) { global[cb] = undefined; }
        script.remove();
        fn(val);
      }

      global[cb] = function (data) { finish(resolve, data); };
      script.onerror = function () { finish(reject, new Error('network')); };

      // Orden columnas Sheet: Número COT | Nombre cliente | Teléfono | Total | Fecha
      script.src = COT_SHEETS_URL
        + '?action=save'
        + '&numCot=' + encodeURIComponent(String(numCot || ''))
        + '&cliente=' + encodeURIComponent(String(cliente || ''))
        + '&telefono=' + encodeURIComponent(String(telefono || ''))
        + '&total=' + encodeURIComponent(String(total || ''))
        + '&fecha=' + encodeURIComponent(String(fecha || ''))
        + '&callback=' + cb;

      (document.body || document.head).appendChild(script);
    });
  }

  function formatoPesos(n) {
    return global.ArpaPricing?.formatoPesos(n) || ('$ ' + (Number(n) || 0).toLocaleString('es-CO'));
  }

  function getCatalogoActivo() {
    return global.ArpaCatalogo?.getListaProductos?.() || [];
  }

  function updateCatalogHint() {
    const hint = document.getElementById('cot-catalog-hint');
    if (!hint) return;
    hint.hidden = getCatalogoActivo().length > 0;
  }

  let filas = [];

  function getCobrosLineas() {
    global.ArpaCobros?.syncFromEditor?.('cot');
    return global.ArpaCobros?.getLines('cot') || [];
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parsePvp(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function actualizarTotalFila(idx) {
    const f = filas[idx];
    if (!f) return;
    const tr = document.querySelector(`#cot-tabla-body tr[data-fila="${idx}"]`);
    const totalCell = tr?.querySelector('.td-total');
    if (totalCell) totalCell.textContent = formatoPesos(f.pvp * f.cant);
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
      p.nom.toLowerCase().includes(q) ||
      p.cod.toLowerCase().includes(q) ||
      (p.marca && p.marca.toLowerCase().includes(q))
    ).slice(0, 10);
    if (!encontrados.length) {
      res.innerHTML = '<div class="resultado-item"><span class="resultado-nom" style="color:var(--muted)">Sin resultados</span></div>';
      res.style.display = 'block';
      return;
    }
    res.innerHTML = encontrados.map((p) =>
      `<div class="resultado-item" data-cod="${p.cod}" data-pvp="${p.pvp || 0}">
        <span class="resultado-cod">${p.cod}</span>
        <span class="resultado-nom">${p.nom}</span>
        <span class="resultado-pvp">${formatoPesos(p.pvp)}</span>
      </div>`
    ).join('');
    res.style.display = 'block';
    res.querySelectorAll('.resultado-item[data-cod]').forEach((el) => {
      el.addEventListener('click', () => seleccionarProductoCot(el.dataset.cod, el.dataset.pvp));
    });
  }

  function resolveProductPvp(prod, cod, pvpHint) {
    const code = cod || prod?.cod;
    let pvp = global.ArpaCatalogo?.getPrecioByCod?.(code);
    if (!pvp) pvp = global.ArpaCatalogo?.getPrecioVenta?.(code, prod);
    if (!pvp && pvpHint != null) pvp = parsePvp(pvpHint);
    if (!pvp && prod?.pvp) pvp = prod.pvp;
    return parsePvp(pvp);
  }

  function seleccionarProductoCot(cod, pvpHint) {
    const prod = global.ArpaCatalogo?.findByCod?.(cod) || getCatalogoActivo().find((p) => p.cod === cod);
    if (!prod) return;
    const cant = parseInt(document.getElementById('cant-input-cot')?.value, 10) || 1;
    const pvpCatalogo = resolveProductPvp(prod, cod, pvpHint);
    const existente = filas.find((f) => f.cod === prod.cod);
    if (existente) {
      existente.cant += cant;
      if (!existente.pvp && pvpCatalogo) existente.pvp = pvpCatalogo;
    } else {
      filas.push({
        cod: prod.cod,
        nom: prod.nom,
        pvp: pvpCatalogo,
        cant,
        tipo: 'producto',
      });
    }
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
      html += `<tr class="cot-row" data-fila="${idx}">
        <td class="td-cod">${escapeHtml(f.cod)}</td>
        <td class="td-desc"><span class="cot-desc-text">${escapeHtml(f.nom)}</span></td>
        <td class="td-cant"><input type="number" class="cot-cant-input" min="1" value="${f.cant}" data-fila="${idx}"></td>
        <td class="td-precio"><input type="number" class="cot-pvp-input" min="0" step="1000" value="${f.pvp}" data-fila="${idx}" inputmode="numeric"></td>
        <td class="td-total">${formatoPesos(f.pvp * f.cant)}</td>
        <td class="td-action"><button type="button" class="btn-quitar no-print" data-quitar="${idx}">✕</button></td>
      </tr>`;
    });
    cobros.forEach((f) => {
      html += `<tr class="row-cobro cot-row" data-cobro="1">
        <td class="td-cod">${escapeHtml(f.cod)}</td>
        <td class="td-desc"><span class="cot-desc-text">${escapeHtml(f.nom)}</span></td>
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
        actualizarTotalFila(idx);
        recalcularCotizacion();
      });
    });
    tbody.querySelectorAll('.cot-pvp-input').forEach((input) => {
      const syncPvp = () => {
        const idx = Number(input.dataset.fila);
        filas[idx].pvp = parsePvp(input.value);
        actualizarTotalFila(idx);
        recalcularCotizacion();
      };
      input.addEventListener('change', syncPvp);
      input.addEventListener('input', syncPvp);
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
    return global.ArpaNumeracion?.formatCotNumber?.(n) || ('COT-' + String(n).padStart(3, '0'));
  }

  function parseCotNumero(value) {
    return global.ArpaNumeracion?.parseSequenceNumber?.(value) || 0;
  }

  function getUltimoCot() {
    const N = global.ArpaNumeracion;
    if (!N) return 0;
    return N.getMaxCounter(N.KEYS.cot, document.getElementById('numero-cot')?.value);
  }

  function nuevoCotNumero() {
    if (!global.ArpaNumeracion?.blockIfPymeMissingCode?.()) return;
    const numField = document.getElementById('numero-cot');
    const { value } = global.ArpaNumeracion.nextNumber('cot', numField?.value);
    if (numField) numField.value = value;
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
    document.title = `${value}${nc}-${hoy.toISOString().slice(0, 10)}`;
  }

  function ensureCotNumero() {
    const numField = document.getElementById('numero-cot');
    if (numField && !numField.value.trim()) nuevoCotNumero();
  }

  function lockCotRowsForPrint(viewRoot) {
    if (!viewRoot) return [];
    const backups = [];
    viewRoot.querySelectorAll('#cot-tabla-body tr.cot-row').forEach((tr) => {
      backups.push({
        el: tr,
        breakInside: tr.style.breakInside,
        pageBreakInside: tr.style.pageBreakInside,
      });
      tr.style.breakInside = 'avoid-page';
      tr.style.pageBreakInside = 'avoid';
    });
    return backups;
  }

  function unlockCotRowsForPrint(backups) {
    backups.forEach(({ el, breakInside, pageBreakInside }) => {
      el.style.breakInside = breakInside;
      el.style.pageBreakInside = pageBreakInside;
    });
  }

  function guardarCotPDF() {
    var _numCot = (document.getElementById('numero-cot')?.value || '').trim();
    var _cliente = document.querySelector('#cot-nombre, #cot-cliente, input[name*=nombre]')?.value?.trim() || '';
    var _telefono = document.querySelector('#cot-tel, #cot-telefono, input[name*=tel]')?.value?.trim() || '';
    var _total = document.querySelector('#total-val-cot, #cot-total, .cot-total')?.textContent?.trim() || '';
    var _fecha = document.getElementById('cot-fecha')?.value?.trim()
      || new Date().toISOString().split('T')[0];
    guardarEnSheets(_numCot, _cliente, _telefono, _total, _fecha);

    global.applyUserSettingsToUI?.();
    global.ArpaCobros?.syncFromEditor?.('cot');
    renderTablaCot();

    const viewRoot = document.getElementById('view-cotizacion');
    const viewWasHidden = viewRoot?.hasAttribute('hidden') ?? false;
    if (viewRoot) viewRoot.removeAttribute('hidden');

    document.body.classList.add('is-printing');
    global.ArpaBrand?.prepareForPrint?.();
    global.ArpaI18n?.preparePdfSpanish?.('view-cotizacion');
    global.ArpaCobros?.syncFromEditor?.('cot');
    renderTablaCot();
    const rowPrintBackups = lockCotRowsForPrint(viewRoot);
    const elementos = viewRoot.querySelectorAll(
      'input:not([type=file]):not([type=checkbox]):not(.cot-cant-input):not(.cot-pvp-input):not(.cobro-desc):not(.cobro-valor), select, textarea'
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

    viewRoot.querySelectorAll('.cot-pvp-input').forEach((input) => {
      const span = document.createElement('span');
      span.className = 'pdf-valor';
      span.textContent = formatoPesos(parsePvp(input.value));
      span.style.cssText = 'display:inline-block;width:100%;text-align:right;font-size:13px;padding:4px;font-family:\'DM Mono\',monospace;font-weight:600;';
      respaldos.push({ el: input, parent: input.parentNode });
      input.parentNode.replaceChild(span, input);
    });

    const btnStack = document.querySelector('#pdf-actions-cot .pdf-actions-stack');
    if (btnStack) btnStack.style.display = 'none';
    document.getElementById('cobros-actions-cot')?.style.setProperty('display', 'none');
    document.getElementById('settings-modal')?.classList.remove('open');

    window.ArpaSignature?.prepareForPrint?.([
      'canvas-cot-cliente',
      'canvas-cot-elaborado'
    ]);

    const tituloRespaldo = document.title;
    const numCot = document.getElementById('numero-cot')?.value.trim() || 'Cotización';
    document.title = numCot;

    window.print();

    setTimeout(() => {
      document.title = tituloRespaldo;
      if (viewRoot && viewWasHidden) viewRoot.setAttribute('hidden', '');
      document.body.classList.remove('is-printing');
      global.ArpaI18n?.restorePdfSpanish?.();
      global.ArpaBrand?.restoreAfterPrint?.();
      unlockCotRowsForPrint(rowPrintBackups);
      global.ArpaSignature?.restoreAfterPrint?.();
      respaldos.forEach(({ el, parent }) => {
        const span = parent.querySelector('.pdf-valor');
        if (span) parent.replaceChild(el, span);
      });
      if (btnStack) btnStack.style.display = '';
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
  };

  global.guardarCotPDF = guardarCotPDF;
  global.nuevoCotNumero = nuevoCotNumero;
  global.ensureCotNumero = ensureCotNumero;
})(window);
