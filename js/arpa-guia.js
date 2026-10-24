/**
 * Guía de primeros pasos (4 pasos) para el técnico nuevo: llegar solo a mandar su primera
 * cotización por WhatsApp. Burbuja con flecha sobre cada elemento, contador "1/4",
 * "Saltar guía", avance guardado en localStorage y barra "Primeros pasos 2/4" para retomarla.
 *
 * - Solo arranca para quien termina la bienvenida (evento arpa:onboarding-done).
 * - Después del primer PDF: pantalla de logro con el aviso para guardar ARPA en el inicio
 *   y luego el formulario de datos (ArpaTrialCapture llama a deferCapture).
 * - Segundo PDF sin logo: consejo "Pon tu logo…".
 * - Navegador interno de WhatsApp/Instagram/Facebook: franja no bloqueante para abrir en
 *   Chrome/Safari con "Copiar link".
 * No pide datos y no llama a ningún servidor.
 */
(function (global) {
  'use strict';

  var STATE_KEY = 'arpa_guia';
  var NEW_TECH_KEY = 'arpa_tecnico_nuevo';
  var INAPP_DISMISS_KEY = 'arpa_guia_inapp_cerrada';
  var TOTAL = 4;

  var TEXTS = {
    es: {
      contador: '{n}/4',
      saltar: 'Saltar guía',
      siguiente: 'Siguiente',
      paso1: 'Escribe el nombre de tu cliente',
      paso2: 'Busca lo que vas a cobrar. Ej.: {ejemplos}',
      paso2_cobros: 'También puedes tocar un cobro sugerido de arriba.',
      paso3: 'Este es el total para tu cliente. Puedes cambiar los precios tocándolos',
      paso4: 'Toca aquí y mándasela a tu cliente',
      barra: 'Primeros pasos {n}/4',
      barra_continuar: 'Continuar',
      logro_titulo: '¡Listo! Tu primera cotización salió 🎉',
      logro_sub: 'Así de rápido le mandas cotizaciones a tus clientes.',
      instalar_titulo: 'Guarda ARPA en tu pantalla de inicio',
      instalar_btn: 'Instalar ARPA',
      instalar_android: 'En Chrome toca el menú ⋮ (arriba a la derecha) y luego «Agregar a pantalla principal».',
      instalar_iphone: 'Toca Compartir (el cuadrado con la flecha hacia arriba) y luego «Agregar a inicio».',
      instalar_ios_otro: 'Para guardarla en tu inicio, abre este link en Safari.',
      instalar_inapp: 'Aquí dentro no se puede guardar. Abre el link en Chrome o Safari para guardarla en tu inicio.',
      entendido: 'Entendido',
      logo_tip: 'Pon tu logo para que tus PDF se vean profesionales',
      logo_btn: 'Poner logo',
      cerrar: 'Cerrar',
      inapp: 'Para mandar tus PDF por WhatsApp y guardar la app, ábrela en {navegador}.',
      copiar: 'Copiar link',
      copiado: '¡Link copiado! Pégalo en {navegador}.',
      abrir_chrome: 'Abrir en Chrome'
    },
    en: {
      contador: '{n}/4',
      saltar: 'Skip guide',
      siguiente: 'Next',
      paso1: "Type your client's name",
      paso2: "Search what you'll charge for. E.g.: {ejemplos}",
      paso2_cobros: 'You can also tap a suggested charge above.',
      paso3: 'This is the total for your client. Tap the prices to change them',
      paso4: 'Tap here and send it to your client',
      barra: 'First steps {n}/4',
      barra_continuar: 'Continue',
      logro_titulo: 'Done! Your first quote is out 🎉',
      logro_sub: "That's how fast you send quotes to your clients.",
      instalar_titulo: 'Save ARPA to your home screen',
      instalar_btn: 'Install ARPA',
      instalar_android: 'In Chrome tap the ⋮ menu (top right) and then "Add to Home screen".',
      instalar_iphone: 'Tap Share (the square with the up arrow) and then "Add to Home Screen".',
      instalar_ios_otro: 'To save it to your home screen, open this link in Safari.',
      instalar_inapp: "It can't be saved from here. Open the link in Chrome or Safari to save it to your home screen.",
      entendido: 'Got it',
      logo_tip: 'Add your logo so your PDFs look professional',
      logo_btn: 'Add logo',
      cerrar: 'Close',
      inapp: 'To send your PDFs on WhatsApp and save the app, open it in {navegador}.',
      copiar: 'Copy link',
      copiado: 'Link copied! Paste it in {navegador}.',
      abrir_chrome: 'Open in Chrome'
    }
  };

  // Ejemplos de respaldo si el catálogo del oficio no está cargado.
  var EJEMPLOS = {
    automatismos: ['motor', 'control'],
    electricidad: ['cable', 'breaker'],
    gas: ['regulador', 'manguera'],
    refrigeracion: ['gas', 'capacitor'],
    cctv: ['cámara', 'cable'],
    plomeria: ['tubo', 'llave'],
    metalmecanica: ['cerradura', 'chapa'],
    plagas: ['fumigación', 'cebo'],
    linea_blanca: ['capacitor', 'motor'],
    solar: ['panel', 'inversor'],
    construccion: ['cemento', 'pintura']
  };

  var state = null;
  var bubble = null;
  var bar = null;
  var paused = false;
  var timer = 0;
  var deferredCapture = null;
  var logroOpen = false;
  var waBound = false;

  // ── utilidades ──────────────────────────────────────────────
  function lang() {
    try { return global.ArpaI18n?.getLang?.() === 'en' ? 'en' : 'es'; } catch (e) { return 'es'; }
  }

  function tx(key, vars) {
    var text = (TEXTS[lang()] && TEXTS[lang()][key]) || TEXTS.es[key] || key;
    Object.keys(vars || {}).forEach(function (k) { text = text.split('{' + k + '}').join(vars[k]); });
    return text;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return raw && typeof raw === 'object' ? raw : null;
    } catch (e) {
      return null;
    }
  }

  function saveState() {
    if (state) lsSet(STATE_KEY, JSON.stringify(state));
  }

  function isNewTech() {
    return lsGet(NEW_TECH_KEY) === 'true';
  }

  function isActive() {
    return !!state && typeof state.paso === 'number' && state.paso >= 1 && state.paso <= TOTAL;
  }

  function cotVisible() {
    var view = document.getElementById('view-cotizacion');
    var gateOpen = document.documentElement.classList.contains('onboarding-active')
      || !document.documentElement.classList.contains('license-ok');
    return !!view && !view.hidden && !gateOpen;
  }

  // ── dispositivo / navegador ─────────────────────────────────
  function ua() {
    return (global.navigator && global.navigator.userAgent) || '';
  }

  function isIos() { return /iPhone|iPad|iPod/i.test(ua()); }
  function isAndroid() { return /Android/i.test(ua()); }

  /** Navegador interno de WhatsApp, Instagram o Facebook. */
  function isInAppBrowser() {
    return /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|FBIOS/i.test(ua());
  }

  function isStandalone() {
    try {
      return !!(global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) || global.navigator.standalone === true;
    } catch (e) {
      return false;
    }
  }

  function browserName() {
    if (isIos()) return 'Safari';
    if (isAndroid()) return 'Chrome';
    return 'Chrome / Safari';
  }

  /** Link para abrir afuera: siempre con ?start=1 para que la otra app empiece la prueba. */
  function shareUrl() {
    try {
      return location.origin + location.pathname + '?start=1';
    } catch (e) {
      return '';
    }
  }

  function copyLink(onDone) {
    var url = shareUrl();
    var done = function () { if (typeof onDone === 'function') onDone(); };
    try {
      if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
        global.navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
        return;
      }
    } catch (e) { /* ignore */ }
    fallbackCopy(url);
    done();
  }

  function fallbackCopy(url) {
    try {
      var input = document.createElement('input');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    } catch (e) { /* ignore */ }
  }

  /** Android: intenta abrir el link en Chrome. Si no funciona, no pasa nada. */
  function openInChrome() {
    try {
      var url = shareUrl().replace(/^https?:\/\//, '');
      var scheme = location.protocol === 'http:' ? 'http' : 'https';
      location.href = 'intent://' + url + '#Intent;scheme=' + scheme + ';package=com.android.chrome;end';
    } catch (e) { /* ignore */ }
  }

  // ── ejemplos según el oficio ────────────────────────────────
  function activeOficio() {
    try {
      var ids = JSON.parse(lsGet('arpa_active_oficios') || '[]');
      return (Array.isArray(ids) && ids[0]) || lsGet('arpa_rubro') || '';
    } catch (e) {
      return lsGet('arpa_rubro') || '';
    }
  }

  function ejemplos() {
    var oficio = activeOficio();
    var palabras = [];
    try {
      var productos = global.ArpaMiCatalogo?.getProducts?.(oficio);
      if (!Array.isArray(productos) || !productos.length) productos = JSON.parse(lsGet('arpa_catalog_' + oficio) || '[]');
      var cuenta = {};
      (productos || []).forEach(function (p) {
        var w = String(p && p.nom || '').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-záéíóúñü]/gi, '');
        if (w.length >= 4) cuenta[w] = (cuenta[w] || 0) + 1;
      });
      palabras = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).slice(0, 2);
    } catch (e) { /* ignore */ }
    if (palabras.length < 2) palabras = EJEMPLOS[oficio] || ['cable', 'motor'];
    return palabras.map(function (w) { return '«' + w + '»'; }).join(', ');
  }

  // ── pasos ───────────────────────────────────────────────────
  function waButton() {
    return document.querySelector('#pdf-actions-cot .btn-pdf-whatsapp[onclick*="guardarCotPDFYWhatsApp"]')
      || document.querySelector('#pdf-actions-cot .btn-pdf-whatsapp');
  }

  function stepTarget(paso) {
    if (paso === 1) return document.getElementById('cot-nombre');
    if (paso === 2) return document.getElementById('buscador-cot');
    if (paso === 3) return document.querySelector('#view-cotizacion .totales-box') || document.getElementById('total-val-cot');
    if (paso === 4) return waButton();
    return null;
  }

  function stepText(paso) {
    if (paso === 1) return esc(tx('paso1'));
    if (paso === 2) {
      var extra = global.ArpaCobros?.usesSuggestions?.() ? '<br><small>' + esc(tx('paso2_cobros')) + '</small>' : '';
      return esc(tx('paso2', { ejemplos: ejemplos() })) + extra;
    }
    if (paso === 3) return esc(tx('paso3'));
    if (paso === 4) return esc(tx('paso4'));
    return '';
  }

  function hasQuoteLines() {
    return !!document.querySelector('#cot-tabla-body tr.cot-row');
  }

  /** Avance automático: se revisa cada poco mientras la guía está activa. */
  function checkProgress() {
    if (!isActive()) return;
    if (state.paso === 1) {
      var nombre = document.getElementById('cot-nombre');
      if (nombre && nombre.value.trim().length >= 2) return goTo(2);
    }
    if (state.paso === 2 && hasQuoteLines()) return goTo(3);
  }

  function goTo(paso, opts) {
    if (!state) state = {};
    state.paso = paso;
    saveState();
    paused = false;
    render({ scroll: !(opts && opts.noScroll) });
  }

  function skip() {
    if (!state) state = {};
    state.paso = 'saltada';
    saveState();
    removeBubble();
    renderBar();
  }

  // ── burbuja ─────────────────────────────────────────────────
  function removeBubble() {
    if (bubble) bubble.remove();
    bubble = null;
  }

  function buildBubble(paso) {
    removeBubble();
    bubble = document.createElement('div');
    bubble.className = 'arpa-guia-burbuja no-print';
    bubble.setAttribute('role', 'dialog');
    bubble.setAttribute('aria-live', 'polite');
    bubble.dataset.paso = String(paso);
    bubble.innerHTML =
      '<div class="arpa-guia-flecha" aria-hidden="true"></div>' +
      '<div class="arpa-guia-head"><span class="arpa-guia-contador">' + esc(tx('contador', { n: paso })) + '</span>' +
      '<button type="button" class="arpa-guia-saltar" data-guia="saltar">' + esc(tx('saltar')) + '</button></div>' +
      '<p class="arpa-guia-texto">' + stepText(paso) + '</p>' +
      (paso === 3 ? '<button type="button" class="arpa-guia-siguiente" data-guia="siguiente">' + esc(tx('siguiente')) + '</button>' : '');
    bubble.querySelector('[data-guia="saltar"]').addEventListener('click', skip);
    var next = bubble.querySelector('[data-guia="siguiente"]');
    if (next) next.addEventListener('click', function () { goTo(4); });
    document.body.appendChild(bubble);
  }

  function positionBubble() {
    if (!bubble || !state) return;
    var target = stepTarget(state.paso);
    if (!target || !target.getClientRects().length) {
      bubble.style.visibility = 'hidden';
      return;
    }
    bubble.style.visibility = '';
    var r = target.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var width = Math.min(320, vw - 24);
    bubble.style.width = width + 'px';
    var h = bubble.offsetHeight;
    var left = Math.max(12, Math.min(vw - width - 12, r.left + r.width / 2 - width / 2));
    // Arriba del elemento (el teclado y la lista de resultados quedan libres); abajo si no cabe.
    // En el paso 4 va debajo, para no tapar "Guardar como PDF".
    var vh = global.innerHeight || document.documentElement.clientHeight;
    var preferBelow = state.paso === 4 && r.bottom + h + 14 <= vh - 70;
    var above = !preferBelow && r.top - h - 14 >= 8;
    var top = above ? r.top - h - 14 : r.bottom + 14;
    bubble.style.left = left + 'px';
    bubble.style.top = (top + global.scrollY) + 'px';
    bubble.classList.toggle('is-below', !above);
    var arrow = bubble.querySelector('.arpa-guia-flecha');
    if (arrow) arrow.style.left = Math.max(16, Math.min(width - 28, r.left + r.width / 2 - left - 8)) + 'px';
  }

  function scrollToTarget(target) {
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      target.scrollIntoView();
    }
  }

  // ── barra "Primeros pasos" ──────────────────────────────────
  function renderBar() {
    var show = isActive() && cotVisible();
    if (!show) {
      if (bar) bar.hidden = true;
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'arpa-guia-barra no-print';
      bar.id = 'arpa-guia-barra';
      var view = document.getElementById('view-cotizacion');
      view.insertBefore(bar, view.firstChild);
      bar.addEventListener('click', function (e) {
        if (e.target.closest('[data-guia="continuar"]')) {
          paused = false;
          render({ scroll: true });
        }
      });
    }
    bar.hidden = false;
    var pct = Math.round(((state.paso - 1) / TOTAL) * 100);
    bar.innerHTML =
      '<span class="arpa-guia-barra-texto">' + esc(tx('barra', { n: state.paso })) + '</span>' +
      '<span class="arpa-guia-barra-pista" aria-hidden="true"><span style="width:' + pct + '%"></span></span>' +
      (paused || !bubble ? '<button type="button" data-guia="continuar">' + esc(tx('barra_continuar')) + '</button>' : '');
  }

  function render(opts) {
    if (!isActive() || !cotVisible() || paused || logroOpen) {
      removeBubble();
      renderBar();
      return;
    }
    if (!bubble || bubble.dataset.paso !== String(state.paso)) {
      buildBubble(state.paso);
      if (opts && opts.scroll) {
        var target = stepTarget(state.paso);
        if (target) scrollToTarget(target);
      }
    }
    renderBar();
    positionBubble();
  }

  // ── logro y consejos ────────────────────────────────────────
  function installHtml() {
    if (isStandalone()) return '';
    var body = '';
    if (isInAppBrowser()) {
      body = '<p>' + esc(tx('instalar_inapp')) + '</p>' +
        '<button type="button" class="arpa-guia-btn-sec" data-guia="copiar">' + esc(tx('copiar')) + '</button>' +
        (isAndroid() ? ' <button type="button" class="arpa-guia-btn-sec" data-guia="chrome">' + esc(tx('abrir_chrome')) + '</button>' : '');
    } else if (isIos()) {
      var safari = !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua());
      body = '<p>' + esc(tx(safari ? 'instalar_iphone' : 'instalar_ios_otro')) + '</p>';
    } else if (isAndroid()) {
      body = global.ArpaInstall?.canInstall?.()
        ? '<button type="button" class="arpa-guia-btn-sec" data-guia="instalar">' + esc(tx('instalar_btn')) + '</button>'
        : '<p>' + esc(tx('instalar_android')) + '</p>';
    } else {
      return '';
    }
    return '<div class="arpa-guia-instalar"><strong>📲 ' + esc(tx('instalar_titulo')) + '</strong>' + body + '</div>';
  }

  function showLogro() {
    if (logroOpen) return;
    logroOpen = true;
    removeBubble();
    var overlay = document.createElement('div');
    overlay.className = 'arpa-guia-logro no-print';
    overlay.id = 'arpa-guia-logro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="arpa-guia-logro-card">' +
      '<h2>' + esc(tx('logro_titulo')) + '</h2>' +
      '<p class="arpa-guia-logro-sub">' + esc(tx('logro_sub')) + '</p>' +
      installHtml() +
      '<p class="arpa-guia-copiado" hidden></p>' +
      '<button type="button" class="arpa-guia-btn" data-guia="entendido">' + esc(tx('entendido')) + '</button>' +
      '</div>';
    overlay.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-guia]');
      if (!btn) return;
      var action = btn.getAttribute('data-guia');
      if (action === 'copiar') {
        copyLink(function () {
          var msg = overlay.querySelector('.arpa-guia-copiado');
          if (msg) { msg.textContent = tx('copiado', { navegador: browserName() }); msg.hidden = false; }
        });
      } else if (action === 'chrome') {
        openInChrome();
      } else if (action === 'instalar') {
        global.ArpaInstall?.promptInstall?.();
      } else if (action === 'entendido') {
        closeLogro();
      }
    });
    document.body.appendChild(overlay);
    renderBar();
  }

  function closeLogro() {
    var overlay = document.getElementById('arpa-guia-logro');
    if (overlay) overlay.remove();
    logroOpen = false;
    var fn = deferredCapture;
    deferredCapture = null;
    if (typeof fn === 'function') {
      try { fn(); } catch (e) { console.warn('[arpa-guia] capture', e); }
    }
  }

  function showLogoTip() {
    if (document.getElementById('arpa-guia-tip')) return;
    var tip = document.createElement('div');
    tip.className = 'arpa-guia-tip no-print';
    tip.id = 'arpa-guia-tip';
    tip.setAttribute('role', 'status');
    tip.innerHTML =
      '<span>🖼️ ' + esc(tx('logo_tip')) + '</span>' +
      '<button type="button" data-guia="logo">' + esc(tx('logo_btn')) + '</button>' +
      '<button type="button" class="arpa-guia-tip-x" data-guia="cerrar" aria-label="' + esc(tx('cerrar')) + '">×</button>';
    tip.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-guia]');
      if (!btn) return;
      tip.remove();
      if (btn.getAttribute('data-guia') === 'logo') global.openSettingsModal?.();
    });
    document.body.appendChild(tip);
  }

  function hasCustomLogo() {
    try {
      var logo = global.ArpaBrand?.getLogo?.();
      return !!logo && logo !== global.ArpaBrand?.DEFAULT_LOGO;
    } catch (e) {
      return false;
    }
  }

  function onDocumentSaved() {
    if (!isNewTech()) return;
    if (!state) state = {};
    state.pdfs = (Number(state.pdfs) || 0) + 1;
    // Primer PDF (con o sin guía): pantalla de logro con el aviso para guardar la app.
    if (!state.logro) {
      state.logro = true;
      if (state.paso !== 'saltada') state.paso = 'hecha';
      saveState();
      showLogro();
      return;
    }
    if (state.pdfs >= 2 && !state.logoTip && !hasCustomLogo()) {
      state.logoTip = true;
      saveState();
      showLogoTip();
    }
    saveState();
  }

  /**
   * ArpaTrialCapture pregunta antes de abrir su formulario: si la pantalla de logro está
   * abierta, el formulario espera a que el técnico toque "Entendido".
   */
  function deferCapture(fn) {
    if (!logroOpen) return false;
    deferredCapture = fn;
    return true;
  }

  // ── franja del navegador interno ────────────────────────────
  function showInAppStrip() {
    if (!isInAppBrowser() || isStandalone()) return;
    var dismissed = false;
    try { dismissed = global.sessionStorage.getItem(INAPP_DISMISS_KEY) === '1'; } catch (e) { /* ignore */ }
    if (dismissed || document.getElementById('arpa-guia-inapp')) return;
    var strip = document.createElement('div');
    strip.className = 'arpa-guia-inapp no-print';
    strip.id = 'arpa-guia-inapp';
    strip.setAttribute('role', 'status');
    strip.innerHTML =
      '<span class="arpa-guia-inapp-texto">' + esc(tx('inapp', { navegador: browserName() })) + '</span>' +
      '<span class="arpa-guia-inapp-btns">' +
      '<button type="button" data-guia="copiar">' + esc(tx('copiar')) + '</button>' +
      (isAndroid() ? '<button type="button" data-guia="chrome">' + esc(tx('abrir_chrome')) + '</button>' : '') +
      '<button type="button" class="arpa-guia-inapp-x" data-guia="cerrar" aria-label="' + esc(tx('cerrar')) + '">×</button>' +
      '</span>';
    strip.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-guia]');
      if (!btn) return;
      var action = btn.getAttribute('data-guia');
      if (action === 'copiar') {
        copyLink(function () {
          var t = strip.querySelector('.arpa-guia-inapp-texto');
          if (t) t.textContent = tx('copiado', { navegador: browserName() });
        });
      } else if (action === 'chrome') {
        openInChrome();
      } else if (action === 'cerrar') {
        try { global.sessionStorage.setItem(INAPP_DISMISS_KEY, '1'); } catch (err) { /* ignore */ }
        strip.remove();
      }
    });
    var page = document.querySelector('.page');
    if (page && page.parentNode) page.parentNode.insertBefore(strip, page);
    else document.body.insertBefore(strip, document.body.firstChild);
  }


  // Estilos propios (así la guía vive en un solo archivo y es fácil de llevar a producción).
  var CSS = [
    '.arpa-guia-burbuja{position:absolute;z-index:960;background:#1a2a4a;color:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 10px 30px rgba(15,23,42,.35);font-family:"DM Sans",sans-serif;box-sizing:border-box;}',
    '.arpa-guia-flecha{position:absolute;bottom:-7px;width:16px;height:16px;background:#1a2a4a;transform:rotate(45deg);}',
    '.arpa-guia-burbuja.is-below .arpa-guia-flecha{bottom:auto;top:-7px;}',
    '.arpa-guia-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;}',
    '.arpa-guia-contador{background:#c9a84c;color:#1a2a4a;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:800;}',
    '.arpa-guia-saltar{background:transparent;border:none;color:#cbd5e1;font-size:12px;text-decoration:underline;cursor:pointer;padding:6px 0 6px 8px;font-family:inherit;}',
    '.arpa-guia-texto{margin:0;font-size:15px;font-weight:600;line-height:1.4;}',
    '.arpa-guia-texto small{font-weight:500;color:#cbd5e1;font-size:12px;}',
    '.arpa-guia-siguiente{margin-top:10px;width:100%;min-height:42px;border:none;border-radius:8px;background:#c9a84c;color:#1a2a4a;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;}',
    '.arpa-guia-barra{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:8px 12px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;font-family:"DM Sans",sans-serif;font-size:13px;font-weight:700;color:#1a2a4a;}',
    '.arpa-guia-barra[hidden]{display:none;}',
    '.arpa-guia-barra-pista{flex:1;height:6px;border-radius:999px;background:#dbeafe;overflow:hidden;}',
    '.arpa-guia-barra-pista span{display:block;height:100%;background:#2563eb;}',
    '.arpa-guia-barra button{border:none;border-radius:8px;background:#1a2a4a;color:#fff;font-weight:700;font-size:12px;padding:6px 12px;min-height:32px;cursor:pointer;font-family:inherit;}',
    '.arpa-guia-logro{position:fixed;inset:0;z-index:10003;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.6);font-family:"DM Sans",sans-serif;}',
    '.arpa-guia-logro-card{width:100%;max-width:380px;background:#fff;border-radius:16px;padding:24px 20px;text-align:center;box-shadow:0 12px 40px rgba(15,23,42,.3);}',
    '.arpa-guia-logro-card h2{margin:0 0 6px;font-family:"Barlow Condensed",sans-serif;font-size:26px;color:#1a2a4a;}',
    '.arpa-guia-logro-sub{margin:0 0 14px;color:#64748b;font-size:14px;}',
    '.arpa-guia-instalar{text-align:left;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:14px;font-size:14px;color:#1e293b;}',
    '.arpa-guia-instalar p{margin:6px 0 8px;line-height:1.45;}',
    '.arpa-guia-copiado{color:#15803d;font-size:13px;font-weight:600;margin:0 0 10px;}',
    '.arpa-guia-btn{width:100%;min-height:48px;border:none;border-radius:10px;background:#c9a84c;color:#1a2a4a;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;}',
    '.arpa-guia-btn-sec{margin-top:6px;min-height:40px;border:1.5px solid #1a2a4a;border-radius:8px;background:#fff;color:#1a2a4a;font-size:13px;font-weight:700;padding:6px 12px;cursor:pointer;font-family:inherit;}',
    '.arpa-guia-tip{position:fixed;left:12px;right:12px;bottom:84px;z-index:970;display:flex;flex-wrap:wrap;align-items:center;gap:8px;background:#1a2a4a;color:#fff;border-radius:12px;padding:10px 12px;font-family:"DM Sans",sans-serif;font-size:14px;box-shadow:0 8px 24px rgba(15,23,42,.3);max-width:520px;margin:0 auto;}',
    '.arpa-guia-tip span{flex:1;min-width:180px;}',
    '.arpa-guia-tip button{border:none;border-radius:8px;background:#c9a84c;color:#1a2a4a;font-weight:800;padding:8px 12px;min-height:36px;cursor:pointer;font-family:inherit;}',
    '.arpa-guia-tip .arpa-guia-tip-x,.arpa-guia-inapp .arpa-guia-inapp-x{background:transparent;color:#fff;font-size:20px;padding:0 6px;min-height:32px;}',
    '.arpa-guia-inapp{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;background:#fef3c7;border-bottom:1px solid #fcd34d;color:#78350f;font-family:"DM Sans",sans-serif;font-size:13px;font-weight:600;}',
    '.arpa-guia-inapp-texto{flex:1;min-width:200px;line-height:1.4;}',
    '.arpa-guia-inapp-btns{display:flex;gap:6px;align-items:center;}',
    '.arpa-guia-inapp button{border:none;border-radius:8px;background:#1a2a4a;color:#fff;font-weight:700;font-size:12px;padding:6px 10px;min-height:34px;cursor:pointer;font-family:inherit;}',
    '.arpa-guia-inapp .arpa-guia-inapp-x{color:#78350f;}',
    '@media print{.arpa-guia-burbuja,.arpa-guia-barra,.arpa-guia-logro,.arpa-guia-tip,.arpa-guia-inapp{display:none!important;}}',
    'body.is-printing .arpa-guia-burbuja,body.is-printing .arpa-guia-barra,body.is-printing .arpa-guia-inapp,body.is-printing .arpa-guia-tip{display:none!important;}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('arpa-guia-css')) return;
    var style = document.createElement('style');
    style.id = 'arpa-guia-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ── arranque ────────────────────────────────────────────────
  function bindWhatsAppButton() {
    if (waBound) return;
    var btn = waButton();
    if (!btn) return;
    waBound = true;
    btn.addEventListener('click', function () {
      // Mientras sale el PDF la burbuja se esconde; si el técnico cancela, la barra permite seguir.
      if (isActive() && state.paso === 4) {
        paused = true;
        removeBubble();
        renderBar();
      }
    }, true);
  }

  function tick() {
    if (!isActive()) {
      removeBubble();
      renderBar();
      return;
    }
    checkProgress();
    render();
  }

  function start() {
    state = loadState();
    bindWhatsAppButton();
    if (!timer) timer = global.setInterval(tick, 400);
    tick();
  }

  function onOnboardingDone() {
    if (!isNewTech()) return;
    state = loadState() || {};
    if (state.paso == null) state.paso = 1;
    saveState();
    paused = false;
    start();
    showInAppStrip();
    // La vista de Cotización ya está abierta: se rehace la burbuja y se lleva al campo del cliente.
    global.setTimeout(function () { removeBubble(); render({ scroll: true }); }, 350);
  }

  function init() {
    injectCss();
    global.addEventListener('arpa:onboarding-done', onOnboardingDone);
    global.addEventListener('arpa:documento-guardado', onDocumentSaved);
    global.addEventListener('scroll', positionBubble, { passive: true });
    global.addEventListener('resize', positionBubble);
    state = loadState();
    if (isNewTech() && isActive()) {
      // Al volver a abrir la app la guía queda en pausa: la barra permite retomarla.
      paused = true;
      start();
    }
    showInAppStrip();
  }

  global.ArpaGuia = {
    deferCapture: deferCapture,
    isInAppBrowser: isInAppBrowser,
    getState: function () { return state; },
    goTo: goTo,
    skip: skip
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
