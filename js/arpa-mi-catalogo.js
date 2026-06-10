/**
 * Módulo: Mi Catálogo (productos y categorías del usuario en localStorage)
 */
(function (global) {
  const STORAGE_KEY = 'arpa_catalogo_usuario';
  const CATEGORIES_KEY = 'arpa_categorias_usuario';
  const UNIDADES = ['unidad', 'metro', 'hora', 'servicio'];
  const SIN_CATEGORIA_ID = '__sin_categoria__';

  let editingProductId = null;
  let editingCategoryId = null;
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

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function getCategories() {
    try {
      const data = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveCategories(categories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }

  function hasCategories() {
    return getCategories().length > 0;
  }

  function getCategoryById(id) {
    return getCategories().find((c) => c.id === id) || null;
  }

  function getCategoryName(id) {
    if (!id || id === SIN_CATEGORIA_ID) return '';
    return getCategoryById(id)?.name || '';
  }

  function countProductsInCategory(categoryId) {
    return getProducts().filter((p) => resolveProductCategoryId(p) === categoryId).length;
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
    return getProducts().some((p) => (p.nom || '').trim() && (p.cod || '').trim());
  }

  function resolveProductCategoryId(product) {
    if (product.categoriaId) return product.categoriaId;
    const legacy = (product.categoria || '').trim();
    if (!legacy) return SIN_CATEGORIA_ID;
    const match = getCategories().find(
      (c) => c.name.toLowerCase() === legacy.toLowerCase()
    );
    return match ? match.id : SIN_CATEGORIA_ID;
  }

  function toFlatProduct(p) {
    const nom = (p.nom || '').trim();
    const marca = (p.marca || '').trim();
    const categoria = getCategoryName(resolveProductCategoryId(p));
    return {
      cod: (p.cod || '').trim(),
      nom: marca ? `${marca} – ${nom}` : nom,
      marca,
      categoria,
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

  function getFilteredProducts() {
    const q = searchQuery.toLowerCase().trim();
    const list = getProducts();
    if (!q) return list;
    return list.filter((p) =>
      (p.nom || '').toLowerCase().includes(q) ||
      (p.cod || '').toLowerCase().includes(q) ||
      getCategoryName(resolveProductCategoryId(p)).toLowerCase().includes(q)
    );
  }

  function setFabVisible(visible) {
    const fab = document.getElementById('btn-catalogo-fab');
    if (fab) fab.hidden = !visible;
  }

  function populateCategorySelect(selectedId) {
    const sel = document.getElementById('cat-form-categoria');
    if (!sel) return;
    const categories = getCategories();
    sel.innerHTML = categories.length
      ? categories.map((c) =>
          `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`
        ).join('')
      : '<option value="">— Cree categorías primero —</option>';
    if (selectedId && categories.some((c) => c.id === selectedId)) {
      sel.value = selectedId;
    } else if (categories.length) {
      sel.value = categories[0].id;
    }
  }

  function openProductForm(product) {
    if (!hasCategories()) {
      openCategoryForm(null);
      return;
    }
    editingProductId = product?.id || null;
    const overlay = document.getElementById('catalogo-form-modal');
    const title = document.getElementById('catalogo-form-title');
    if (title) title.textContent = editingProductId ? 'Editar producto' : 'Nuevo producto';

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    };

    set('cat-form-nom', product?.nom);
    set('cat-form-cod', product?.cod);
    set('cat-form-pvp', product?.pvp != null ? product.pvp : '');
    set('cat-form-marca', product?.marca);
    populateCategorySelect(product ? resolveProductCategoryId(product) : null);
    const unidad = document.getElementById('cat-form-unidad');
    if (unidad) unidad.value = UNIDADES.includes(product?.unidad) ? product.unidad : 'unidad';

    showProductFormError('');
    overlay?.classList.add('open');
    document.getElementById('cat-form-nom')?.focus();
  }

  function closeProductForm() {
    editingProductId = null;
    document.getElementById('catalogo-form-modal')?.classList.remove('open');
  }

  function readProductFormData() {
    return {
      nom: document.getElementById('cat-form-nom')?.value.trim() || '',
      cod: document.getElementById('cat-form-cod')?.value.trim() || '',
      pvp: parsePvp(document.getElementById('cat-form-pvp')?.value),
      unidad: document.getElementById('cat-form-unidad')?.value || 'unidad',
      marca: document.getElementById('cat-form-marca')?.value.trim() || '',
      categoriaId: document.getElementById('cat-form-categoria')?.value || ''
    };
  }

  function showProductFormError(msg) {
    const el = document.getElementById('catalogo-form-error');
    if (el) {
      el.textContent = msg;
      el.hidden = !msg;
    }
  }

  function saveProductForm() {
    const data = readProductFormData();
    if (!data.nom) {
      showProductFormError('El nombre es obligatorio.');
      return;
    }
    if (!data.cod) {
      showProductFormError('La referencia es obligatoria.');
      return;
    }
    if (data.pvp <= 0) {
      showProductFormError('Ingrese un precio unitario válido.');
      return;
    }
    if (!data.categoriaId || !getCategoryById(data.categoriaId)) {
      showProductFormError('Seleccione una categoría válida.');
      return;
    }

    const products = getProducts();
    const duplicate = products.find((p) =>
      p.cod.toLowerCase() === data.cod.toLowerCase() && p.id !== editingProductId
    );
    if (duplicate) {
      showProductFormError('Ya existe un producto con esa referencia.');
      return;
    }

    const payload = {
      nom: data.nom,
      cod: data.cod,
      pvp: data.pvp,
      unidad: data.unidad,
      marca: data.marca,
      categoriaId: data.categoriaId
    };

    if (editingProductId) {
      const idx = products.findIndex((p) => p.id === editingProductId);
      if (idx >= 0) {
        products[idx] = { ...products[idx], ...payload };
        delete products[idx].categoria;
      }
    } else {
      products.unshift({ id: newId(), ...payload });
    }

    saveProducts(products);
    showProductFormError('');
    closeProductForm();
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

  function openCategoryForm(category) {
    editingCategoryId = category?.id || null;
    const overlay = document.getElementById('catalogo-cat-modal');
    const title = document.getElementById('catalogo-cat-title');
    const input = document.getElementById('cat-cat-nombre');
    if (title) title.textContent = editingCategoryId ? 'Editar categoría' : 'Nueva categoría';
    if (input) input.value = category?.name || '';
    showCategoryFormError('');
    overlay?.classList.add('open');
    input?.focus();
  }

  function closeCategoryForm() {
    editingCategoryId = null;
    document.getElementById('catalogo-cat-modal')?.classList.remove('open');
  }

  function showCategoryFormError(msg) {
    const el = document.getElementById('catalogo-cat-error');
    if (el) {
      el.textContent = msg;
      el.hidden = !msg;
    }
  }

  function saveCategoryForm() {
    const name = document.getElementById('cat-cat-nombre')?.value.trim() || '';
    if (!name) {
      showCategoryFormError('El nombre de la categoría es obligatorio.');
      return;
    }

    const categories = getCategories();
    const duplicate = categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCategoryId
    );
    if (duplicate) {
      showCategoryFormError('Ya existe una categoría con ese nombre.');
      return;
    }

    if (editingCategoryId) {
      const idx = categories.findIndex((c) => c.id === editingCategoryId);
      if (idx >= 0) categories[idx] = { ...categories[idx], name };
    } else {
      categories.push({ id: newId(), name });
    }

    saveCategories(categories);
    showCategoryFormError('');
    closeCategoryForm();
    render();
  }

  function deleteCategory(id) {
    const category = getCategoryById(id);
    if (!category) return;
    const count = countProductsInCategory(id);
    if (count > 0) {
      alert(`No se puede eliminar: hay ${count} producto${count !== 1 ? 's' : ''} en esta categoría.`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    saveCategories(getCategories().filter((c) => c.id !== id));
    render();
  }

  function renderProductCard(p) {
    return `
      <article class="catalogo-card" data-id="${escapeHtml(p.id)}">
        <div class="catalogo-card-head">
          <span class="catalogo-ref">${escapeHtml(p.cod)}</span>
          <span class="catalogo-unidad">${escapeHtml(p.unidad || 'unidad')}</span>
        </div>
        <h3 class="catalogo-nom">${escapeHtml(p.nom)}</h3>
        ${p.marca ? `<p class="catalogo-meta"><span>${escapeHtml(p.marca)}</span></p>` : ''}
        <div class="catalogo-card-foot">
          <strong class="catalogo-pvp">${formatoPesos(p.pvp)}</strong>
          <div class="catalogo-card-actions">
            <button type="button" class="btn-catalogo-edit" data-id="${escapeHtml(p.id)}" aria-label="Editar">✏️</button>
            <button type="button" class="btn-catalogo-del" data-id="${escapeHtml(p.id)}" aria-label="Eliminar">🗑️</button>
          </div>
        </div>
      </article>`;
  }

  function bindProductCardActions(container) {
    container.querySelectorAll('.btn-catalogo-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = getProducts().find((p) => p.id === btn.dataset.id);
        if (product) openProductForm(product);
      });
    });
    container.querySelectorAll('.btn-catalogo-del').forEach((btn) => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }

  function renderCategoriesPanel() {
    const panel = document.getElementById('catalogo-categorias-panel');
    if (!panel) return;

    const categories = getCategories();
    if (!categories.length) {
      panel.innerHTML = `
        <div class="catalogo-cat-empty">
          Primero crea tus categorías. Ejemplo: Motores, Repuestos, Servicios, Materiales…
        </div>
        <button type="button" class="btn-catalogo-add-cat" id="btn-catalogo-first-cat">+ Crear primera categoría</button>`;
      document.getElementById('btn-catalogo-first-cat')?.addEventListener('click', () => openCategoryForm(null));
      return;
    }

    panel.innerHTML = `
      <div class="catalogo-cat-list">
        ${categories.map((c) => {
          const n = countProductsInCategory(c.id);
          const canDelete = n === 0;
          return `
            <div class="catalogo-cat-chip" data-id="${escapeHtml(c.id)}">
              <span class="catalogo-cat-chip-name">${escapeHtml(c.name)}</span>
              <span class="catalogo-cat-chip-count">${n}</span>
              <button type="button" class="btn-cat-edit" data-id="${escapeHtml(c.id)}" aria-label="Editar categoría">✏️</button>
              ${canDelete ? `<button type="button" class="btn-cat-del" data-id="${escapeHtml(c.id)}" aria-label="Eliminar categoría">✕</button>` : ''}
            </div>`;
        }).join('')}
      </div>
      <button type="button" class="btn-catalogo-add-cat" id="btn-catalogo-add-cat">+ Nueva categoría</button>`;

    document.getElementById('btn-catalogo-add-cat')?.addEventListener('click', () => openCategoryForm(null));
    panel.querySelectorAll('.btn-cat-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = getCategoryById(btn.dataset.id);
        if (cat) openCategoryForm(cat);
      });
    });
    panel.querySelectorAll('.btn-cat-del').forEach((btn) => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });
  }

  function renderProductGroups() {
    const list = document.getElementById('catalogo-list');
    const empty = document.getElementById('catalogo-empty');
    const count = document.getElementById('catalogo-count');
    if (!list) return;

    const categories = getCategories();
    const products = getFilteredProducts();
    const total = getProducts().length;

    if (count) {
      count.textContent = total
        ? `${total} producto${total !== 1 ? 's' : ''}${searchQuery ? ` · ${products.length} mostrados` : ''}`
        : '';
    }

    if (!categories.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = true;
      return;
    }

    if (!total) {
      list.innerHTML = '';
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = 'Aún no hay productos.<br>Pulse <strong>+</strong> para agregar el primero.';
      }
      return;
    }

    if (empty) empty.hidden = true;

    if (!products.length) {
      list.innerHTML = '<div class="catalogo-no-results">Sin resultados para la búsqueda.</div>';
      return;
    }

    const groups = [];
    categories.forEach((cat) => {
      const items = products.filter((p) => resolveProductCategoryId(p) === cat.id);
      if (items.length) groups.push({ id: cat.id, name: cat.name, items });
    });

    const sinCat = products.filter((p) => resolveProductCategoryId(p) === SIN_CATEGORIA_ID);
    if (sinCat.length) {
      groups.push({ id: SIN_CATEGORIA_ID, name: 'Sin categoría', items: sinCat });
    }

    list.innerHTML = groups.map((g) => `
      <section class="catalogo-grupo">
        <h3 class="catalogo-grupo-title">
          <span class="catalogo-grupo-dot">🔹</span>
          ${escapeHtml(g.name.toUpperCase())}
          <span class="catalogo-grupo-count">(${g.items.length} producto${g.items.length !== 1 ? 's' : ''})</span>
        </h3>
        <div class="catalogo-grupo-cards">
          ${g.items.map(renderProductCard).join('')}
        </div>
      </section>
    `).join('');

    bindProductCardActions(list);
  }

  function render() {
    renderCategoriesPanel();
    renderProductGroups();
  }

  function refreshView() {
    searchQuery = document.getElementById('catalogo-buscar')?.value || '';
    render();
  }

  function onFabClick() {
    if (!hasCategories()) {
      openCategoryForm(null);
    } else {
      openProductForm(null);
    }
  }

  function initMiCatalogo() {
    document.getElementById('catalogo-buscar')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProductGroups();
    });
    document.getElementById('btn-catalogo-fab')?.addEventListener('click', onFabClick);
    document.getElementById('btn-catalogo-form-save')?.addEventListener('click', saveProductForm);
    document.getElementById('btn-catalogo-form-cancel')?.addEventListener('click', closeProductForm);
    document.getElementById('catalogo-form-close')?.addEventListener('click', closeProductForm);
    document.getElementById('catalogo-form-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'catalogo-form-modal') closeProductForm();
    });
    document.getElementById('btn-catalogo-cat-save')?.addEventListener('click', saveCategoryForm);
    document.getElementById('btn-catalogo-cat-cancel')?.addEventListener('click', closeCategoryForm);
    document.getElementById('catalogo-cat-close')?.addEventListener('click', closeCategoryForm);
    document.getElementById('catalogo-cat-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'catalogo-cat-modal') closeCategoryForm();
    });
    render();
  }

  global.ArpaMiCatalogo = {
    STORAGE_KEY,
    CATEGORIES_KEY,
    getProducts,
    getCategories,
    saveProducts,
    hasProducts,
    hasCategories,
    getListaFlat,
    findByCod,
    render,
    refreshView,
    setFabVisible,
    initMiCatalogo
  };
})(window);
