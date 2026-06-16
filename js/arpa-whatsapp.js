/**
 * Enviar formato o cotización por WhatsApp tras guardar PDF
 */
(function (global) {
  function getCompanyName() {
    return global.ArpaBrand?.getSettings?.()?.companyName?.trim()
      || 'su empresa';
  }

  function openWhatsAppWithMessage(telRaw, message) {
    const tel = telRaw.replace(/\D/g, '');
    const text = encodeURIComponent(message);
    const url = tel.length >= 10
      ? `https://wa.me/${tel.startsWith('57') ? tel : '57' + tel}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function buildFormatoMessage() {
    const clienteEl = document.getElementById('formato-cliente-nombre')
      || document.querySelector('#view-formato input[placeholder="Nombre completo o razón social"]');
    const nombre = (clienteEl?.value.trim() || 'Cliente').split(' ')[0];
    const numero = document.getElementById('numero-formato')?.value.trim() || '—';
    const company = getCompanyName();

    return `Hola ${nombre}, le comparto el formato de servicio N°${numero} de ${company}. Por favor revíselo y confírmenos su recepción.`;
  }

  function buildCotMessage() {
    const nombre = (document.getElementById('cot-nombre')?.value.trim() || 'Cliente').split(' ')[0];
    const numero = document.getElementById('numero-cot')?.value.trim() || '—';
    const company = getCompanyName();

    return `Hola ${nombre}, le comparto la cotización N°${numero} de ${company}. Por favor revísela y confírmenos su recepción.`;
  }

  function openWhatsAppFormato() {
    const telRaw = document.getElementById('formato-cliente-tel')?.value
      || document.querySelector('#view-formato input[placeholder="+57 300 000 0000"]')?.value
      || '';
    openWhatsAppWithMessage(telRaw, buildFormatoMessage());
  }

  function openWhatsAppCot() {
    const telRaw = document.getElementById('cot-tel')?.value || '';
    openWhatsAppWithMessage(telRaw, buildCotMessage());
  }

  function guardarPDFYWhatsApp() {
    global.ArpaHistorial?.captureFromFormato?.();
    if (typeof global.guardarPDF === 'function') global.guardarPDF();
    setTimeout(openWhatsAppFormato, 600);
  }

  function guardarCotPDFYWhatsApp() {
    if (typeof global.guardarCotPDF === 'function') global.guardarCotPDF();
    setTimeout(openWhatsAppCot, 600);
  }

  global.guardarPDFYWhatsApp = guardarPDFYWhatsApp;
  global.guardarCotPDFYWhatsApp = guardarCotPDFYWhatsApp;
  global.abrirWhatsAppFormato = openWhatsAppFormato;
  global.abrirWhatsAppCot = openWhatsAppCot;
})(window);
