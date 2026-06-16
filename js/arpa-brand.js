/**
 * Marca blanca: configuración de empresa, logo y aplicación dinámica a la UI/PDF
 */
(function (global) {
  const SETTINGS_KEY = 'arpa_suite_user_settings';
  const SETTINGS_CONFIGURED_KEY = 'arpa_suite_settings_configured';
  const SALES_ENTRY_KEY = 'arpa_suite_sales_entry';
  const FORMATO_DRAFT_KEY = 'arpa_formato_borrador';
  const GLOBAL_BRAND_URL = 'https://arpatechnologyglobal.com';
  const GLOBAL_FOOTER_TEXT = '© 2026 ARPA Technology Global · arpatechnologyglobal.com · Todos los derechos reservados.';
  const COT_NOTA_LEGAL_HTML = '<strong>Nota:</strong> Cotización válida por <strong>15 días calendario</strong>. Precios en pesos colombianos (COP).';

  function getCotNotaLegalHtml() {
    return COT_NOTA_LEGAL_HTML;
  }

  function isInternalAppUrl(url) {
    const u = String(url || '').trim().toLowerCase();
    return !u || u.includes('github.io') || u.includes('/formato-arlenpav');
  }

  const EMPTY_SETTINGS = {
    companyName: '',
    nit: '',
    address: '',
    city: '',
    phone: '',
    website: '',
    bankName: '',
    accountType: 'Ahorros',
    accountNumber: '',
    accountHolder: '',
    accountHolderDocument: '',
    technicianName: '',
    technicianDocument: '',
    logoBase64: ''
  };

  /** @deprecated use EMPTY_SETTINGS — kept for callers that read DEFAULTS */
  const DEFAULTS = { ...EMPTY_SETTINGS };

  const LEGACY_COMPANY_PATTERNS = [
    /automatismos\s*arlenpav/i,
    /^automatismos\s*arpa/i
  ];
  const LEGACY_NIT_PATTERNS = [
    /901\.?\s*473\.?\s*259/i
  ];

  const DEFAULT_LOGO = './icon-192x192.png';

  let pendingLogoBase64 = null;

  function hasUserSettings() {
    try {
      return localStorage.getItem(SETTINGS_CONFIGURED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function isLegacyPreset(saved) {
    if (!saved || typeof saved !== 'object') return false;
    const name = String(saved.companyName || '');
    const nit = String(saved.nit || '');
    if (LEGACY_COMPANY_PATTERNS.some((re) => re.test(name))) return true;
    if (LEGACY_NIT_PATTERNS.some((re) => re.test(nit))) return true;
    return false;
  }

  function containsLegacyBrandText(text) {
    const blob = String(text || '').toLowerCase();
    return blob.includes('automatismos') && blob.includes('arlenpav');
  }

  function migrateConfiguredFlag() {
    if (hasUserSettings()) return;
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (saved.companyName?.trim() && !isLegacyPreset(saved)) {
        localStorage.setItem(SETTINGS_CONFIGURED_KEY, 'true');
      }
    } catch (e) {}
  }

  function purgeLegacyData() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (isLegacyPreset(saved)) {
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(SETTINGS_CONFIGURED_KEY);
      }
      const draft = localStorage.getItem(FORMATO_DRAFT_KEY) || '';
      if (containsLegacyBrandText(draft)) {
        localStorage.removeItem(FORMATO_DRAFT_KEY);
      }
      migrateConfiguredFlag();
    } catch (e) {}
  }

  function getSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { ...EMPTY_SETTINGS, ...saved };
    } catch (e) {
      return { ...EMPTY_SETTINGS };
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
    if (!hasUserSettings()) {
      return '<em>Configure datos bancarios en Ajustes ⚙️</em>';
    }
    return `<strong>Datos para consignación:</strong> ${val(s.bankName, '—')} · Cuenta ${val(s.accountType, '—')} · N° ${val(s.accountNumber, '—')}`;
  }

  function applyToUI() {
    const s = getSettings();
    const configured = hasUserSettings() && Boolean(s.companyName?.trim());
    document.documentElement.classList.toggle('brand-unconfigured', !configured);

    const company = (s.companyName || '').trim();
    const companyDisplay = configured ? company : 'Nombre de tu Empresa';
    const companyUpper = configured ? company.toUpperCase() : 'NOMBRE DE TU EMPRESA';
    const logo = getLogo(s);

    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };

    set('brand-logo', (el) => { el.src = logo; el.alt = configured ? company + ' – Logo' : 'Logo de su empresa'; });
    set('settings-logo-preview', (el) => { el.src = logo; el.alt = 'Vista previa del logo'; });
    set('brand-company-name', (el) => {
      el.textContent = companyUpper;
      el.classList.toggle('brand-placeholder', !configured);
    });
    set('brand-company-contact', (el) => {
      if (!configured) {
        el.innerHTML = 'Configure su empresa en <strong>⚙️ Ajustes</strong> para personalizar este documento.';
        return;
      }
      let html = `NIT: ${val(s.nit, '—')} &nbsp;|&nbsp; Tel: ${val(s.phone, '—')}<br>${val(s.address, '—')}`;
      const website = (s.website || '').trim();
      if (website && !isInternalAppUrl(website)) html += `<br>${website}`;
      el.innerHTML = html;
    });
    set('brand-screen-footer', (el) => {
      if (el.dataset.editable !== 'true') return;
      if (!configured) {
        el.innerHTML = 'Configure los datos de su empresa en ⚙️ Ajustes';
        return;
      }
      el.innerHTML = `${company} &nbsp;|&nbsp; NIT ${val(s.nit, '—')} &nbsp;|&nbsp; Tel ${val(s.phone, '—')}`;
    });
    set('brand-bank-block', (el) => { el.innerHTML = formatBankBlock(s); });
    set('brand-bank-block-formato', (el) => { el.innerHTML = formatBankBlock(s); });
    set('brand-warranty-header', (el) => {
      el.innerHTML = configured
        ? `<span class="shield">🛡️</span> Garantía – ${company}`
        : '<span class="shield">🛡️</span> Términos de Garantía';
    });
    set('brand-warranty-exclusion', (el) => {
      el.innerHTML = configured
        ? `<strong>Exclusiones de garantía:</strong> La garantía no aplica sobre daños causados por descargas eléctricas, sobretensiones, rayos u otras causas externas. Tampoco aplica cuando el equipo ha sido intervenido por <strong>personal no autorizado por ${company}</strong>.`
        : '<strong>Exclusiones de garantía:</strong> La garantía no aplica sobre daños por causas externas, descargas eléctricas o intervención de personal no autorizado.';
    });
    set('brand-verification-company', (el) => { el.textContent = configured ? company : 'su empresa'; });
    document.querySelectorAll('[data-brand-company]').forEach((el) => { el.textContent = configured ? company : 'su empresa'; });
    set('brand-technician-signature-label', (el) => {
      el.textContent = s.technicianName?.trim() ? `Firma Técnico – ${s.technicianName}` : 'Firma Técnico';
    });
    set('cot-elaborado-label', (el) => {
      el.textContent = s.technicianName?.trim() ? `Elaborado por – ${s.technicianName}` : 'Elaborado por';
    });
    set('cot-nota-legal', (el) => {
      el.innerHTML = getCotNotaLegalHtml();
    });
    set('validation-text', (el) => { el.textContent = 'Arpa Suite · Listo'; });

    const tech = document.getElementById('campo-tecnico-responsable');
    const techFirma = document.getElementById('campo-tecnico-firma');
    if (configured && tech && !tech.value.trim() && s.technicianName) tech.value = s.technicianName;
    if (configured && techFirma && !techFirma.value.trim() && s.technicianName) techFirma.value = s.technicianName;

    const cotNom = document.getElementById('cot-elaborado-nombre');
    const cotTel = document.getElementById('cot-elaborado-tel');
    if (configured && cotNom && !cotNom.value.trim() && s.technicianName) cotNom.value = s.technicianName;
    if (configured && cotTel && !cotTel.value.trim() && s.phone?.trim()) cotTel.value = s.phone.trim();

    document.title = document.title.includes('–') ? document.title : (configured ? `Arpa Suite – ${company}` : 'Arpa Suite');
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
      website: (() => {
        const w = document.getElementById('settings-website')?.value.trim() || '';
        return isInternalAppUrl(w) ? '' : w;
      })(),
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
    try { localStorage.setItem(SETTINGS_CONFIGURED_KEY, 'true'); } catch (e) {}
    try { localStorage.setItem(SALES_ENTRY_KEY, 'true'); } catch (e) {}

    global.ArpaPricing?.savePriceList?.(global.ArpaPricing.readPriceListFromSettingsForm());
    global.ArpaCobros?.seedFromPriceList?.('cot');
    global.ArpaCotizacion?.refreshCobros?.();
    global.ArpaCuentaCobro?.refreshView?.();
    global.ArpaCuentaCobro?.refreshView?.();

    pendingLogoBase64 = null;
    applyToUI();
    closeSettings();
  }

  let printUiBackup = null;

  function prepareForPrint() {
    printUiBackup = { contactHtml: null, sealHtml: null };
    const contact = document.getElementById('brand-company-contact');
    if (contact) {
      printUiBackup.contactHtml = contact.innerHTML;
      contact.querySelectorAll('a').forEach((a) => {
        const span = document.createElement('span');
        span.textContent = a.textContent;
        a.replaceWith(span);
      });
      contact.innerHTML = contact.innerHTML.replace(/https?:\/\/[^\s<]*github\.io[^\s<]*/gi, '');
    }
    const seal = document.getElementById('arpa-global-seal');
    if (seal) {
      printUiBackup.sealHtml = seal.innerHTML;
      seal.innerHTML = `<p class="suite-footer-global-text">${GLOBAL_FOOTER_TEXT}</p>`;
    }
    document.querySelectorAll('#suite-footer a[href]').forEach((a) => {
      const span = document.createElement('span');
      span.className = 'suite-footer-global-link';
      span.textContent = a.textContent;
      a.replaceWith(span);
    });
  }

  function restoreAfterPrint() {
    if (!printUiBackup) return;
    const contact = document.getElementById('brand-company-contact');
    if (contact && printUiBackup.contactHtml != null) contact.innerHTML = printUiBackup.contactHtml;
    const seal = document.getElementById('arpa-global-seal');
    if (seal && printUiBackup.sealHtml != null) seal.innerHTML = printUiBackup.sealHtml;
    printUiBackup = null;
  }

  function protectGlobalSeal() {
    const seal = document.getElementById('arpa-global-seal');
    if (!seal || seal.dataset.arpaCore !== 'immutable') return;
    new MutationObserver(() => {
      const text = seal.textContent.replace(/\s+/g, ' ').trim();
      if (!text.includes('ARPA Technology Global') || !text.includes('arpatechnologyglobal.com')) {
        seal.innerHTML = `<p class="suite-footer-global-text">${GLOBAL_FOOTER_TEXT}</p>`;
      }
      seal.querySelectorAll('a[href*="github.io"], a[href*="Formato-Arlenpav"]').forEach((a) => a.remove());
    }).observe(seal, { childList: true, subtree: true, characterData: true });
  }

  global.ArpaBrand = {
    SETTINGS_KEY,
    SETTINGS_CONFIGURED_KEY,
    SALES_ENTRY_KEY,
    FORMATO_DRAFT_KEY,
    GLOBAL_BRAND_URL,
    GLOBAL_FOOTER_TEXT,
    getCotNotaLegalHtml,
    DEFAULTS,
    EMPTY_SETTINGS,
    DEFAULT_LOGO,
    hasUserSettings,
    purgeLegacyData,
    isLegacyPreset,
    getSettings,
    saveSettings,
    getLogo,
    applyToUI,
    prepareForPrint,
    restoreAfterPrint,
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
    purgeLegacyData();
    applyToUI();
    protectGlobalSeal();
  });
  document.getElementById('settings-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') closeSettings();
  });
})(window);
