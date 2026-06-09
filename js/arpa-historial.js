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

  function readFormSnapshot() {
    const tipoEl = document.querySelector('#view-formato input[name="tipo"]:checked');
    const tipoKey = tipoEl?.value || 'instalacion';
    const clienteEl = document.getElementById('formato-cliente-nombre')
      || document.querySelector('#view-formato input[placeholder="Nombre completo o razón social"]');
    const ciudadEl = document.getElementById('formato-cliente-ciudad')
      || document.querySelector('#view-formato input[placeholder="Medellín"]');

    return {
      numero: document.getElementById('numero-formato')?.value.trim() || '',
      cliente: clienteEl?.value.trim() || '',
      tipo: TIPO_LABEL[tipoKey] || 'Instalación',
      ciudad: ciudadEl?.value.trim() || '',
      fecha: document.getElementById('formato-fecha')?.value || ''
    };
  }

  function captureFromFormato() {
    const snap = readFormSnapshot();
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      ...snap,
      savedAt: new Date().toISOString()
    };

    const records = getRecords();
    records.unshift(record);
    saveRecords(records);
    return record;
  }

  function removeRecord(id) {
    saveRecords(getRecords().filter((r) => r.id !== id));
    render();
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
    list.innerHTML = records.map((r) => `
      <article class="historial-card" data-id="${escapeHtml(r.id)}">
        <div class="historial-card-head">
          <span class="historial-num">N° ${escapeHtml(r.numero || '—')}</span>
          <span class="historial-tipo">${escapeHtml(r.tipo)}</span>
        </div>
        <div class="historial-card-body">
          <div class="historial-row"><span>Cliente</span><strong>${escapeHtml(r.cliente || '—')}</strong></div>
          <div class="historial-row"><span>Ciudad</span><strong>${escapeHtml(r.ciudad || '—')}</strong></div>
          <div class="historial-row"><span>Fecha</span><strong>${escapeHtml(r.fecha || '—')}</strong></div>
        </div>
        <button type="button" class="historial-delete" data-id="${escapeHtml(r.id)}" aria-label="Eliminar registro">Eliminar</button>
      </article>
    `).join('');

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

    const header = ['Numero', 'Cliente', 'Tipo', 'Ciudad', 'Fecha', 'Guardado'];
    const rows = records.map((r) => [
      r.numero,
      r.cliente,
      r.tipo,
      r.ciudad,
      r.fecha,
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
    captureFromFormato();
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
    captureFromFormato,
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
