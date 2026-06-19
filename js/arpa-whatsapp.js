/**
 * Enviar formato o cotización por WhatsApp tras guardar PDF
 */
(function (global) {
  const PDF_WHATSAPP_ALERT = 'PDF guardado en tu dispositivo. Ahora se abrirá WhatsApp — adjunta el archivo desde tu galería.';

  function getCompanyName() {
    return global.ArpaBrand?.getSettings?.()?.companyName?.trim()
      || 'su empresa';
  }

  function openWhatsAppWithText(message) {
    window.location.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  function alertAndOpenWhatsApp(message) {
    alert(PDF_WHATSAPP_ALERT);
    openWhatsAppWithText(message);
  }

  function buildFormatoMessage() {
    const nombre = document.getElementById('formato-cliente-nombre')?.value.trim()
      || document.querySelector('#view-formato input[placeholder="Nombre completo o razón social"]')?.value.trim()
      || 'Cliente';
    const numero = document.getElementById('numero-formato')?.value.trim() || '—';
    const fecha = document.getElementById('formato-fecha')?.value.trim() || '—';
    const company = getCompanyName();

    return `Hola ${nombre}, le comparto el formato de servicio N°${numero} con fecha ${fecha} de ${company}. Por favor revíselo y confírmenos su recepción.`;
  }

  function buildCotMessage() {
    const nombre = document.getElementById('cot-nombre')?.value.trim() || 'Cliente';
    const numero = document.getElementById('numero-cot')?.value.trim() || '—';
    const fecha = document.getElementById('cot-fecha')?.value.trim()
      || new Date().toISOString().split('T')[0];
    const company = getCompanyName();

    return `Hola ${nombre}, le comparto la cotización N°${numero} con fecha ${fecha} de ${company}. Por favor revísela y confírmenos su recepción.`;
  }

  function openWhatsAppFormato() {
    alertAndOpenWhatsApp(buildFormatoMessage());
  }

  function openWhatsAppCot() {
    alertAndOpenWhatsApp(buildCotMessage());
  }

  function guardarPDFYWhatsApp() {
    global.ArpaHistorial?.captureFromFormato?.();
    if (typeof global.guardarPDF === 'function') global.guardarPDF();
    setTimeout(function () {
      alertAndOpenWhatsApp(buildFormatoMessage());
    }, 600);
  }

  function guardarCotPDFYWhatsApp() {
    if (typeof global.guardarCotPDF === 'function') global.guardarCotPDF();
    setTimeout(function () {
      alertAndOpenWhatsApp(buildCotMessage());
    }, 600);
  }

  global.ArpaWhatsApp = {
    PDF_WHATSAPP_ALERT,
    alertAndOpenWhatsApp,
    openWhatsAppWithText
  };
  global.guardarPDFYWhatsApp = guardarPDFYWhatsApp;
  global.guardarCotPDFYWhatsApp = guardarCotPDFYWhatsApp;
  global.abrirWhatsAppFormato = openWhatsAppFormato;
  global.abrirWhatsAppCot = openWhatsAppCot;
})(window);
