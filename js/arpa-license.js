/**
 * Validación de licencia al iniciar ARPA Suite
 */
(function (global) {
  const STORAGE_KEY = 'arpa_suite_license_code';
  const API_URL = 'https://script.google.com/macros/s/AKfycbzJvK5-hb4-IWAHvktIpx421C-aEzgRPALjGb9ks-Rl7V5vO0RKHUHrul852gicuI62/exec';

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

  function unlockApp() {
    document.documentElement.classList.add('license-ok');
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

  async function validateCode(code) {
    const url = `${API_URL}?codigo=${encodeURIComponent(code.trim())}`;
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error('network');
    const data = await res.json();
    return data?.valido === true;
  }

  function initLicenseGate() {
    if (getSavedCode()) {
      unlockApp();
      return;
    }

    const input = document.getElementById('license-code-input');
    const btn = document.getElementById('license-activate-btn');
    const errorEl = document.getElementById('license-error');

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
        const ok = await validateCode(code);
        if (ok) {
          saveCode(code);
          unlockApp();
        } else {
          showError(errorEl, 'Código de licencia inválido. Verifique e intente de nuevo.');
          input?.focus();
          input?.select();
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

  global.ArpaLicense = {
    STORAGE_KEY,
    getSavedCode,
    unlockApp,
    initLicenseGate
  };

  document.addEventListener('DOMContentLoaded', initLicenseGate);
})(window);
