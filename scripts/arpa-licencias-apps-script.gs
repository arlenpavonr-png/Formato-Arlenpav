/**
 * ARPA Suite — Licencias (doGet) + Gumroad Ping (doPost) + email automático
 *
 * DESPLIEGUE
 * 1. Abre el Sheet → Extensiones → Apps Script → pega este archivo como Code.gs
 * 2. Ajusta CONFIG.SHEET_NAME si tu pestaña no se llama "Hoja 1"
 * 3. Agrega columna DEVICE_ID en fila 1 (o se crea sola al primer trial auto)
 * 4. Project Settings → Script Properties:
 *      GUMROAD_SELLER_ID     = (seller_id del primer Ping real)
 *      GUMROAD_PRODUCT_FREE  = product_id del plan gratis
 *      GUMROAD_PRODUCT_PRO   = product_id del plan Pro
 *      GUMROAD_PRODUCT_PYME  = product_id del plan PYME
 * 5. Deploy → Web app → Execute as: Me → Anyone → copia URL /exec
 * 6. Gumroad → Settings → Advanced → Ping → pega la URL
 *
 * COLUMNAS Sheet (fila 1): CODIGO | PLAN | CLIENTE | EMAIL | VENCIMIENTO | ACTIVO | DEVICE_ID
 *
 * GET endpoints (JSONP):
 *   ?codigo=ARPA-FREE-0001&callback=fn          → validar licencia
 *   ?accion=provision_trial&device_id=UUID&callback=fn → trial auto 7 días
 */

const CONFIG = {
  SHEET_ID: '154LeJlcAPa3dlWxXHC2WA2_xFNL4oQ45I8630Kzcd3E',
  SHEET_NAME: 'Hoja 1',
  APP_URL: 'https://arlenpavonr-png.github.io/Formato-Arlenpav/',
  MANUAL_URL: 'https://arlenpavonr-png.github.io/Formato-Arlenpav/manual.html',
  SUPPORT_WHATSAPP: '573005683914',
  SUPPORT_WHATSAPP_DISPLAY: '+57 300-568-3914',
  EMAIL_FROM_NAME: 'ARPA Technology Global',
  PLANS: {
    FREE: { prefix: 'ARPA-FREE-', planLabel: 'Free', days: 7 },
    PRO:  { prefix: 'ARPA-PRO-',  planLabel: 'Pro',  days: 30 },
    PYME: { prefix: 'ARPA-PYME-', planLabel: 'PYME', days: 30 },
  },
};

// ─── GET: validación + trial automático (PWA JSONP) ─────────────────────────

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const callback = params.callback;
  const accion = String(params.accion || '').trim().toLowerCase();

  if (accion === 'provision_trial') {
    const deviceId = String(params.device_id || '').trim();
    return respondJsonp_(provisionTrial_(deviceId), callback);
  }

  const codigo = String(params.codigo || '').trim().toUpperCase();
  return respondJsonp_(validateLicense_(codigo), callback);
}

function validateLicense_(codigo) {
  if (!codigo) {
    return { valido: false, mensaje: 'Código requerido.' };
  }

  const sheet = getLicenseSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = normalizeHeaders_(data[0]);
  const cols = getColumnMap_(headers);

  if (cols.codigo < 0) {
    return { valido: false, mensaje: 'Error de configuración del Sheet.' };
  }

  for (let i = 1; i < data.length; i++) {
    const rowCodigo = String(data[i][cols.codigo] || '').trim().toUpperCase();
    if (rowCodigo !== codigo) continue;
    return buildValidationResult_(data[i], cols, rowCodigo);
  }

  return { valido: false, mensaje: 'Código de licencia inválido.' };
}

function provisionTrial_(deviceId) {
  deviceId = String(deviceId || '').trim();
  if (!deviceId || deviceId.length < 12) {
    return { valido: false, mensaje: 'Dispositivo inválido.' };
  }

  const sheet = getLicenseSheet_();
  ensureDeviceIdColumn_(sheet);
  const data = sheet.getDataRange().getValues();
  const headers = normalizeHeaders_(data[0]);
  const cols = getColumnMap_(headers);

  for (let i = 1; i < data.length; i++) {
    if (cols.deviceId < 0) break;
    const rowDevice = String(data[i][cols.deviceId] || '').trim();
    if (rowDevice !== deviceId) continue;

    const codigo = String(data[i][cols.codigo] || '').trim().toUpperCase();
    const result = buildValidationResult_(data[i], cols, codigo);
    result.trial = true;
    result.nuevo = false;
    return result;
  }

  const plan = CONFIG.PLANS.FREE;
  const codigo = generateCode_(plan.prefix);
  const vencimiento = addDays_(new Date(), plan.days);

  appendLicenseRow_({
    CODIGO: codigo,
    PLAN: plan.planLabel,
    CLIENTE: 'Trial automático',
    EMAIL: '',
    VENCIMIENTO: vencimiento,
    ACTIVO: 'SI',
    DEVICE_ID: deviceId,
  });

  return {
    valido: true,
    mensaje: 'Trial activado.',
    codigo: codigo,
    plan: plan.planLabel,
    vencimiento: formatDateIso_(vencimiento),
    trial: true,
    nuevo: true,
  };
}

function buildValidationResult_(row, cols, codigo) {
  const activo = cols.activo >= 0
    ? String(row[cols.activo] || '').trim().toUpperCase()
    : 'SI';

  if (activo !== 'SI' && activo !== 'SÍ') {
    return { valido: false, mensaje: 'Licencia inactiva.', codigo: codigo };
  }

  let vencStr = '';
  if (cols.venc >= 0) {
    const venc = row[cols.venc];
    if (venc instanceof Date && !isNaN(venc.getTime())) {
      vencStr = formatDateIso_(venc);
      if (stripTime_(venc) < stripTime_(new Date())) {
        const plan = cols.plan >= 0 ? String(row[cols.plan] || '') : '';
        const isTrial = String(codigo || '').indexOf('ARPA-FREE-') === 0;
        return {
          valido: false,
          mensaje: 'Licencia vencida.',
          codigo: codigo,
          plan: plan,
          vencimiento: vencStr,
          trial_usado: isTrial,
          vencida: true,
        };
      }
    }
  }

  const plan = cols.plan >= 0 ? String(row[cols.plan] || '') : '';
  return {
    valido: true,
    mensaje: 'Licencia válida.',
    codigo: codigo,
    plan: plan,
    vencimiento: vencStr,
  };
}

function getColumnMap_(headers) {
  return {
    codigo: headers.indexOf('CODIGO'),
    plan: headers.indexOf('PLAN'),
    activo: headers.indexOf('ACTIVO'),
    venc: headers.indexOf('VENCIMIENTO'),
    deviceId: headers.indexOf('DEVICE_ID'),
  };
}

function ensureDeviceIdColumn_(sheet) {
  const headers = normalizeHeaders_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
  if (headers.indexOf('DEVICE_ID') >= 0) return;
  sheet.getRange(1, sheet.getLastColumn() + 1).setValue('DEVICE_ID');
}

function appendLicenseRow_(valuesByHeader) {
  const sheet = getLicenseSheet_();
  ensureDeviceIdColumn_(sheet);
  const data = sheet.getDataRange().getValues();
  const headers = normalizeHeaders_(data[0]);
  const row = headers.map(function (h) {
    return valuesByHeader[h] != null ? valuesByHeader[h] : '';
  });
  sheet.appendRow(row);
}

// ─── POST: Gumroad Ping ──────────────────────────────────────────────────────

function doPost(e) {
  try {
    const payload = parseGumroadPayload_(e);
    if (!payload) return textResponse_('Bad payload', 400);

    if (payload.resource_name && payload.resource_name !== 'sale') {
      return textResponse_('Ignored: ' + payload.resource_name, 200);
    }
    if (String(payload.refunded || '').toLowerCase() === 'true') {
      return textResponse_('Ignored: refunded', 200);
    }

    const props = PropertiesService.getScriptProperties();
    const expectedSeller = props.getProperty('GUMROAD_SELLER_ID');
    if (expectedSeller && payload.seller_id !== expectedSeller) {
      return textResponse_('Invalid seller', 403);
    }

    const plan = resolvePlanFromPayload_(payload);
    if (!plan) {
      return textResponse_('Unknown product', 200);
    }

    const saleId = String(payload.sale_id || payload.order_number || '').trim();
    if (saleId && wasSaleProcessed_(saleId)) {
      return textResponse_('Already processed', 200);
    }

    const email = String(payload.email || '').trim().toLowerCase();
    const cliente = String(
      payload.full_name || payload.purchaser_name || 'Cliente ARPA Suite'
    ).trim();

    if (!email) return textResponse_('Missing email', 400);

    const codigo = generateCode_(plan.prefix);
    const vencimiento = addDays_(new Date(), plan.days);

    appendLicenseRow_({
      CODIGO: codigo,
      PLAN: plan.planLabel,
      CLIENTE: cliente,
      EMAIL: email,
      VENCIMIENTO: vencimiento,
      ACTIVO: 'SI',
    });

    sendActivationEmail_(email, cliente, plan, codigo, vencimiento);

    if (saleId) markSaleProcessed_(saleId);

    Logger.log('Licencia creada: ' + codigo + ' (' + plan.planLabel + ') → ' + email);
    return textResponse_('OK', 200);
  } catch (err) {
    Logger.log('doPost error: ' + err.stack || err);
    return textResponse_('Error: ' + err.message, 500);
  }
}

// ─── Email HTML ──────────────────────────────────────────────────────────────

function sendActivationEmail_(to, cliente, plan, codigo, vencimiento) {
  const nombre = (cliente || 'Cliente').split(' ')[0];
  const vencStr = formatDateEs_(vencimiento);
  const waUrl = 'https://wa.me/' + CONFIG.SUPPORT_WHATSAPP;
  const subject = 'Tu licencia ARPA Suite — ' + codigo;

  const html = buildActivationEmailHtml_({
    nombre: nombre,
    planLabel: plan.planLabel,
    codigo: codigo,
    vencStr: vencStr,
    appUrl: CONFIG.APP_URL,
    manualUrl: CONFIG.MANUAL_URL,
    waUrl: waUrl,
    waDisplay: CONFIG.SUPPORT_WHATSAPP_DISPLAY,
  });

  MailApp.sendEmail({
    to: to,
    subject: subject,
    htmlBody: html,
    name: CONFIG.EMAIL_FROM_NAME,
  });
}

function buildActivationEmailHtml_(d) {
  return [
    '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '</head><body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">',

    // Header
    '<tr><td style="background:#1a2a4a;padding:28px 32px;text-align:center;">',
    '<p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;font-weight:700;">ARPA Technology Global</p>',
    '<h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;">Bienvenido a ARPA Suite</h1>',
    '</td></tr>',

    // Body
    '<tr><td style="padding:32px;">',
    '<p style="margin:0 0 16px;font-size:16px;color:#1e2d4a;line-height:1.6;">Hola <strong>' + escapeHtml_(d.nombre) + '</strong>,</p>',
    '<p style="margin:0 0 24px;font-size:15px;color:#5a6a8a;line-height:1.65;">',
    'Tu plan <strong style="color:#1a2a4a;">' + escapeHtml_(d.planLabel) + '</strong> está listo. ',
    'Usa el código de abajo para activar la plataforma. Válido hasta el <strong>' + escapeHtml_(d.vencStr) + '</strong>.',
    '</p>',

    // Code box
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">',
    '<tr><td style="background:#1a2a4a;border-radius:10px;padding:20px;text-align:center;border:2px solid #c9a84c;">',
    '<p style="margin:0 0 6px;font-size:11px;color:#c9a84c;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Tu código de licencia</p>',
    '<p style="margin:0;font-size:28px;color:#ffffff;font-weight:700;letter-spacing:1px;font-family:Consolas,Monaco,monospace;">',
    escapeHtml_(d.codigo),
    '</p></td></tr></table>',

    // Steps
    '<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1a2a4a;text-transform:uppercase;letter-spacing:0.5px;">Activación en 3 pasos</p>',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">',
    stepRow_(1, 'Abre ARPA Suite en tu navegador o celular'),
    stepRow_(2, 'Ingresa tu código de licencia en la pantalla de activación'),
    stepRow_(3, 'Pulsa <strong>Activar</strong> y comienza a generar documentos profesionales'),
    '</table>',

    // CTA button
    '<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 16px;"><tr><td>',
    '<a href="' + escapeHtml_(d.appUrl) + '" target="_blank" style="display:inline-block;background:#c9a84c;color:#1a2a4a;',
    'font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">',
    'Abrir ARPA Suite →</a></td></tr></table>',

    // Manual
    '<p style="margin:0 0 28px;font-size:14px;color:#5a6a8a;line-height:1.6;text-align:center;">',
    '¿Primera vez? Consulta el ',
    '<a href="' + escapeHtml_(d.manualUrl) + '" target="_blank" style="color:#1a2a4a;font-weight:700;text-decoration:underline;">',
    'manual de usuario</a> con guías paso a paso.</p>',

    // Support
    '<p style="margin:0;font-size:14px;color:#5a6a8a;line-height:1.6;text-align:center;">',
    '¿Necesitas ayuda? Escríbenos por WhatsApp:<br>',
    '<a href="' + escapeHtml_(d.waUrl) + '" style="color:#c9a84c;font-weight:700;text-decoration:none;">',
    escapeHtml_(d.waDisplay) + '</a></p>',

    '</td></tr>',

    // Footer
    '<tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">',
    '<p style="margin:0;font-size:12px;color:#8896b3;">© ' + new Date().getFullYear() + ' ARPA Technology Global · Todos los derechos reservados</p>',
    '</td></tr>',

    '</table></td></tr></table></body></html>',
  ].join('');
}

function stepRow_(num, text) {
  return [
    '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">',
    '<table role="presentation" cellspacing="0" cellpadding="0"><tr>',
    '<td style="width:36px;vertical-align:top;">',
    '<span style="display:inline-block;width:28px;height:28px;background:#c9a84c;color:#1a2a4a;',
    'border-radius:50%;text-align:center;line-height:28px;font-size:14px;font-weight:700;">',
    String(num), '</span></td>',
    '<td style="font-size:14px;color:#1e2d4a;line-height:1.5;vertical-align:middle;">', text, '</td>',
    '</tr></table></td></tr>',
  ].join('');
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Planes Gumroad ──────────────────────────────────────────────────────────

function resolvePlanFromPayload_(payload) {
  const props = PropertiesService.getScriptProperties();
  const productId = String(payload.product_id || '');
  const priceCents = parseInt(String(payload.price || '0'), 10);

  const freeId = props.getProperty('GUMROAD_PRODUCT_FREE') || '';
  const proId = props.getProperty('GUMROAD_PRODUCT_PRO') || '';
  const pymeId = props.getProperty('GUMROAD_PRODUCT_PYME') || '';

  if (freeId && productId === freeId) return CONFIG.PLANS.FREE;
  if (proId && productId === proId) return CONFIG.PLANS.PRO;
  if (pymeId && productId === pymeId) return CONFIG.PLANS.PYME;

  if (priceCents === 0 && !proId && !pymeId) return CONFIG.PLANS.FREE;
  if (priceCents === 0 && productId === freeId) return CONFIG.PLANS.FREE;

  return null;
}

// ─── Helpers Sheet / códigos ─────────────────────────────────────────────────

function getLicenseSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Pestaña no encontrada: ' + CONFIG.SHEET_NAME);
  return sheet;
}

function generateCode_(prefix) {
  const values = getLicenseSheet_().getDataRange().getValues();
  let maxNum = 0;
  const upperPrefix = prefix.toUpperCase();

  for (let i = 1; i < values.length; i++) {
    const cod = String(values[i][0] || '').trim().toUpperCase();
    if (!cod.startsWith(upperPrefix)) continue;
    const num = parseInt(cod.slice(upperPrefix.length), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  return prefix + String(maxNum + 1).padStart(4, '0');
}

function normalizeHeaders_(row) {
  return row.map(function (h) { return String(h).trim().toUpperCase(); });
}

function parseGumroadPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  const params = {};
  e.postData.contents.split('&').forEach(function (pair) {
    if (!pair) return;
    const eq = pair.indexOf('=');
    const key = decodeURIComponent((eq >= 0 ? pair.slice(0, eq) : pair).replace(/\+/g, ' '));
    const val = decodeURIComponent((eq >= 0 ? pair.slice(eq + 1) : '').replace(/\+/g, ' '));
    params[key] = val;
  });
  return params;
}

function wasSaleProcessed_(saleId) {
  return PropertiesService.getScriptProperties().getProperty('sale_' + saleId) === '1';
}

function markSaleProcessed_(saleId) {
  PropertiesService.getScriptProperties().setProperty('sale_' + saleId, '1');
}

function addDays_(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateEs_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'America/Bogota', 'dd/MM/yyyy');
}

function formatDateIso_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd');
}

function respondJsonp_(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function textResponse_(message) {
  return ContentService.createTextOutput(message);
}

// ─── Tests (Editor → Run) ────────────────────────────────────────────────────

function testProvisionTrial() {
  const deviceId = 'TEST-DEVICE-' + Date.now();
  const result = provisionTrial_(deviceId);
  Logger.log(JSON.stringify(result));
}

function testValidateCode() {
  const result = validateLicense_('ARPA-PRO-001');
  Logger.log(JSON.stringify(result));
}

function testGumroadFree() {
  runTestPing_({
    product_key: 'FREE',
    price: '0',
    email: 'test-free@ejemplo.com',
    full_name: 'Usuario Free Test',
  });
}

function testGumroadPro() {
  runTestPing_({
    product_key: 'PRO',
    price: '350000',
    email: 'test-pro@ejemplo.com',
    full_name: 'Usuario Pro Test',
  });
}

function testGumroadPyme() {
  runTestPing_({
    product_key: 'PYME',
    price: '800000',
    email: 'test-pyme@ejemplo.com',
    full_name: 'Usuario PYME Test',
  });
}

function runTestPing_(opts) {
  const props = PropertiesService.getScriptProperties();
  const map = {
    FREE: props.getProperty('GUMROAD_PRODUCT_FREE') || 'TEST_FREE',
    PRO: props.getProperty('GUMROAD_PRODUCT_PRO') || 'TEST_PRO',
    PYME: props.getProperty('GUMROAD_PRODUCT_PYME') || 'TEST_PYME',
  };

  const body = [
    'seller_id=' + (props.getProperty('GUMROAD_SELLER_ID') || 'TEST_SELLER'),
    'product_id=' + map[opts.product_key],
    'product_name=ARPA Suite ' + opts.product_key,
    'email=' + encodeURIComponent(opts.email),
    'full_name=' + encodeURIComponent(opts.full_name),
    'price=' + opts.price,
    'currency=cop',
    'quantity=1',
    'sale_id=TEST_' + opts.product_key + '_' + Date.now(),
    'resource_name=sale',
    'refunded=false',
  ].join('&');

  Logger.log(doPost({ postData: { contents: body } }).getContent());
}
