/**
 * Onboarding de primera apertura — rubro y catálogo demo
 */
(function (global) {
  const ONBOARDING_KEY = 'arpa_onboarding';
  const RUBRO_KEY = 'arpa_rubro';
  const CATALOG_KEY = 'arpa_catalogo_usuario';
  const CATEGORIES_KEY = 'arpa_categorias_usuario';

  const DEMO_PRODUCTS = [
    ['KFOX1050HS', 'Motor Fox 1050 High Speed 3/4HP WiFi', 1219900, 'unidad', 'Accessmatic', 'Motores Garaje'],
    ['KFOX1100WS', 'Motor Fox 1100 Pro 3/4HP WiFi', 1399900, 'unidad', 'Accessmatic', 'Motores Garaje'],
    ['ACSH1000', 'Motor Shark 1000 3/4HP Silencioso', 1095900, 'unidad', 'Accessmatic', 'Motores Garaje'],
    ['ACRP120', 'Motor Raptor 1200 1HP Silencioso', 1399900, 'unidad', 'Accessmatic', 'Motores Garaje'],
    ['CPUMA1200', 'Motor Puma 1200 1HP WiFi', 1369900, 'unidad', 'Accessmatic', 'Motores Garaje'],
    ['ACKSC1800C', 'Motor Scorpion 1800 1.5HP Riel C', 1999900, 'unidad', 'Accessmatic', 'Motores Garaje'],
    ['ACKSC1800T', 'Motor Scorpion 1800 1.5HP Riel T', 1999900, 'unidad', 'Accessmatic', 'Motores Garaje'],
    ['AUACKPB400', 'Motor Pitbull 400kg Corredizo', 1099900, 'unidad', 'Accessmatic', 'Motores Corredizas'],
    ['D850', 'Motor Bulldozer 850kg Semi-industrial', 1599900, 'unidad', 'Accessmatic', 'Motores Corredizas'],
    ['1024BL', 'Motor Bulldog 1024BL 1000kg 24V', 2999900, 'unidad', 'Accessmatic', 'Motores Corredizas'],
    ['D1100', 'Motor Bulldog 1100 1100kg', 1999900, 'unidad', 'Accessmatic', 'Motores Corredizas'],
    ['AUELMC4', 'Motor Elite Slide 400kg', 1069900, 'unidad', 'Elite', 'Motores Corredizas'],
    ['AUELMC5', 'Motor Elite Slide 500kg', 1199900, 'unidad', 'Elite', 'Motores Corredizas'],
    ['AUELMC8', 'Motor Elite Slide 800kg', 1549900, 'unidad', 'Elite', 'Motores Corredizas'],
    ['AUELMC8FV', 'Motor Elite Slide 800kg + Lampara', 1899900, 'unidad', 'Elite', 'Motores Corredizas'],
    ['MC624', 'Motor Elite 600kg Bateria 24V', 1859900, 'unidad', 'Elite', 'Motores Corredizas'],
    ['MC12', 'Motor Elite 1200kg Industrial', 1999900, 'unidad', 'Elite', 'Motores Corredizas'],
    ['ELITETWIST250', 'Kit Elite Twist250 2 Hojas 250kg', 1799900, 'unidad', 'Elite', 'Motores Batientes'],
    ['EAGLE250', 'Kit Eagle 250 2 Hojas 3mt', 2519900, 'unidad', 'Accessmatic', 'Motores Batientes'],
    ['FALCON300', 'Kit Falcon 300 2 Hojas 3mt 300kg', 2199900, 'unidad', 'Accessmatic', 'Motores Batientes'],
    ['FALCON350', 'Kit Falcon 350 2 Hojas 4mt 350kg', 3749900, 'unidad', 'Accessmatic', 'Motores Batientes'],
    ['EAGLE500', 'Kit Eagle 500 2 Hojas 5mt 350kg', 3889900, 'unidad', 'Accessmatic', 'Motores Batientes'],
    ['FENIX600', 'Kit Fenix 600 2 Hojas 5.5mt 600kg', 6719900, 'unidad', 'Accessmatic', 'Motores Batientes'],
    ['CAR201', 'Motor Enrollable 200kg Comercial', 1019900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['ACKAR201B', 'Kit Enrollable 200kg + Freno', 1249900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['ACAR382', 'Kit Enrollable 380kg + Freno', 1499900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['ACKAR382B', 'Kit Enrollable 380kg Nuevo', 1699900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['UACKAR201F', 'Kit Enrollable 200kg + Tarjeta', 1349900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['UACKAR382F', 'Kit Enrollable 380kg + Tarjeta', 1889900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['AUELKME624DC', 'Elite Spin 600kg Sin Resorte 24V', 1649900, 'unidad', 'Elite', 'Cortinas Enrollables'],
    ['AUELKME8511', 'Elite Spin 800kg 110V', 1759900, 'unidad', 'Elite', 'Cortinas Enrollables'],
    ['AUELKME824DC', 'Elite Spin 800kg DC + Baterias', 2469900, 'unidad', 'Elite', 'Cortinas Enrollables'],
    ['AUACKHULK500S', 'Hulk 500kg Industrial', 1399900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['AUACKHULK624DC', 'Hulk 600kg + Bateria Respaldo', 1729900, 'unidad', 'Accessmatic', 'Cortinas Enrollables'],
    ['AUELKPA42', 'Cabezal Elite Zoom 4.2mt 120kg', 5299900, 'unidad', 'Elite', 'Cabezales'],
    ['AUACKAN427S', 'Cabezal Avalon 4200 Full Range', 7099900, 'unidad', 'Accessmatic', 'Cabezales'],
    ['AUACKAT42M', 'Cabezal Avanti 4200 140kg', 8549900, 'unidad', 'Accessmatic', 'Cabezales'],
    ['AUACKAT63M', 'Cabezal Avanti 6300 140kg', 9699900, 'unidad', 'Accessmatic', 'Cabezales'],
    ['AUACKAVANTI6000Z', 'Cabezal Telescopica 6mt 4 Hojas', 15990000, 'unidad', 'Accessmatic', 'Cabezales'],
    ['AUACMTD224', 'Barrera Mastodon 224 3M Ciclos', 2999900, 'unidad', 'Accessmatic', 'Barreras'],
    ['AUCKMTD224', 'Kit Barrera Mastodon 224 + Asta 2mt', 3499900, 'unidad', 'Accessmatic', 'Barreras'],
    ['AUACMTD624', 'Barrera Mastodon 624 Rapida', 4599900, 'unidad', 'Accessmatic', 'Barreras'],
    ['AUACKMTD624', 'Kit Barrera Mastodon 624 + Asta Telesc', 5399900, 'unidad', 'Accessmatic', 'Barreras'],
    ['AUACALW4', 'Control 4 Botones Verdes 433MHz', 39900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACACCESSCLIP', 'Accessclip Universal Controles', 9900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACALH3', 'Control 3 Botones Visor Shark', 69900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACALT2', 'Control 2 Botones Visor Fox', 69900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACAF24Li', 'Bateria Litio Scorpion Shark Fox', 249900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACALH2', 'Control 433MHz Shark 1000', 69900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACALR4', 'Control 4 Canales Raptor Elite', 69900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['UACACCESSCAM', 'Camara WiFi AccessCam 1280x720', 589900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACAE20', 'Fotoceldas 20mt Interior', 55900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACAE30', 'Fotoceldas 30mt Intemperie', 129900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['UACAELYNX20', 'Fotocelda Inalambrica Lynx 20mt IP54', 399900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACCRAB02', 'Sistema Anticaida 2 pulgadas', 169900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACCRAB03', 'Sistema Anticaida 3 pulgadas', 259900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACKSH20', 'Acople Eje Extension 200mm Kong50', 109900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUACFL1224', 'Lampara LED Destellante Kong', 159900, 'unidad', 'Accessmatic', 'Accesorios'],
    ['AUELEP100240', 'Modulo WiFi Elite-Pulse Tuya Alexa', 199900, 'unidad', 'Elite', 'Accesorios']
  ];

  const RUBRO_BUTTON_IDS = {
    automatizacion: 'btn-onboarding-rubro-automatizacion',
    'aire-acondicionado': 'btn-onboarding-rubro-aire',
    electricidad: 'btn-onboarding-rubro-electricidad',
    otro: 'btn-onboarding-rubro-otro'
  };

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

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

  function openDemoModal() {
    const count = DEMO_PRODUCTS.length;
    const title = document.getElementById('onboarding-demo-title');
    const text = document.getElementById('onboarding-demo-text');
    if (title) title.textContent = 'Catálogo Demo Accessmatic';
    if (text) text.textContent = `¿Deseas precargar ${count} productos?`;
    closeStepModals();
    document.getElementById('onboarding-demo-modal')?.classList.add('open');
  }

  function openOtroModal() {
    closeStepModals();
    document.getElementById('onboarding-otro-modal')?.classList.add('open');
  }

  function loadDemoCatalog() {
    const categories = [];
    const categoryIds = new Map();

    function ensureCategory(name) {
      const label = (name || 'General').trim();
      const key = label.toLowerCase();
      if (!categoryIds.has(key)) {
        const cat = { id: newId(), name: label };
        categories.push(cat);
        categoryIds.set(key, cat.id);
      }
      return categoryIds.get(key);
    }

    const products = DEMO_PRODUCTS.map(([cod, nom, pvp, unidad, marca, categoria]) => ({
      id: newId(),
      cod,
      nom,
      pvp: Number(pvp) || 0,
      unidad: unidad || 'unidad',
      marca: marca || '',
      categoriaId: ensureCategory(categoria)
    }));

    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    localStorage.setItem(CATALOG_KEY, JSON.stringify(products));
    global.ArpaCatalogo?.invalidateListaCache?.();
    global.ArpaCotizacion?.updateCatalogHint?.();
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
    DEMO_PRODUCTS,
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
