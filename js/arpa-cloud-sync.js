/**
 * Respaldo en Google Sheets: catálogo e historial (POST JSON)
 */
(function (global) {
  'use strict';

  const LICENSE_API = 'https://script.google.com/macros/s/AKfycbzKBeyDVWVqPG1R47EZTVKmCpa3SOwxs8LXrW4ipvRtiyyRV4trJKg7D4i89_cUTcH2/exec';
  const LICENSE_CODE_KEY = 'arpa_suite_license_code';
  const CATALOG_PRODUCTS_KEY = 'arpa_catalogo_usuario';
  const CATALOG_CATEGORIES_KEY = 'arpa_categorias_usuario';
  const HISTORIAL_KEY = 'arpa_suite_servicio_historial';

  let catalogSyncTimer = null;
  let suppressCatalogSync = false;
  let suppressHistorialSync = false;

  function getLicenseCode() {
    try {
      return (localStorage.getItem(LICENSE_CODE_KEY) || '').trim().toUpperCase();
    } catch (e) {
      return '';
    }
  }

  function hasActiveLicense() {
    return !!getLicenseCode();
  }

  function postJson(payload) {
    return fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then((res) => res.json());
  }

  function getAllCategories() {
    try {
      const data = JSON.parse(localStorage.getItem(CATALOG_CATEGORIES_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function getAllProducts() {
    try {
      const data = JSON.parse(localStorage.getItem(CATALOG_PRODUCTS_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function getCategoryName(categoriaId) {
    if (!categoriaId) return 'General';
    const cat = getAllCategories().find((c) => c.id === categoriaId);
    return cat?.name || 'General';
  }

  function productToCloud(p) {
    return {
      id: p.id,
      cod: p.cod,
      nom: p.nom,
      pvp: p.pvp,
      unidad: p.unidad || '',
      marca: p.marca || '',
      categoria: getCategoryName(p.categoriaId)
    };
  }

  function pushCatalogo() {
    const licencia = getLicenseCode();
    if (!licencia) return Promise.resolve();
    const productos = getAllProducts().map(productToCloud);
    return postJson({ accion: 'savecatalogo', licencia, productos }).catch((err) => {
      console.warn('[arpa-cloud-sync] savecatalogo', err);
    });
  }

  function scheduleCatalogCloudSync() {
    if (suppressCatalogSync) return;
    if (catalogSyncTimer) clearTimeout(catalogSyncTimer);
    catalogSyncTimer = setTimeout(() => {
      catalogSyncTimer = null;
      pushCatalogo();
    }, 2000);
  }

  function recordToCloudEntry(record) {
    return {
      id: record.id,
      tipo: record.documento || record.tipo || '',
      subtipo: record.subtipo || '',
      numero: record.numeroServicio || record.numero || '',
      cliente: record.cliente || '',
      ciudad: record.ciudad || '',
      fecha: record.fecha || '',
      monto: record.total != null ? record.total : ''
    };
  }

  function pushHistorialEntry(record) {
    if (suppressHistorialSync || !record) return Promise.resolve();
    const licencia = getLicenseCode();
    if (!licencia) return Promise.resolve();
    return postJson({
      accion: 'savehistorialentry',
      licencia,
      entrada: recordToCloudEntry(record)
    }).catch((err) => {
      console.warn('[arpa-cloud-sync] savehistorialentry', err);
    });
  }

  function deleteHistorialEntry(entradaId) {
    if (suppressHistorialSync || !entradaId) return Promise.resolve();
    const licencia = getLicenseCode();
    if (!licencia) return Promise.resolve();
    return postJson({
      accion: 'deletehistorialentry',
      licencia,
      entradaId
    }).catch((err) => {
      console.warn('[arpa-cloud-sync] deletehistorialentry', err);
    });
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function inferModuloFromTipo(tipo) {
    const t = String(tipo || '').toLowerCase();
    if (t.includes('cuenta')) return 'cuenta-cobro';
    if (t.includes('cotiz')) return 'cotizacion';
    return 'formato';
  }

  function cloudEntryToRecord(entry) {
    const tipo = entry.tipo || '';
    const modulo = inferModuloFromTipo(tipo);
    const monto = entry.monto;
    const record = {
      id: entry.id || newId(),
      modulo,
      documento: tipo,
      tipo,
      subtipo: entry.subtipo || '',
      numero: entry.numero || '',
      numeroServicio: entry.numero || '',
      cliente: entry.cliente || '',
      ciudad: entry.ciudad || '',
      fecha: entry.fecha || '',
      savedAt: new Date().toISOString()
    };
    if (monto !== '' && monto != null && !Number.isNaN(Number(monto))) {
      record.total = Number(monto);
    }
    return record;
  }

  function needsCatalogRestore() {
    if (!hasActiveLicense()) return false;
    return getAllProducts().length === 0;
  }

  function needsHistorialRestore() {
    if (!hasActiveLicense()) return false;
    try {
      const data = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');
      return !Array.isArray(data) || data.length === 0;
    } catch (e) {
      return true;
    }
  }

  function applyCatalogFromCloud(productos) {
    if (!Array.isArray(productos) || !productos.length) return false;

    const categories = [];
    const catKeyToId = new Map();

    function ensureCategory(name, oficioId) {
      const label = String(name || 'General').trim() || 'General';
      const oid = global.ArpaOficios?.normalizeOficioId?.(oficioId) || 'automatismos';
      const key = oid + '::' + label.toLowerCase();
      if (catKeyToId.has(key)) return catKeyToId.get(key);
      const cat = { id: newId(), name: label, oficioId: oid };
      categories.push(cat);
      catKeyToId.set(key, cat.id);
      return cat.id;
    }

    const products = productos.map((p) => {
      const oficioId = 'automatismos';
      const categoriaId = ensureCategory(p.categoria, oficioId);
      return {
        id: p.id || newId(),
        cod: String(p.cod || '').trim(),
        nom: String(p.nom || '').trim(),
        pvp: Number(p.pvp) || 0,
        unidad: String(p.unidad || 'unidad').trim() || 'unidad',
        marca: String(p.marca || '').trim(),
        categoriaId,
        oficioId
      };
    }).filter((p) => p.cod && p.nom);

    if (!products.length) return false;

    suppressCatalogSync = true;
    try {
      localStorage.setItem(CATALOG_CATEGORIES_KEY, JSON.stringify(categories));
      localStorage.setItem(CATALOG_PRODUCTS_KEY, JSON.stringify(products));
      global.ArpaCatalogo?.invalidateListaCache?.();
      global.ArpaCotizacion?.updateCatalogHint?.();
      global.ArpaMiCatalogo?.refreshView?.();
      return true;
    } catch (e) {
      console.warn('[arpa-cloud-sync] applyCatalogFromCloud', e);
      return false;
    } finally {
      suppressCatalogSync = false;
    }
  }

  function applyHistorialFromCloud(entradas) {
    if (!Array.isArray(entradas) || !entradas.length) return false;

    const records = entradas.map(cloudEntryToRecord);
    suppressHistorialSync = true;
    try {
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(records));
      global.ArpaHistorial?.render?.();
      return true;
    } catch (e) {
      console.warn('[arpa-cloud-sync] applyHistorialFromCloud', e);
      return false;
    } finally {
      suppressHistorialSync = false;
    }
  }

  function restoreCloudDataIfNeeded() {
    const licencia = getLicenseCode();
    if (!licencia) return Promise.resolve({ catalog: false, historial: false });

    const tasks = [];

    if (needsCatalogRestore()) {
      tasks.push(
        postJson({ accion: 'getcatalogo', licencia })
          .then((data) => {
            if (!data?.ok || !data.productos?.length) return false;
            return applyCatalogFromCloud(data.productos);
          })
          .catch((err) => {
            console.warn('[arpa-cloud-sync] getcatalogo', err);
            return false;
          })
      );
    } else {
      tasks.push(Promise.resolve(false));
    }

    if (needsHistorialRestore()) {
      tasks.push(
        postJson({ accion: 'gethistorial', licencia })
          .then((data) => {
            if (!data?.ok || !data.entradas?.length) return false;
            return applyHistorialFromCloud(data.entradas);
          })
          .catch((err) => {
            console.warn('[arpa-cloud-sync] gethistorial', err);
            return false;
          })
      );
    } else {
      tasks.push(Promise.resolve(false));
    }

    return Promise.all(tasks).then(([catalog, historial]) => ({ catalog, historial }));
  }

  global.ArpaCloudSync = {
    LICENSE_API,
    postJson,
    pushCatalogo,
    scheduleCatalogCloudSync,
    pushHistorialEntry,
    deleteHistorialEntry,
    restoreCloudDataIfNeeded,
    needsCatalogRestore,
    needsHistorialRestore
  };
})(window);
