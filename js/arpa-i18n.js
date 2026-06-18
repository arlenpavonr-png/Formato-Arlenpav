/**
 * ARPA Suite – UI internationalization (ES / EN)
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'arpa_lang';
  var currentLang = 'es';
  var defaultsCaptured = false;
  var brandDefaultsCaptured = false;
  var brandDefaults = {};
  var I18N_ES = {};

  var I18N_EN = {
    'license_gate.title': 'ARPA Suite',
    'license_gate.subtitle': 'Enter your license code to activate the platform.',
    'license_gate.label_code': 'License code',
    'license_gate.placeholder_code': 'Your license code',
    'license_gate.btn_verify': 'Verify',
    'license_gate.btn_verifying': 'Verifying…',
    'license_gate.loading': 'Activating your 7-day trial…',
    'license_gate.validating': 'Verifying license…',
    'license_gate.expired_title': 'Your 7-day trial has ended.',
    'license_gate.expired_sub': 'Choose a plan to keep using ARPA Suite. You will receive your code by email after purchase.',
    'license_gate.btn_pro': 'Buy Pro plan',
    'license_gate.btn_pyme': 'Buy PYME plan',
    'license_gate.btn_whatsapp': 'Questions? Message us on WhatsApp',
    'license_gate.have_code': 'Already have a Pro or PYME code?',
    'license_gate.enter_code': 'Enter it here',
    'license_gate.retry_trial': 'Retry automatic activation',
    'license_gate.error_required': 'Enter your license code.',
    'license_gate.error_invalid': 'Invalid license code.',
    'license_gate.error_network': 'Could not verify license. Check your connection and try again.',
    'license_gate.error_trial': 'Could not activate trial. Enter your code or retry.',

    'onboarding.title': 'Welcome to ARPA Suite',
    'onboarding.subtitle_rubro': 'What is your main line of business?',
    'onboarding.rubro.automatizacion': 'Automation',
    'onboarding.rubro.aire_acondicionado': 'Air Conditioning',
    'onboarding.rubro.electricidad': 'Electrical',
    'onboarding.rubro.otro': 'Other',
    'onboarding.demo.title': 'Accessmatic Demo Catalog',
    'onboarding.demo.text': 'Would you like to preload 59 products?',
    'onboarding.demo.btn_skip': 'Skip, start empty',
    'onboarding.demo.btn_yes': 'Yes, load catalog',
    'onboarding.otro.title': 'Your catalog',
    'onboarding.otro.text': 'You will start with an empty catalog. You can add your products manually.',
    'onboarding.otro.btn_continue': 'Got it, continue',

    'header.validation_badge': 'Arpa Suite',
    'header.validation_badge_ready': 'Arpa Suite · Ready',
    'header.lang.aria': 'Language',
    'header.settings.title': 'Company settings',
    'header.settings.aria': 'Company settings',
    'header.doc_type.formato': 'Service Form',
    'header.doc_type.cotizacion': '💰 Quote',
    'header.doc_type.catalogo': '📦 My Catalog',
    'header.doc_type.cuenta_cobro': '🧾 Invoice',
    'header.doc_type.historial': '📋 Service History',
    'header.number_label': 'No.',
    'header.btn_new_number': '+ NEW No.',
    'header.placeholder.formato_number': '0001',
    'header.placeholder.cot_number': 'COT-001',
    'header.placeholder.cc_number': 'CC-001',
    'header.title.tap_new_number': 'Tap to generate new number',

    'menu.aria': 'Main menu',
    'menu.formato': 'Form',
    'menu.cotizacion': 'Quote',
    'menu.catalogo': 'Catalog',
    'menu.historial': 'History',
    'menu.cuenta_cobro': 'Invoice',
    'menu.configuracion': 'Settings',
    'menu.fab_add.aria': 'Add',

    'formato.section.tipo_servicio': 'Service Type',
    'formato.tipo.instalacion': '⚙️ Installation',
    'formato.tipo.mantenimiento': '🔧 Maintenance',
    'formato.tipo.reparacion': '🛠 Repair',
    'formato.section.datos_cliente': 'Client Details',
    'formato.label.nombre_empresa': 'Name / Company',
    'formato.placeholder.nombre_empresa': 'Full name or company name',
    'formato.label.nit_cedula': 'Tax ID / ID Number',
    'formato.placeholder.nit_cedula': '000.000.000-0',
    'formato.label.telefono': 'Phone',
    'formato.placeholder.telefono': '+57 300 000 0000',
    'formato.label.direccion_instalacion': 'Installation address',
    'formato.placeholder.direccion': 'Street, avenue, neighborhood...',
    'formato.label.ciudad': 'City',
    'formato.placeholder.ciudad': 'Medellín',
    'formato.label.fecha': 'Date',
    'formato.section.tecnico': 'Responsible Technician',
    'formato.label.tecnico': 'Technician',
    'formato.placeholder.tecnico': 'Technician name',
    'formato.label.auxiliar': 'Assistant (if applicable)',
    'formato.placeholder.auxiliar': 'Assistant name',
    'formato.section.tipo_puerta': 'Door / Motor Type',
    'formato.puerta.corrediza': 'Sliding',
    'formato.puerta.batiente_1': 'Single swing',
    'formato.puerta.batiente_2': 'Double swing',
    'formato.puerta.levadiza': 'Lift',
    'formato.puerta.seccional': 'Sectional',
    'formato.puerta.barrera': 'Vehicle barrier',
    'formato.puerta.techo_corredizo': 'Skylight',
    'formato.puerta.otra': 'Other',
    'formato.section.medidas': 'Opening Dimensions',
    'formato.label.ancho_a': 'Width A (m)',
    'formato.label.alto_h': 'Height H (m)',
    'formato.label.md': 'MD (m)',
    'formato.label.mi': 'MI (m)',
    'formato.placeholder.dimension': '0.00',
    'formato.label.peso': 'Approx. weight (kg)',
    'formato.placeholder.peso': 'kg',
    'formato.label.material_puerta': 'Door material',
    'formato.placeholder.material_puerta': 'Iron, aluminum...',
    'formato.section.equipo': 'Installed Equipment',
    'formato.label.marca_motor': 'Motor brand',
    'formato.select.seleccionar': 'Select...',
    'formato.select.otra_marca': 'Other',
    'formato.label.referencia_modelo': 'Reference / Model',
    'formato.select.seleccionar_referencia': 'Select reference...',
    'formato.placeholder.referencia_manual': 'E.g.: ARES 1500',
    'formato.label.serie_codigo': 'Serial / Code',
    'formato.placeholder.serie': 'Serial number',
    'formato.label.voltaje': 'Voltage',
    'formato.label.accesorios': 'Included accessories',
    'formato.accesorio.control_remoto': 'Remote control',
    'formato.accesorio.teclado': 'Numeric keypad',
    'formato.accesorio.fotocelda': 'Photocell',
    'formato.accesorio.sensor_apertura': 'Opening sensor',
    'formato.accesorio.bateria': 'Backup battery',
    'formato.accesorio.cierre_automatico': 'Auto close',
    'formato.accesorio.tarjeta_lector': 'Card / reader',
    'formato.section.materiales': 'Materials Used',
    'formato.mat.header.descripcion': 'Material / Description',
    'formato.mat.header.unidad': 'Unit',
    'formato.mat.header.cant': 'Qty.',
    'formato.mat.placeholder.ej1': 'E.g.: 1/2" conduit pipe',
    'formato.mat.placeholder.ej2': 'E.g.: 40x20 rectangular tube',
    'formato.mat.placeholder.ej3': 'E.g.: #12 sheathed cable',
    'formato.mat.placeholder.ej4': 'E.g.: Screws and anchors',
    'formato.mat.placeholder.ml': 'lm',
    'formato.mat.placeholder.cero': '0',
    'formato.mat.placeholder.und': 'unit',
    'formato.mat.placeholder.otro': 'Other material...',
    'formato.section.fotos': 'Photo Record',
    'formato.foto.badge_antes': 'Before',
    'formato.foto.label_antes': 'Before Photo',
    'formato.foto.btn_galeria': '🖼 Gallery / Camera',
    'formato.foto.badge_despues': 'After',
    'formato.foto.label_despues': 'After Photo',
    'formato.section.observaciones': 'Notes and Recommendations',
    'formato.placeholder.obs1': 'Note 1...',
    'formato.placeholder.obs2': 'Note 2...',
    'formato.placeholder.obs3': 'Note 3...',
    'formato.placeholder.obs4': 'Note 4...',
    'formato.nota.label': 'Note:',
    'formato.nota.body': 'The client must provide an electrical outlet (110V–220V) with ground for installation, including wiring and conduit for sensors if required. Failure to meet these requirements will incur additional cost.',
    'formato.section.garantia': 'Warranty Terms',
    'formato.garantia.header_static': 'Warranty Terms',
    'formato.garantia.header': 'Warranty – {company}',
    'formato.garantia.tiempo.label': 'Warranty period:',
    'formato.garantia.tiempo.body': 'Labor warranty is 1 year from the service date. Equipment has a 2-year warranty against manufacturing defects.',
    'formato.garantia.mantenimiento.label': 'Preventive maintenance:',
    'formato.garantia.mantenimiento.body': 'We recommend maintenance every 6 months with our technical team. This extends equipment life, prevents failures, and maintains optimal operating conditions.',
    'formato.garantia.exclusiones.label': 'Warranty exclusions:',
    'formato.garantia.exclusiones.body_static': 'The warranty does not apply to damage from external causes, electrical surges, or unauthorized personnel intervention.',
    'formato.garantia.exclusiones.body': '<strong>Warranty exclusions:</strong> The warranty does not apply to damage caused by electrical surges, overvoltage, lightning, or other external causes. It also does not apply when the equipment has been serviced by <strong>personnel not authorized by {company}</strong>.',
    'formato.section.video': 'Delivery Video',
    'formato.video.label': 'Delivery Video Link (Google Drive/YouTube) - Optional',
    'formato.video.placeholder': 'https://drive.google.com/... or https://youtube.com/...',
    'formato.section.firmas': 'Acceptance and Signatures',
    'formato.firma.cliente': 'Client Signature',
    'formato.firma.tecnico': 'Technician Signature',
    'formato.firma.tecnico_named': 'Technician Signature – {name}',
    'formato.firma.btn_borrar': 'Clear',
    'formato.firma.aria_cliente': 'Client signature canvas',
    'formato.firma.aria_tecnico': 'Technician signature canvas',
    'formato.firma.placeholder.nombre': 'Full name',
    'formato.firma.placeholder.doc': 'ID / Tax ID',
    'formato.firma.placeholder.tecnico': 'Technician name',
    'formato.firma.placeholder.id_tecnico': 'Technician ID',
    'formato.video_qr.title': 'Equipment delivery video',
    'formato.video_qr.aria': 'Delivery video QR code',
    'formato.video_qr.hint': 'Scan the code to watch the equipment delivery video',
    'formato.verification': 'Document issued by <strong id="brand-verification-company">{company}</strong> through <strong>Arpa Suite</strong>.',
    'formato.section.datos_bancarios': 'Bank Details',

    'cot.section.datos_cliente': 'Client Details',
    'cot.label.correo': 'Email',
    'cot.placeholder.correo': 'email@example.com',
    'cot.label.valida_hasta': 'Valid until',
    'cot.section.cobros': 'Charges',
    'cot.btn_agregar_item': '+ Add additional item',
    'cot.section.buscar': 'Search and Add Products',
    'cot.label.producto': 'Product',
    'cot.placeholder.buscar': '🔍 Search by name or code...',
    'cot.label.cant': 'Qty.',
    'cot.hint.catalogo': 'Go to My Catalog to add your products',
    'cot.section.productos': 'Quoted Products and Services',
    'cot.table.codigo': 'Code',
    'cot.table.descripcion': 'Description',
    'cot.table.cant': 'Qty.',
    'cot.table.pvp_unit': 'Unit Price',
    'cot.table.total': 'Total',
    'cot.table.empty': 'Add products, services, or additional items',
    'cot.section.resumen': 'Quote Summary',
    'cot.iva.toggle': 'Include VAT 19%',
    'cot.total.subtotal': 'Subtotal',
    'cot.total.iva': 'VAT (19%)',
    'cot.total.grand': 'TOTAL',
    'cot.section.datos_bancarios': 'Bank Details',
    'cot.section.observaciones': 'Notes',
    'cot.placeholder.obs': 'Additional specifications, notes for the client...',
    'cot.section.aprobacion': 'Approval',
    'cot.firma.aprobado_cliente': 'Approved by (Client)',
    'cot.firma.elaborado': 'Prepared by',
    'cot.firma.elaborado_named': 'Prepared by – {name}',
    'cot.firma.aria_cliente': 'Client quote signature',
    'cot.firma.aria_elaborado': 'Prepared-by quote signature',
    'cot.nota_legal': '<strong>Nota:</strong> Cotización válida por <strong>15 días calendario</strong>. Precios en pesos colombianos (COP).',

    'cat.section.categorias': 'Categories',
    'cat.section.productos': 'Products',
    'cat.intro': 'Your products are grouped by category. Quote will use this catalog when items are loaded.',
    'cat.placeholder.buscar': '🔍 Search by name or reference…',
    'cat.btn.importar': '📥 Import Excel/CSV',
    'cat.btn.cargar_bft_nas': '📦 Load BFT + NAS Catalog (333 products)',
    'cat.empty': 'No products yet.<br>Tap <strong>+</strong> to add the first one.',

    'cc.section.datos_documento': 'Document Details',
    'cc.placeholder.ciudad': 'City',
    'cc.label.fecha_emision': 'Issue date',
    'cc.label.fecha_vencimiento': 'Due date',
    'cc.section.cobrador': 'Collector',
    'cc.cobrador.hint': 'Data from Company Settings.',
    'cc.cobrador.tecnico_dueno': 'Technician / Owner',
    'cc.cobrador.cedula_nit': 'Personal ID / Tax ID',
    'cc.cobrador.empresa': 'Company',
    'cc.cobrador.nit_empresa': 'Company Tax ID',
    'cc.cobrador.telefono': 'Phone',
    'cc.cobrador.direccion': 'Address',
    'cc.section.cliente': 'Client',
    'cc.placeholder.cliente_nombre': 'Client name',
    'cc.label.nit_cc': 'Tax ID / ID No.',
    'cc.placeholder.direccion_cliente': 'Client address',
    'cc.section.servicios': 'Services',
    'cc.table.descripcion': 'Description',
    'cc.table.valor_unitario': 'Unit value',
    'cc.btn.agregar_servicio': '+ Add service',
    'cc.section.totales': 'Totals',
    'cc.retencion.toggle': 'Withholding tax',
    'cc.retencion.pct_label': '% Withholding',
    'cc.total.retencion': 'Withholding',
    'cc.total.grand': 'TOTAL DUE',
    'cc.section.datos_pago': 'Payment Details',
    'cc.label.banco': 'Bank',
    'cc.placeholder.banco': 'E.g. Bancolombia, Nequi…',
    'cc.label.tipo_cuenta': 'Account type',
    'cc.cuenta.ahorros': 'Savings',
    'cc.cuenta.corriente': 'Checking',
    'cc.label.numero_cuenta': 'Account number',
    'cc.label.titular': 'Account holder',
    'cc.placeholder.titular': 'Account holder name',
    'cc.label.nit_titular': 'Holder Tax ID / ID',
    'cc.placeholder.doc_titular': 'Holder document',
    'cc.section.observaciones': 'Notes',
    'cc.placeholder.obs': 'Additional notes for the client...',
    'cc.section.firmas': 'Signatures',
    'cc.firma.cobrador': 'Collector',
    'cc.firma.cliente': 'Client',
    'cc.firma.label': 'Signature',
    'cc.btn.limpiar': '🗑 Clear',
    'cc.btn.whatsapp': '💬 WhatsApp',
    'cc.btn.pdf': '📄 Generate PDF',

    'hist.section.title': 'Service History',
    'hist.intro': 'Records saved when exporting PDF from the Service Form. Maximum 200 services.',
    'hist.empty': 'No services in history yet.<br>Save a form as PDF to record the first service.',
    'hist.btn.export_csv': 'Export History CSV',

    'pdf.btn.guardar_formato': '📄 Save as PDF',
    'pdf.btn.whatsapp_formato': '📲 Send via WhatsApp',
    'pdf.btn.guardar_cot': '📄 Save as PDF',
    'pdf.btn.whatsapp_cot': '📲 Send via WhatsApp',

    'footer.aria': 'Footer',
    'footer.global.rights': 'All rights reserved.',

    'import.title': 'Import preview',
    'import.table.nombre': 'Name',
    'import.table.ref': 'Ref.',
    'import.table.precio': 'Price',
    'import.table.unidad': 'Unit',
    'import.table.marca': 'Brand',
    'import.table.categoria': 'Category',
    'import.table.estado': 'Status',
    'import.btn.cancel': 'Cancel',
    'import.btn.add': 'Add to existing',
    'import.btn.replace': 'Replace catalog',

    'cat_modal.title.new': 'New category',
    'cat_modal.label.nombre': 'Category name',
    'cat_modal.placeholder.nombre': 'E.g. Motors, Parts, Services…',

    'prod_modal.title.new': 'New product',
    'prod_modal.label.nombre': 'Name',
    'prod_modal.placeholder.nombre': 'Product or service name',
    'prod_modal.label.referencia': 'Reference',
    'prod_modal.placeholder.referencia': 'Unique code or reference',
    'prod_modal.label.precio': 'Unit price',
    'prod_modal.label.unidad': 'Unit',
    'prod_modal.unidad.unidad': 'Unit',
    'prod_modal.unidad.metro': 'Meter',
    'prod_modal.unidad.hora': 'Hour',
    'prod_modal.unidad.servicio': 'Service',
    'prod_modal.label.marca_optional': 'Brand (optional)',
    'prod_modal.placeholder.marca': 'Product brand',
    'prod_modal.label.categoria': 'Category',

    'common.btn.cancel': 'Cancel',
    'common.btn.save': 'Save',

    'settings.title': '⚙️ Company Settings',
    'settings.close.aria': 'Close',
    'settings.label.company': 'Company Name',
    'settings.placeholder.company': 'Your company name',
    'settings.label.nit': 'Tax ID',
    'settings.label.address': 'Address',
    'settings.placeholder.address': 'Business address',
    'settings.label.city_optional': 'City (optional)',
    'settings.label.phone': 'Phone',
    'settings.placeholder.phone': 'Contact phone',
    'settings.label.website_optional': 'Website (optional)',
    'settings.placeholder.website': 'https://your-company.com',
    'settings.section.bank': 'Bank Details',
    'settings.label.bank': 'Bank',
    'settings.placeholder.bank': 'Bank name',
    'settings.label.account_type': 'Account type',
    'settings.label.account_number': 'Account number',
    'settings.placeholder.account_number': 'Account number',
    'settings.label.account_holder_optional': 'Account holder (optional)',
    'settings.label.holder_doc_optional': 'Holder Tax ID / ID (optional)',
    'settings.label.technician_optional': 'Technician name (optional)',
    'settings.placeholder.technician': 'Responsible technician name',
    'settings.label.technician_doc_optional': 'Technician ID / Tax ID (optional)',
    'settings.label.technician_code': 'Technician initials or code',
    'settings.placeholder.technician_code': 'PJ',
    'settings.technician_code.hint': 'PYME plan: required. Prefixes your documents (e.g. PJ-001). Other plans: optional.',
    'settings.label.logo': 'Your company logo',
    'settings.logo.hint': 'Upload your logo (PNG, JPG or WebP). If none is uploaded, the official ARPA Suite logo will be used.',
    'settings.section.price_list': 'Price List',
    'settings.price_list.hint': 'Base values for recurring services. Applied in Quote (editable before PDF).',
    'settings.btn.cancel': 'Cancel',
    'settings.btn.save': 'Save'
  };

  var DOC_TYPE_KEYS = {
    formato: 'header.doc_type.formato',
    cotizacion: 'header.doc_type.cotizacion',
    catalogo: 'header.doc_type.catalogo',
    'cuenta-cobro': 'header.doc_type.cuenta_cobro',
    historial: 'header.doc_type.historial'
  };

  function readStoredLang() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') return stored;
    } catch (e) { /* ignore */ }
    return 'es';
  }

  function interpolate(str, vars) {
    if (!str || !vars) return str;
    return String(str).replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] != null ? vars[key] : '{' + key + '}';
    });
  }

  function getLang() {
    return currentLang;
  }

  function t(key, vars) {
    var dict = currentLang === 'en' ? I18N_EN : I18N_ES;
    var text = dict[key];
    if (text == null && currentLang === 'en') text = I18N_EN[key];
    if (text == null) text = key;
    return interpolate(text, vars);
  }

  function storeDefaultKey(key, value) {
    if (key && value != null && I18N_ES[key] == null) {
      I18N_ES[key] = value;
    }
  }

  function supplementSpanishKeys() {
    Object.assign(I18N_ES, {
      'header.doc_type.cotizacion': '💰 Cotización',
      'header.doc_type.catalogo': '📦 Mi Catálogo',
      'header.doc_type.cuenta_cobro': '🧾 Cuenta de Cobro',
      'header.doc_type.historial': '📋 Historial de Servicios',
      'header.validation_badge_ready': 'Arpa Suite · Listo',
      'formato.garantia.header': 'Garantía – {company}',
      'formato.garantia.exclusiones.body': '<strong>Exclusiones de garantía:</strong> La garantía no aplica sobre daños causados por descargas eléctricas, sobretensiones, rayos u otras causas externas. Tampoco aplica cuando el equipo ha sido intervenido por <strong>personal no autorizado por {company}</strong>.',
      'formato.firma.tecnico_named': 'Firma Técnico – {name}',
      'cot.firma.elaborado_named': 'Elaborado por – {name}',
      'cot.nota_legal': '<strong>Nota:</strong> Cotización válida por <strong>15 días calendario</strong>. Precios en pesos colombianos (COP).'
    });
  }

  function captureDefaults() {
    if (defaultsCaptured) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var val = el.textContent;
      if (!el.hasAttribute('data-i18n-default')) {
        el.setAttribute('data-i18n-default', val);
      }
      storeDefaultKey(key, el.getAttribute('data-i18n-default') || val);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      var val = el.getAttribute('placeholder') || '';
      if (!el.hasAttribute('data-i18n-default-placeholder')) {
        el.setAttribute('data-i18n-default-placeholder', val);
      }
      storeDefaultKey(key, el.getAttribute('data-i18n-default-placeholder') || val);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (!key) return;
      var val = el.getAttribute('title') || '';
      if (!el.hasAttribute('data-i18n-default-title')) {
        el.setAttribute('data-i18n-default-title', val);
      }
      storeDefaultKey(key, el.getAttribute('data-i18n-default-title') || val);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria-label');
      if (!key) return;
      var val = el.getAttribute('aria-label') || '';
      if (!el.hasAttribute('data-i18n-default-aria')) {
        el.setAttribute('data-i18n-default-aria', val);
      }
      storeDefaultKey(key, el.getAttribute('data-i18n-default-aria') || val);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (!key) return;
      var val = el.innerHTML;
      if (!el.hasAttribute('data-i18n-default-html')) {
        el.setAttribute('data-i18n-default-html', val);
      }
      storeDefaultKey(key, el.getAttribute('data-i18n-default-html') || val);
    });
    defaultsCaptured = true;
  }

  function resolveText(key, lang) {
    if (lang === 'en') {
      return I18N_EN[key] != null ? I18N_EN[key] : key;
    }
    return I18N_ES[key] != null ? I18N_ES[key] : key;
  }

  function applyAttributeSet(selector, attr, defaultAttr, lang) {
    document.querySelectorAll(selector).forEach(function (el) {
      var key = el.getAttribute(attr);
      if (!key) return;
      if (lang === 'es') {
        var def = el.getAttribute(defaultAttr);
        if (def != null) {
          if (attr === 'data-i18n-placeholder') el.setAttribute('placeholder', def);
          else if (attr === 'data-i18n-title') el.setAttribute('title', def);
          else if (attr === 'data-i18n-aria-label') el.setAttribute('aria-label', def);
          else if (attr === 'data-i18n-html') el.innerHTML = def;
          else el.textContent = def;
        }
      } else {
        var text = resolveText(key, lang);
        if (attr === 'data-i18n-placeholder') el.setAttribute('placeholder', text);
        else if (attr === 'data-i18n-title') el.setAttribute('title', text);
        else if (attr === 'data-i18n-aria-label') el.setAttribute('aria-label', text);
        else if (attr === 'data-i18n-html') el.innerHTML = text;
        else el.textContent = text;
      }
    });
  }

  function apply(lang) {
    lang = lang === 'en' ? 'en' : 'es';
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* ignore */ }
    document.documentElement.lang = lang;
    applyAttributeSet('[data-i18n]', 'data-i18n', 'data-i18n-default', lang);
    applyAttributeSet('[data-i18n-placeholder]', 'data-i18n-placeholder', 'data-i18n-default-placeholder', lang);
    applyAttributeSet('[data-i18n-title]', 'data-i18n-title', 'data-i18n-default-title', lang);
    applyAttributeSet('[data-i18n-aria-label]', 'data-i18n-aria-label', 'data-i18n-default-aria', lang);
    applyAttributeSet('[data-i18n-html]', 'data-i18n-html', 'data-i18n-default-html', lang);
    updateLangButtons(lang);
    refreshDocTypeLabel();
    refreshBrandTexts();
  }

  function setLang(lang) {
    apply(lang === 'en' ? 'en' : 'es');
  }

  function updateLangButtons(lang) {
    var btnEs = document.getElementById('lang-btn-es');
    var btnEn = document.getElementById('lang-btn-en');
    if (btnEs) btnEs.classList.toggle('active', lang === 'es');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  }

  function bindLangSwitch() {
    var btnEs = document.getElementById('lang-btn-es');
    var btnEn = document.getElementById('lang-btn-en');
    if (btnEs) {
      btnEs.addEventListener('click', function () { setLang('es'); });
    }
    if (btnEn) {
      btnEn.addEventListener('click', function () { setLang('en'); });
    }
  }

  function getCompanyName() {
    var el = document.getElementById('brand-verification-company');
    if (el && el.textContent.trim()) return el.textContent.trim();
    if (global.ArpaBrand && typeof global.ArpaBrand.getSettings === 'function') {
      var s = global.ArpaBrand.getSettings();
      if (s && s.companyName) return s.companyName.trim();
    }
    return 'Su Empresa';
  }

  function getTechnicianName() {
    if (global.ArpaBrand && typeof global.ArpaBrand.getSettings === 'function') {
      var s = global.ArpaBrand.getSettings();
      if (s && s.technicianName && s.technicianName.trim()) return s.technicianName.trim();
    }
    var tech = document.getElementById('campo-tecnico-responsable');
    if (tech && tech.value.trim()) return tech.value.trim();
    var cotNom = document.getElementById('cot-elaborado-nombre');
    if (cotNom && cotNom.value.trim()) return cotNom.value.trim();
    return '';
  }

  function captureBrandDefaultsIfNeeded() {
    if (brandDefaultsCaptured) return;
    var header = document.getElementById('brand-warranty-header');
    if (header) brandDefaults['brand-warranty-header'] = header.innerHTML;
    var exclusion = document.getElementById('brand-warranty-exclusion');
    if (exclusion) brandDefaults['brand-warranty-exclusion'] = exclusion.innerHTML;
    var companyEl = document.getElementById('brand-verification-company');
    if (companyEl && companyEl.parentElement) {
      brandDefaults['brand-verification-p'] = companyEl.parentElement.innerHTML;
    }
    var nota = document.getElementById('cot-nota-legal');
    if (nota) brandDefaults['cot-nota-legal'] = nota.innerHTML;
    var techLabel = document.getElementById('brand-technician-signature-label');
    if (techLabel) brandDefaults['brand-technician-signature-label'] = techLabel.textContent;
    var cotLabel = document.getElementById('cot-elaborado-label');
    if (cotLabel) brandDefaults['cot-elaborado-label'] = cotLabel.textContent;
    var validation = document.getElementById('validation-text');
    if (validation) brandDefaults['validation-text'] = validation.textContent;
    brandDefaultsCaptured = true;
  }

  var pdfBackup = null;

  function pushBackup(items, el, kind, value) {
    if (!el) return;
    items.push({ el: el, kind: kind, value: value });
  }

  function applySpanishInRoot(root, items) {
    if (!root) return;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var def = el.getAttribute('data-i18n-default');
      if (def == null) return;
      pushBackup(items, el, 'textContent', el.textContent);
      el.textContent = def;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var def = el.getAttribute('data-i18n-default-placeholder');
      if (def == null) return;
      pushBackup(items, el, 'placeholder', el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', def);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var def = el.getAttribute('data-i18n-default-title');
      if (def == null) return;
      pushBackup(items, el, 'title', el.getAttribute('title') || '');
      el.setAttribute('title', def);
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var def = el.getAttribute('data-i18n-default-aria');
      if (def == null) return;
      pushBackup(items, el, 'aria-label', el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', def);
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var def = el.getAttribute('data-i18n-default-html');
      if (def == null) return;
      pushBackup(items, el, 'innerHTML', el.innerHTML);
      el.innerHTML = def;
    });
  }

  function applyPdfBrandSpanish(items) {
    var company = getCompanyName();
    var techName = getTechnicianName();

    var warrantyHeader = document.getElementById('brand-warranty-header');
    if (warrantyHeader) {
      pushBackup(items, warrantyHeader, 'innerHTML', warrantyHeader.innerHTML);
      warrantyHeader.innerHTML = '<span class="shield">🛡️</span> ' + interpolate(resolveText('formato.garantia.header', 'es'), { company: company });
    }
    var warrantyExclusion = document.getElementById('brand-warranty-exclusion');
    if (warrantyExclusion) {
      pushBackup(items, warrantyExclusion, 'innerHTML', warrantyExclusion.innerHTML);
      warrantyExclusion.innerHTML = interpolate(resolveText('formato.garantia.exclusiones.body', 'es'), { company: company });
    }
    var verificationCompany = document.getElementById('brand-verification-company');
    if (verificationCompany && verificationCompany.parentElement) {
      pushBackup(items, verificationCompany.parentElement, 'innerHTML', verificationCompany.parentElement.innerHTML);
      verificationCompany.parentElement.innerHTML = interpolate(resolveText('formato.verification', 'es'), { company: company });
    }
    var cotNota = document.getElementById('cot-nota-legal');
    if (cotNota && global.ArpaBrand && typeof global.ArpaBrand.getCotNotaLegalHtml === 'function') {
      pushBackup(items, cotNota, 'innerHTML', cotNota.innerHTML);
      cotNota.innerHTML = global.ArpaBrand.getCotNotaLegalHtml();
    }
    var techSigLabel = document.getElementById('brand-technician-signature-label');
    if (techSigLabel) {
      pushBackup(items, techSigLabel, 'textContent', techSigLabel.textContent);
      techSigLabel.textContent = techName
        ? interpolate(resolveText('formato.firma.tecnico_named', 'es'), { name: techName })
        : resolveText('formato.firma.tecnico', 'es');
    }
    var cotElabLabel = document.getElementById('cot-elaborado-label');
    if (cotElabLabel) {
      pushBackup(items, cotElabLabel, 'textContent', cotElabLabel.textContent);
      cotElabLabel.textContent = techName
        ? interpolate(resolveText('cot.firma.elaborado_named', 'es'), { name: techName })
        : resolveText('cot.firma.elaborado', 'es');
    }
  }

  function preparePdfSpanish(viewId) {
    captureDefaults();
    captureBrandDefaultsIfNeeded();
    pdfBackup = { items: [] };
    var viewRoot = document.getElementById(viewId);
    var page = document.querySelector('.page');
    var header = page ? page.querySelector('.header') : null;
    var qrPrint = document.getElementById('formato-video-qr-print');
    [viewRoot, header, qrPrint].forEach(function (root) {
      applySpanishInRoot(root, pdfBackup.items);
    });
    applyPdfBrandSpanish(pdfBackup.items);
    var viewKey = String(viewId || '').replace('view-', '');
    var docType = document.getElementById('doc-type-label');
    if (docType) {
      pushBackup(pdfBackup.items, docType, 'textContent', docType.textContent);
      docType.textContent = resolveText(DOC_TYPE_KEYS[viewKey] || DOC_TYPE_KEYS.formato, 'es');
    }
  }

  function restorePdfSpanish() {
    if (!pdfBackup) return;
    pdfBackup.items.forEach(function (item) {
      if (!item.el) return;
      if (item.kind === 'placeholder') item.el.setAttribute('placeholder', item.value);
      else if (item.kind === 'title') item.el.setAttribute('title', item.value);
      else if (item.kind === 'aria-label') item.el.setAttribute('aria-label', item.value);
      else item.el[item.kind] = item.value;
    });
    pdfBackup = null;
    refreshBrandTexts();
  }

  function applyCotNotaLegal() {
    var cotNota = document.getElementById('cot-nota-legal');
    if (cotNota && global.ArpaBrand && typeof global.ArpaBrand.getCotNotaLegalHtml === 'function') {
      cotNota.innerHTML = global.ArpaBrand.getCotNotaLegalHtml();
    }
  }

  function refreshBrandTexts() {
    captureBrandDefaultsIfNeeded();
    var lang = currentLang;
    var company = getCompanyName();
    var techName = getTechnicianName();

    if (lang === 'es') {
      var header = document.getElementById('brand-warranty-header');
      if (header && brandDefaults['brand-warranty-header'] != null) {
        header.innerHTML = brandDefaults['brand-warranty-header'];
      }
      var exclusion = document.getElementById('brand-warranty-exclusion');
      if (exclusion && brandDefaults['brand-warranty-exclusion'] != null) {
        exclusion.innerHTML = brandDefaults['brand-warranty-exclusion'];
      }
      var companyEl = document.getElementById('brand-verification-company');
      if (companyEl && companyEl.parentElement && brandDefaults['brand-verification-p'] != null) {
        companyEl.parentElement.innerHTML = brandDefaults['brand-verification-p'];
      }
      var nota = document.getElementById('cot-nota-legal');
      if (nota && brandDefaults['cot-nota-legal'] != null) {
        nota.innerHTML = brandDefaults['cot-nota-legal'];
      }
      var techLabel = document.getElementById('brand-technician-signature-label');
      if (techLabel && brandDefaults['brand-technician-signature-label'] != null) {
        techLabel.textContent = brandDefaults['brand-technician-signature-label'];
      }
      var cotLabel = document.getElementById('cot-elaborado-label');
      if (cotLabel && brandDefaults['cot-elaborado-label'] != null) {
        cotLabel.textContent = brandDefaults['cot-elaborado-label'];
      }
      applyCotNotaLegal();
      return;
    }

    var warrantyHeader = document.getElementById('brand-warranty-header');
    if (warrantyHeader) {
      warrantyHeader.innerHTML = '<span class="shield">🛡️</span> ' + t('formato.garantia.header', { company: company });
    }
    var warrantyExclusion = document.getElementById('brand-warranty-exclusion');
    if (warrantyExclusion) {
      warrantyExclusion.innerHTML = t('formato.garantia.exclusiones.body', { company: company });
    }
    var verificationCompany = document.getElementById('brand-verification-company');
    if (verificationCompany && verificationCompany.parentElement) {
      verificationCompany.parentElement.innerHTML = t('formato.verification', { company: company });
    }
    var techSigLabel = document.getElementById('brand-technician-signature-label');
    if (techSigLabel) {
      techSigLabel.textContent = techName
        ? t('formato.firma.tecnico_named', { name: techName })
        : t('formato.firma.tecnico');
    }
    var cotElabLabel = document.getElementById('cot-elaborado-label');
    if (cotElabLabel) {
      cotElabLabel.textContent = techName
        ? t('cot.firma.elaborado_named', { name: techName })
        : t('cot.firma.elaborado');
    }
    applyCotNotaLegal();
  }

  function refreshDocTypeLabel() {
    var el = document.getElementById('doc-type-label');
    if (!el) return;
    var view = 'formato';
    if (global.ArpaViews && typeof global.ArpaViews.getCurrentView === 'function') {
      view = global.ArpaViews.getCurrentView() || 'formato';
    }
    var key = DOC_TYPE_KEYS[view] || DOC_TYPE_KEYS.formato;
    el.textContent = t(key);
  }

  function wrapFunction(name, afterFn) {
    function attempt() {
      if (typeof global[name] !== 'function') return false;
      if (global[name].__arpaI18nWrapped) return true;
      var original = global[name];
      global[name] = function () {
        var result = original.apply(this, arguments);
        if (typeof afterFn === 'function') afterFn();
        return result;
      };
      global[name].__arpaI18nWrapped = true;
      return true;
    }
    if (attempt()) return;
    var retries = 0;
    (function retry() {
      if (attempt() || retries > 40) return;
      retries += 1;
      setTimeout(retry, 50);
    })();
  }

  function wrapExternalFunctions() {
    wrapFunction('applyUserSettingsToUI', refreshBrandTexts);
  }

  function patchShowView() {
    if (!global.ArpaViews || typeof global.ArpaViews.showView !== 'function') return;
    if (global.ArpaViews.showView.__arpaI18nWrapped) return;
    var original = global.ArpaViews.showView;
    global.ArpaViews.showView = function (view, btn) {
      original.call(this, view, btn);
      refreshDocTypeLabel();
    };
    global.ArpaViews.showView.__arpaI18nWrapped = true;

    if (typeof global.ArpaViews.openHistorialView === 'function' && !global.ArpaViews.openHistorialView.__arpaI18nWrapped) {
      var origHist = global.ArpaViews.openHistorialView;
      global.ArpaViews.openHistorialView = function (btn) {
        origHist.call(this, btn);
        refreshDocTypeLabel();
      };
      global.ArpaViews.openHistorialView.__arpaI18nWrapped = true;
    }
  }

  function init() {
    captureDefaults();
    supplementSpanishKeys();
    currentLang = readStoredLang();
    bindLangSwitch();
    apply(currentLang);
    setTimeout(function () {
      wrapExternalFunctions();
      refreshBrandTexts();
      refreshDocTypeLabel();
    }, 0);
    global.addEventListener('load', function () {
      patchShowView();
      refreshBrandTexts();
      refreshDocTypeLabel();
    });
  }

  global.ArpaI18n = {
    getLang: getLang,
    setLang: setLang,
    apply: apply,
    t: t,
    init: init,
    refreshDocTypeLabel: refreshDocTypeLabel,
    refreshBrandTexts: refreshBrandTexts,
    preparePdfSpanish: preparePdfSpanish,
    restorePdfSpanish: restorePdfSpanish,
    KEY_COUNT: Object.keys(I18N_EN).length
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
