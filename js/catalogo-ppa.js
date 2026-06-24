/**
 * Catálogo PPA (29 productos) — Automatismos
 */
(function (global) {
  const CATALOG_KEY = 'arpa_catalogo_usuario';
  const CATEGORIES_KEY = 'arpa_categorias_usuario';
  const OFICIO_AUTOMATISMOS = 'automatismos';

  const CODIGO_ALIASES = {};

  function canonicalCodigo(cod) {
    const c = String(cod || '').trim().toUpperCase();
    return CODIGO_ALIASES[c] || c;
  }

  const CATALOGO_PPA = [
  { codigo: "PPA-DZ-HOME-JF-350", nombre: "DZ Home Jetflex 350kg", precio: 0, categoria: "Motores Corredizos", marca: "PPA" },
  { codigo: "PPA-DZ-STARK-400-WF", nombre: "DZ Stark Home 400kg WiFi", precio: 0, categoria: "Motores Corredizos", marca: "PPA" },
  { codigo: "PPA-DZ-STARK-JF-450", nombre: "DZ Stark Home Jetflex 450kg", precio: 0, categoria: "Motores Corredizos", marca: "PPA" },
  { codigo: "PPA-DZ-COND-JF-1000", nombre: "DZ Condominio Jetflex 1000kg", precio: 0, categoria: "Motores Corredizos", marca: "PPA" },
  { codigo: "PPA-DZ-1500-JF", nombre: "DZ 1500 Jetflex Industrial", precio: 0, categoria: "Motores Corredizos", marca: "PPA" },
  { codigo: "PPA-DZ-2500-IND", nombre: "DZ 2500 Industrial", precio: 0, categoria: "Motores Corredizos", marca: "PPA" },
  { codigo: "PPA-FAC-125-1H", nombre: "PPA Facility 125kg (1 hoja)", precio: 0, categoria: "Motores Batientes", marca: "PPA" },
  { codigo: "PPA-FAC-350-2H", nombre: "PPA Facility 350kg (2 hojas)", precio: 0, categoria: "Motores Batientes", marca: "PPA" },
  { codigo: "PPA-BAT-BL-350", nombre: "PPA Brushless Batiente 350kg", precio: 0, categoria: "Motores Batientes", marca: "PPA" },
  { codigo: "PPA-BAT-JF-500", nombre: "PPA Jetflex Batiente 500kg", precio: 0, categoria: "Motores Batientes", marca: "PPA" },
  { codigo: "PPA-LEV-RES", nombre: "PPA Levadizo Residencial", precio: 0, categoria: "Motores Levadizos", marca: "PPA" },
  { codigo: "PPA-LEV-IND", nombre: "PPA Levadizo Industrial", precio: 0, categoria: "Motores Levadizos", marca: "PPA" },
  { codigo: "PPA-CORT-RES", nombre: "PPA Cortina Enrollable Residencial", precio: 0, categoria: "Cortinas Enrollables", marca: "PPA" },
  { codigo: "PPA-CORT-IND", nombre: "PPA Cortina Enrollable Industrial", precio: 0, categoria: "Cortinas Enrollables", marca: "PPA" },
  { codigo: "PPA-KD2-LEG", nombre: "Barrera KD2 Legero", precio: 0, categoria: "Barreras Automáticas", marca: "PPA" },
  { codigo: "PPA-K10-24V", nombre: "Barrera K10 24V", precio: 0, categoria: "Barreras Automáticas", marca: "PPA" },
  { codigo: "PPA-K1-JF", nombre: "Barrera K1 Jetflex", precio: 0, categoria: "Barreras Automáticas", marca: "PPA" },
  { codigo: "PPA-BARRIER-BL", nombre: "Barrera Barrier Brushless", precio: 0, categoria: "Barreras Automáticas", marca: "PPA" },
  { codigo: "PPA-SIN-PARAR-AC", nombre: "Barrera Sin Parar AC", precio: 0, categoria: "Barreras Automáticas", marca: "PPA" },
  { codigo: "PPA-CENT-FAC-4T", nombre: "Central Facility 4T", precio: 0, categoria: "Centrales Electrónicas", marca: "PPA" },
  { codigo: "PPA-CENT-TRIFLEX-BL", nombre: "Central Triflex Connect Brushless", precio: 0, categoria: "Centrales Electrónicas", marca: "PPA" },
  { codigo: "PPA-CENT-TRIFLEX-FRD", nombre: "Central Triflex Full Range Display", precio: 0, categoria: "Centrales Electrónicas", marca: "PPA" },
  { codigo: "PPA-ZAP-2B", nombre: "Control ZAP 2 botones", precio: 0, categoria: "Accesorios", marca: "PPA" },
  { codigo: "PPA-F10R", nombre: "Fotocelda F10-R", precio: 0, categoria: "Accesorios", marca: "PPA" },
  { codigo: "PPA-CREM-RES-GOLD", nombre: "Cremallera Residencial GOLD", precio: 0, categoria: "Accesorios", marca: "PPA" },
  { codigo: "PPA-CREM-IND-GOLD", nombre: "Cremallera Industrial GOLD", precio: 0, categoria: "Accesorios", marca: "PPA" },
  { codigo: "PPA-MOD-BAT", nombre: "Módulo de Batería", precio: 0, categoria: "Accesorios", marca: "PPA" },
  { codigo: "PPA-SEMAF", nombre: "Semáforo Audiovisual", precio: 0, categoria: "Accesorios", marca: "PPA" },
  { codigo: "PPA-BTN-SALIDA", nombre: "Botón de Salida Metálico", precio: 0, categoria: "Accesorios", marca: "PPA" }
  ];

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function readCatalogState() {
    if (global.ArpaMiCatalogo?.getProducts) {
      return {
        products: (global.ArpaMiCatalogo.getProducts(OFICIO_AUTOMATISMOS) || []).slice(),
        categories: (global.ArpaMiCatalogo.getCategories(OFICIO_AUTOMATISMOS) || []).slice()
      };
    }
    let products = [];
    let categories = [];
    try {
      products = JSON.parse(localStorage.getItem(CATALOG_KEY) || '[]');
    } catch (e) {
      products = [];
    }
    try {
      categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
    } catch (e) {
      categories = [];
    }
    return { products, categories };
  }

  function writeCatalogState(products, categories) {
    if (global.ArpaMiCatalogo?.saveProducts) {
      global.ArpaMiCatalogo.saveCategories(categories, OFICIO_AUTOMATISMOS);
      global.ArpaMiCatalogo.saveProducts(products, OFICIO_AUTOMATISMOS);
      return;
    }
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    localStorage.setItem(CATALOG_KEY, JSON.stringify(products));
  }

  function precargarCatalogoPPA() {
    const state = readCatalogState();
    const productosExistentes = state.products;
    const categoriasExistentes = state.categories;

    const categoryIds = new Map(
      categoriasExistentes.map((c) => [(c.name || '').trim().toLowerCase(), c.id])
    );
    const categorias = categoriasExistentes.slice();

    function ensureCategory(name) {
      const label = (name || 'General').trim();
      const key = label.toLowerCase();
      if (!categoryIds.has(key)) {
        const cat = { id: newId(), name: label, oficioId: OFICIO_AUTOMATISMOS };
        categorias.push(cat);
        categoryIds.set(key, cat.id);
      }
      return categoryIds.get(key);
    }

    const codigosExistentes = new Set(
      productosExistentes
        .map((p) => canonicalCodigo(String(p.cod || p.codigo || '').trim()))
        .filter(Boolean)
    );

    let agregados = 0;
    const ahora = new Date().toISOString();

    CATALOGO_PPA.forEach((producto) => {
      const cod = canonicalCodigo(producto.codigo);
      if (!cod || codigosExistentes.has(cod)) return;
      productosExistentes.push({
        id: newId(),
        cod,
        nom: producto.nombre,
        pvp: Number(producto.precio) || 0,
        unidad: 'unidad',
        marca: producto.marca || '',
        categoriaId: ensureCategory(producto.categoria),
        oficioId: OFICIO_AUTOMATISMOS,
        fechaAgregado: ahora
      });
      codigosExistentes.add(cod);
      agregados++;
    });

    writeCatalogState(productosExistentes, categorias);

    global.ArpaCatalogo?.invalidateListaCache?.();
    global.ArpaCotizacion?.updateCatalogHint?.();
    global.ArpaMiCatalogo?.refreshView?.();

    alert('Catálogo cargado: ' + agregados + ' productos agregados de PPA');
    return agregados;
  }

  global.CATALOGO_PPA = CATALOGO_PPA;
  global.precargarCatalogoPPA = precargarCatalogoPPA;
  global.ArpaCatalogo?.invalidateListaCache?.();
})(typeof window !== 'undefined' ? window : globalThis);
