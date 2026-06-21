/**
 * Compartir Formato por WhatsApp (Web Share API + fallback wa.me)
 */
(function (global) {
  function readFormatoField(el) {
    return global.ArpaHistorial?.readInputLikePdf?.(el)
      ?? (el?.value || el?.placeholder || '').trim();
  }

  function getCompanyName() {
    return global.ArpaBrand?.getSettings?.()?.companyName?.trim()
      || 'su empresa';
  }

  function openWhatsAppWithMessage(telRaw, message) {
    const tel = String(telRaw || '').replace(/\D/g, '');
    const text = encodeURIComponent(message);
    const url = tel.length >= 10
      ? `https://wa.me/${tel.startsWith('57') ? tel : '57' + tel}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.location.href = url;
  }

  const WHATSAPP_NATIVE_FALLBACK_MS = 1200;

  function buildWhatsAppUrls(telRaw, message) {
    const tel = String(telRaw || '').replace(/\D/g, '');
    const text = encodeURIComponent(message);
    const phone = tel.length >= 10 ? (tel.startsWith('57') ? tel : '57' + tel) : '';
    const waMeUrl = phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    const nativeUrl = phone
      ? `whatsapp://send?phone=${phone}&text=${text}`
      : `whatsapp://send?text=${text}`;
    return { waMeUrl, nativeUrl };
  }

  function openWhatsAppNativeWithFallback(telRaw, message) {
    const { waMeUrl, nativeUrl } = buildWhatsAppUrls(telRaw, message);
    let fellBack = false;

    const fallbackTimer = setTimeout(() => {
      if (fellBack || document.hidden) return;
      fellBack = true;
      window.location.href = waMeUrl;
    }, WHATSAPP_NATIVE_FALLBACK_MS);

    function onVisibilityChange() {
      if (!document.hidden) return;
      fellBack = true;
      clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.location.href = nativeUrl;
  }

  function buildFormatoMessage() {
    const nombre = readFormatoField(document.getElementById('formato-cliente-nombre')) || 'Cliente';
    const numero = readFormatoField(document.getElementById('numero-formato')) || '—';
    const fecha = document.getElementById('formato-fecha')?.value?.trim() || '—';
    const company = getCompanyName();

    return `Hola ${nombre}, le comparto el formato de servicio N°${numero} con fecha ${fecha} de ${company}. Por favor revíselo y confírmenos su recepción.`;
  }

  function buildCotMessage() {
    const nombre = (document.getElementById('cot-nombre')?.value.trim() || 'Cliente').split(' ')[0];
    const numero = document.getElementById('numero-cot')?.value.trim() || '—';
    const company = getCompanyName();

    return `Hola ${nombre}, le comparto la cotización N°${numero} de ${company}. Por favor revísela y confírmenos su recepción.`;
  }

  function hideFormatoShareButton() {
    const btn = document.getElementById('btn-formato-share-wa');
    if (btn) btn.hidden = true;
  }

  function showFormatoShareAfterPdf() {
    const btn = document.getElementById('btn-formato-share-wa');
    if (btn) btn.hidden = false;
  }

  function sanitizeFilenamePart(text) {
    return String(text || '')
      .replace(/[^\w\s-áéíóúÁÉÍÓÚñÑ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40) || 'Formato';
  }

  async function generarFormatoPdfFile() {
    const jsPDF = global.jspdf?.jsPDF || global.jsPDF;
    const html2canvas = global.html2canvas;
    if (!jsPDF || !html2canvas) return null;

    const element = document.querySelector('.page');
    if (!element) return null;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const blob = pdf.output('blob');
    const numero = readFormatoField(document.getElementById('numero-formato'));
    const cliente = readFormatoField(document.getElementById('formato-cliente-nombre'));
    const filename = `Formato_${sanitizeFilenamePart(numero)}_${sanitizeFilenamePart(cliente)}.pdf`;

    return new File([blob], filename, { type: 'application/pdf' });
  }

  async function compartirFormatoWhatsApp() {
    const telRaw = document.getElementById('formato-cliente-tel')?.value.trim() || '';
    const message = buildFormatoMessage();

    try {
      const file = await generarFormatoPdfFile();
      if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: file.name,
          text: message
        });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.warn('[arpa-whatsapp] share', err);
    }

    alert('Adjunte el PDF manualmente desde su galería o archivos recientes.');
    openWhatsAppWithMessage(telRaw, message + ' (Adjunte el PDF desde su dispositivo.)');
  }

  function openWhatsAppCot() {
    const telRaw = document.getElementById('cot-tel')?.value || '';
    openWhatsAppNativeWithFallback(telRaw, buildCotMessage());
  }

  function guardarCotPDFYWhatsApp() {
    if (typeof global.guardarCotPDF === 'function') global.guardarCotPDF();
    setTimeout(openWhatsAppCot, 600);
  }

  global.ArpaWhatsApp = {
    hideFormatoShareButton,
    showFormatoShareAfterPdf,
    compartirFormatoWhatsApp,
    generarFormatoPdfFile,
    buildFormatoMessage,
    openWhatsAppNativeWithFallback
  };

  global.compartirFormatoWhatsApp = compartirFormatoWhatsApp;
  global.guardarCotPDFYWhatsApp = guardarCotPDFYWhatsApp;
  global.abrirWhatsAppCot = openWhatsAppCot;
})(window);
