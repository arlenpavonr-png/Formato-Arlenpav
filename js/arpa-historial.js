/**
 * Historial de servicios (localStorage)
 */
(function (global) {
  const STORAGE_KEY = 'arpa_suite_servicio_historial';
  const MAX_RECORDS = 200;

  function formatFechaLegible(fechaStr) {
    if (!fechaStr) return '—';
    var d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
      return String(d.getDate()).padStart(2,'0') + '/' +
             String(d.getMonth()+1).padStart(2,'0') + '/' +
             d.getFullYear();
    }
    return fechaStr;
  }

  const TIPO_LABEL = {
    instalacion: 'Instalación',
    mantenimiento: 'Mantenimiento',
    reparacion: 'Reparación'
  };

  const DOC_META = {
    formato: { icon: '📋', label: 'Formato de Servicio', className: 'historial-doc-formato' },
    cotizacion: { icon: '💰', label: 'Cotización', className: 'historial-doc-cotizacion' },
    'cuenta-cobro': { icon: '🧾', label: 'Cuenta de Cobro', className: 'historial-doc-cuenta-cobro' }
  };

  function getRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  }

  function newRecordId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function readInputLikePdf(el) {
    if (!el) return '';
    if (el.tagName === 'SELECT') {
      return (el.options[el.selectedIndex]?.text || '').trim();
    }
    const valor = (el.value || '').trim();
    return valor || (el.placeholder || '').trim();
  }

  function inferModulo(record) {
    if (!record) return 'formato';
    if (record.modulo === 'cuenta-cobro') return 'cuenta-cobro';
    if (record.modulo === 'cotizacion')   return 'cotizacion';
    var num = (record.numero || record.numeroServicio || '')
                .toString().toUpperCase();
    var doc = (record.documento || '').toLowerCase().trim();
    var tipo = (record.tipo || '').toLowerCase().trim();
    if (num.startsWith('CC-') || doc === 'cuenta de cobro'
        || tipo === 'cuenta de cobro') return 'cuenta-cobro';
    if (num.startsWith('AP-') || num.startsWith('COT-')
        || doc === 'cotización' || doc === 'cotizacion'
        || tipo === 'cotización' || tipo === 'cotizacion')
      return 'cotizacion';
    return 'formato';
  }

  function getDocumentoMeta(record) {
    const modulo = inferModulo(record);
    return DOC_META[modulo] || DOC_META.formato;
  }

  function getDocumentoLabel(record) {
    return record?.documento || getDocumentoMeta(record).label;
  }

  function getSubtipoLabel(record) {
    if (record?.subtipo) return record.subtipo;
    const modulo = inferModulo(record);
    if (modulo === 'formato') {
      const tipo = record?.tipo || '';
      if (tipo && tipo !== getDocumentoLabel(record)) return tipo;
    }
    return '';
  }

  function shouldShowTotal(record) {
    const modulo = inferModulo(record);
    return modulo === 'cotizacion' || modulo === 'cuenta-cobro';
  }

  function getSinDescripcion() { return window.ArpaI18n.t('ui.historial.sin_descripcion'); }

  function trimBrief(text, maxLen) {
    const limit = maxLen || 100;
    const s = String(text || '').trim();
    if (!s) return '';
    return s.length > limit ? s.slice(0, limit - 1) + '…' : s;
  }

  function firstNonEmpty(values) {
    for (let i = 0; i < values.length; i += 1) {
      const t = trimBrief(values[i]);
      if (t) return t;
    }
    return '';
  }

  function buildConceptoFromItemList(items) {
    const list = (items || []).map((item) => String(item || '').trim()).filter(Boolean);
    if (!list.length) return '';
    const first = list[0];
    if (list.length > 1) return `${first} + ${list.length - 1} más`;
    return first;
  }

  function truncateConcepto(text, maxLen) {
    const limit = maxLen || 60;
    const s = String(text || '').trim();
    return s.length > limit ? s.slice(0, limit) + '...' : s;
  }

  function getConceptoDisplay(record, options) {
    const partes = [];
    const subtipo = getSubtipoLabel(record);
    const concepto = (record?.concepto || '').trim();
    if (subtipo) {
      const conceptoLower = concepto.toLowerCase();
      const subtipoLower = subtipo.toLowerCase();
      if (!conceptoLower.startsWith(subtipoLower)) {
        partes.push(subtipo);
      }
    }
    if (concepto) partes.push(concepto);
    if (!partes.length) return getSinDescripcion();
    const texto = partes.join(' · ');
    return options?.full ? texto : truncateConcepto(texto);
  }

  function getFormatoBriefDetail() {
    const oficioId = global.ArpaFormatoTipo?.getDocumentFormatoOficio?.()
      || global.ArpaOficios?.getActiveFormatoOficioId?.()
      || 'automatismos';
    const equipo = global.ArpaFormatoTipo?.getFormatoEquipoValues?.(oficioId);
    const materiales = [];
    document.querySelectorAll('#view-formato .mat-row input[type="text"]').forEach((input) => {
      const v = (input.value || '').trim();
      if (v) materiales.push(v);
    });
    if (equipo) {
      return firstNonEmpty([
        equipo.referencia,
        equipo.marca,
        ...materiales
      ]);
    }
    return firstNonEmpty([...materiales]);
  }

  function getFormatoObservaciones() {
    const lines = [];
    document.querySelectorAll('#view-formato .obs-lines input').forEach((input) => {
      const v = (input.value || '').trim();
      if (v) lines.push(v);
    });
    return firstNonEmpty(lines);
  }

  function buildFormatoConcepto() {
    const tipoEl = document.querySelector('#view-formato input[name="tipo"]:checked');
    const tipoKey = tipoEl?.value || 'instalacion';
    const tipoLabel = TIPO_LABEL[tipoKey] || 'Instalación';
    const detail = getFormatoBriefDetail();
    if (detail) return `${tipoLabel} — ${detail}`;
    const obs = getFormatoObservaciones();
    if (obs) return obs;
    return tipoLabel;
  }

  function buildCotizacionConcepto() {
    const labels = global.ArpaCotizacion?.getCotItemLabels?.() || [];
    let concepto = buildConceptoFromItemList(labels);
    if (!concepto) {
      const obs = (document.getElementById('cot-obs')?.value || '').trim();
      if (obs) concepto = trimBrief(obs, 120);
    }
    return concepto || getSinDescripcion();
  }

  function buildCuentaCobroConcepto(snap) {
    const d = snap || global.ArpaCuentaCobro?.getFormSnapshot?.();
    const items = (d?.servicios || [])
      .map((s) => (s.desc || '').trim())
      .filter(Boolean);
    let concepto = buildConceptoFromItemList(items);
    if (!concepto && d?.observaciones) concepto = trimBrief(d.observaciones, 120);
    return concepto || getSinDescripcion();
  }

  function addRecord(record) {
    const records = getRecords();
    const numero = String(record.numero || '').trim();
    const modulo = inferModulo(record);

    let finalRecord = record;
    if (numero) {
      const existingIdx = records.findIndex(
        (r) => inferModulo(r) === modulo && String(r.numero || '').trim() === numero
      );
      if (existingIdx !== -1) {
        const existing = records[existingIdx];
        finalRecord = { ...existing, ...record, id: existing.id };
        records.splice(existingIdx, 1);
        records.unshift(finalRecord);
        saveRecords(records);
        render();
        global.ArpaCloudSync?.pushHistorialEntry?.(finalRecord);
        return finalRecord;
      }
    }

    records.unshift(finalRecord);
    saveRecords(records);
    render();
    global.ArpaCloudSync?.pushHistorialEntry?.(finalRecord);
    return finalRecord;
  }

  function readFormSnapshot() {
    const tipoEl = document.querySelector('#view-formato input[name="tipo"]:checked');
    const tipoKey = tipoEl?.value || 'instalacion';
    const numeroServicio = readInputLikePdf(document.getElementById('numero-formato'));

    return {
      numero: numeroServicio,
      numeroServicio,
      cliente: readInputLikePdf(document.getElementById('formato-cliente-nombre')),
      subtipo: TIPO_LABEL[tipoKey] || 'Instalación',
      ciudad: readInputLikePdf(document.getElementById('formato-cliente-ciudad')),
      fecha: document.getElementById('formato-fecha')?.value || ''
    };
  }

  function captureFromFormato() {
    const snap = readFormSnapshot();
    return addRecord({
      id: newRecordId(),
      modulo: 'formato',
      documento: 'Formato de Servicio',
      subtipo: snap.subtipo,
      tipo: snap.subtipo,
      numero: snap.numero,
      numeroServicio: snap.numeroServicio,
      cliente: snap.cliente,
      ciudad: snap.ciudad,
      fecha: snap.fecha,
      concepto: buildFormatoConcepto(),
      formatoOficio: global.ArpaFormatoTipo?.getDocumentFormatoOficio?.() || 'automatismos',
      savedAt: new Date().toISOString()
    });
  }

  function captureFromCotizacion(snap) {
    const d = snap || global.ArpaCotizacion?.getCotSnapshot?.();
    if (!d) return null;

    return addRecord({
      id: newRecordId(),
      modulo: 'cotizacion',
      documento: 'Cotización',
      tipo: 'Cotización',
      numero: d.numero || '',
      numeroServicio: d.numero || '',
      cliente: d.cliente || '',
      ciudad: d.ciudad || '',
      fecha: d.fecha || '',
      total: d.total,
      concepto: buildCotizacionConcepto(),
      savedAt: new Date().toISOString()
    });
  }

  function captureFromCuentaCobro(snap) {
    const d = snap || global.ArpaCuentaCobro?.getFormSnapshot?.();
    if (!d) return null;

    return addRecord({
      id: newRecordId(),
      modulo: 'cuenta-cobro',
      documento: 'Cuenta de Cobro',
      tipo: 'Cuenta de Cobro',
      numero: d.numero || '',
      numeroServicio: d.numero || '',
      cliente: d.cliente?.nombre || '',
      ciudad: d.ciudad || '',
      fecha: d.fechaEmision || '',
      total: d.total,
      concepto: buildCuentaCobroConcepto(d),
      savedAt: new Date().toISOString()
    });
  }

  function removeRecord(id) {
    saveRecords(getRecords().filter((r) => r.id !== id));
    render();
    global.ArpaCloudSync?.deleteHistorialEntry?.(id);
  }

  function dedupeRecords() {
    const records = getRecords();
    if (records.length < 2) return false;

    const seen = new Set();
    const result = [];
    const removedIds = [];
    records.forEach((r) => {
      const numero = String(r.numero || '').trim();
      if (!numero) { result.push(r); return; }
      const key = inferModulo(r) + '|' + numero;
      if (seen.has(key)) {
        removedIds.push(r.id);
        return;
      }
      seen.add(key);
      result.push(r);
    });

    if (!removedIds.length) return false;
    saveRecords(result);
    removedIds.forEach((id) => global.ArpaCloudSync?.deleteHistorialEntry?.(id));
    return true;
  }

  function formatoPesos(n) {
    return global.ArpaPricing?.formatoPesos(n) || ('$ ' + (Number(n) || 0).toLocaleString('es-CO'));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function renderCard(r) {
    const meta = getDocumentoMeta(r);
    const subtipo = getSubtipoLabel(r);
    const showTotal = shouldShowTotal(r) && r.total != null;
    return `
      <article class="historial-card" data-id="${escapeHtml(r.id)}">
        <div class="historial-card-head">
          <span class="historial-num">N° ${escapeHtml(r.numeroServicio || r.numero || '—')}</span>
          <span class="historial-tipo ${meta.className}">
            ${meta.icon} ${escapeHtml(getDocumentoLabel(r))}
            ${subtipo ? `<span class="historial-subtipo">${escapeHtml(subtipo)}</span>` : ''}
          </span>
        </div>
        <div class="historial-card-body">
          <div class="historial-row"><span>${escapeHtml(window.ArpaI18n.t('ui.historial.cliente'))}</span><strong>${escapeHtml(r.cliente || '—')}</strong></div>
          <div class="historial-row historial-row-concepto"><span>${escapeHtml(window.ArpaI18n.t('ui.historial.concepto'))}</span><strong>${escapeHtml(getConceptoDisplay(r))}</strong></div>
          <div class="historial-row"><span>${escapeHtml(window.ArpaI18n.t('ui.historial.ciudad'))}</span><strong>${escapeHtml(r.ciudad || '—')}</strong></div>
          <div class="historial-row"><span>${escapeHtml(window.ArpaI18n.t('ui.historial.fecha'))}</span><strong>${escapeHtml(formatFechaLegible(r.fecha))}</strong></div>
          ${showTotal ? `<div class="historial-row"><span>${escapeHtml(window.ArpaI18n.t('ui.historial.total'))}</span><strong>${escapeHtml(formatoPesos(r.total))}</strong></div>` : ''}
        </div>
        <button type="button" class="historial-delete" data-id="${escapeHtml(r.id)}" aria-label="${escapeHtml(window.ArpaI18n.t('aria.historial.eliminar_registro'))}">${escapeHtml(window.ArpaI18n.t('ui.historial.eliminar'))}</button>
        <button type="button" class="btn-ver-doc" onclick="ArpaHistorial.verDocumento('${escapeHtml(r.id)}')">
          ${escapeHtml(window.ArpaI18n.t('ui.historial.ver_documento'))} 📄
        </button>
      </article>`;
  }

  function verDocumento(id) {
    const records = getRecords();
    const r = records.find((rec) => rec.id === id);
    if (!r) {
      alert(window.ArpaI18n.t('alert.historial.registro_no_encontrado'));
      return;
    }
    const modulo = inferModulo(r);

    if (modulo === 'formato') {
      document.querySelector('.main-menu-btn[onclick*="scrollToTopMenu"]')?.click();
      setTimeout(() => {
        if (r.cliente) {
          const el = document.getElementById('formato-cliente-nombre');
          if (el) el.value = r.cliente;
        }
        if (r.ciudad) {
          const el = document.getElementById('formato-cliente-ciudad');
          if (el) el.value = r.ciudad;
        }
        if (r.fecha) {
          const el = document.getElementById('formato-fecha');
          if (el) el.value = r.fecha;
        }
        window.scrollTo(0, 0);
        alert(window.ArpaI18n.t('alert.historial.documento_restaurado'));
      }, 400);
    } else if (modulo === 'cotizacion') {
      document.querySelector('.main-menu-btn[onclick*="openCotizacionView"]')?.click();
      setTimeout(() => {
        if (r.cliente) {
          const el = document.getElementById('cot-nombre');
          if (el) el.value = r.cliente;
        }
        if (r.ciudad) {
          const el = document.getElementById('cot-ciudad');
          if (el) el.value = r.ciudad;
        }
        if (r.fecha) {
          const el = document.getElementById('cot-fecha');
          if (el) el.value = r.fecha;
        }
        window.scrollTo(0, 0);
        alert(window.ArpaI18n.t('alert.historial.documento_restaurado'));
      }, 400);
    } else {
      document.querySelector('.main-menu-btn[onclick*="openCuentaCobroView"]')?.click();
      setTimeout(() => {
        if (r.cliente) {
          const el = document.getElementById('cc-cliente-nombre');
          if (el) el.value = r.cliente;
        }
        if (r.fecha) {
          const el = document.getElementById('cc-fecha-emision');
          if (el) el.value = r.fecha;
        }
        window.scrollTo(0, 0);
        alert(window.ArpaI18n.t('alert.historial.documento_restaurado'));
      }, 400);
    }
  }

  let filtroActivo = 'todos';
  let textoBusqueda = '';

  function renderStats() {
    function toYM(str) {
      if (!str) return '';
      if (/^\d{4}-\d{2}/.test(str)) return str.slice(0, 7);
      var d = new Date(str);
      if (!isNaN(d.getTime())) return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      return '';
    }
    var records = getRecords();
    var ahora = new Date();
    var mesActual = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0');
    var esteMes = records.filter(function(r) {
      return toYM(r.fecha) === mesActual || toYM(r.savedAt) === mesActual;
    });
    var totalCotMes = esteMes
      .filter(function(r) { return inferModulo(r) === 'cotizacion' && r.total; })
      .reduce(function(s, r) { return s + (Number(r.total) || 0); }, 0);
    var elTotal = document.getElementById('hist-stat-total-n');
    var elMes   = document.getElementById('hist-stat-mes-n');
    var elCot   = document.getElementById('hist-stat-cot-mes');
    if (elTotal) elTotal.textContent = records.length;
    if (elMes)   elMes.textContent   = esteMes.length;
    if (elCot)   elCot.textContent   = formatoPesos(totalCotMes);
  }

  function render() {
    renderStats();
    const list = document.getElementById('historial-list');
    const empty = document.getElementById('historial-empty');
    if (!list) return;

    let records = getRecords();

    if (filtroActivo !== 'todos') {
      records = records.filter(function(r) { return inferModulo(r) === filtroActivo; });
    }

    if (textoBusqueda.trim()) {
      const q = textoBusqueda.trim().toLowerCase();
      records = records.filter(function(r) {
        return (r.cliente || '').toLowerCase().includes(q)
          || (r.ciudad  || '').toLowerCase().includes(q)
          || (r.numero  || '').toLowerCase().includes(q)
          || (r.numeroServicio || '').toLowerCase().includes(q);
      });
    }

    if (!records.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;
    list.innerHTML = records.map(function(r) { return renderCard(r); }).join('');

    list.querySelectorAll('.historial-delete').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (confirm(window.ArpaI18n.t('confirm.historial.eliminar_registro'))) {
          removeRecord(btn.dataset.id);
        }
      });
    });
  }

  function exportCSV() {
    const records = getRecords();
    if (!records.length) {
      alert(window.ArpaI18n.t('alert.historial.no_hay_registros'));
      return;
    }

    const header = ['Documento', 'Subtipo', 'Numero', 'Cliente', 'Concepto', 'Ciudad', 'Fecha', 'Total', 'Guardado'];
    const rows = records.map((r) => [
      getDocumentoLabel(r),
      getSubtipoLabel(r),
      r.numeroServicio || r.numero,
      r.cliente,
      getConceptoDisplay(r, { full: true }),
      r.ciudad,
      r.fecha,
      shouldShowTotal(r) && r.total != null ? r.total : '',
      r.savedAt
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-servicios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function guardarPDFYHistorial() {
    if (typeof global.guardarPDF === 'function') global.guardarPDF();
  }

  function patchCloseSettingsForHistorial() {
    const orig = global.closeSettingsModal;
    if (typeof orig !== 'function' || orig.__historialPatch) return;

    global.closeSettingsModal = function patchedCloseSettings() {
      orig();
      if (global.ArpaViews?.getCurrentView?.() === 'historial') {
        document.querySelectorAll('.main-menu-btn').forEach((b) => b.classList.remove('active'));
        document.querySelector('.main-menu-btn[onclick*="openHistorialView"]')?.classList.add('active');
      }
    };
    global.closeSettingsModal.__historialPatch = true;
  }

  function initFiltros() {
    const buscar = document.getElementById('historial-buscar');
    if (buscar) {
      buscar.addEventListener('input', function() {
        textoBusqueda = buscar.value;
        render();
      });
    }
    document.querySelectorAll('.historial-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        filtroActivo = btn.dataset.filtro;
        textoBusqueda = '';
        const buscarEl = document.getElementById('historial-buscar');
        if (buscarEl) buscarEl.value = '';
        document.querySelectorAll('.historial-tab').forEach(function(b) {
          b.style.background = '#fff';
          b.style.color = 'var(--navy)';
          b.classList.remove('active');
        });
        btn.style.background = 'var(--navy)';
        btn.style.color = '#fff';
        btn.classList.add('active');
        render();
      });
    });
  }

  global.ArpaHistorial = {
    STORAGE_KEY,
    getRecords,
    readInputLikePdf,
    readFormSnapshot,
    buildFormatoConcepto,
    buildCotizacionConcepto,
    buildCuentaCobroConcepto,
    getConceptoDisplay,
    captureFromFormato,
    captureFromCotizacion,
    captureFromCuentaCobro,
    dedupeRecords,
    render,
    exportCSV,
    removeRecord,
    verDocumento,
    initFiltros
  };

  global.guardarPDFYHistorial = guardarPDFYHistorial;
  global.exportarHistorialCSV = exportCSV;

  document.addEventListener('DOMContentLoaded', () => {
    patchCloseSettingsForHistorial();
    dedupeRecords();
    initFiltros();
    render();
    document.getElementById('btn-exportar-historial')?.addEventListener('click', exportCSV);
  });
})(window);
