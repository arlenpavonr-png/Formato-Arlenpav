/**
 * Helpers de licencia (cliente) — exenciones founder y permisos por plan.
 */
(function (global) {
  const LICENSE_CODE_KEY = 'arpa_suite_license_code';
  const LICENSE_PLAN_KEY = 'arpa_suite_license_plan';
  const FOUNDER_CODE = 'ARPA-FOUNDER-001';
  const WL_PREFIX = 'ARPA-WL-';
  const PYME_PREFIX = 'ARPA-PYME-';

  function normalizeCode(code) {
    return String(code || '').trim().toUpperCase();
  }

  function getActiveLicenseCode() {
    try {
      return normalizeCode(localStorage.getItem(LICENSE_CODE_KEY) || '');
    } catch (e) {
      return '';
    }
  }

  /** Licencia fundador: exenta de bloqueos presentes y futuros. */
  function isFounderLicense(code) {
    return normalizeCode(code || getActiveLicenseCode()) === FOUNDER_CODE;
  }

  function isWhiteLabelLicense(code) {
    return normalizeCode(code || getActiveLicenseCode()).indexOf(WL_PREFIX) === 0;
  }

  /** No expira localmente (solo founder hoy; extensible). */
  function isNeverExpiring(code) {
    return isFounderLicense(code);
  }

  /** Cambio de nombre de marca / logo de la app. */
  function canCustomizeBrand(code) {
    if (isFounderLicense(code)) return true;
    return isWhiteLabelLicense(code);
  }

  /** Atajo para futuras restricciones por plan. */
  function isExemptFromPlanRestrictions(code) {
    return isFounderLicense(code);
  }

  function getActiveLicensePlan() {
    try {
      return String(localStorage.getItem(LICENSE_PLAN_KEY) || '').trim().toUpperCase();
    } catch (e) {
      return '';
    }
  }

  function isPymePlan(code) {
    const c = normalizeCode(code || getActiveLicenseCode());
    if (c.indexOf(PYME_PREFIX) === 0) return true;
    return getActiveLicensePlan() === 'PYME';
  }

  function requiresTechnicianCode(code) {
    return isPymePlan(code);
  }

  global.ArpaLicense = {
    FOUNDER_CODE,
    WL_PREFIX,
    PYME_PREFIX,
    LICENSE_PLAN_KEY,
    getActiveLicenseCode,
    getActiveLicensePlan,
    isFounderLicense,
    isWhiteLabelLicense,
    isNeverExpiring,
    canCustomizeBrand,
    isExemptFromPlanRestrictions,
    isPymePlan,
    requiresTechnicianCode
  };
})(typeof window !== 'undefined' ? window : globalThis);
