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

  /** Prefijo del país configurado (CO 57, MX 52, CL 56, PE 51, US 1). */
  function countryPhonePrefix() {
    return global.ArpaPricing?.getCountryProfile?.()?.phonePrefix || '57';
  }

  function buildWaMeUrl(telRaw, message) {
    const tel = String(telRaw || '').replace(/\D/g, '');
    const text = encodeURIComponent(message);
    // Número nacional (9–10 dígitos) → se antepone el prefijo del país configurado.
    // Más de 10 dígitos → ya trae el código de país y se usa tal cual.
    const phone = tel.length > 10 ? tel : (tel.length >= 9 ? countryPhonePrefix() + tel : '');
    return phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
  }

  function openWhatsAppWithMessage(telRaw, message) {
    const url = buildWaMeUrl(telRaw, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function buildFormatoMessage() {
    const nombre = readFormatoField(document.getElementById('formato-cliente-nombre')) || 'Cliente';
    const numero = readFormatoField(document.getElementById('numero-formato')) || '—';
    const fecha = document.getElementById('formato-fecha')?.value?.trim() || '—';
    const company = getCompanyName();
    // Idioma del documento = English → mensaje para el cliente en inglés (fecha MM/DD/YYYY).
    const enMsg = global.ArpaDocLang?.shareMessage?.('formato', {
      nombre: readFormatoField(document.getElementById('formato-cliente-nombre')),
      numero,
      fecha: global.ArpaDocLang.date(fecha),
      company: global.ArpaBrand?.getSettings?.()?.companyName?.trim()
    });
    if (enMsg) return enMsg;

    return `Hola ${nombre}, le comparto el formato de servicio N°${numero} con fecha ${fecha} de ${company}. Por favor revíselo y confírmenos su recepción.`;
  }

  function buildCotMessage() {
    const nombre = (document.getElementById('cot-nombre')?.value.trim() || 'Cliente').split(' ')[0];
    const numero = document.getElementById('numero-cot')?.value.trim() || '—';
    const company = getCompanyName();
    const enMsg = global.ArpaDocLang?.shareMessage?.('cot', {
      nombre: (document.getElementById('cot-nombre')?.value.trim() || '').split(' ')[0],
      numero,
      company: global.ArpaBrand?.getSettings?.()?.companyName?.trim()
    });
    if (enMsg) return enMsg;

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
    const element = document.querySelector('.page');
    if (!element || !global.ArpaPdfCaptura || typeof global.prepararFormatoParaPdf !== 'function') return null;

    global.ArpaTrialCapture?.beginPdfExport?.();
    // Los mismos pasos que "Guardar como PDF" (campos como texto, firmas como imagen, sin botones),
    // y la captura con los estilos de impresión: el PDF compartido sale igual al guardado.
    // (prepararFormatoParaPdf ya pone el documento en su idioma, también con English.)
    const prep = global.prepararFormatoParaPdf();
    try {
      await prep.ready;
      const numero = readFormatoField(document.getElementById('numero-formato'));
      const cliente = readFormatoField(document.getElementById('formato-cliente-nombre'));
      const { blob } = await global.ArpaPdfCaptura.capturarPdf(element, {
        searchableText: [
          (document.getElementById('brand-company-name')?.textContent || '').trim(),
          numero,
          cliente
        ]
      });
      const filename = `${global.ArpaDocLang?.text?.('file.formato', 'Formato') ?? 'Formato'}_${sanitizeFilenamePart(numero)}_${sanitizeFilenamePart(cliente)}.pdf`;
      return new File([blob], filename, { type: 'application/pdf' });
    } finally {
      prep.restore();
      global.ArpaTrialCapture?.endPdfExport?.();
    }
  }

  async function compartirFormatoWhatsApp() {
    if (!(await global.ArpaBrand?.ensureCompanyName?.() ?? true)) return;
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

    alert(window.ArpaI18n.t('alert.pdf.adjuntar_manual'));
    openWhatsAppWithMessage(telRaw, message + (global.ArpaDocLang?.text?.('msg.attach_note', ' (Adjunte el PDF desde su dispositivo.)') ?? ' (Adjunte el PDF desde su dispositivo.)'));
  }

  function openWhatsAppCot() {
    const telRaw = document.getElementById('cot-tel')?.value || '';
    openWhatsAppWithMessage(telRaw, buildCotMessage());
  }

  global.ArpaWhatsApp = {
    hideFormatoShareButton,
    showFormatoShareAfterPdf,
    compartirFormatoWhatsApp,
    generarFormatoPdfFile,
    buildFormatoMessage,
    buildWaMeUrl,
    openWhatsAppWithMessage
  };

  global.compartirFormatoWhatsApp = compartirFormatoWhatsApp;
  global.abrirWhatsAppCot = openWhatsAppCot;
})(window);
