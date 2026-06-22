/**
 * Historial de servicios (localStorage)
 */
(function (global) {
  const STORAGE_KEY = 'arpa_suite_servicio_historial';
  const MAX_RECORDS = 200;

  function formatFechaLegible(fechaStr) {
    if (!fechaStr) return '—';
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const d = new Date(fechaStr + 'T12:00:00');
    if (isNaN(d)) return fechaStr;
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
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
    if (record?.modulo) return record.modulo;
    if (record?.tipo === 'Cuenta de Cobro') return 'cuenta-cobro';
    if (record?.documento === 'Cotización' || record?.tipo === 'Cotización') return 'cotizacion';
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

  const SIN_DESCRIPCION = 'Sin descripción';

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

  function getConceptoDisplay(record) {
    const partes = [];
    const subtipo = getSubtipoLabel(record);
    if (subtipo) partes.push(subtipo);
    const ciudad = (record?.ciudad || '').trim();
    if (ciudad) partes.push(ciudad);
    const concepto = (record?.concepto || '').trim();
    if (concepto) partes.push(concepto);
    if (!partes.length) return SIN_DESCRIPCION;
    return partes.join(' · ');
  }

  function getFormatoBriefDetail() {
    const refManual = document.getElementById('ref-manual')?.value.trim() || '';
    const refSelect = readInputLikePdf(document.getElementById('sel-referencia'));
    const marca = readInputLikePdf(document.getElementById('sel-marca'));
    const materiales = [];
    document.querySelectorAll('#view-formato .mat-row input[type="text"]').forEach((input) => {
      const v = (input.value || '').trim();
      if (v) materiales.push(v);
    });
    return firstNonEmpty([
      refManual,
      refSelect && refSelect !== 'Seleccionar referencia...' ? refSelect : '',
      marca && marca !== 'Seleccionar...' ? marca : '',
      ...materiales
    ]);
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
    return concepto || SIN_DESCRIPCION;
  }

  function buildCuentaCobroConcepto(snap) {
    const d = snap || global.ArpaCuentaCobro?.getFormSnapshot?.();
    const items = (d?.servicios || [])
      .map((s) => (s.desc || '').trim())
      .filter(Boolean);
    let concepto = buildConceptoFromItemList(items);
    if (!concepto && d?.observaciones) concepto = trimBrief(d.observaciones, 120);
    return concepto || SIN_DESCRIPCION;
  }

  function addRecord(record) {
    const records = getRecords();
    records.unshift(record);
    saveRecords(records);
    render();
    global.ArpaCloudSync?.pushHistorialEntry?.(record);
    return record;
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
          <div class="historial-row"><span>Cliente</span><strong>${escapeHtml(r.cliente || '—')}</strong></div>
          <div class="historial-row historial-row-concepto"><span>Concepto</span><strong>${escapeHtml(getConceptoDisplay(r))}</strong></div>
          <div class="historial-row"><span>Ciudad</span><strong>${escapeHtml(r.ciudad || '—')}</strong></div>
          <div class="historial-row"><span>Fecha</span><strong>${escapeHtml(formatFechaLegible(r.fecha))}</strong></div>
          ${showTotal ? `<div class="historial-row"><span>Total</span><strong>${escapeHtml(formatoPesos(r.total))}</strong></div>` : ''}
        </div>
        <button type="button" class="historial-delete" data-id="${escapeHtml(r.id)}" aria-label="Eliminar registro">Eliminar</button>
        <button type="button" class="btn-ver-doc" onclick="ArpaHistorial.verDocumento('${escapeHtml(r.id)}')">
          Ver documento 📄
        </button>
      </article>`;
  }

  function verDocumento(id) {
    const records = getRecords();
    const r = records.find((rec) => rec.id === id);
    if (!r) {
      alert('Registro no encontrado.');
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
        alert('Documento restaurado. Revisa los datos y genera el PDF.');
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
        alert('Documento restaurado. Revisa los datos y genera el PDF.');
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
        alert('Documento restaurado. Revisa los datos y genera el PDF.');
      }, 400);
    }
  }

  function render() {
    const list = document.getElementById('historial-list');
    const empty = document.getElementById('historial-empty');
    if (!list) return;

    const records = getRecords();
    if (!records.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;
    list.innerHTML = records.map((r) => renderCard(r)).join('');

    list.querySelectorAll('.historial-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este registro del historial?')) {
          removeRecord(btn.dataset.id);
        }
      });
    });
  }

  function exportCSV() {
    const records = getRecords();
    if (!records.length) {
      alert('No hay registros para exportar.');
      return;
    }

    const header = ['Documento', 'Subtipo', 'Numero', 'Cliente', 'Concepto', 'Ciudad', 'Fecha', 'Total', 'Guardado'];
    const rows = records.map((r) => [
      getDocumentoLabel(r),
      getSubtipoLabel(r),
      r.numeroServicio || r.numero,
      r.cliente,
      getConceptoDisplay(r),
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
    render,
    exportCSV,
    removeRecord,
    verDocumento
  };

  global.guardarPDFYHistorial = guardarPDFYHistorial;
  global.exportarHistorialCSV = exportCSV;

  document.addEventListener('DOMContentLoaded', () => {
    patchCloseSettingsForHistorial();
    render();
    document.getElementById('btn-exportar-historial')?.addEventListener('click', exportCSV);
  });
})(window);
