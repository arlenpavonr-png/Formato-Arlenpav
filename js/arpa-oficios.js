/**
 * Oficios / actividades — selector multi-oficio y catálogos genéricos (anexo).
 * Automatismos permanece como oficio principal; los demás son extensiones opcionales.
 */
(function (global) {
  const OFICIO_AUTOMATISMOS = 'automatismos';
  const SEEDED_KEY = 'arpa_oficios_seeded';

  /** @type {{ id: string, i18nKey: string, locked?: boolean }[]} */
  const OFICIOS = [
    { id: OFICIO_AUTOMATISMOS, i18nKey: 'oficio.automatismos', locked: true },
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

  /**
   * Catálogos genéricos precargados por oficio (punto de partida editable).
   * Formato por ítem de producto: { cod, nom, categoria, pvp, unidad?, marca? }
   * Las categorías se derivan del campo `categoria` de cada producto.
   * Los datos se entregarán en un mensaje posterior — estructura lista para recibirlos.
   */
  const SEED_CATALOGS = {
    electricidad: { products: [] },
    gas: { products: [] },
    refrigeracion: { products: [] },
    cctv: { products: [] },
    plomeria: { products: [] },
    cerrajeria: { products: [] },
    plagas: { products: [] },
    linea_blanca: { products: [] },
    solar: { products: [] }
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

  function getActiveOficiosFromSettings() {
    try {
      const raw = global.ArpaBrand?.getSettings?.()?.activeOficios;
      if (!Array.isArray(raw) || !raw.length) return [OFICIO_AUTOMATISMOS];
      const ids = raw.map(normalizeOficioId).filter((id, i, arr) => arr.indexOf(id) === i);
      if (!ids.includes(OFICIO_AUTOMATISMOS)) ids.unshift(OFICIO_AUTOMATISMOS);
      return ids;
    } catch (e) {
      return [OFICIO_AUTOMATISMOS];
    }
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
    if (id === OFICIO_AUTOMATISMOS) return;
    const seeded = getSeededOficios();
    if (seeded.includes(id)) return;
    seeded.push(id);
    try {
      localStorage.setItem(SEEDED_KEY, JSON.stringify(seeded));
    } catch (e) { /* ignore */ }
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Importa productos genéricos del oficio a localStorage si hay datos en SEED_CATALOGS.
   * No modifica Automatismos ni productos ya existentes del usuario.
   */
  function seedOficioIfNeeded(oficioId) {
    const id = normalizeOficioId(oficioId);
    if (id === OFICIO_AUTOMATISMOS) return { added: 0, skipped: true };
    if (getSeededOficios().includes(id)) return { added: 0, skipped: true };

    const pack = SEED_CATALOGS[id];
    const seedProducts = Array.isArray(pack?.products) ? pack.products : [];
    if (!seedProducts.length) {
      return { added: 0, skipped: true, empty: true };
    }

    const STORAGE_KEY = global.ArpaMiCatalogo?.STORAGE_KEY || 'arpa_catalogo_usuario';
    const CATEGORIES_KEY = global.ArpaMiCatalogo?.CATEGORIES_KEY || 'arpa_categorias_usuario';

    let categories;
    let products;
    try {
      categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
      products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(categories)) categories = [];
      if (!Array.isArray(products)) products = [];
    } catch (e) {
      categories = [];
      products = [];
    }

    const existingCodes = new Set(
      products
        .filter((p) => resolveItemOficioId(p) === id)
        .map((p) => String(p.cod || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const catByName = new Map();
    categories
      .filter((c) => resolveItemOficioId(c) === id)
      .forEach((c) => catByName.set(String(c.name || '').trim().toLowerCase(), c.id));

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
      const categoriaId = ensureCategory(item.categoria || item.category || 'General');
      products.push({
        id: newId(),
        cod,
        nom,
        pvp: Number(item.pvp != null ? item.pvp : item.precio) || 0,
        unidad: item.unidad || 'unidad',
        marca: String(item.marca || '').trim(),
        categoriaId,
        oficioId: id
      });
      existingCodes.add(cod.toLowerCase());
      added++;
    });

    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) { /* ignore */ }

    if (added > 0) {
      markOficioSeeded(id);
      global.ArpaCatalogo?.invalidateListaCache?.();
      global.ArpaCotizacion?.updateCatalogHint?.();
    }

    return { added, skipped: false };
  }

  function seedActiveOficios() {
    getActiveOficiosFromSettings().forEach((id) => seedOficioIfNeeded(id));
  }

  function renderSettingsCheckboxes(container) {
    if (!container) return;
    const active = new Set(getActiveOficiosFromSettings());
    container.innerHTML = OFICIOS.map((o) => {
      const checked = active.has(o.id) || o.locked;
      const disabled = !!o.locked;
      return `
        <label class="settings-oficio-chip${disabled ? ' is-locked' : ''}">
          <input type="checkbox" name="settings-oficio" value="${o.id}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}>
          <span data-i18n="${o.i18nKey}">${getOficioLabel(o.id)}</span>
        </label>`;
    }).join('');
    global.ArpaI18n?.apply?.(global.ArpaI18n?.getLang?.() || 'es');
  }

  function readSettingsCheckboxes(container) {
    const selected = [OFICIO_AUTOMATISMOS];
    container?.querySelectorAll('input[name="settings-oficio"]:checked').forEach((el) => {
      const id = normalizeOficioId(el.value);
      if (!selected.includes(id)) selected.push(id);
    });
    return selected;
  }

  global.ArpaOficios = {
    OFICIO_AUTOMATISMOS,
    OFICIOS,
    SEED_CATALOGS,
    normalizeOficioId,
    resolveItemOficioId,
    getOficiosList,
    getOficioById,
    getActiveOficiosFromSettings,
    getOficioLabel,
    seedOficioIfNeeded,
    seedActiveOficios,
    renderSettingsCheckboxes,
    readSettingsCheckboxes
  };
})(typeof window !== 'undefined' ? window : globalThis);
