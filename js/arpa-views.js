/**
 * Módulo: Navegación entre vistas (Formato / Cotización)
 */
(function (global) {
  let currentView = 'formato';

  function showView(view, menuBtn) {
    currentView = view;
    document.querySelectorAll('.suite-view').forEach((el) => {
      el.hidden = el.id !== `view-${view}`;
    });
    document.querySelectorAll('.main-menu-btn').forEach((b) => b.classList.remove('active'));
    menuBtn?.classList.add('active');

    const docType = document.getElementById('doc-type-label');
    const metaFormato = document.getElementById('header-meta-formato');
    const metaCot = document.getElementById('header-meta-cot');
    const pdfFormato = document.getElementById('pdf-actions-formato');
    const pdfCot = document.getElementById('pdf-actions-cot');

    if (docType) docType.textContent = view === 'cotizacion' ? '💰 Cotización' : 'Formato de Servicio';
    if (metaFormato) metaFormato.hidden = view !== 'formato';
    if (metaCot) metaCot.hidden = view !== 'cotizacion';
    if (pdfFormato) pdfFormato.hidden = view !== 'formato';
    if (pdfCot) pdfCot.hidden = view !== 'cotizacion';

    if (view === 'cotizacion') {
      global.ArpaCobros?.seedFromPriceList('cot');
      global.ArpaCotizacion?.refreshCobros?.();
      global.ArpaCotizacion?.renderTablaCot?.();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToTopMenu(btn) {
    showView('formato', btn);
  }

  function openCotizacionView(btn) {
    showView('cotizacion', btn);
  }

  function openHistorialView(menuBtn) {
    currentView = 'historial';
    document.querySelectorAll('.suite-view').forEach((el) => {
      el.hidden = el.id !== 'view-historial';
    });
    document.querySelectorAll('.main-menu-btn').forEach((b) => b.classList.remove('active'));
    menuBtn?.classList.add('active');

    const docType = document.getElementById('doc-type-label');
    const metaFormato = document.getElementById('header-meta-formato');
    const metaCot = document.getElementById('header-meta-cot');
    const pdfFormato = document.getElementById('pdf-actions-formato');
    const pdfCot = document.getElementById('pdf-actions-cot');

    if (docType) docType.textContent = '📋 Historial de Servicios';
    if (metaFormato) metaFormato.hidden = true;
    if (metaCot) metaCot.hidden = true;
    if (pdfFormato) pdfFormato.hidden = true;
    if (pdfCot) pdfCot.hidden = true;

    global.ArpaHistorial?.render?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  global.ArpaViews = { showView, scrollToTopMenu, openCotizacionView, openHistorialView, getCurrentView: () => currentView };
  global.scrollToTopMenu = scrollToTopMenu;
  global.openCotizacionView = openCotizacionView;
  global.openHistorialView = openHistorialView;
})(window);
