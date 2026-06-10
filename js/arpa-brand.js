/**
 * Marca blanca: configuración de empresa, logo y aplicación dinámica a la UI/PDF
 */
(function (global) {
  const SETTINGS_KEY = 'arpa_suite_user_settings';
  const GLOBAL_BRAND_URL = 'https://arpatechnologyglobal.com';

  const DEFAULTS = {
    companyName: 'Su Empresa S.A.S.',
    nit: '000.000.000-0',
    address: 'Dirección comercial',
    city: '',
    phone: '000-000-0000',
    website: '',
    bankName: 'Nombre del banco',
    accountType: 'Ahorros',
    accountNumber: '00000000000',
    accountHolder: '',
    accountHolderDocument: '',
    technicianName: '',
    technicianDocument: '',
    logoBase64: ''
  };

  const DEFAULT_LOGO = './logo-arpa-suite.png';

  let pendingLogoBase64 = null;

  function getSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { ...DEFAULTS, ...saved };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function saveSettings(data) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[arpa-brand]', e);
      showError('No se pudo guardar. Si subió un logo, pruebe con una imagen más pequeña.');
      return false;
    }
  }

  function getLogo(settings) {
    return settings?.logoBase64 || DEFAULT_LOGO;
  }

  function val(value, fallback) {
    const v = (value || '').trim();
    return v || fallback;
  }

  function showError(msg) {
    const el = document.getElementById('settings-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
  }

  function clearError() {
    const el = document.getElementById('settings-error');
    if (!el) return;
    el.textContent = '';
    el.classList.remove('visible');
  }

  function formatBankBlock(s) {
    return `<strong>Datos para consignación:</strong> ${val(s.bankName, DEFAULTS.bankName)} · Cuenta ${val(s.accountType, DEFAULTS.accountType)} · N° ${val(s.accountNumber, DEFAULTS.accountNumber)}`;
  }

  function applyToUI() {
    const s = getSettings();
    const company = val(s.companyName, DEFAULTS.companyName);
    const companyUpper = company.toUpperCase();
    const logo = getLogo(s);

    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };

    set('brand-logo', (el) => { el.src = logo; el.alt = company + ' – Logo'; });
    set('settings-logo-preview', (el) => { el.src = logo; el.alt = 'Vista previa del logo'; });
    set('brand-company-name', (el) => { el.textContent = companyUpper; });
    set('brand-company-contact', (el) => {
      let html = `NIT: ${val(s.nit, DEFAULTS.nit)} &nbsp;|&nbsp; Tel: ${val(s.phone, DEFAULTS.phone)}<br>${val(s.address, DEFAULTS.address)}`;
      if (s.website?.trim()) html += `<br>${s.website.trim()}`;
      el.innerHTML = html;
    });
    set('brand-screen-footer', (el) => {
      if (el.dataset.editable !== 'true') return;
      el.innerHTML = `${company} &nbsp;|&nbsp; NIT ${val(s.nit, DEFAULTS.nit)} &nbsp;|&nbsp; Tel ${val(s.phone, DEFAULTS.phone)}`;
    });
    set('brand-bank-block', (el) => { el.innerHTML = formatBankBlock(s); });
    set('brand-bank-block-formato', (el) => { el.innerHTML = formatBankBlock(s); });
    set('brand-warranty-header', (el) => {
      el.innerHTML = `<span class="shield">🛡️</span> Garantía – ${company}`;
    });
    set('brand-warranty-exclusion', (el) => {
      el.innerHTML = `<strong>Exclusiones de garantía:</strong> La garantía no aplica sobre daños causados por descargas eléctricas, sobretensiones, rayos u otras causas externas. Tampoco aplica cuando el equipo ha sido intervenido por <strong>personal no autorizado por ${company}</strong>.`;
    });
    set('brand-verification-company', (el) => { el.textContent = company; });
    document.querySelectorAll('[data-brand-company]').forEach((el) => { el.textContent = company; });
    set('brand-technician-signature-label', (el) => {
      el.textContent = s.technicianName?.trim() ? `Firma Técnico – ${s.technicianName}` : 'Firma Técnico';
    });
    set('cot-elaborado-label', (el) => {
      el.textContent = s.technicianName?.trim() ? `Elaborado por – ${s.technicianName}` : 'Elaborado por';
    });
    set('cot-nota-legal', (el) => {
      el.innerHTML = `<strong>Nota:</strong> Cotización con vigencia de <strong>15 días calendario</strong>. Precios en pesos colombianos (COP). Emitida por <strong>${company}</strong>.`;
    });
    set('validation-text', (el) => { el.textContent = 'Arpa Suite · Listo'; });

    const tech = document.getElementById('campo-tecnico-responsable');
    const techFirma = document.getElementById('campo-tecnico-firma');
    if (tech && !tech.value.trim() && s.technicianName) tech.value = s.technicianName;
    if (techFirma && !techFirma.value.trim() && s.technicianName) techFirma.value = s.technicianName;

    const cotNom = document.getElementById('cot-elaborado-nombre');
    const cotTel = document.getElementById('cot-elaborado-tel');
    if (cotNom && !cotNom.value.trim() && s.technicianName) cotNom.value = s.technicianName;
    if (cotTel && !cotTel.value.trim()) cotTel.value = val(s.phone, DEFAULTS.phone);

    document.title = document.title.includes('–') ? document.title : `Arpa Suite – ${company}`;
  }

  function previewLogo(input) {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Seleccione una imagen válida (PNG, JPG o WebP).');
      input.value = '';
      return;
    }
    if (file.size > 800000) {
      showError('Logo muy pesado. Máximo ~800 KB.');
      input.value = '';
      return;
    }
    clearError();
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingLogoBase64 = e.target.result;
      const preview = document.getElementById('settings-logo-preview');
      if (preview) preview.src = pendingLogoBase64;
    };
    reader.readAsDataURL(file);
  }

  function openSettings(menuBtn) {
    clearError();
    pendingLogoBase64 = null;
    const s = getSettings();
    const fields = {
      'settings-company': s.companyName,
      'settings-nit': s.nit,
      'settings-address': s.address,
      'settings-city': s.city,
      'settings-phone': s.phone,
      'settings-website': s.website,
      'settings-bank': s.bankName,
      'settings-account-type': s.accountType,
      'settings-account-number': s.accountNumber,
      'settings-account-holder': s.accountHolder,
      'settings-account-holder-doc': s.accountHolderDocument,
      'settings-technician': s.technicianName,
      'settings-technician-doc': s.technicianDocument
    };
    Object.entries(fields).forEach(([id, v]) => {
      const el = document.getElementById(id);
      if (el) el.value = v || '';
    });
    const preview = document.getElementById('settings-logo-preview');
    if (preview) preview.src = getLogo(s);
    const logoInput = document.getElementById('settings-logo');
    if (logoInput) logoInput.value = '';
    global.ArpaPricing?.renderPriceListSettings?.();
    document.getElementById('settings-modal')?.classList.add('open');
    if (menuBtn) {
      document.querySelectorAll('.main-menu-btn').forEach((b) => b.classList.remove('active'));
      menuBtn.classList.add('active');
    }
  }

  function closeSettings() {
    document.getElementById('settings-modal')?.classList.remove('open');
    pendingLogoBase64 = null;
    const view = global.ArpaViews?.getCurrentView?.() || 'formato';
    document.querySelectorAll('.main-menu-btn').forEach((b) => b.classList.remove('active'));
    const sel = view === 'cotizacion'
      ? '.main-menu-btn[onclick*="openCotizacionView"]'
      : view === 'catalogo'
      ? '.main-menu-btn[onclick*="openCatalogoView"]'
      : view === 'cuenta-cobro'
      ? '.main-menu-btn[onclick*="openCuentaCobroView"]'
      : view === 'historial'
      ? '.main-menu-btn[onclick*="openHistorialView"]'
      : '.main-menu-btn[onclick*="scrollToTopMenu"]';
    document.querySelector(sel)?.classList.add('active');
  }

  function saveFromModal() {
    clearError();
    const companyName = document.getElementById('settings-company')?.value.trim();
    const nit = document.getElementById('settings-nit')?.value.trim();
    const address = document.getElementById('settings-address')?.value.trim();
    const city = document.getElementById('settings-city')?.value.trim();
    const phone = document.getElementById('settings-phone')?.value.trim();
    const bankName = document.getElementById('settings-bank')?.value.trim();
    const accountType = document.getElementById('settings-account-type')?.value.trim();
    const accountNumber = document.getElementById('settings-account-number')?.value.trim();

    if (!companyName || !nit || !address || !phone || !bankName || !accountType || !accountNumber) {
      showError('Complete todos los campos obligatorios marcados con *.');
      return;
    }

    const current = getSettings();
    const settings = {
      companyName,
      nit,
      address,
      city,
      phone,
      website: document.getElementById('settings-website')?.value.trim() || '',
      bankName,
      accountType,
      accountNumber,
      accountHolder: document.getElementById('settings-account-holder')?.value.trim() || '',
      accountHolderDocument: document.getElementById('settings-account-holder-doc')?.value.trim() || '',
      technicianName: document.getElementById('settings-technician')?.value.trim() || '',
      technicianDocument: document.getElementById('settings-technician-doc')?.value.trim() || '',
      logoBase64: pendingLogoBase64 !== null ? pendingLogoBase64 : (current.logoBase64 || '')
    };

    if (!saveSettings(settings)) return;

    global.ArpaPricing?.savePriceList?.(global.ArpaPricing.readPriceListFromSettingsForm());
    global.ArpaCobros?.seedFromPriceList?.('cot');
    global.ArpaCotizacion?.refreshCobros?.();
    global.ArpaCuentaCobro?.refreshView?.();
    global.ArpaCuentaCobro?.refreshView?.();

    pendingLogoBase64 = null;
    applyToUI();
    closeSettings();
  }

  function protectGlobalSeal() {
    const seal = document.getElementById('arpa-global-seal');
    if (!seal || seal.dataset.arpaCore !== 'immutable') return;
    const snapshot = seal.innerHTML;
    new MutationObserver(() => {
      const text = seal.textContent.replace(/\s+/g, ' ').trim();
      if (!text.includes('ARPA Technology Global') || !text.includes('arpatechnologyglobal.com')) {
        seal.innerHTML = snapshot;
      }
    }).observe(seal, { childList: true, subtree: true, characterData: true });
  }

  global.ArpaBrand = {
    SETTINGS_KEY,
    GLOBAL_BRAND_URL,
    DEFAULTS,
    DEFAULT_LOGO,
    getSettings,
    saveSettings,
    getLogo,
    applyToUI,
    previewLogo,
    openSettings,
    closeSettings,
    saveFromModal,
    formatBankBlock
  };

  global.applyUserSettingsToUI = applyToUI;
  global.openSettingsModal = openSettings;
  global.closeSettingsModal = closeSettings;
  global.saveSettingsFromModal = saveFromModal;
  global.previewLogoUpload = previewLogo;

  document.addEventListener('DOMContentLoaded', () => {
    applyToUI();
    protectGlobalSeal();
  });
  document.getElementById('settings-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') closeSettings();
  });
})(window);
