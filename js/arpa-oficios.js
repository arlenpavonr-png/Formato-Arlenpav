/**
 * Oficios / actividades — selector de oficio y catálogos genéricos (anexo).
 */
(function (global) {
  const OFICIO_AUTOMATISMOS = 'automatismos';
  const SEEDED_KEY = 'arpa_oficios_seeded';
  const ACTIVE_OFICIOS_KEY = 'arpa_active_oficios';

  /** @type {{ id: string, i18nKey: string }[]} */
  const OFICIOS = [
    { id: OFICIO_AUTOMATISMOS, i18nKey: 'oficio.automatismos' },
    { id: 'electricidad', i18nKey: 'oficio.electricidad' },
    { id: 'gas', i18nKey: 'oficio.gas' },
    { id: 'refrigeracion', i18nKey: 'oficio.refrigeracion' },
    { id: 'cctv', i18nKey: 'oficio.cctv' },
    { id: 'plomeria', i18nKey: 'oficio.plomeria' },
    { id: 'cerrajeria', i18nKey: 'oficio.cerrajeria' },
    { id: 'plagas', i18nKey: 'oficio.plagas' },
    { id: 'linea_blanca', i18nKey: 'oficio.linea_blanca' },
    { id: 'solar', i18nKey: 'oficio.solar' }
  ];

  function normalizeSeedUnidad(val) {
    const v = String(val || '').trim().toLowerCase();
    const aliases = {
      un: 'unidad',
      und: 'unidad',
      unidades: 'unidad',
      mts: 'metro',
      metros: 'metro',
      m: 'metro',
      hr: 'hora',
      horas: 'hora',
      servicios: 'servicio'
    };
    if (aliases[v]) return aliases[v];
    if (['unidad', 'metro', 'hora', 'servicio'].includes(v)) return v;
    return v || 'unidad';
  }

  /**
   * Catálogos genéricos precargados por oficio (punto de partida editable).
   * Formato por ítem: { cod, nom, categoria, pvp, unidad?, marca? }
   */
  const SEED_CATALOGS = {
    electricidad: {
      products: [
        { cod: 'ELE-001', nom: 'Breaker 1 polo 20A', categoria: 'Protección', pvp: 18000, unidad: 'un' },
        { cod: 'ELE-002', nom: 'Breaker 2 polos 30A', categoria: 'Protección', pvp: 42000, unidad: 'un' },
        { cod: 'ELE-003', nom: 'Tablero de distribución 12 circuitos', categoria: 'Tableros', pvp: 95000, unidad: 'un' },
        { cod: 'ELE-004', nom: 'Cable encauchetado 12 AWG', categoria: 'Cableado', pvp: 2200, unidad: 'metro' },
        { cod: 'ELE-005', nom: 'Cable encauchetado 14 AWG', categoria: 'Cableado', pvp: 1800, unidad: 'metro' },
        { cod: 'ELE-006', nom: 'Toma doble con polo a tierra', categoria: 'Tomas y Switches', pvp: 9500, unidad: 'un' },
        { cod: 'ELE-007', nom: 'Switch sencillo', categoria: 'Tomas y Switches', pvp: 7000, unidad: 'un' },
        { cod: 'ELE-008', nom: 'Luminaria LED panel 24W', categoria: 'Iluminación', pvp: 35000, unidad: 'un' },
        { cod: 'ELE-009', nom: 'Reflector LED 50W exterior', categoria: 'Iluminación', pvp: 48000, unidad: 'un' },
        { cod: 'ELE-010', nom: 'Caja octogonal PVC', categoria: 'Accesorios', pvp: 3500, unidad: 'un' },
        { cod: 'ELE-011', nom: 'Tubería EMT 1/2 pulgada', categoria: 'Cableado', pvp: 8500, unidad: 'un' },
        { cod: 'ELE-012', nom: 'Totalizador 2x40A', categoria: 'Protección', pvp: 65000, unidad: 'un' }
      ]
    },
    gas: {
      products: [
        { cod: 'GAS-001', nom: 'Válvula de corte 1/2 pulgada', categoria: 'Válvulas', pvp: 25000, unidad: 'un' },
        { cod: 'GAS-002', nom: 'Regulador de presión doméstico', categoria: 'Reguladores', pvp: 38000, unidad: 'un' },
        { cod: 'GAS-003', nom: 'Manguera flexible para gas 1m', categoria: 'Mangueras', pvp: 22000, unidad: 'un' },
        { cod: 'GAS-004', nom: 'Detector de fugas de gas', categoria: 'Seguridad', pvp: 85000, unidad: 'un' },
        { cod: 'GAS-005', nom: 'Calentador de gas instantáneo', categoria: 'Calentadores', pvp: 450000, unidad: 'un' },
        { cod: 'GAS-006', nom: 'Tubería de cobre 1/2 pulgada', categoria: 'Tubería', pvp: 14000, unidad: 'metro' },
        { cod: 'GAS-007', nom: 'Llave de paso para estufa', categoria: 'Válvulas', pvp: 32000, unidad: 'un' },
        { cod: 'GAS-008', nom: 'Empaque/junta para conexión gas', categoria: 'Accesorios', pvp: 3000, unidad: 'un' },
        { cod: 'GAS-009', nom: 'Medidor de gas residencial', categoria: 'Medición', pvp: 180000, unidad: 'un' },
        { cod: 'GAS-010', nom: 'Certificado RETIE/revisión técnica', categoria: 'Servicios', pvp: 120000, unidad: 'servicio' }
      ]
    },
    refrigeracion: {
      products: [
        { cod: 'REF-001', nom: 'Gas refrigerante R410A (libra)', categoria: 'Refrigerantes', pvp: 35000, unidad: 'libra' },
        { cod: 'REF-002', nom: 'Gas refrigerante R22 (libra)', categoria: 'Refrigerantes', pvp: 45000, unidad: 'libra' },
        { cod: 'REF-003', nom: 'Compresor 1/4 HP', categoria: 'Compresores', pvp: 280000, unidad: 'un' },
        { cod: 'REF-004', nom: 'Termostato digital', categoria: 'Controles', pvp: 65000, unidad: 'un' },
        { cod: 'REF-005', nom: 'Capacitor de arranque', categoria: 'Eléctricos', pvp: 28000, unidad: 'un' },
        { cod: 'REF-006', nom: 'Filtro secador', categoria: 'Accesorios', pvp: 18000, unidad: 'un' },
        { cod: 'REF-007', nom: 'Tubería de cobre refrigeración 1/4', categoria: 'Tubería', pvp: 12000, unidad: 'metro' },
        { cod: 'REF-008', nom: 'Mantenimiento preventivo split', categoria: 'Servicios', pvp: 80000, unidad: 'servicio' },
        { cod: 'REF-009', nom: 'Instalación split 12000 BTU', categoria: 'Servicios', pvp: 250000, unidad: 'servicio' },
        { cod: 'REF-010', nom: 'Soportes para unidad exterior', categoria: 'Accesorios', pvp: 45000, unidad: 'un' }
      ]
    },
    cctv: {
      products: [
        { cod: 'CCT-001', nom: 'Cámara domo 2MP interior', categoria: 'Cámaras', pvp: 85000, unidad: 'un' },
        { cod: 'CCT-002', nom: 'Cámara bullet 4MP exterior', categoria: 'Cámaras', pvp: 135000, unidad: 'un' },
        { cod: 'CCT-003', nom: 'DVR 8 canales', categoria: 'Grabación', pvp: 280000, unidad: 'un' },
        { cod: 'CCT-004', nom: 'NVR 8 canales PoE', categoria: 'Grabación', pvp: 420000, unidad: 'un' },
        { cod: 'CCT-005', nom: 'Disco duro 1TB vigilancia', categoria: 'Almacenamiento', pvp: 165000, unidad: 'un' },
        { cod: 'CCT-006', nom: 'Cable UTP cat6 (caja 305m)', categoria: 'Cableado', pvp: 380000, unidad: 'caja' },
        { cod: 'CCT-007', nom: 'Conector RJ45', categoria: 'Accesorios', pvp: 1500, unidad: 'un' },
        { cod: 'CCT-008', nom: 'Fuente de poder 12V 5A', categoria: 'Energía', pvp: 35000, unidad: 'un' },
        { cod: 'CCT-009', nom: 'Instalación cámara + configuración', categoria: 'Servicios', pvp: 60000, unidad: 'servicio' },
        { cod: 'CCT-010', nom: 'Switch PoE 8 puertos', categoria: 'Redes', pvp: 195000, unidad: 'un' }
      ]
    },
    plomeria: {
      products: [
        { cod: 'PLO-001', nom: 'Tubo PVC presión 1/2 pulgada (6m)', categoria: 'Tubería', pvp: 22000, unidad: 'un' },
        { cod: 'PLO-002', nom: 'Llave terminal lavamanos', categoria: 'Llaves', pvp: 45000, unidad: 'un' },
        { cod: 'PLO-003', nom: 'Sifón para lavaplatos', categoria: 'Accesorios', pvp: 18000, unidad: 'un' },
        { cod: 'PLO-004', nom: 'Tanque sanitario completo', categoria: 'Sanitarios', pvp: 220000, unidad: 'un' },
        { cod: 'PLO-005', nom: 'Codo PVC 1/2 pulgada', categoria: 'Accesorios', pvp: 1800, unidad: 'un' },
        { cod: 'PLO-006', nom: 'Cinta teflón', categoria: 'Accesorios', pvp: 2500, unidad: 'un' },
        { cod: 'PLO-007', nom: 'Destapada de tubería (servicio)', categoria: 'Servicios', pvp: 70000, unidad: 'servicio' },
        { cod: 'PLO-008', nom: 'Instalación de calentador eléctrico', categoria: 'Servicios', pvp: 90000, unidad: 'servicio' },
        { cod: 'PLO-009', nom: 'Llave de paso 1/2 pulgada', categoria: 'Llaves', pvp: 25000, unidad: 'un' },
        { cod: 'PLO-010', nom: 'Manguera flexible para lavadora', categoria: 'Accesorios', pvp: 15000, unidad: 'un' }
      ]
    },
    cerrajeria: {
      products: [
        { cod: 'CER-001', nom: 'Cerradura de pomo estándar', categoria: 'Cerraduras', pvp: 55000, unidad: 'un' },
        { cod: 'CER-002', nom: 'Cerradura de seguridad multipunto', categoria: 'Cerraduras', pvp: 180000, unidad: 'un' },
        { cod: 'CER-003', nom: 'Cilindro de seguridad', categoria: 'Cilindros', pvp: 65000, unidad: 'un' },
        { cod: 'CER-004', nom: 'Control de acceso con tarjeta', categoria: 'Control de Acceso', pvp: 320000, unidad: 'un' },
        { cod: 'CER-005', nom: 'Cerradura electrónica con huella', categoria: 'Cerraduras', pvp: 450000, unidad: 'un' },
        { cod: 'CER-006', nom: 'Apertura de cerradura (servicio)', categoria: 'Servicios', pvp: 50000, unidad: 'servicio' },
        { cod: 'CER-007', nom: 'Duplicado de llave', categoria: 'Servicios', pvp: 8000, unidad: 'servicio' },
        { cod: 'CER-008', nom: 'Cambio de cilindro (servicio)', categoria: 'Servicios', pvp: 35000, unidad: 'servicio' },
        { cod: 'CER-009', nom: 'Candado de seguridad alta resistencia', categoria: 'Cerraduras', pvp: 48000, unidad: 'un' },
        { cod: 'CER-010', nom: 'Bisagra reforzada', categoria: 'Accesorios', pvp: 12000, unidad: 'un' }
      ]
    },
    plagas: {
      products: [
        { cod: 'PLA-001', nom: 'Fumigación residencial (servicio)', categoria: 'Servicios', pvp: 120000, unidad: 'servicio' },
        { cod: 'PLA-002', nom: 'Control de roedores (servicio)', categoria: 'Servicios', pvp: 150000, unidad: 'servicio' },
        { cod: 'PLA-003', nom: 'Trampa para roedores', categoria: 'Equipos', pvp: 15000, unidad: 'un' },
        { cod: 'PLA-004', nom: 'Cebo en gel para cucarachas', categoria: 'Insecticidas', pvp: 28000, unidad: 'un' },
        { cod: 'PLA-005', nom: 'Insecticida residual (galón)', categoria: 'Insecticidas', pvp: 85000, unidad: 'galón' },
        { cod: 'PLA-006', nom: 'Equipo de aspersión manual', categoria: 'Equipos', pvp: 120000, unidad: 'un' },
        { cod: 'PLA-007', nom: 'Control de termitas (servicio)', categoria: 'Servicios', pvp: 280000, unidad: 'servicio' },
        { cod: 'PLA-008', nom: 'Certificado de fumigación', categoria: 'Servicios', pvp: 20000, unidad: 'servicio' },
        { cod: 'PLA-009', nom: 'Trampa de luz UV para insectos', categoria: 'Equipos', pvp: 65000, unidad: 'un' },
        { cod: 'PLA-010', nom: 'Mantenimiento mensual (contrato)', categoria: 'Servicios', pvp: 90000, unidad: 'servicio' }
      ]
    },
    linea_blanca: {
      products: [
        { cod: 'LIB-001', nom: 'Compresor para nevera', categoria: 'Repuestos Nevera', pvp: 220000, unidad: 'un' },
        { cod: 'LIB-002', nom: 'Termostato para nevera', categoria: 'Repuestos Nevera', pvp: 35000, unidad: 'un' },
        { cod: 'LIB-003', nom: 'Correa para lavadora', categoria: 'Repuestos Lavadora', pvp: 18000, unidad: 'un' },
        { cod: 'LIB-004', nom: 'Motor para lavadora', categoria: 'Repuestos Lavadora', pvp: 180000, unidad: 'un' },
        { cod: 'LIB-005', nom: 'Resistencia para estufa eléctrica', categoria: 'Repuestos Estufa', pvp: 45000, unidad: 'un' },
        { cod: 'LIB-006', nom: 'Tarjeta electrónica universal', categoria: 'Repuestos Generales', pvp: 120000, unidad: 'un' },
        { cod: 'LIB-007', nom: 'Diagnóstico de electrodoméstico', categoria: 'Servicios', pvp: 30000, unidad: 'servicio' },
        { cod: 'LIB-008', nom: 'Reparación de nevera (mano de obra)', categoria: 'Servicios', pvp: 80000, unidad: 'servicio' },
        { cod: 'LIB-009', nom: 'Reparación de lavadora (mano de obra)', categoria: 'Servicios', pvp: 70000, unidad: 'servicio' },
        { cod: 'LIB-010', nom: 'Bisagra para nevera', categoria: 'Repuestos Nevera', pvp: 25000, unidad: 'un' }
      ]
    },
    solar: {
      products: [
        { cod: 'SOL-001', nom: 'Panel solar monocristalino 450W', categoria: 'Paneles', pvp: 650000, unidad: 'un' },
        { cod: 'SOL-002', nom: 'Inversor híbrido 3000W', categoria: 'Inversores', pvp: 1800000, unidad: 'un' },
        { cod: 'SOL-003', nom: 'Batería de litio 100Ah', categoria: 'Baterías', pvp: 2200000, unidad: 'un' },
        { cod: 'SOL-004', nom: 'Estructura de montaje para techo', categoria: 'Estructuras', pvp: 280000, unidad: 'un' },
        { cod: 'SOL-005', nom: 'Controlador de carga MPPT', categoria: 'Controladores', pvp: 350000, unidad: 'un' },
        { cod: 'SOL-006', nom: 'Cable solar 6mm (metro)', categoria: 'Cableado', pvp: 4500, unidad: 'metro' },
        { cod: 'SOL-007', nom: 'Conector MC4', categoria: 'Accesorios', pvp: 8000, unidad: 'un' },
        { cod: 'SOL-008', nom: 'Instalación sistema solar residencial', categoria: 'Servicios', pvp: 800000, unidad: 'servicio' },
        { cod: 'SOL-009', nom: 'Estudio de consumo energético', categoria: 'Servicios', pvp: 100000, unidad: 'servicio' },
        { cod: 'SOL-010', nom: 'Mantenimiento panel solar (servicio)', categoria: 'Servicios', pvp: 120000, unidad: 'servicio' }
      ]
    }
  };

  function normalizeOficioId(id) {
    const v = String(id || '').trim().toLowerCase();
    if (!v || v === OFICIO_AUTOMATISMOS) return OFICIO_AUTOMATISMOS;
    return OFICIOS.some((o) => o.id === v) ? v : OFICIO_AUTOMATISMOS;
  }

  function resolveItemOficioId(item) {
    return normalizeOficioId(item?.oficioId);
  }

  function getOficiosList() {
    return OFICIOS.slice();
  }

  function getOficioById(id) {
    return OFICIOS.find((o) => o.id === normalizeOficioId(id)) || OFICIOS[0];
  }

  function isFounderLicense() {
    return global.ArpaLicense?.isFounderLicense?.() === true;
  }

  function normalizeActiveOficiosList(raw) {
    if (!Array.isArray(raw) || !raw.length) return [];
    const ids = raw.map(normalizeOficioId).filter((id, i, arr) => arr.indexOf(id) === i);
    if (isFounderLicense()) return ids;
    return ids.length ? [ids[0]] : [];
  }

  function readActiveOficiosFromStorage() {
    try {
      const fromKey = JSON.parse(localStorage.getItem(ACTIVE_OFICIOS_KEY) || 'null');
      if (Array.isArray(fromKey) && fromKey.length) {
        return normalizeActiveOficiosList(fromKey);
      }
    } catch (e) { /* ignore */ }
    try {
      const fromSettings = global.ArpaBrand?.getSettings?.()?.activeOficios;
      if (Array.isArray(fromSettings) && fromSettings.length) {
        return normalizeActiveOficiosList(fromSettings);
      }
    } catch (e) { /* ignore */ }
    return [];
  }

  function saveActiveOficios(ids) {
    const normalized = normalizeActiveOficiosList(ids);
    try {
      localStorage.setItem(ACTIVE_OFICIOS_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.warn('[arpa-oficios] saveActiveOficios', e);
      return false;
    }
    try {
      const brand = global.ArpaBrand;
      if (brand?.getSettings && brand?.saveSettings) {
        const current = brand.getSettings();
        brand.saveSettings({ ...current, activeOficios: normalized });
      }
    } catch (e) { /* ignore */ }
    return true;
  }

  function getActiveOficiosFromSettings() {
    return readActiveOficiosFromStorage();
  }

  function getOficioLabel(oficioId) {
    const key = getOficioById(oficioId).i18nKey;
    const translated = global.ArpaI18n?.t?.(key);
    if (translated && translated !== key) return translated;
    const fallbacks = {
      automatismos: 'Automatismos',
      electricidad: 'Electricidad',
      gas: 'Gas',
      refrigeracion: 'Refrigeración y Aire Acondicionado',
      cctv: 'Cámaras y CCTV / Seguridad Electrónica',
      plomeria: 'Plomería y Fontanería',
      cerrajeria: 'Cerrajería',
      plagas: 'Control de Plagas / Fumigación',
      linea_blanca: 'Línea Blanca / Electrodomésticos',
      solar: 'Energía Solar'
    };
    return fallbacks[normalizeOficioId(oficioId)] || oficioId;
  }

  function getSeededOficios() {
    try {
      const data = JSON.parse(localStorage.getItem(SEEDED_KEY) || '[]');
      return Array.isArray(data) ? data.map(normalizeOficioId) : [];
    } catch (e) {
      return [];
    }
  }

  function markOficioSeeded(oficioId) {
    const id = normalizeOficioId(oficioId);
    const seeded = getSeededOficios();
    if (seeded.includes(id)) return;
    seeded.push(id);
    try {
      localStorage.setItem(SEEDED_KEY, JSON.stringify(seeded));
    } catch (e) { /* ignore */ }
  }

  function getSeedProductsForOficio(oficioId) {
    const id = normalizeOficioId(oficioId);
    if (id === OFICIO_AUTOMATISMOS) {
      return global.ArpaCatalogo?.buildAutomatismosSeedProducts?.() || [];
    }
    const pack = SEED_CATALOGS[id];
    return Array.isArray(pack?.products) ? pack.products : [];
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function importSeedCatalog(oficioId, options) {
    const opts = options || {};
    const id = normalizeOficioId(oficioId);
    if (!opts.force && getSeededOficios().includes(id)) {
      return { added: 0, skipped: true, reason: 'already_seeded' };
    }

    const seedProducts = getSeedProductsForOficio(id);
    if (!seedProducts.length) {
      return { added: 0, skipped: true, empty: true, total: 0 };
    }

    let categories = global.ArpaMiCatalogo?.getCategories?.(id) || [];
    let products = global.ArpaMiCatalogo?.getProducts?.(id) || [];

    const existingCodes = new Set(
      products
        .map((p) => String(p.cod || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const catByName = new Map();
    categories.forEach((c) => catByName.set(String(c.name || '').trim().toLowerCase(), c.id));

    function ensureCategory(name) {
      const label = String(name || 'General').trim() || 'General';
      const key = label.toLowerCase();
      if (catByName.has(key)) return catByName.get(key);
      const cat = { id: newId(), name: label, oficioId: id };
      categories.push(cat);
      catByName.set(key, cat.id);
      return cat.id;
    }

    let added = 0;
    seedProducts.forEach((item) => {
      const cod = String(item.cod || item.codigo || '').trim();
      const nom = String(item.nom || item.nombre || '').trim();
      if (!cod || !nom) return;
      if (existingCodes.has(cod.toLowerCase())) return;
      const categoriaId = ensureCategory(
        id === OFICIO_AUTOMATISMOS
          ? (global.ArpaCatalogo?.normalizeAutomatismosCategory?.(item.categoria || item.category) || item.categoria || 'General')
          : (item.categoria || item.category || 'General')
      );
      const seedPvp = id === OFICIO_AUTOMATISMOS
        ? 0
        : (Number(item.pvp != null ? item.pvp : item.precio) || 0);
      products.push({
        id: newId(),
        cod,
        nom,
        pvp: seedPvp,
        unidad: normalizeSeedUnidad(item.unidad),
        marca: String(item.marca || '').trim(),
        categoriaId,
        oficioId: id
      });
      existingCodes.add(cod.toLowerCase());
      added++;
    });

    try {
      global.ArpaMiCatalogo?.saveCategories?.(categories, id);
      global.ArpaMiCatalogo?.saveProducts?.(products, id);
    } catch (e) { /* ignore */ }

    markOficioSeeded(id);
    if (added > 0) {
      global.ArpaCatalogo?.invalidateListaCache?.();
      global.ArpaCotizacion?.updateCatalogHint?.();
    }

    return { added, skipped: false, total: seedProducts.length };
  }

  function unmarkOficioSeeded(oficioId) {
    const id = normalizeOficioId(oficioId);
    const seeded = getSeededOficios().filter((s) => s !== id);
    try {
      localStorage.setItem(SEEDED_KEY, JSON.stringify(seeded));
    } catch (e) { /* ignore */ }
  }

  function productBelongsToOficioForRemoval(product, oficioId) {
    const id = normalizeOficioId(oficioId);
    const raw = product?.oficioId;
    if (raw === undefined || raw === null || String(raw).trim() === '') return false;
    return normalizeOficioId(raw) === id;
  }

  function categoryBelongsToOficioForRemoval(category, oficioId) {
    const id = normalizeOficioId(oficioId);
    const raw = category?.oficioId;
    if (raw === undefined || raw === null || String(raw).trim() === '') return false;
    return normalizeOficioId(raw) === id;
  }

  function unseedOficio(oficioId) {
    const id = normalizeOficioId(oficioId);

    global.ArpaMiCatalogo?.saveProducts?.([], id);
    global.ArpaMiCatalogo?.saveCategories?.([], id);

    unmarkOficioSeeded(id);
    global.ArpaCatalogo?.invalidateListaCache?.();
    global.ArpaCotizacion?.updateCatalogHint?.();
  }

  function seedOficioIfNeeded(oficioId) {
    return importSeedCatalog(oficioId, { force: false });
  }

  function getSeedProductCount(oficioId) {
    return getSeedProductsForOficio(oficioId).length;
  }

  /** Carga manual del catálogo base de un oficio (agrega faltantes, sin duplicar códigos). */
  function precargarCatalogoOficio(oficioId) {
    const id = normalizeOficioId(oficioId);

    const total = getSeedProductCount(id);
    if (!total) {
      alert('No hay catálogo base disponible para este oficio.');
      return 0;
    }

    const label = getOficioLabel(id);
    const result = importSeedCatalog(id, { force: true });
    global.ArpaMiCatalogo?.refreshView?.();

    if (result.added > 0) {
      alert(
        'Catálogo base cargado: ' + result.added + ' producto' +
        (result.added !== 1 ? 's' : '') + ' agregado' +
        (result.added !== 1 ? 's' : '') + ' en ' + label + '.'
      );
    } else {
      alert(
        'El catálogo base de ' + label + ' ya estaba cargado (' + total +
        ' productos). No se agregaron duplicados.'
      );
    }
    return result.added;
  }

  function seedActiveOficios() {
    getActiveOficiosFromSettings().forEach((id) => seedOficioIfNeeded(id));
  }

  function renderSettingsCheckboxes(container) {
    if (!container) return;
    const active = getActiveOficiosFromSettings();
    const activeSet = new Set(active);
    const founder = isFounderLicense();
    const inputType = founder ? 'checkbox' : 'radio';
    const singleActive = active[0] || null;

    container.innerHTML = OFICIOS.map((o) => {
      const checked = founder ? activeSet.has(o.id) : singleActive === o.id;
      return `
        <label class="settings-oficio-chip">
          <input type="${inputType}" name="settings-oficio" value="${o.id}"${checked ? ' checked' : ''}>
          <span data-i18n="${o.i18nKey}">${getOficioLabel(o.id)}</span>
        </label>`;
    }).join('');
    bindOficioCheckboxListeners(container);
    global.ArpaI18n?.apply?.(global.ArpaI18n?.getLang?.() || 'es');
  }

  function readSettingsCheckboxes(container) {
    const selected = [];
    if (!container) return [];
    container.querySelectorAll('input[name="settings-oficio"]:checked').forEach((el) => {
      const id = normalizeOficioId(el.value);
      if (!selected.includes(id)) selected.push(id);
    });
    return normalizeActiveOficiosList(selected);
  }

  function revertOficioInputs(container, activeIds) {
    if (!container) return;
    const activeSet = new Set(activeIds);
    const single = activeIds[0] || null;
    container.querySelectorAll('input[name="settings-oficio"]').forEach((el) => {
      if (isFounderLicense()) {
        el.checked = activeSet.has(normalizeOficioId(el.value));
      } else {
        el.checked = normalizeOficioId(el.value) === single;
      }
    });
  }

  function applyNonFounderOficioChange(container, newOficioId) {
    const previous = getActiveOficiosFromSettings();
    const previousSingle = previous[0] || null;
    const nextId = normalizeOficioId(newOficioId);

    if (previousSingle === nextId) return true;

    if (previousSingle) {
      const msg =
        'Vas a cambiar de ' + getOficioLabel(previousSingle) + ' a ' + getOficioLabel(nextId) +
        '. Esto eliminará los productos de ' + getOficioLabel(previousSingle) +
        ' de tu catálogo (los que agregaste manualmente en otras categorías no se tocan). ¿Continuar?';
      if (!confirm(msg)) {
        revertOficioInputs(container, previous);
        return false;
      }
      unseedOficio(previousSingle);
    }

    if (!saveActiveOficios([nextId])) {
      revertOficioInputs(container, previous);
      return false;
    }

    seedOficioIfNeeded(nextId);
    global.ArpaMiCatalogo?.refreshView?.();
    renderSettingsCheckboxes(container);
    return true;
  }

  function applyOficiosFromSettingsUI(container) {
    const grid = container || document.getElementById('settings-oficios-grid');
    const ids = readSettingsCheckboxes(grid);
    if (!saveActiveOficios(ids)) return false;
    seedActiveOficios();
    global.ArpaMiCatalogo?.refreshView?.();
    return true;
  }

  function bindOficioCheckboxListeners(container) {
    if (!container) return;
    container.querySelectorAll('input[name="settings-oficio"]').forEach((input) => {
      if (input.dataset.oficioBound === '1') return;
      input.dataset.oficioBound = '1';
      input.addEventListener('change', (e) => {
        const target = e.target;
        if (isFounderLicense()) {
          applyOficiosFromSettingsUI(container);
          return;
        }

        if (!target.checked) {
          target.checked = true;
          return;
        }

        applyNonFounderOficioChange(container, target.value);
      });
    });
  }

  global.ArpaOficios = {
    OFICIO_AUTOMATISMOS,
    OFICIOS,
    SEED_CATALOGS,
    ACTIVE_OFICIOS_KEY,
    normalizeOficioId,
    normalizeActiveOficiosList,
    readActiveOficiosFromStorage,
    saveActiveOficios,
    applyOficiosFromSettingsUI,
    resolveItemOficioId,
    getOficiosList,
    getOficioById,
    getActiveOficiosFromSettings,
    getOficioLabel,
    seedOficioIfNeeded,
    seedActiveOficios,
    importSeedCatalog,
    getSeedProductsForOficio,
    getSeedProductCount,
    precargarCatalogoOficio,
    renderSettingsCheckboxes,
    readSettingsCheckboxes,
    unseedOficio,
    isFounderLicense
  };

  global.precargarCatalogoOficio = precargarCatalogoOficio;

  function migrateActiveOficiosKey() {
    try {
      if (localStorage.getItem(ACTIVE_OFICIOS_KEY)) return;
      const fromSettings = global.ArpaBrand?.getSettings?.()?.activeOficios;
      if (Array.isArray(fromSettings) && fromSettings.length) {
        saveActiveOficios(fromSettings);
      }
    } catch (e) { /* ignore */ }
  }

  function bootstrapCatalogSeeds() {
    if (global.ArpaOnboarding && !global.ArpaOnboarding.isOnboardingDone()) return;
    getActiveOficiosFromSettings().forEach((id) => seedOficioIfNeeded(id));
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      migrateActiveOficiosKey();
      bootstrapCatalogSeeds();
    });
  } else {
    migrateActiveOficiosKey();
    bootstrapCatalogSeeds();
  }
})(typeof window !== 'undefined' ? window : globalThis);
