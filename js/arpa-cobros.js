/**
 * Cobros dinámicos: filas editables (descripción + valor) con suma automática
 */
(function (global) {
  const stores = {};

  function getStore(id) {
    if (!stores[id]) stores[id] = { lines: [], seeded: false };
    return stores[id];
  }

  function createLine(desc = '', value = 0) {
    return { id: Date.now() + Math.random(), desc, value: Number(value) || 0 };
  }

  function renderEditor(storeId) {
    const container = document.getElementById(`cobros-editor-${storeId}`);
    if (!container) return;
    const store = getStore(storeId);

    if (!store.lines.length) {
      container.innerHTML = '<p class="extra-items-empty">Sin ítems de cobro. Use + para agregar.</p>';
      notifyChange(storeId);
      return;
    }

    container.innerHTML = store.lines.map((line, index) => `
      <div class="cobro-row" data-index="${index}">
        <div class="field cobro-desc-field">
          <label>Descripción</label>
          <input type="text" class="cobro-desc" value="${escapeAttr(line.desc)}" placeholder="Descripción del ítem">
        </div>
        <div class="field cobro-valor-field">
          <label>Valor (COP)</label>
          <input type="number" class="cobro-valor" min="0" step="1000" inputmode="numeric" value="${line.value || ''}" placeholder="0">
        </div>
        <button type="button" class="btn-quitar-extra cobro-remove" data-index="${index}" aria-label="Quitar">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('.cobro-desc').forEach((input, i) => {
      input.addEventListener('input', () => {
        store.lines[i].desc = input.value;
        notifyChange(storeId);
      });
    });
    container.querySelectorAll('.cobro-valor').forEach((input, i) => {
      input.addEventListener('input', () => {
        store.lines[i].value = Number(input.value) || 0;
        notifyChange(storeId);
      });
    });
    container.querySelectorAll('.cobro-remove').forEach((btn) => {
      btn.addEventListener('click', () => removeLine(storeId, Number(btn.dataset.index)));
    });

    notifyChange(storeId);
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  function addLine(storeId, desc = '', value = 0) {
    getStore(storeId).lines.push(createLine(desc, value));
    renderEditor(storeId);
  }

  function removeLine(storeId, index) {
    getStore(storeId).lines.splice(index, 1);
    renderEditor(storeId);
  }

  function getLines(storeId) {
    return getStore(storeId).lines
      .filter((l) => l.desc.trim() || l.value > 0)
      .map((l) => ({
        cod: 'COBRO',
        nom: l.desc.trim() || 'Ítem de cobro',
        pvp: Number(l.value) || 0,
        cant: 1,
        tipo: 'cobro'
      }));
  }

  function getSubtotal(storeId) {
    return getLines(storeId).reduce((s, l) => s + l.pvp * l.cant, 0);
  }

  function seedFromPriceList(storeId) {
    const store = getStore(storeId);
    if (store.seeded && store.lines.length) return;
    const list = global.ArpaPricing?.getPriceList?.();
    if (!list) return;
    store.lines = Object.values(list).map((item) => createLine(item.label, item.value));
    store.seeded = true;
    renderEditor(storeId);
  }

  function notifyChange(storeId) {
    if (storeId === 'cot') global.ArpaCotizacion?.renderTablaCot?.(false);
  }

  function init(storeId) {
    const btn = document.getElementById(`btn-cobros-add-${storeId}`);
    btn?.addEventListener('click', () => addLine(storeId));
    renderEditor(storeId);
  }

  global.ArpaCobros = {
    init,
    addLine,
    removeLine,
    getLines,
    getSubtotal,
    seedFromPriceList,
    renderEditor
  };

  global.agregarCobroItem = (storeId) => addLine(storeId || 'cot');
})(window);
