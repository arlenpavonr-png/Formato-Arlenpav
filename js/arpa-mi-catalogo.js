/**
 * Módulo: Mi Catálogo (productos del usuario en localStorage)
 */
(function (global) {
  const STORAGE_KEY = 'arpa_catalogo_usuario';
  const UNIDADES = ['unidad', 'metro', 'hora', 'servicio'];

  let editingId = null;
  let searchQuery = '';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function formatoPesos(n) {
    return global.ArpaPricing?.formatoPesos(n) || ('$ ' + (Number(n) || 0).toLocaleString('es-CO'));
  }

  function parsePvp(value) {
    const n = Number(String(value).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function getProducts() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    global.ArpaCatalogo?.invalidateListaCache?.();
    global.ArpaCotizacion?.updateCatalogHint?.();
  }

  function hasProducts() {
    return getProducts().length > 0;
  }

  function toFlatProduct(p) {
    const nom = (p.nom || '').trim();
    const marca = (p.marca || '').trim();
    return {
      cod: (p.cod || '').trim(),
      nom: marca ? `${marca} – ${nom}` : nom,
      marca,
      categoria: (p.categoria || '').trim(),
      pvp: parsePvp(p.pvp),
      unidad: p.unidad || 'unidad',
      _userId: p.id
    };
  }

  function getListaFlat() {
    return getProducts()
      .filter((p) => (p.nom || '').trim() && (p.cod || '').trim())
      .map(toFlatProduct);
  }

  function findByCod(cod) {
    return getListaFlat().find((p) => p.cod === cod) || null;
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function getFilteredProducts() {
    const q = searchQuery.toLowerCase().trim();
    const list = getProducts();
    if (!q) return list;
    return list.filter((p) =>
      (p.nom || '').toLowerCase().includes(q) ||
      (p.cod || '').toLowerCase().includes(q)
    );
  }

  function openForm(product) {
    editingId = product?.id || null;
    const overlay = document.getElementById('catalogo-form-modal');
    const title = document.getElementById('catalogo-form-title');
    if (title) title.textContent = editingId ? 'Editar producto' : 'Nuevo producto';

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    };

    set('cat-form-nom', product?.nom);
    set('cat-form-cod', product?.cod);
    set('cat-form-pvp', product?.pvp != null ? product.pvp : '');
    set('cat-form-marca', product?.marca);
    set('cat-form-categoria', product?.categoria);
    const unidad = document.getElementById('cat-form-unidad');
    if (unidad) unidad.value = UNIDADES.includes(product?.unidad) ? product.unidad : 'unidad';

    overlay?.classList.add('open');
    document.getElementById('cat-form-nom')?.focus();
  }

  function closeForm() {
    editingId = null;
    document.getElementById('catalogo-form-modal')?.classList.remove('open');
  }

  function readFormData() {
    return {
      nom: document.getElementById('cat-form-nom')?.value.trim() || '',
      cod: document.getElementById('cat-form-cod')?.value.trim() || '',
      pvp: parsePvp(document.getElementById('cat-form-pvp')?.value),
      unidad: document.getElementById('cat-form-unidad')?.value || 'unidad',
      marca: document.getElementById('cat-form-marca')?.value.trim() || '',
      categoria: document.getElementById('cat-form-categoria')?.value.trim() || ''
    };
  }

  function showFormError(msg) {
    const el = document.getElementById('catalogo-form-error');
    if (el) {
      el.textContent = msg;
      el.hidden = !msg;
    }
  }

  function saveForm() {
    const data = readFormData();
    if (!data.nom) {
      showFormError('El nombre es obligatorio.');
      return;
    }
    if (!data.cod) {
      showFormError('La referencia es obligatoria.');
      return;
    }
    if (data.pvp <= 0) {
      showFormError('Ingrese un precio unitario válido.');
      return;
    }

    const products = getProducts();
    const duplicate = products.find((p) =>
      p.cod.toLowerCase() === data.cod.toLowerCase() && p.id !== editingId
    );
    if (duplicate) {
      showFormError('Ya existe un producto con esa referencia.');
      return;
    }

    if (editingId) {
      const idx = products.findIndex((p) => p.id === editingId);
      if (idx >= 0) {
        products[idx] = { ...products[idx], ...data };
      }
    } else {
      products.unshift({ id: newId(), ...data });
    }

    saveProducts(products);
    showFormError('');
    closeForm();
    render();
  }

  function deleteProduct(id) {
    const product = getProducts().find((p) => p.id === id);
    if (!product) return;
    const label = product.nom || product.cod || 'este producto';
    if (!confirm(`¿Eliminar "${label}" del catálogo?`)) return;
    saveProducts(getProducts().filter((p) => p.id !== id));
    render();
  }

  function render() {
    const list = document.getElementById('catalogo-list');
    const empty = document.getElementById('catalogo-empty');
    const count = document.getElementById('catalogo-count');
    if (!list) return;

    const products = getFilteredProducts();
    const total = getProducts().length;

    if (count) {
      count.textContent = total
        ? `${total} producto${total !== 1 ? 's' : ''}${searchQuery ? ` · ${products.length} mostrados` : ''}`
        : '';
    }

    if (!total) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    if (!products.length) {
      list.innerHTML = '<div class="catalogo-no-results">Sin resultados para la búsqueda.</div>';
      return;
    }

    list.innerHTML = products.map((p) => `
      <article class="catalogo-card" data-id="${escapeHtml(p.id)}">
        <div class="catalogo-card-head">
          <span class="catalogo-ref">${escapeHtml(p.cod)}</span>
          <span class="catalogo-unidad">${escapeHtml(p.unidad || 'unidad')}</span>
        </div>
        <h3 class="catalogo-nom">${escapeHtml(p.nom)}</h3>
        ${(p.marca || p.categoria) ? `
          <p class="catalogo-meta">
            ${p.marca ? `<span>${escapeHtml(p.marca)}</span>` : ''}
            ${p.categoria ? `<span>${escapeHtml(p.categoria)}</span>` : ''}
          </p>` : ''}
        <div class="catalogo-card-foot">
          <strong class="catalogo-pvp">${formatoPesos(p.pvp)}</strong>
          <div class="catalogo-card-actions">
            <button type="button" class="btn-catalogo-edit" data-id="${escapeHtml(p.id)}" aria-label="Editar">✏️</button>
            <button type="button" class="btn-catalogo-del" data-id="${escapeHtml(p.id)}" aria-label="Eliminar">🗑️</button>
          </div>
        </div>
      </article>
    `).join('');

    list.querySelectorAll('.btn-catalogo-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = getProducts().find((p) => p.id === btn.dataset.id);
        if (product) openForm(product);
      });
    });
    list.querySelectorAll('.btn-catalogo-del').forEach((btn) => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }

  function refreshView() {
    searchQuery = document.getElementById('catalogo-buscar')?.value || '';
    render();
  }

  function initMiCatalogo() {
    document.getElementById('catalogo-buscar')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });
    document.getElementById('btn-catalogo-fab')?.addEventListener('click', () => {
      showFormError('');
      openForm(null);
    });
    document.getElementById('btn-catalogo-form-save')?.addEventListener('click', saveForm);
    document.getElementById('btn-catalogo-form-cancel')?.addEventListener('click', closeForm);
    document.getElementById('catalogo-form-close')?.addEventListener('click', closeForm);
    document.getElementById('catalogo-form-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'catalogo-form-modal') closeForm();
    });
    render();
  }

  global.ArpaMiCatalogo = {
    STORAGE_KEY,
    getProducts,
    saveProducts,
    hasProducts,
    getListaFlat,
    findByCod,
    render,
    refreshView,
    initMiCatalogo
  };
})(window);
