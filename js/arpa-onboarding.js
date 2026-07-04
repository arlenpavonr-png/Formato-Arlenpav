/**
 * Onboarding de primera apertura — oficio principal y catálogo demo (Automatismos)
 */
(function (global) {
  const ONBOARDING_KEY = 'arpa_onboarding';
  const RUBRO_KEY = 'arpa_rubro';
  const OFICIO_AUTOMATISMOS = 'automatismos';

  function isOnboardingDone() {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function isLicenseReady() {
    return document.documentElement.classList.contains('license-ok');
  }

  function setOnboardingActive(active) {
    document.documentElement.classList.toggle('onboarding-active', active);
  }

  function showGate() {
    renderRubroButtons();
    setOnboardingActive(true);
    document.getElementById('onboarding-gate')?.classList.add('open');
  }

  function closeStepModals() {
    document.getElementById('onboarding-demo-modal')?.classList.remove('open');
  }

  function hideGate() {
    document.getElementById('onboarding-gate')?.classList.remove('open');
    closeStepModals();
    setOnboardingActive(false);
  }

  function getAutomatismosSeedCount() {
    return global.ArpaOficios?.getSeedProductCount?.(OFICIO_AUTOMATISMOS) || 0;
  }

  function openDemoModal() {
    const count = getAutomatismosSeedCount();
    const title = document.getElementById('onboarding-demo-title');
    const text = document.getElementById('onboarding-demo-text');
    if (title) title.textContent = 'Catálogo BFT, Accessmatic, Elite y NAS';
    if (text) text.textContent = `¿Deseas precargar ${count} productos?`;
    closeStepModals();
    document.getElementById('onboarding-demo-modal')?.classList.add('open');
  }

  function loadDemoCatalog() {
    global.ArpaOficios?.importSeedCatalog?.(OFICIO_AUTOMATISMOS, { force: true });
    global.ArpaCatalogo?.invalidateListaCache?.();
    global.ArpaCotizacion?.updateCatalogHint?.();
    global.ArpaMiCatalogo?.refreshView?.();
  }

  function activateOficio(oficioId) {
    if (!oficioId) return;
    global.ArpaOficios?.saveActiveOficios?.([oficioId]);
  }

  let pendingFinish_ = null;

  function completeFinishOnboarding_(oficioId, opts) {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(RUBRO_KEY, oficioId);
    activateOficio(oficioId);
    hideGate();

    if (opts?.loadDemo) {
      loadDemoCatalog();
    }

    if (opts?.goToCatalog) {
      const btn = document.querySelector('[data-onboarding-oficio="' + OFICIO_AUTOMATISMOS + '"]')
        || document.querySelector('.main-menu-btn[onclick*="openCatalogoView"]');
      global.openCatalogoView?.(btn);
      global.ArpaMiCatalogo?.refreshView?.();
    }
  }

  function sendTrialRegistration_(nombre, telefono, oficioId) {
    try {
      const deviceId = localStorage.getItem('arpa_suite_device_id') || '';
      const fecha = new Date().toISOString().slice(0, 10);
      const payload = {
        accion: 'registertrialuser',
        nombre: nombre,
        telefono: telefono,
        oficio: oficioId,
        fechaInicio: fecha,
        trialId: deviceId
      };
      global.ArpaCloudSync?.postJson?.(payload)?.catch?.(function (err) {
        console.warn('[onboarding] registro trial', err);
      });
    } catch (e) {
      console.warn('[onboarding] registro trial error', e);
    }
  }

  function showContactModal() {
    document.getElementById('onboarding-contact-modal')?.classList.add('open');
  }

  function hideContactModal() {
    document.getElementById('onboarding-contact-modal')?.classList.remove('open');
  }

  function submitContactModal_() {
    const nombreInput = document.getElementById('onboarding-contact-nombre');
    const telefonoInput = document.getElementById('onboarding-contact-telefono');
    const nombre = (nombreInput?.value || '').trim();
    const telefono = (telefonoInput?.value || '').trim();
    if (!nombre || !telefono) {
      if (!nombre) nombreInput?.focus();
      else telefonoInput?.focus();
      return;
    }
    hideContactModal();
    const pending = pendingFinish_ || { oficioId: '', opts: {} };
    pendingFinish_ = null;
    sendTrialRegistration_(nombre, telefono, pending.oficioId);
    completeFinishOnboarding_(pending.oficioId, pending.opts);
  }

  function finishOnboarding(oficioId, opts) {
    pendingFinish_ = { oficioId: oficioId, opts: opts };
    closeStepModals();
    showContactModal();
  }

  function onOficioSelected(oficioId) {
    const id = global.ArpaOficios?.normalizeOficioId?.(oficioId) || oficioId;
    if (id === OFICIO_AUTOMATISMOS) {
      openDemoModal();
      return;
    }
    finishOnboarding(id);
  }

  function renderRubroButtons() {
    const container = document.getElementById('onboarding-rubros');
    if (!container) return;

    const oficios = global.ArpaOficios?.getOficiosList?.() || [];
    container.innerHTML = oficios.map((o) => {
      const label = global.ArpaOficios?.getOficioLabel?.(o.id) || o.id;
      const isPrimary = o.id === OFICIO_AUTOMATISMOS;
      return (
        '<button type="button" class="btn-onboarding-rubro' + (isPrimary ? ' primary' : '') + '" ' +
        'data-onboarding-oficio="' + o.id + '" data-i18n="' + o.i18nKey + '">' +
        label +
        '</button>'
      );
    }).join('');

    container.querySelectorAll('[data-onboarding-oficio]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        onOficioSelected(btn.getAttribute('data-onboarding-oficio'));
      });
    });

    if (global.ArpaI18n && typeof global.ArpaI18n.apply === 'function') {
      global.ArpaI18n.apply(global.ArpaI18n.getLang?.() || 'es');
    }
  }

  function initOnboarding() {
    renderRubroButtons();

    document.getElementById('btn-onboarding-demo-yes')?.addEventListener('click', () => {
      finishOnboarding(OFICIO_AUTOMATISMOS, { loadDemo: true, goToCatalog: true });
    });

    document.getElementById('btn-onboarding-demo-skip')?.addEventListener('click', () => {
      finishOnboarding(OFICIO_AUTOMATISMOS);
    });

    document.getElementById('btn-onboarding-contact-continue')?.addEventListener('click', () => {
      submitContactModal_();
    });
  }

  function tryShow() {
    if (!isLicenseReady() || isOnboardingDone()) return false;
    showGate();
    return true;
  }

  global.ArpaOnboarding = {
    ONBOARDING_KEY,
    RUBRO_KEY,
    isOnboardingDone,
    loadDemoCatalog,
    tryShow,
    initOnboarding,
    renderRubroButtons
  };

  document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
    tryShow();
  });
})(window);
