/**
 * Onboarding de primera apertura — rubro y catálogo demo
 */
(function (global) {
  const ONBOARDING_KEY = 'arpa_onboarding';
  const RUBRO_KEY = 'arpa_rubro';

  const RUBRO_BUTTON_IDS = {
    automatizacion: 'btn-onboarding-rubro-automatizacion',
    'aire-acondicionado': 'btn-onboarding-rubro-aire',
    electricidad: 'btn-onboarding-rubro-electricidad',
    otro: 'btn-onboarding-rubro-otro'
  };

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
    setOnboardingActive(true);
    document.getElementById('onboarding-gate')?.classList.add('open');
  }

  function closeStepModals() {
    document.getElementById('onboarding-demo-modal')?.classList.remove('open');
    document.getElementById('onboarding-otro-modal')?.classList.remove('open');
  }

  function hideGate() {
    document.getElementById('onboarding-gate')?.classList.remove('open');
    closeStepModals();
    setOnboardingActive(false);
  }

  function getAutomatismosSeedCount() {
    return global.ArpaOficios?.getSeedProductCount?.('automatismos') || 0;
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

  function openOtroModal() {
    closeStepModals();
    document.getElementById('onboarding-otro-modal')?.classList.add('open');
  }

  function loadDemoCatalog() {
    global.ArpaOficios?.importSeedCatalog?.('automatismos', { force: true });
    global.ArpaCatalogo?.invalidateListaCache?.();
    global.ArpaCotizacion?.updateCatalogHint?.();
    global.ArpaMiCatalogo?.refreshView?.();
  }

  function finishOnboarding(rubro, opts) {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(RUBRO_KEY, rubro);
    hideGate();

    if (opts?.loadDemo) {
      loadDemoCatalog();
    }

    if (opts?.goToCatalog) {
      const btn = document.getElementById('btn-onboarding-rubro-automatizacion')
        || document.querySelector('.main-menu-btn[onclick*="openCatalogoView"]');
      global.openCatalogoView?.(btn);
      global.ArpaMiCatalogo?.refreshView?.();
    }
  }

  function getRubroFromButton(btn) {
    return btn?.getAttribute('data-onboarding-rubro') || btn?.dataset?.onboardingRubro || '';
  }

  function onRubroSelected(rubro) {
    if (rubro === 'automatizacion') {
      openDemoModal();
      return;
    }
    if (rubro === 'otro') {
      openOtroModal();
      return;
    }
    finishOnboarding(rubro);
  }

  function bindRubroButtons() {
    Object.entries(RUBRO_BUTTON_IDS).forEach(([rubro, id]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        onRubroSelected(getRubroFromButton(btn) || rubro);
      });
    });
  }

  function initOnboarding() {
    bindRubroButtons();

    document.getElementById('btn-onboarding-demo-yes')?.addEventListener('click', () => {
      finishOnboarding('automatizacion', { loadDemo: true, goToCatalog: true });
    });

    document.getElementById('btn-onboarding-demo-skip')?.addEventListener('click', () => {
      finishOnboarding('automatizacion');
    });

    document.getElementById('btn-onboarding-otro-continue')?.addEventListener('click', () => {
      finishOnboarding('otro');
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
    initOnboarding
  };

  document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
    tryShow();
  });
})(window);
