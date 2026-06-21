/**
 * Historial de servicios (localStorage)
 */
(function (global) {
  const STORAGE_KEY = 'arpa_suite_servicio_historial';
  const MAX_RECORDS = 200;

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
    list.innerHTML = records.map((r) => {
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
          <div class="historial-row"><span>Ciudad</span><strong>${escapeHtml(r.ciudad || '—')}</strong></div>
          <div class="historial-row"><span>Fecha</span><strong>${escapeHtml(r.fecha || '—')}</strong></div>
          ${showTotal ? `<div class="historial-row"><span>Total</span><strong>${escapeHtml(formatoPesos(r.total))}</strong></div>` : ''}
        </div>
        <button type="button" class="historial-delete" data-id="${escapeHtml(r.id)}" aria-label="Eliminar registro">Eliminar</button>
      </article>`;
    }).join('');

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

    const header = ['Documento', 'Subtipo', 'Numero', 'Cliente', 'Ciudad', 'Fecha', 'Total', 'Guardado'];
    const rows = records.map((r) => [
      getDocumentoLabel(r),
      getSubtipoLabel(r),
      r.numeroServicio || r.numero,
      r.cliente,
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
    captureFromFormato,
    captureFromCotizacion,
    captureFromCuentaCobro,
    render,
    exportCSV,
    removeRecord
  };

  global.guardarPDFYHistorial = guardarPDFYHistorial;
  global.exportarHistorialCSV = exportCSV;

  document.addEventListener('DOMContentLoaded', () => {
    patchCloseSettingsForHistorial();
    render();
    document.getElementById('btn-exportar-historial')?.addEventListener('click', exportCSV);
  });
})(window);
