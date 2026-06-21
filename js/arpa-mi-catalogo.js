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
  let editingOficioId = 'automatismos';
  let currentOficioId = 'automatismos';
  let activeTabOficio = 'automatismos';
  const searchByOficio = {};
  let importPreviewRows = [];

  function normalizeOficioId(oficioId) {
    return global.ArpaOficios?.normalizeOficioId?.(oficioId) || 'automatismos';
  }

  function resolveItemOficioId(item) {
    return global.ArpaOficios?.resolveItemOficioId?.(item) || 'automatismos';
  }

  function sectionDomIds(oficioId) {
    const id = normalizeOficioId(oficioId);
    if (id === 'automatismos') {
      return {
        panel: 'catalogo-categorias-panel',
        list: 'catalogo-list',
        empty: 'catalogo-empty',
        count: 'catalogo-count',
        search: 'catalogo-buscar',
        section: 'catalogo-section-automatismos'
      };
    }
    return {
      panel: `catalogo-categorias-panel-${id}`,
      list: `catalogo-list-${id}`,
      empty: `catalogo-empty-${id}`,
      count: `catalogo-count-${id}`,
      search: `catalogo-buscar-${id}`,
      section: `catalogo-section-${id}`
    };
  }

  function getActiveOficios() {
    return global.ArpaOficios?.getActiveOficiosFromSettings?.() || ['automatismos'];
  }

  const IMPORT_HEADERS = {
    nombre: 'nom',
    referencia: 'cod',
    precio: 'pvp',
    preciounitario: 'pvp',
    pvp: 'pvp',
    unidad: 'unidad',
    marca: 'marca',
    categoria: 'categoria'
  };

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

  function getAllCategories() {
    try {
      const data = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function getCategories(oficioId) {
    const oid = normalizeOficioId(oficioId);
    return getAllCategories().filter((c) => resolveItemOficioId(c) === oid);
  }

  function saveCategories(categories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    global.ArpaCloudSync?.scheduleCatalogCloudSync?.();
  }

  function hasCategories(oficioId) {
    return getCategories(oficioId).length > 0;
  }

  function getCategoryById(id, oficioId) {
    const oid = oficioId != null ? normalizeOficioId(oficioId) : null;
    return getAllCategories().find((c) => {
      if (c.id !== id) return false;
      return oid == null || resolveItemOficioId(c) === oid;
    }) || null;
  }

  function getCategoryName(id, oficioId) {
    if (!id || id === SIN_CATEGORIA_ID) return '';
    return getCategoryById(id, oficioId)?.name || '';
  }

  function countProductsInCategory(categoryId, oficioId) {
    return getProducts(oficioId).filter((p) => resolveProductCategoryId(p) === categoryId).length;
  }

  function getAllProducts() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function getProducts(oficioId) {
    const oid = normalizeOficioId(oficioId);
    return getAllProducts().filter((p) => resolveItemOficioId(p) === oid);
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    global.ArpaCatalogo?.invalidateListaCache?.();
    global.ArpaCotizacion?.updateCatalogHint?.();
    global.ArpaCloudSync?.scheduleCatalogCloudSync?.();
  }

  function hasProducts(oficioId) {
    return getProducts(oficioId).some((p) => (p.nom || '').trim() && (p.cod || '').trim());
  }

  function resolveProductCategoryId(product) {
    if (product.categoriaId) return product.categoriaId;
    const legacy = (product.categoria || '').trim();
    if (!legacy) return SIN_CATEGORIA_ID;
    const oid = resolveItemOficioId(product);
    const match = getCategories(oid).find(
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
    return getAllProducts()
      .filter((p) => (p.nom || '').trim() && (p.cod || '').trim())
      .map(toFlatProduct);
  }

  function findByCod(cod) {
    return getListaFlat().find((p) => p.cod === cod) || null;
  }

  function getFilteredProducts(oficioId) {
    const oid = normalizeOficioId(oficioId);
    const q = (searchByOficio[oid] || '').toLowerCase().trim();
    const list = getProducts(oid);
    if (!q) return list;
    return list.filter((p) =>
      (p.nom || '').toLowerCase().includes(q) ||
      (p.cod || '').toLowerCase().includes(q) ||
      getCategoryName(resolveProductCategoryId(p), oid).toLowerCase().includes(q)
    );
  }

  function setFabVisible(visible) {
    const fab = document.getElementById('btn-catalogo-fab');
    if (fab) fab.hidden = !visible;
  }

  function populateCategorySelect(selectedId, oficioId) {
    const sel = document.getElementById('cat-form-categoria');
    if (!sel) return;
    const oid = normalizeOficioId(oficioId || editingOficioId);
    const categories = getCategories(oid);
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

  function openProductForm(product, oficioId) {
    editingOficioId = normalizeOficioId(oficioId || resolveItemOficioId(product) || currentOficioId);
    currentOficioId = editingOficioId;
    if (!hasCategories(editingOficioId)) {
      openCategoryForm(null, editingOficioId);
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
    populateCategorySelect(product ? resolveProductCategoryId(product) : null, editingOficioId);
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

    const products = getAllProducts();
    const oid = editingOficioId;
    const duplicate = products.find((p) =>
      resolveItemOficioId(p) === oid &&
      p.cod.toLowerCase() === data.cod.toLowerCase() &&
      p.id !== editingProductId
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
      categoriaId: data.categoriaId,
      oficioId: oid
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
    const product = getAllProducts().find((p) => p.id === id);
    if (!product) return;
    const label = product.nom || product.cod || 'este producto';
    if (!confirm(`¿Eliminar "${label}" del catálogo?`)) return;
    saveProducts(getAllProducts().filter((p) => p.id !== id));
    render();
  }

  function openCategoryForm(category, oficioId) {
    editingOficioId = normalizeOficioId(oficioId || resolveItemOficioId(category) || currentOficioId);
    currentOficioId = editingOficioId;
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

    const categories = getAllCategories();
    const oid = editingOficioId;
    const duplicate = categories.find(
      (c) =>
        resolveItemOficioId(c) === oid &&
        c.name.toLowerCase() === name.toLowerCase() &&
        c.id !== editingCategoryId
    );
    if (duplicate) {
      showCategoryFormError('Ya existe una categoría con ese nombre.');
      return;
    }

    if (editingCategoryId) {
      const idx = categories.findIndex((c) => c.id === editingCategoryId);
      if (idx >= 0) categories[idx] = { ...categories[idx], name };
    } else {
      categories.push({ id: newId(), name, oficioId: oid });
    }

    saveCategories(categories);
    showCategoryFormError('');
    closeCategoryForm();
    render();
  }

  function deleteCategory(id) {
    const category = getCategoryById(id);
    if (!category) return;
    const oid = resolveItemOficioId(category);
    const count = countProductsInCategory(id, oid);
    if (count > 0) {
      alert(`No se puede eliminar: hay ${count} producto${count !== 1 ? 's' : ''} en esta categoría.`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    saveCategories(getAllCategories().filter((c) => c.id !== id));
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

  function bindProductCardActions(container, oficioId) {
    const oid = normalizeOficioId(oficioId);
    container.querySelectorAll('.btn-catalogo-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = getProducts(oid).find((p) => p.id === btn.dataset.id);
        if (product) openProductForm(product, oid);
      });
    });
    container.querySelectorAll('.btn-catalogo-del').forEach((btn) => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }

  function renderCategoriesPanel(oficioId) {
    const oid = normalizeOficioId(oficioId);
    const dom = sectionDomIds(oid);
    const panel = document.getElementById(dom.panel);
    if (!panel) return;

    const categories = getCategories(oid);
    if (!categories.length) {
      panel.innerHTML = `
        <div class="catalogo-cat-empty" data-i18n="cat.cat_empty">
          Primero crea tus categorías. Ejemplo: Motores, Repuestos, Servicios, Materiales…
        </div>
        <button type="button" class="btn-catalogo-add-cat" data-oficio="${escapeHtml(oid)}">+ Crear primera categoría</button>`;
      panel.querySelector('.btn-catalogo-add-cat')?.addEventListener('click', () => openCategoryForm(null, oid));
      global.ArpaI18n?.apply?.(global.ArpaI18n?.getLang?.() || 'es');
      return;
    }

    panel.innerHTML = `
      <div class="catalogo-cat-list">
        ${categories.map((c) => {
          const n = countProductsInCategory(c.id, oid);
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
      <button type="button" class="btn-catalogo-add-cat" data-oficio="${escapeHtml(oid)}">+ Nueva categoría</button>`;

    panel.querySelector('.btn-catalogo-add-cat')?.addEventListener('click', () => openCategoryForm(null, oid));
    panel.querySelectorAll('.btn-cat-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = getCategoryById(btn.dataset.id, oid);
        if (cat) openCategoryForm(cat, oid);
      });
    });
    panel.querySelectorAll('.btn-cat-del').forEach((btn) => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });
  }

  function renderProductGroups(oficioId) {
    const oid = normalizeOficioId(oficioId);
    const dom = sectionDomIds(oid);
    const list = document.getElementById(dom.list);
    const empty = document.getElementById(dom.empty);
    const count = document.getElementById(dom.count);
    if (!list) return;

    const categories = getCategories(oid);
    const products = getFilteredProducts(oid);
    const total = getProducts(oid).length;
    const q = (searchByOficio[oid] || '').trim();

    if (count) {
      count.textContent = total
        ? `${total} producto${total !== 1 ? 's' : ''}${q ? ` · ${products.length} mostrados` : ''}`
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

    bindProductCardActions(list, oid);
  }

  function setCatalogoTab(oficioId) {
    const id = normalizeOficioId(oficioId);
    activeTabOficio = id;
    currentOficioId = id;
    applyCatalogoTabVisibility(getActiveOficios());
  }

  function applyCatalogoTabVisibility(activeOficios) {
    const active = Array.isArray(activeOficios) ? activeOficios : getActiveOficios();
    const multi = active.length > 1;
    const tabsWrap = document.getElementById('catalogo-oficios-tabs');

    if (!active.includes(activeTabOficio)) {
      activeTabOficio = active.includes('automatismos') ? 'automatismos' : active[0];
      currentOficioId = activeTabOficio;
    }

    if (tabsWrap) tabsWrap.hidden = !multi;

    active.forEach((oid) => {
      const section = document.getElementById(sectionDomIds(oid).section);
      if (section) section.hidden = multi && oid !== activeTabOficio;
    });

    document.querySelectorAll('#catalogo-oficios-tabs-list .catalogo-oficio-tab').forEach((btn) => {
      const isActive = btn.dataset.oficio === activeTabOficio;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function renderOficioTabs(activeOficios) {
    const tabsWrap = document.getElementById('catalogo-oficios-tabs');
    const tabsList = document.getElementById('catalogo-oficios-tabs-list');
    if (!tabsWrap || !tabsList) {
      applyCatalogoTabVisibility(activeOficios);
      return;
    }

    if (activeOficios.length <= 1) {
      tabsList.innerHTML = '';
      applyCatalogoTabVisibility(activeOficios);
      return;
    }

    tabsList.innerHTML = activeOficios.map((oficioId) => {
      const i18nKey = global.ArpaOficios?.getOficioById?.(oficioId)?.i18nKey || '';
      const label = global.ArpaOficios?.getOficioLabel?.(oficioId) || oficioId;
      const isActive = oficioId === activeTabOficio;
      return `<button type="button" class="catalogo-oficio-tab${isActive ? ' active' : ''}" role="tab" data-oficio="${escapeHtml(oficioId)}" aria-selected="${isActive ? 'true' : 'false'}"${i18nKey ? ` data-i18n="${escapeHtml(i18nKey)}"` : ''}>${escapeHtml(label)}</button>`;
    }).join('');

    global.ArpaI18n?.apply?.(global.ArpaI18n?.getLang?.() || 'es');

    tabsList.querySelectorAll('.catalogo-oficio-tab').forEach((btn) => {
      btn.addEventListener('click', () => setCatalogoTab(btn.dataset.oficio));
    });

    applyCatalogoTabVisibility(activeOficios);
  }

  function renderExtraOficioSections(activeOficios) {
    const container = document.getElementById('catalogo-extra-sections');
    if (!container) return;

    const extras = activeOficios.filter((id) => id !== 'automatismos');
    container.innerHTML = extras.map((oficioId) => {
      const i18nKey = global.ArpaOficios?.getOficioById?.(oficioId)?.i18nKey || '';
      const label = global.ArpaOficios?.getOficioLabel?.(oficioId) || oficioId;
      const seedCount = global.ArpaOficios?.getSeedProductCount?.(oficioId) || 0;
      return `
        <div id="catalogo-section-${escapeHtml(oficioId)}" class="catalogo-oficio-section" data-oficio="${escapeHtml(oficioId)}">
          <h2 class="catalogo-oficio-title"><span class="dot"></span><span${i18nKey ? ` data-i18n="${escapeHtml(i18nKey)}"` : ''}>${escapeHtml(label)}</span></h2>
          <div class="section catalogo-categorias-block">
            <div class="section-title"><span class="dot"></span><span data-i18n="cat.section.categorias">Categorías</span></div>
            <div id="catalogo-categorias-panel-${escapeHtml(oficioId)}"></div>
          </div>
          <div class="section">
            <div class="section-title"><span class="dot"></span><span data-i18n="cat.section.productos">Productos</span></div>
            <p class="catalogo-oficio-intro" data-i18n="cat.oficio.intro">Catálogo genérico editable. Ajuste precios y productos según su negocio.</p>
            <div class="catalogo-toolbar">
              <div class="catalogo-toolbar-row">
                <input type="search" id="catalogo-buscar-${escapeHtml(oficioId)}" data-i18n-placeholder="cat.placeholder.buscar" placeholder="🔍 Buscar por nombre o referencia…" autocomplete="off" inputmode="search">
                <button type="button" class="btn-catalogo-import btn-catalogo-seed-oficio" data-oficio="${escapeHtml(oficioId)}" data-i18n="cat.btn.cargar_catalogo_base">📦 Cargar catálogo base (${seedCount})</button>
                <button type="button" class="btn-catalogo-import btn-catalogo-add-oficio" data-oficio="${escapeHtml(oficioId)}" data-i18n="cat.btn.agregar_producto">+ Agregar producto</button>
              </div>
              <span id="catalogo-count-${escapeHtml(oficioId)}" class="catalogo-count"></span>
            </div>
            <div id="catalogo-empty-${escapeHtml(oficioId)}" class="catalogo-empty" hidden data-i18n-html="cat.empty">
              Aún no hay productos.<br>Pulse <strong>+</strong> para agregar el primero.
            </div>
            <div id="catalogo-list-${escapeHtml(oficioId)}" class="catalogo-list"></div>
          </div>
        </div>`;
    }).join('');

    global.ArpaI18n?.apply?.(global.ArpaI18n?.getLang?.() || 'es');

    extras.forEach((oficioId) => {
      document.getElementById(`catalogo-buscar-${oficioId}`)?.addEventListener('input', (e) => {
        searchByOficio[oficioId] = e.target.value;
        currentOficioId = oficioId;
        renderProductGroups(oficioId);
      });
      container.querySelector(`.btn-catalogo-seed-oficio[data-oficio="${oficioId}"]`)?.addEventListener('click', () => {
        currentOficioId = oficioId;
        global.ArpaOficios?.precargarCatalogoOficio?.(oficioId);
      });
      container.querySelector(`.btn-catalogo-add-oficio[data-oficio="${oficioId}"]`)?.addEventListener('click', () => {
        currentOficioId = oficioId;
        onFabClick();
      });
      container.querySelector(`#catalogo-section-${oficioId}`)?.addEventListener('focusin', () => {
        currentOficioId = oficioId;
      });
    });
  }

  function render() {
    const active = getActiveOficios();
    global.ArpaOficios?.seedActiveOficios?.();

    renderExtraOficioSections(active);
    renderOficioTabs(active);

    active.forEach((oficioId) => {
      renderCategoriesPanel(oficioId);
      renderProductGroups(oficioId);
    });

    applyCatalogoTabVisibility(active);
  }

  function refreshView() {
    searchByOficio.automatismos = document.getElementById('catalogo-buscar')?.value || '';
    getActiveOficios().forEach((oficioId) => {
      if (oficioId === 'automatismos') return;
      const el = document.getElementById(`catalogo-buscar-${oficioId}`);
      if (el) searchByOficio[oficioId] = el.value;
    });
    render();
  }

  function onFabClick() {
    const oid = normalizeOficioId(currentOficioId);
    if (!hasCategories(oid)) {
      openCategoryForm(null, oid);
    } else {
      openProductForm(null, oid);
    }
  }

  function normalizeHeaderKey(key) {
    return String(key || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  function mapImportRow(raw) {
    const mapped = {};
    Object.entries(raw || {}).forEach(([key, val]) => {
      const field = IMPORT_HEADERS[normalizeHeaderKey(key)];
      if (field) mapped[field] = val;
    });
    return mapped;
  }

  function normalizeUnidad(val) {
    const v = String(val || '').trim().toLowerCase();
    if (UNIDADES.includes(v)) return v;
    const aliases = {
      unidades: 'unidad',
      und: 'unidad',
      mts: 'metro',
      metros: 'metro',
      m: 'metro',
      horas: 'hora',
      hr: 'hora',
      servicios: 'servicio'
    };
    return aliases[v] || 'unidad';
  }

  function parseCSVLine(line, delimiter) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur.trim());
    return out;
  }

  function parseCSVText(text) {
    const clean = String(text || '').replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return [];

    const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
    const headers = parseCSVLine(lines[0], delimiter);
    return lines.slice(1).map((line) => {
      const vals = parseCSVLine(line, delimiter);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = vals[i] ?? '';
      });
      return row;
    });
  }

  function parseExcelArrayBuffer(buffer) {
    const XLSX = global.XLSX;
    if (!XLSX) throw new Error('No se pudo cargar la librería SheetJS.');
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
  }

  function validateImportRow(mapped) {
    const nom = String(mapped.nom || '').trim();
    const cod = String(mapped.cod || '').trim();
    const pvp = parsePvp(mapped.pvp);
    const errors = [];
    if (!nom) errors.push('Falta nombre');
    if (!cod) errors.push('Falta referencia');
    if (pvp <= 0) errors.push('Precio inválido');
    return {
      nom,
      cod,
      pvp,
      unidad: normalizeUnidad(mapped.unidad),
      marca: String(mapped.marca || '').trim(),
      categoria: String(mapped.categoria || '').trim() || 'General',
      valid: errors.length === 0,
      errors: errors.join(', ')
    };
  }

  function buildImportPreview(rawRows) {
    return rawRows
      .map(mapImportRow)
      .map(validateImportRow)
      .filter((row) => row.nom || row.cod || row.pvp || row.marca || row.categoria);
  }

  function ensureCategoryByName(name, categories, oficioId) {
    const oid = normalizeOficioId(oficioId || currentOficioId);
    const label = (name || 'General').trim() || 'General';
    let cat = categories.find(
      (c) => resolveItemOficioId(c) === oid && c.name.toLowerCase() === label.toLowerCase()
    );
    if (!cat) {
      cat = { id: newId(), name: label, oficioId: oid };
      categories.push(cat);
    }
    return cat.id;
  }

  function rowsToProducts(rows, categories, oficioId) {
    const oid = normalizeOficioId(oficioId || currentOficioId);
    return rows
      .filter((r) => r.valid)
      .map((r) => ({
        id: newId(),
        nom: r.nom,
        cod: r.cod,
        pvp: r.pvp,
        unidad: r.unidad,
        marca: r.marca,
        categoriaId: ensureCategoryByName(r.categoria, categories, oid),
        oficioId: oid
      }));
  }

  function openImportModal() {
    document.getElementById('catalogo-import-modal')?.classList.add('open');
  }

  function closeImportModal() {
    importPreviewRows = [];
    document.getElementById('catalogo-import-modal')?.classList.remove('open');
    document.getElementById('catalogo-import-tbody').innerHTML = '';
    const summary = document.getElementById('catalogo-import-summary');
    if (summary) summary.textContent = '';
    document.getElementById('btn-catalogo-import-add').disabled = true;
    document.getElementById('btn-catalogo-import-replace').disabled = true;
  }

  function renderImportPreview(rows) {
    importPreviewRows = rows;
    const validCount = rows.filter((r) => r.valid).length;
    const invalidCount = rows.length - validCount;
    const summary = document.getElementById('catalogo-import-summary');
    if (summary) {
      summary.innerHTML = `Se detectaron <strong>${rows.length}</strong> filas: ` +
        `<strong>${validCount}</strong> válidas` +
        (invalidCount ? `, <strong>${invalidCount}</strong> con errores (no se importarán).` : '.');
    }

    const tbody = document.getElementById('catalogo-import-tbody');
    if (tbody) {
      tbody.innerHTML = rows.slice(0, 100).map((r) => `
        <tr class="${r.valid ? '' : 'row-invalid'}">
          <td>${escapeHtml(r.nom || '—')}</td>
          <td>${escapeHtml(r.cod || '—')}</td>
          <td>${r.valid ? escapeHtml(formatoPesos(r.pvp)) : escapeHtml(String(r.pvp || '—'))}</td>
          <td>${escapeHtml(r.unidad)}</td>
          <td>${escapeHtml(r.marca || '—')}</td>
          <td>${escapeHtml(r.categoria)}</td>
          <td>${r.valid ? '✓ OK' : escapeHtml(r.errors)}</td>
        </tr>
      `).join('') + (rows.length > 100 ? `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:10px;">… y ${rows.length - 100} filas más</td></tr>` : '');
    }

    const canImport = validCount > 0;
    document.getElementById('btn-catalogo-import-add').disabled = !canImport;
    document.getElementById('btn-catalogo-import-replace').disabled = !canImport;
    openImportModal();
  }

  async function handleImportFile(file) {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    try {
      let rawRows = [];
      if (ext === 'csv') {
        const text = await file.text();
        rawRows = parseCSVText(text);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        rawRows = parseExcelArrayBuffer(buffer);
      } else {
        alert('Formato no soportado. Use .xlsx, .xls o .csv');
        return;
      }

      const preview = buildImportPreview(rawRows);
      if (!preview.length) {
        alert('No se encontraron productos. Verifique que la primera fila tenga las columnas: Nombre, Referencia, Precio, Unidad, Marca, Categoría.');
        return;
      }
      renderImportPreview(preview);
    } catch (e) {
      alert('Error al leer el archivo: ' + (e.message || 'formato inválido'));
    }
  }

  function applyImport(mode) {
    const validRows = importPreviewRows.filter((r) => r.valid);
    if (!validRows.length) return;

    const categories = getAllCategories().slice();
    const oid = normalizeOficioId(currentOficioId);
    const imported = rowsToProducts(validRows, categories, oid);
    saveCategories(categories);

    let products;
    let skipped = 0;

    if (mode === 'replace') {
      if (!confirm('¿Reemplazar el catálogo de este oficio con estos ' + validRows.length + ' productos?')) return;
      products = getAllProducts().filter((p) => resolveItemOficioId(p) !== oid).concat(imported);
    } else {
      if (!confirm('¿Agregar estos ' + validRows.length + ' productos a los existentes de este oficio?')) return;
      const existing = getAllProducts();
      const codes = new Set(
        existing.filter((p) => resolveItemOficioId(p) === oid).map((p) => p.cod.toLowerCase())
      );
      products = existing.slice();
      imported.forEach((p) => {
        if (codes.has(p.cod.toLowerCase())) {
          skipped++;
        } else {
          products.push(p);
          codes.add(p.cod.toLowerCase());
        }
      });
    }

    saveProducts(products);
    closeImportModal();
    render();

    let msg = mode === 'replace'
      ? `Catálogo reemplazado: ${imported.length} productos importados.`
      : `${imported.length - skipped} productos agregados.`;
    if (skipped) msg += ` ${skipped} omitidos por referencia duplicada.`;
    alert(msg);
  }

  function triggerImportPicker() {
    const input = document.getElementById('catalogo-import-file');
    if (!input) return;
    input.value = '';
    input.click();
  }

  function initMiCatalogo() {
    document.getElementById('catalogo-buscar')?.addEventListener('input', (e) => {
      searchByOficio.automatismos = e.target.value;
      currentOficioId = 'automatismos';
      renderProductGroups('automatismos');
    });
    document.getElementById('catalogo-section-automatismos')?.addEventListener('focusin', () => {
      currentOficioId = 'automatismos';
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
    document.getElementById('btn-catalogo-import')?.addEventListener('click', () => {
      currentOficioId = 'automatismos';
      triggerImportPicker();
    });
    document.getElementById('catalogo-import-file')?.addEventListener('change', (e) => {
      handleImportFile(e.target.files?.[0]);
    });
    document.getElementById('btn-catalogo-import-cancel')?.addEventListener('click', closeImportModal);
    document.getElementById('catalogo-import-close')?.addEventListener('click', closeImportModal);
    document.getElementById('catalogo-import-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'catalogo-import-modal') closeImportModal();
    });
    document.getElementById('btn-catalogo-import-add')?.addEventListener('click', () => applyImport('add'));
    document.getElementById('btn-catalogo-import-replace')?.addEventListener('click', () => applyImport('replace'));
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
