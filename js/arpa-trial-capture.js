/**
 * Captura de WhatsApp en trial gratis + sync con Sheets
 * Disparadores: primer guardado (modal) o día 3 sin guardar (pantalla completa).
 */
(function (global) {
  'use strict';

  const LICENSE_API = 'https://script.google.com/macros/s/AKfycbw9wGLhbqFUt6FxRs0iLu_4xDntE8l2a4Vpd3BsXZyddPbII03BtFG6TpH7IpEe5Z3F/exec';
  const LICENSE_CODE_KEY = 'arpa_suite_license_code';
  const ACTIVE_OFICIOS_KEY = 'arpa_active_oficios';
  const TRIAL_START_KEY = 'arpa_trial_fecha_inicio';
  const TRIAL_WHATSAPP_KEY = 'arpa_trial_whatsapp';
  const TRIAL_NOMBRE_KEY = 'arpa_trial_nombre';
  const TRIAL_OFICIO_KEY = 'arpa_trial_oficio';
  const TRIAL_PAIS_KEY = 'arpa_trial_pais';
  const TRIAL_ID_KEY = 'arpa_trial_id';
  const TRIAL_SYNCED_KEY = 'arpa_trial_synced';
  const TRIAL_DOC_SAVED_KEY = 'arpa_trial_doc_saved';
  const TRIAL_CAPTURED_KEY = 'arpa_trial_captured';
  // "Ahora no": fecha (AAAA-MM-DD) hasta la que no se vuelve a pedir; después sale al abrir la app.
  const TRIAL_LATER_KEY = 'arpa_trial_capture_ahora_no';
  // Ya se pidió el WhatsApp después del primer documento guardado (se pide una vez aunque haya "Ahora no").
  const TRIAL_AFTER_SAVE_ASKED_KEY = 'arpa_trial_capture_tras_guardar';
  // Ya se pidió al terminar la bienvenida (apenas el técnico elige su oficio).
  const TRIAL_WELCOME_ASKED_KEY = 'arpa_trial_capture_bienvenida';

  const OFICIO_OPTIONS = [
    { id: 'automatismos', label: 'Automatismos' },
    { id: 'electricidad', label: 'Electricidad' },
    { id: 'gas', label: 'Gas' },
    { id: 'refrigeracion', label: 'Refrigeración y Aire Acondicionado' },
    { id: 'cctv', label: 'Cámaras y CCTV / Seguridad Electrónica' },
    { id: 'plomeria', label: 'Plomería y Fontanería' },
    { id: 'metalmecanica', label: 'Cerrajería y Metalmecánica' },
    { id: 'plagas', label: 'Control de Plagas / Fumigación' },
    { id: 'linea_blanca', label: 'Línea Blanca / Electrodomésticos' },
    { id: 'solar', label: 'Energía Solar' },
    { id: 'construccion', label: 'Construcción y Acabados' }
  ];

  function t(key, fallback) {
    if (global.ArpaI18n && typeof global.ArpaI18n.t === 'function') {
      const val = global.ArpaI18n.t(key);
      if (val && val !== key) return val;
    }
    return fallback || key;
  }

  function getSavedLicenseCode() {
    try {
      return (localStorage.getItem(LICENSE_CODE_KEY) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function getTrialStartDate() {
    try {
      return (localStorage.getItem(TRIAL_START_KEY) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function isSynced() {
    try {
      return localStorage.getItem(TRIAL_SYNCED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function isCaptureCompleted() {
    try {
      if (localStorage.getItem(TRIAL_CAPTURED_KEY) === 'true') return true;
      const whatsapp = (localStorage.getItem(TRIAL_WHATSAPP_KEY) || '').trim();
      const nombre = (localStorage.getItem(TRIAL_NOMBRE_KEY) || '').trim();
      return !!(whatsapp && nombre);
    } catch (e) {
      return false;
    }
  }

  function hasDocumentSaved() {
    try {
      return localStorage.getItem(TRIAL_DOC_SAVED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function getTrialDayIndex() {
    const start = getTrialStartDate();
    if (!start) return 0;
    const startDate = new Date(start + 'T00:00:00');
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today - startDate) / 86400000);
  }

  function localISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getLaterUntil() {
    try {
      return (localStorage.getItem(TRIAL_LATER_KEY) || '').trim();
    } catch (e) {
      return '';
    }
  }

  /** true mientras dura el "Ahora no" (hasta el día 3 de la prueba). */
  function isLaterActive() {
    const until = getLaterUntil();
    return !!until && localISO(new Date()) < until;
  }

  /** "Ahora no": no vuelve a salir hasta el día 3 de la prueba (o mañana, si ya es el día 3 o después). */
  function markLater() {
    const start = getTrialStartDate();
    let until;
    if (start && getTrialDayIndex() < 2) {
      const d = new Date(start + 'T00:00:00');
      d.setDate(d.getDate() + 2);
      until = localISO(d);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      until = localISO(d);
    }
    try { localStorage.setItem(TRIAL_LATER_KEY, until); } catch (e) { /* ignore */ }
  }

  function needsBackupCaptureOnLoad() {
    if (!shouldOfferTrialCapture()) return false;
    if (!getTrialStartDate()) return false;
    // Quien tocó "Ahora no" lo vuelve a ver al abrir la app cuando se cumple el plazo.
    if (getLaterUntil()) return !isLaterActive();
    if (hasDocumentSaved()) return false;
    return getTrialDayIndex() >= 2;
  }

  /** Nombre del negocio que el técnico ya dio (Configuración o "Antes de tu primer PDF"). */
  function getKnownName() {
    try {
      const stored = (localStorage.getItem(TRIAL_NOMBRE_KEY) || '').trim();
      if (stored) return stored;
      const brand = global.ArpaBrand;
      if (brand?.hasUserSettings?.() && brand?.getSettings) {
        return String(brand.getSettings().companyName || '').trim();
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  function ensureTrialStartSilent() {
    if (getTrialStartDate()) return;
    const now = new Date();
    const fechaInicio = now.toISOString().slice(0, 10);
    const trialId = 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    try {
      localStorage.setItem(TRIAL_START_KEY, fechaInicio);
      localStorage.setItem(TRIAL_ID_KEY, trialId);
    } catch (e) {
      console.warn('[arpa-trial-capture] ensureTrialStartSilent', e);
    }
  }

  const PHONE_PREFIX_BY_COUNTRY = { CO: '57', MX: '52', US: '1', CL: '56', PE: '51' };

  /**
   * País para el registro de prueba (CO, MX, US, CL, PE); Colombia si no se sabe.
   * Si la app quedó en EE.UU. (celular en "es-US") pero la zona horaria del celular
   * dice otro país (p. ej. Monterrey), manda la zona horaria: así un mexicano no
   * queda con +1.
   */
  function trialCountry() {
    try {
      const pricing = global.ArpaPricing;
      const code = pricing?.getCountryProfile?.()?.code || 'CO';
      const fromTz = pricing?.detectCountryFromTimezone?.() || '';
      if (code === 'US' && fromTz && fromTz !== 'US' && PHONE_PREFIX_BY_COUNTRY[fromTz]) return fromTz;
      return code;
    } catch (e) {
      return 'CO';
    }
  }

  function trialPhonePrefix() {
    try {
      const code = trialCountry();
      const profile = global.ArpaPricing?.getCountryProfile?.();
      if (profile && profile.code === code && profile.phonePrefix) return profile.phonePrefix;
      return PHONE_PREFIX_BY_COUNTRY[code] || '57';
    } catch (e) {
      return '57';
    }
  }

  /**
   * País según el indicativo del WhatsApp que escribió el técnico ("528111234567" → "MX").
   * '' si no es de un país que maneja la app.
   */
  function countryFromPhone(digits) {
    const d = String(digits || '').replace(/\D/g, '');
    if (d.length < 11) return '';
    for (const code of Object.keys(PHONE_PREFIX_BY_COUNTRY)) {
      const pre = PHONE_PREFIX_BY_COUNTRY[code];
      if (code !== 'US' && d.indexOf(pre) === 0) return code;
    }
    return d[0] === '1' ? 'US' : '';
  }

  /**
   * Si el WhatsApp es de México, Colombia, Chile o Perú y la app quedó en EE.UU. o sin país
   * (celular en "español de EE.UU."), la app se pone en el país del WhatsApp: moneda, IVA y RFC/NIT.
   * Caso real: un técnico de México con IVA 0 % "Impuesto sobre ventas" (2-nov-2026).
   */
  function syncCountryWithPhone(phone) {
    const fromPhone = countryFromPhone(phone);
    if (!fromPhone || fromPhone === 'US') return '';
    let saved = '';
    try { saved = global.ArpaBrand?.getSettings?.()?.country || ''; } catch (e) { /* ignore */ }
    const current = trialCountry();
    if (current === fromPhone) return fromPhone;
    if (saved && saved !== 'US' && current !== 'US') return '';
    try { global.ArpaBrand?.applyCountry?.(fromPhone); } catch (e) { /* ignore */ }
    return fromPhone;
  }

  /**
   * +1 con una "lada" que no existe en EE.UU./Canadá (empieza por 0 o 1, o es 211…911).
   * Ej.: +1 811 123 4567 es un número de Monterrey al que le quedó el +1.
   */
  function looksLikeWrongUsNumber(digits) {
    const d = String(digits || '');
    if (d.length !== 11 || d[0] !== '1') return false;
    const area = d.slice(1, 4);
    return /^[01]/.test(area) || area.slice(1) === '11';
  }

  function normalizePhone(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '';
    // Número nacional de 10 dígitos → prefijo del país configurado (CO 57, MX 52, US 1).
    if (digits.length === 10) digits = trialPhonePrefix() + digits;
    if (digits.length === 11 && digits.startsWith('3')) digits = '57' + digits;
    return digits;
  }

  function getPreferredOficioId() {
    try {
      const stored = (localStorage.getItem(TRIAL_OFICIO_KEY) || '').trim();
      if (stored && OFICIO_OPTIONS.some((o) => o.id === stored)) return stored;
      const raw = localStorage.getItem(ACTIVE_OFICIOS_KEY);
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      const id = Array.isArray(parsed) ? String(parsed[0] || '').trim() : '';
      return OFICIO_OPTIONS.some((o) => o.id === id) ? id : '';
    } catch (e) {
      return '';
    }
  }

  function readOficioSelectValue(select) {
    if (!select) return '';
    const value = (select.value || '').trim();
    if (value) return value;
    const idx = select.selectedIndex;
    if (idx > 0 && select.options[idx]) {
      return (select.options[idx].value || '').trim();
    }
    return '';
  }

  function populateOficioSelect(select) {
    if (!select) return;
    select.innerHTML = '<option value="">' + t('trial_capture.oficio_placeholder', 'Seleccione su oficio principal…') + '</option>' +
      // Nombre del oficio según idioma y país (p. ej. Cerrajería en Colombia, Herrería en otros países)
      OFICIO_OPTIONS.map((o) => `<option value="${o.id}">${t('oficio.' + o.id, o.label)}</option>`).join('');
    const preferred = getPreferredOficioId();
    if (preferred) {
      select.value = preferred;
    } else {
      select.selectedIndex = 0;
    }
  }

  function isFreeTrialUser() {
    if (global.ArpaLicense && typeof global.ArpaLicense.isFreeTrialLicense === 'function') {
      return global.ArpaLicense.isFreeTrialLicense();
    }
    const code = getSavedLicenseCode().toUpperCase();
    if (!code) return false;
    if (code.indexOf('ARPA-WL-') === 0) return false;
    if (code.indexOf('ARPA-PYME-') === 0) return false;
    if (code.indexOf('ARPA-PRO-') === 0) return false;
    return code.indexOf('ARPA-FREE-') === 0;
  }

  function shouldOfferTrialCapture() {
    if (isCaptureCompleted()) return false;
    return isFreeTrialUser();
  }

  function showCaptureError(msg) {
    const el = document.getElementById('trial-capture-error');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('visible', !!msg);
  }

  function setCaptureActive(active) {
    document.documentElement.classList.toggle('trial-capture-active', active);
  }

  function hideCapture() {
    const gate = document.getElementById('trial-capture-gate');
    gate?.classList.remove('trial-capture-gate--modal');
    setCaptureActive(false);
    gate?.setAttribute('hidden', '');
  }

  function applyCaptureCopy(options) {
    const titleEl = document.getElementById('trial-capture-title');
    const subEl = document.querySelector('#trial-capture-gate .trial-capture-sub');
    const btn = document.getElementById('trial-capture-submit');
    if (!titleEl || !subEl) return;

    const variant = options.variant || 'backup';

    if (options.title) {
      titleEl.textContent = options.title;
    } else if (variant === 'achievement') {
      titleEl.textContent = t('trial_capture.title_achievement', '¡Sigue avanzando con ARPA Suite!');
    } else {
      titleEl.textContent = t('trial_capture.title', 'Bienvenido a ARPA Suite');
    }

    if (options.subtitle) {
      subEl.textContent = options.subtitle;
    } else if (variant === 'achievement') {
      subEl.textContent = t(
        'trial_capture.subtitle_achievement',
        'Completa el formulario en menos de un minuto. Te avisamos por WhatsApp antes de que venza tu prueba gratis.'
      );
    } else {
      subEl.textContent = t(
        'trial_capture.subtitle_backup',
        'Para recordarte antes de que termine tu prueba y poder ayudarte, déjanos un WhatsApp de contacto.'
      );
    }

    if (btn) {
      btn.textContent = options.btnText ||
        (variant === 'achievement'
          ? t('trial_capture.btn_submit', 'Guardar y continuar')
          : t('trial_capture.btn_start', 'Continuar a la app'));
    }
  }

  function postRegisterTrial(payload) {
    return fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ accion: 'registerTrialUser' }, payload))
    }).then((res) => res.json());
  }

  function readStoredTrialPayload() {
    try {
      return {
        telefono: localStorage.getItem(TRIAL_WHATSAPP_KEY) || '',
        fechaInicio: localStorage.getItem(TRIAL_START_KEY) || '',
        trialId: localStorage.getItem(TRIAL_ID_KEY) || '',
        nombre: localStorage.getItem(TRIAL_NOMBRE_KEY) || '',
        oficio: localStorage.getItem(TRIAL_OFICIO_KEY) || '',
        pais: localStorage.getItem(TRIAL_PAIS_KEY) || ''
      };
    } catch (e) {
      return null;
    }
  }

  function registerTrialUserSilent() {
    if (isSynced()) return Promise.resolve(true);
    const stored = readStoredTrialPayload();
    if (!stored || !stored.telefono || !stored.fechaInicio || !stored.trialId) {
      return Promise.resolve(false);
    }

    return postRegisterTrial(stored)
      .then((data) => {
        if (data && data.ok) {
          try { localStorage.setItem(TRIAL_SYNCED_KEY, 'true'); } catch (e) { /* ignore */ }
          return true;
        }
        return false;
      })
      .catch(() => false);
  }

  function retryPendingRegistration() {
    if (isSynced() || !getTrialStartDate()) return;
    registerTrialUserSilent();
  }

  function showCapture(opts) {
    let options = {};
    if (typeof opts === 'function') {
      options = { onComplete: opts, mode: 'fullscreen', variant: 'backup' };
    } else {
      options = opts || {};
    }

    const mode = options.mode || 'fullscreen';
    const onComplete = options.onComplete;
    const gate = document.getElementById('trial-capture-gate');
    const nameInput = document.getElementById('trial-capture-name');
    const oficioSelect = document.getElementById('trial-capture-oficio');
    const phoneInput = document.getElementById('trial-capture-phone');
    const btn = document.getElementById('trial-capture-submit');
    if (!gate || !btn) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    applyCaptureCopy(options);
    if (pdfExportDepth > 0) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    gate.removeAttribute('hidden');
    gate.classList.toggle('trial-capture-gate--modal', mode === 'modal');
    setCaptureActive(mode === 'fullscreen');
    showCaptureError('');
    populateOficioSelect(oficioSelect);
    if (phoneInput && !phoneInput.value.trim()) phoneInput.value = '+' + trialPhonePrefix() + ' ';

    // Lo que el técnico ya dio no se le vuelve a pedir: el campo se llena solo y se esconde.
    const knownName = getKnownName();
    if (nameInput && knownName && !nameInput.value.trim()) nameInput.value = knownName;
    nameInput?.closest('.trial-capture-field')?.classList.toggle('is-known', !!knownName);
    const knownOficio = !!readOficioSelectValue(oficioSelect);
    oficioSelect?.closest('.trial-capture-field')?.classList.toggle('is-known', knownOficio);

    const laterBtn = document.getElementById('trial-capture-later');
    if (laterBtn) {
      laterBtn.hidden = !options.allowLater;
      laterBtn.onclick = function () {
        markLater();
        hideCapture();
        if (typeof onComplete === 'function') onComplete();
      };
    }

    function finish() {
      hideCapture();
      if (typeof onComplete === 'function') onComplete();
      registerTrialUserSilent();
    }

    function onSubmit() {
      const nombre = (nameInput?.value || '').trim();
      const oficio = readOficioSelectValue(oficioSelect);
      const phone = normalizePhone(phoneInput?.value || '');

      if (!nombre) {
        showCaptureError(t('trial_capture.error_name', 'Ingrese su nombre.'));
        nameInput?.focus();
        return;
      }
      if (!oficio) {
        showCaptureError(t('trial_capture.error_oficio', 'Seleccione su oficio.'));
        oficioSelect?.focus();
        return;
      }
      if (phone.length < 11) {
        showCaptureError(t('trial_capture.error_phone', 'Ingrese un número de WhatsApp válido con código de país.'));
        phoneInput?.focus();
        return;
      }
      if (looksLikeWrongUsNumber(phone) && phoneInput) {
        // No se guarda: se cambia a +52 y se le pide confirmar con otro toque.
        phoneInput.value = '+52 ' + phone.slice(1);
        showCaptureError(t('trial_capture.error_phone_us', 'Ese número no existe en Estados Unidos (+1). Lo cambiamos a México (+52). Revíselo y toque Guardar de nuevo.'));
        phoneInput.focus();
        return;
      }

      ensureTrialStartSilent();
      let fechaInicio = getTrialStartDate();
      let trialId = '';
      try {
        trialId = localStorage.getItem(TRIAL_ID_KEY) || '';
        if (!trialId) {
          trialId = 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
          localStorage.setItem(TRIAL_ID_KEY, trialId);
        }
        if (!fechaInicio) {
          fechaInicio = new Date().toISOString().slice(0, 10);
          localStorage.setItem(TRIAL_START_KEY, fechaInicio);
        }
        localStorage.setItem(TRIAL_WHATSAPP_KEY, phone);
        localStorage.setItem(TRIAL_NOMBRE_KEY, nombre);
        localStorage.setItem(TRIAL_OFICIO_KEY, oficio);
        localStorage.setItem(TRIAL_PAIS_KEY, syncCountryWithPhone(phone) || trialCountry());
        localStorage.setItem(TRIAL_CAPTURED_KEY, 'true');
        localStorage.setItem(ACTIVE_OFICIOS_KEY, JSON.stringify([oficio]));
        localStorage.removeItem(TRIAL_SYNCED_KEY);
      } catch (e) {
        console.warn('[arpa-trial-capture] localStorage', e);
      }

      btn.disabled = true;
      finish();
    }

    btn.disabled = false;
    btn.onclick = onSubmit;
    [nameInput, phoneInput].forEach((el) => {
      el?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onSubmit();
      }, { once: false });
    });

    if (!knownName) nameInput?.focus();
    else phoneInput?.focus();
  }

  let pdfExportDepth = 0;
  let pendingCaptureDocType = null;

  function beginPdfExport() {
    pdfExportDepth += 1;
    hideCapture();
  }

  function endPdfExport() {
    pdfExportDepth = Math.max(0, pdfExportDepth - 1);
    if (pdfExportDepth > 0) return;
    if (!pendingCaptureDocType) return;
    const docType = pendingCaptureDocType;
    pendingCaptureDocType = null;
    showCaptureAfterSave(docType);
  }

  function showCaptureAfterSave(docType) {
    // La guía de primeros pasos muestra antes su pantalla de logro y luego llama a este formulario.
    if (global.ArpaGuia?.deferCapture?.(() => openCaptureAfterSave(docType))) return;
    openCaptureAfterSave(docType);
  }

  function flag(key) {
    try { return localStorage.getItem(key) === 'true'; } catch (e) { return false; }
  }

  function setFlag(key) {
    try { localStorage.setItem(key, 'true'); } catch (e) { /* ignore */ }
  }

  /** Después de guardar: siempre la primera vez (aunque antes dijera "Ahora no"); después, respeta el "Ahora no". */
  function canAskAfterSave() {
    if (!shouldOfferTrialCapture()) return false;
    return !flag(TRIAL_AFTER_SAVE_ASKED_KEY) || !isLaterActive();
  }

  function openCaptureAfterSave(docType) {
    if (!canAskAfterSave()) return;
    setFlag(TRIAL_AFTER_SAVE_ASKED_KEY);
    // Cada documento con su género: "tu cotización quedó guardada", "tu formato quedó guardado".
    const title = docType === 'cotizacion'
      ? t('trial_capture.title_after_save_cot', '¡Tu cotización quedó guardada!')
      : t('trial_capture.title_after_save', '¡Tu {doc} quedó guardado!')
        .replace('{doc}', t('trial_capture.doc_formato', 'Formato de Servicio'));

    showCapture({
      mode: 'modal',
      variant: 'achievement',
      title: title,
      subtitle: t(
        'trial_capture.subtitle_after_save_wa',
        'Te avisamos por WhatsApp antes de que venza tu prueba.'
      ),
      btnText: t('trial_capture.btn_submit_modal', 'Enviar datos'),
      allowLater: true
    });
  }

  function onDocumentSaved(docType) {
    try {
      localStorage.setItem(TRIAL_DOC_SAVED_KEY, 'true');
    } catch (e) { /* ignore */ }
    try {
      global.dispatchEvent(new CustomEvent('arpa:documento-guardado', { detail: { docType } }));
    } catch (e) { /* ignore */ }

    if (!canAskAfterSave()) return;

    if (pdfExportDepth > 0) {
      pendingCaptureDocType = docType;
      return;
    }

    showCaptureAfterSave(docType);
  }

  function maybeShowBackupCaptureOnLoad(onContinue) {
    if (!needsBackupCaptureOnLoad()) {
      if (typeof onContinue === 'function') onContinue();
      return;
    }
    showCapture({
      mode: 'fullscreen',
      variant: 'achievement',
      title: t('trial_capture.title_achievement', '¡Sigue avanzando con ARPA Suite!'),
      subtitle: t(
        'trial_capture.subtitle_achievement',
        'Completa el formulario en menos de un minuto. Te avisamos por WhatsApp antes de que venza tu prueba gratis.'
      ),
      btnText: t('trial_capture.btn_start', 'Continuar a la app'),
      onComplete: onContinue,
      allowLater: true
    });
  }

  /**
   * Apenas termina la bienvenida (ya eligió su oficio): pide nombre y WhatsApp una vez,
   * con "Ahora no". Antes solo se pedía al guardar el primer documento o al día 3, y la
   * mayoría de los que abrían la app se iba sin dejar cómo contactarlos.
   */
  function onOnboardingDone() {
    if (!shouldOfferTrialCapture() || flag(TRIAL_WELCOME_ASKED_KEY)) return;
    if (pdfExportDepth > 0) return;
    setFlag(TRIAL_WELCOME_ASKED_KEY);
    ensureTrialStartSilent();
    showCapture({
      mode: 'modal',
      variant: 'backup',
      title: t('trial_capture.title', 'Bienvenido a ARPA Suite'),
      subtitle: t(
        'trial_capture.subtitle_backup',
        'Para recordarte antes de que termine tu prueba y poder ayudarte, déjanos un WhatsApp de contacto.'
      ),
      btnText: t('trial_capture.btn_submit', 'Guardar y continuar'),
      allowLater: true
    });
  }

  try {
    global.addEventListener('arpa:onboarding-done', onOnboardingDone);
  } catch (e) { /* ignore */ }

  global.ArpaTrialCapture = {
    TRIAL_START_KEY,
    TRIAL_WHATSAPP_KEY,
    TRIAL_NOMBRE_KEY,
    TRIAL_OFICIO_KEY,
    TRIAL_PAIS_KEY,
    TRIAL_ID_KEY,
    TRIAL_DOC_SAVED_KEY,
    TRIAL_CAPTURED_KEY,
    TRIAL_LATER_KEY,
    ensureTrialStartSilent,
    isLaterActive,
    isCaptureCompleted,
    beginPdfExport,
    endPdfExport,
    onDocumentSaved,
    maybeShowBackupCaptureOnLoad,
    showCapture,
    retryPendingRegistration,
    registerTrialUserSilent,
    normalizePhone,
    trialCountry,
    looksLikeWrongUsNumber,
    countryFromPhone,
    syncCountryWithPhone,
    onOnboardingDone,
    canAskAfterSave
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retryPendingRegistration);
  } else {
    retryPendingRegistration();
  }

  global.addEventListener('online', retryPendingRegistration);
})(window);
