/**
 * Captura de WhatsApp en primer uso (trial gratis) + sync con Sheets
 */
(function (global) {
  'use strict';

  const LICENSE_API = 'https://script.google.com/macros/s/AKfycbzKBeyDVWVqPG1R47EZTVKmCpa3SOwxs8LXrW4ipvRtiyyRV4trJKg7D4i89_cUTcH2/exec';
  const LICENSE_CODE_KEY = 'arpa_suite_license_code';
  const ACTIVE_OFICIOS_KEY = 'arpa_active_oficios';
  const TRIAL_START_KEY = 'arpa_trial_fecha_inicio';
  const TRIAL_WHATSAPP_KEY = 'arpa_trial_whatsapp';
  const TRIAL_NOMBRE_KEY = 'arpa_trial_nombre';
  const TRIAL_OFICIO_KEY = 'arpa_trial_oficio';
  const TRIAL_ID_KEY = 'arpa_trial_id';
  const TRIAL_SYNCED_KEY = 'arpa_trial_synced';

  const OFICIO_OPTIONS = [
    { id: 'automatismos', label: 'Automatismos' },
    { id: 'electricidad', label: 'Electricidad' },
    { id: 'gas', label: 'Gas' },
    { id: 'refrigeracion', label: 'Refrigeración y Aire Acondicionado' },
    { id: 'cctv', label: 'Cámaras y CCTV / Seguridad Electrónica' },
    { id: 'plomeria', label: 'Plomería y Fontanería' },
    { id: 'cerrajeria', label: 'Cerrajería' },
    { id: 'plagas', label: 'Control de Plagas / Fumigación' },
    { id: 'linea_blanca', label: 'Línea Blanca / Electrodomésticos' },
    { id: 'solar', label: 'Energía Solar' }
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

  function needsCapture() {
    if (getTrialStartDate()) return false;
    if (getSavedLicenseCode()) return false;
    return true;
  }

  function normalizePhone(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) digits = '57' + digits;
    if (digits.length === 11 && digits.startsWith('3')) digits = '57' + digits;
    return digits;
  }

  function populateOficioSelect(select) {
    if (!select || select.options.length > 1) return;
    select.innerHTML = '<option value="">' + t('trial_capture.oficio_placeholder', 'Seleccione su oficio…') + '</option>' +
      OFICIO_OPTIONS.map((o) => `<option value="${o.id}">${o.label}</option>`).join('');
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
    setCaptureActive(false);
    document.getElementById('trial-capture-gate')?.setAttribute('hidden', '');
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
        oficio: localStorage.getItem(TRIAL_OFICIO_KEY) || ''
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

  function showCapture(onComplete) {
    const gate = document.getElementById('trial-capture-gate');
    const nameInput = document.getElementById('trial-capture-name');
    const oficioSelect = document.getElementById('trial-capture-oficio');
    const phoneInput = document.getElementById('trial-capture-phone');
    const btn = document.getElementById('trial-capture-submit');
    if (!gate || !btn) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    gate.removeAttribute('hidden');
    setCaptureActive(true);
    showCaptureError('');
    populateOficioSelect(oficioSelect);
    if (phoneInput && !phoneInput.value.trim()) phoneInput.value = '+57 ';

    function finish() {
      hideCapture();
      if (typeof onComplete === 'function') onComplete();
      registerTrialUserSilent();
    }

    function onSubmit() {
      const nombre = (nameInput?.value || '').trim();
      const oficio = (oficioSelect?.value || '').trim();
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

      const now = new Date();
      const fechaInicio = now.toISOString().slice(0, 10);
      const trialId = 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

      try {
        localStorage.setItem(TRIAL_START_KEY, fechaInicio);
        localStorage.setItem(TRIAL_WHATSAPP_KEY, phone);
        localStorage.setItem(TRIAL_NOMBRE_KEY, nombre);
        localStorage.setItem(TRIAL_OFICIO_KEY, oficio);
        localStorage.setItem(TRIAL_ID_KEY, trialId);
        localStorage.setItem(ACTIVE_OFICIOS_KEY, JSON.stringify([oficio]));
        localStorage.removeItem(TRIAL_SYNCED_KEY);
      } catch (e) {
        console.warn('[arpa-trial-capture] localStorage', e);
      }

      btn.disabled = true;
      finish();
    }

    btn.onclick = onSubmit;
    [nameInput, phoneInput].forEach((el) => {
      el?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onSubmit();
      }, { once: false });
    });

    nameInput?.focus();
  }

  global.ArpaTrialCapture = {
    TRIAL_START_KEY,
    TRIAL_WHATSAPP_KEY,
    TRIAL_NOMBRE_KEY,
    TRIAL_OFICIO_KEY,
    TRIAL_ID_KEY,
    needsCapture,
    showCapture,
    retryPendingRegistration,
    registerTrialUserSilent
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retryPendingRegistration);
  } else {
    retryPendingRegistration();
  }

  global.addEventListener('online', retryPendingRegistration);
})(window);
