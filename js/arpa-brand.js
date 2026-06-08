/**
 * Marca blanca: configuración de empresa, logo y aplicación dinámica a la UI/PDF
 */
(function (global) {
  const SETTINGS_KEY = 'arpa_suite_user_settings';
  const VIRAL_URL = 'https://globaltechnology.com';

  const DEFAULTS = {
    companyName: 'Su Empresa S.A.S.',
    nit: '000.000.000-0',
    address: 'Dirección comercial',
    phone: '000-000-0000',
    website: '',
    bankName: 'Nombre del banco',
    accountType: 'Ahorros',
    accountNumber: '00000000000',
    technicianName: '',
    logoBase64: ''
  };

  const DEFAULT_LOGO = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
    '<rect width="120" height="120" rx="16" fill="#0f2044"/>' +
    '<circle cx="60" cy="54" r="28" fill="#ffffff" opacity="0.95"/>' +
    '<text x="60" y="62" text-anchor="middle" fill="#d97706" font-size="20" font-weight="bold" font-family="Arial,sans-serif">LOGO</text>' +
    '</svg>'
  );

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
      'settings-phone': s.phone,
      'settings-website': s.website,
      'settings-bank': s.bankName,
      'settings-account-type': s.accountType,
      'settings-account-number': s.accountNumber,
      'settings-technician': s.technicianName
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
      : '.main-menu-btn[onclick*="scrollToTopMenu"]';
    document.querySelector(sel)?.classList.add('active');
  }

  function saveFromModal() {
    clearError();
    const companyName = document.getElementById('settings-company')?.value.trim();
    const nit = document.getElementById('settings-nit')?.value.trim();
    const address = document.getElementById('settings-address')?.value.trim();
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
      phone,
      website: document.getElementById('settings-website')?.value.trim() || '',
      bankName,
      accountType,
      accountNumber,
      technicianName: document.getElementById('settings-technician')?.value.trim() || '',
      logoBase64: pendingLogoBase64 !== null ? pendingLogoBase64 : (current.logoBase64 || '')
    };

    if (!saveSettings(settings)) return;

    global.ArpaPricing?.savePriceList?.(global.ArpaPricing.readPriceListFromSettingsForm());
    global.ArpaPricing?.applyServicePriceToFormato?.();
    global.ArpaCobros?.seedFromPriceList?.('cot');
    global.ArpaCotizacion?.refreshCobros?.();

    pendingLogoBase64 = null;
    applyToUI();
    closeSettings();
  }

  global.ArpaBrand = {
    SETTINGS_KEY,
    VIRAL_URL,
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

  document.addEventListener('DOMContentLoaded', applyToUI);
  document.getElementById('settings-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') closeSettings();
  });
})(window);
