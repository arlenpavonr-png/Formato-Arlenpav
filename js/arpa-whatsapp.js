/**
 * Enviar formato por WhatsApp tras guardar PDF
 */
(function (global) {
  function buildMessage() {
    const clienteEl = document.getElementById('formato-cliente-nombre')
      || document.querySelector('#view-formato input[placeholder="Nombre completo o razón social"]');
    const nombre = (clienteEl?.value.trim() || 'Cliente').split(' ')[0];
    const numero = document.getElementById('numero-formato')?.value.trim() || '—';
    const company = global.ArpaBrand?.getSettings?.()?.companyName?.trim()
      || global.ArpaBrand?.DEFAULTS?.companyName
      || 'Su Empresa S.A.S.';

    return `Hola ${nombre}, le comparto el formato de servicio N°${numero} de ${company}. Por favor revíselo y confírmenos su recepción.`;
  }

  function openWhatsApp() {
    const telRaw = document.getElementById('formato-cliente-tel')?.value
      || document.querySelector('#view-formato input[placeholder="+57 300 000 0000"]')?.value
      || '';
    const tel = telRaw.replace(/\D/g, '');
    const text = encodeURIComponent(buildMessage());
    const url = tel.length >= 10
      ? `https://wa.me/${tel.startsWith('57') ? tel : '57' + tel}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function guardarPDFYWhatsApp() {
    global.ArpaHistorial?.captureFromFormato?.();
    if (typeof global.guardarPDF === 'function') global.guardarPDF();
    setTimeout(openWhatsApp, 600);
  }

  global.guardarPDFYWhatsApp = guardarPDFYWhatsApp;
  global.abrirWhatsAppFormato = openWhatsApp;
})(window);
