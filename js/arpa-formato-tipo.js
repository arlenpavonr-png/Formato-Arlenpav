/**
 * Formato de Servicio — sección dinámica de tipo según oficio activo.
 */
(function (global) {
  const DRAFT_OFICIO_KEY = '_formatoOficio';
  const DRAFT_STORAGE_KEY = 'arpa_formato_borrador';
  let currentRenderOficio = null;
  let printLabelBackups = [];

  function getOficiosApi() {
    return global.ArpaOficios || {};
  }

  function readDraftRaw() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function getDocumentFormatoOficio() {
    const draft = readDraftRaw();
    if (draft[DRAFT_OFICIO_KEY]) {
      return getOficiosApi().resolveFormatoOficioId?.(draft[DRAFT_OFICIO_KEY]) || 'automatismos';
    }
    return getOficiosApi().getActiveFormatoOficioId?.() || 'automatismos';
  }

  function setDocumentFormatoOficio(oficioId) {
    const next = getOficiosApi().resolveFormatoOficioId?.(oficioId) || 'automatismos';
    try {
      const draft = readDraftRaw();
      draft[DRAFT_OFICIO_KEY] = next;
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) { /* ignore */ }
    return next;
  }

  function getOtraOption(config) {
    return (config?.opciones || []).find((op) => op.otra);
  }

  function updateMedidasVisibility(oficioId) {
    const config = getOficiosApi().getFormatoConfig?.(oficioId);
    const section = document.getElementById('formato-medidas-section');
    if (!section) return;
    section.hidden = !config?.showMedidas;
  }

  function updateOtraFieldVisibility(oficioId) {
    const wrap = document.getElementById('formato-tipo-otra-wrap');
    if (!wrap) return;
    const config = getOficiosApi().getFormatoConfig?.(oficioId);
    const otra = getOtraOption(config);
    if (!otra || oficioId === 'automatismos') {
      wrap.hidden = true;
      return;
    }
    const checked = !!document.getElementById(otra.id)?.checked;
    wrap.hidden = !checked;
  }

  function bindTipoCheckboxListeners(oficioId) {
    const config = getOficiosApi().getFormatoConfig?.(oficioId);
    if (!config) return;
    config.opciones.forEach((op) => {
      const el = document.getElementById(op.id);
      if (!el || el.dataset.formatoTipoBound === '1') return;
      el.dataset.formatoTipoBound = '1';
      el.addEventListener('change', () => {
        updateOtraFieldVisibility(currentRenderOficio || oficioId);
        if (typeof global.actualizarReferencias === 'function') {
          global.actualizarReferencias();
        }
      });
    });
    const otraInput = document.getElementById('formato-tipo-otra-texto');
    if (otraInput && otraInput.dataset.formatoTipoBound !== '1') {
      otraInput.dataset.formatoTipoBound = '1';
      otraInput.addEventListener('input', () => {
        if (typeof global.scheduleFormatoDraftSave === 'function') {
          global.scheduleFormatoDraftSave();
        }
      });
    }
  }

  function renderFormatoTipoSection(oficioId, options) {
    const opts = options || {};
    const api = getOficiosApi();
    const config = api.getFormatoConfig?.(oficioId);
    if (!config) return false;

    const chips = document.getElementById('formato-tipo-chips');
    const title = document.getElementById('formato-tipo-titulo');
    if (!chips || !title) return false;

    const previous = {};
    if (!opts.preserveValues) {
      chips.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        previous[el.id] = el.checked;
      });
    }

    const otraText = opts.preserveValues
      ? (document.getElementById('formato-tipo-otra-texto')?.value || '')
      : '';

    title.textContent = config.titulo;
    title.setAttribute('data-i18n', config.tituloI18nKey);
    title.setAttribute('data-i18n-default', config.titulo);

    chips.innerHTML = config.opciones.map((op) => (
      '<input type="checkbox" id="' + op.id + '">' +
      '<label for="' + op.id + '" data-i18n="' + op.i18nKey + '" data-i18n-default="' + op.label.replace(/"/g, '&quot;') + '">' + op.label + '</label>'
    )).join('');

    if (opts.preserveValues) {
      Object.entries(previous).forEach(([id, checked]) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!checked;
      });
      const otraInput = document.getElementById('formato-tipo-otra-texto');
      if (otraInput) otraInput.value = otraText;
    } else if (opts.selections) {
      Object.entries(opts.selections).forEach(([id, checked]) => {
        const el = document.getElementById(id);
        if (el && el.type === 'checkbox') el.checked = !!checked;
      });
      const otraInput = document.getElementById('formato-tipo-otra-texto');
      if (otraInput && opts.selections['formato-tipo-otra-texto'] != null) {
        otraInput.value = String(opts.selections['formato-tipo-otra-texto']);
      }
    }

    currentRenderOficio = config.oficioId;
    updateMedidasVisibility(config.oficioId);
    updateOtraFieldVisibility(config.oficioId);
    bindTipoCheckboxListeners(config.oficioId);

    if (global.ArpaI18n?.apply) {
      global.ArpaI18n.apply(global.ArpaI18n.getLang?.() || 'es');
    }

    return true;
  }

  function collectTipoSelections() {
    const config = getOficiosApi().getFormatoConfig?.(currentRenderOficio || getDocumentFormatoOficio());
    const data = {};
    (config?.opciones || []).forEach((op) => {
      const el = document.getElementById(op.id);
      if (el) data[op.id] = !!el.checked;
    });
    const otraInput = document.getElementById('formato-tipo-otra-texto');
    if (otraInput) data['formato-tipo-otra-texto'] = otraInput.value || '';
    return data;
  }

  function refreshForActiveOficio(options) {
    const opts = options || {};
    const active = getOficiosApi().getActiveFormatoOficioId?.() || 'automatismos';
    if (!opts.keepDocumentOficio) {
      setDocumentFormatoOficio(active);
    }
    const oficioId = opts.keepDocumentOficio ? getDocumentFormatoOficio() : active;
    renderFormatoTipoSection(oficioId, { preserveValues: !opts.clearSelections, selections: opts.selections });
    if (opts.clearSelections) {
      const otraInput = document.getElementById('formato-tipo-otra-texto');
      if (otraInput) otraInput.value = '';
    }
    if (typeof global.scheduleFormatoDraftSave === 'function') {
      global.scheduleFormatoDraftSave();
    }
  }

  function ensureDocumentOficioForNewForm() {
    const active = getOficiosApi().getActiveFormatoOficioId?.() || 'automatismos';
    setDocumentFormatoOficio(active);
    renderFormatoTipoSection(active);
  }

  function hasLegacyAutomatismosDraft(data) {
    return ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'].some((id) => data[id] != null);
  }

  function resolveDraftOficioId(data) {
    if (data[DRAFT_OFICIO_KEY]) {
      return getOficiosApi().resolveFormatoOficioId?.(data[DRAFT_OFICIO_KEY]) || 'automatismos';
    }
    if (hasLegacyAutomatismosDraft(data)) return 'automatismos';
    return getOficiosApi().getActiveFormatoOficioId?.() || 'automatismos';
  }

  function initFromDraft(draft) {
    const data = draft || readDraftRaw();
    const oficioId = resolveDraftOficioId(data);
    currentRenderOficio = oficioId;
    renderFormatoTipoSection(oficioId, { preserveValues: true, selections: data });
    updateMedidasVisibility(oficioId);
    updateOtraFieldVisibility(oficioId);
  }

  function ensureDocumentFormatoTipoForPrint() {
    const oficioId = getDocumentFormatoOficio();
    const selections = {};
    const config = getOficiosApi().getFormatoConfig?.(oficioId);
    (config?.opciones || []).forEach((op) => {
      const el = document.getElementById(op.id);
      if (el) selections[op.id] = !!el.checked;
    });
    const otraInput = document.getElementById('formato-tipo-otra-texto');
    if (otraInput) selections['formato-tipo-otra-texto'] = otraInput.value || '';
    renderFormatoTipoSection(oficioId, { preserveValues: true, selections });
  }

  function prepareFormatoTipoForPrint() {
    ensureDocumentFormatoTipoForPrint();
    printLabelBackups = [];
    const oficioId = getDocumentFormatoOficio();
    const config = getOficiosApi().getFormatoConfig?.(oficioId);
    const title = document.getElementById('formato-tipo-titulo');
    if (title) {
      printLabelBackups.push({ el: title, value: title.textContent });
      title.textContent = config?.titulo || title.textContent;
    }
    const otra = getOtraOption(config);
    if (otra && oficioId !== 'automatismos') {
      const cb = document.getElementById(otra.id);
      const txt = (document.getElementById('formato-tipo-otra-texto')?.value || '').trim();
      const lbl = document.querySelector('label[for="' + otra.id + '"]');
      const wrap = document.getElementById('formato-tipo-otra-wrap');
      if (wrap) {
        printLabelBackups.push({ el: wrap, prop: 'hidden', value: wrap.hidden });
        wrap.hidden = true;
      }
      if (cb?.checked && txt && lbl) {
        printLabelBackups.push({ el: lbl, value: lbl.textContent });
        const base = getOficiosApi().getFormatoOpcionLabel?.(oficioId, otra.id) || 'Otra';
        lbl.textContent = base + ': ' + txt;
      }
    }
  }

  function restoreFormatoTipoAfterPrint() {
    printLabelBackups.forEach((item) => {
      if (!item.el) return;
      if (item.prop === 'hidden') item.el.hidden = item.value;
      else item.el.textContent = item.value;
    });
    printLabelBackups = [];
    if (global.ArpaI18n?.apply) {
      global.ArpaI18n.apply(global.ArpaI18n.getLang?.() || 'es');
    }
  }

  function initFormatoTipoByOficio() {
    const draft = readDraftRaw();
    if (draft && Object.keys(draft).length) {
      initFromDraft(draft);
    } else {
      ensureDocumentOficioForNewForm();
    }
    global.addEventListener('arpa-active-oficio-changed', () => {
      refreshForActiveOficio({ clearSelections: true });
    });
  }

  global.ArpaFormatoTipo = {
    DRAFT_OFICIO_KEY,
    getDocumentFormatoOficio,
    setDocumentFormatoOficio,
    renderFormatoTipoSection,
    collectTipoSelections,
    refreshForActiveOficio,
    ensureDocumentOficioForNewForm,
    initFromDraft,
    ensureDocumentFormatoTipoForPrint,
    prepareFormatoTipoForPrint,
    restoreFormatoTipoAfterPrint,
    initFormatoTipoByOficio,
    updateMedidasVisibility,
    updateOtraFieldVisibility
  };
})(typeof window !== 'undefined' ? window : globalThis);
