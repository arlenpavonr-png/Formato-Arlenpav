/**
 * Validación de licencia al iniciar ARPA Suite + revalidación online cada 7 días
 */
(function (global) {
  const STORAGE_KEY = 'arpa_suite_license_code';
  const LAST_VALIDATION_KEY = 'arpa_last_validation';
  const API_URL = 'https://script.google.com/macros/s/AKfycbwpDWX0Wp9xDB14pDPSq3hQOwa82QV3P5FyS4insOPQpsle6uwOksE7OIomiWNe7gyt/exec';
  const VALIDATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
  const WHATSAPP_RENEW = '573005683914';

  function getSavedCode() {
    try {
      return (localStorage.getItem(STORAGE_KEY) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function saveCode(code) {
    localStorage.setItem(STORAGE_KEY, code.trim());
  }

  function clearLicense() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_VALIDATION_KEY);
  }

  function getLastValidation() {
    try {
      const raw = localStorage.getItem(LAST_VALIDATION_KEY);
      const ts = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(ts) ? ts : null;
    } catch (e) {
      return null;
    }
  }

  function setLastValidation(ts) {
    localStorage.setItem(LAST_VALIDATION_KEY, String(ts || Date.now()));
  }

  function needsRevalidation() {
    const last = getLastValidation();
    if (last == null) return true;
    return Date.now() - last >= VALIDATION_INTERVAL_MS;
  }

  function unlockApp() {
    document.documentElement.classList.add('license-ok');
  }

  function lockApp() {
    document.documentElement.classList.remove('license-ok');
  }

  function showActivateUI() {
    document.getElementById('license-gate-activate')?.removeAttribute('hidden');
    document.getElementById('license-gate-expired')?.setAttribute('hidden', '');
    const sub = document.getElementById('license-gate-sub');
    if (sub) sub.textContent = 'Ingrese su código de licencia para activar la plataforma.';
  }

  function showExpiredUI() {
    document.getElementById('license-gate-activate')?.setAttribute('hidden', '');
    document.getElementById('license-gate-expired')?.removeAttribute('hidden');
  }

  function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
  }

  function hideError(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.remove('visible');
  }

  function evaluateLicenseResponse(data) {
    if (!data || typeof data !== 'object') {
      return { ok: false, reason: 'invalid_response' };
    }
    return { ok: data.valido === true, reason: data.valido === true ? 'ok' : 'invalid' };
  }

  async function fetchLicenseStatus(code) {
    const url = `${API_URL}?codigo=${encodeURIComponent(code.trim())}`;
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error('network');
    return res.json();
  }

  async function validateLicenseOnline(code) {
    const data = await fetchLicenseStatus(code);
    return evaluateLicenseResponse(data);
  }

  function handleLicenseExpired() {
    clearLicense();
    lockApp();
    showExpiredUI();
  }

  async function runRevalidation(code) {
    try {
      const result = await validateLicenseOnline(code);
      if (result.ok) {
        setLastValidation(Date.now());
        return true;
      }
      handleLicenseExpired();
      return false;
    } catch (e) {
      return true;
    }
  }

  function openRenewWhatsApp() {
    const text = encodeURIComponent('Hola, deseo renovar mi licencia de ARPA Suite.');
    window.open(`https://wa.me/${WHATSAPP_RENEW}?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  function bindActivateForm() {
    const input = document.getElementById('license-code-input');
    const btn = document.getElementById('license-activate-btn');
    const errorEl = document.getElementById('license-error');

    if (btn?.dataset.bound === '1') return;
    if (btn) btn.dataset.bound = '1';

    input?.focus();

    async function activate() {
      const code = input?.value?.trim() || '';
      if (!code) {
        showError(errorEl, 'Ingrese su código de licencia.');
        input?.focus();
        return;
      }

      hideError(errorEl);
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Verificando…';
      }

      try {
        const result = await validateLicenseOnline(code);
        if (result.ok) {
          saveCode(code);
          setLastValidation(Date.now());
          unlockApp();
          showActivateUI();
          global.ArpaOnboarding?.tryShow?.();
        } else {
          handleLicenseExpired();
        }
      } catch (e) {
        showError(errorEl, 'No se pudo verificar la licencia. Compruebe su conexión e intente de nuevo.');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Activar';
        }
      }
    }

    btn?.addEventListener('click', activate);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') activate();
    });
  }

  function bindRenewButton() {
    const btn = document.getElementById('license-renew-btn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', openRenewWhatsApp);
  }

  async function initLicenseGate() {
    bindRenewButton();
    showActivateUI();

    const code = getSavedCode();
    if (!code) {
      bindActivateForm();
      return;
    }

    unlockApp();

    if (needsRevalidation()) {
      await runRevalidation(code);
      if (!getSavedCode()) return;
    }

    bindActivateForm();
  }

  global.ArpaLicense = {
    STORAGE_KEY,
    LAST_VALIDATION_KEY,
    getSavedCode,
    getLastValidation,
    setLastValidation,
    needsRevalidation,
    validateLicenseOnline,
    unlockApp,
    lockApp,
    initLicenseGate
  };

  document.addEventListener('DOMContentLoaded', initLicenseGate);
})(window);
