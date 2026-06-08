const BRAND_CONFIG_URL = './brand/default/brand.config.json';
const BRAND_ASSETS_BASE = './brand/default/';

async function loadBrandData() {
  try {
    const response = await fetch(BRAND_CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`No se pudo cargar la configuración de marca (${response.status})`);
    }

    const brand = await response.json();
    const logoEl = document.getElementById('brand-logo');
    const companyNameEl = document.getElementById('brand-company-name');

    if (!logoEl) {
      console.warn('[brand-loader] No se encontró el elemento #brand-logo en index.html');
    }
    if (!companyNameEl) {
      console.warn('[brand-loader] No se encontró el elemento #brand-company-name en index.html');
    }

    if (logoEl && brand.assets?.logo) {
      logoEl.src = BRAND_ASSETS_BASE + brand.assets.logo;
      if (brand.assets.logoAlt) {
        logoEl.alt = brand.assets.logoAlt;
      }
      logoEl.onerror = () => {
        console.warn('[brand-loader] Logo local no disponible, usando fallback:', brand.urls?.logoFallbackUrl);
        if (brand.urls?.logoFallbackUrl) {
          logoEl.src = brand.urls.logoFallbackUrl;
        }
      };
    }

    if (companyNameEl && brand.company?.legalName) {
      companyNameEl.textContent = brand.company.legalName;
    }

    if (typeof window.applyUserSettingsToUI === 'function') {
      window.applyUserSettingsToUI();
    }

    console.log('[brand-loader] Datos de marca cargados correctamente:', {
      id: brand.id,
      companyName: brand.company?.legalName,
      logo: brand.assets?.logo,
      logoApplied: Boolean(logoEl && brand.assets?.logo),
      companyNameApplied: Boolean(companyNameEl && brand.company?.legalName)
    });

    return brand;
  } catch (error) {
    console.error('[brand-loader] Error al cargar la configuración de marca:', error.message);
    return null;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBrandData);
} else {
  loadBrandData();
}
