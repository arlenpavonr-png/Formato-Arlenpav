/**
 * "Activar mi licencia": ventana en español con la forma de pagar (texto aprobado por Arlen, 3-nov-2026).
 * - Botón en la franja "Prueba gratis: quedan N días".
 * - El botón "Comprar ARPA Suite" de la pantalla de prueba vencida abre esta misma ventana.
 * No cobra nada ni guarda datos: solo abre Gumroad o el WhatsApp oficial.
 */
(function (global) {
  'use strict';

  var GUMROAD_URL = 'https://arpatech.gumroad.com/l/arpa-suite-tecnico';
  var WHATSAPP = '573016092542';
  var MODAL_ID = 'arpa-activar-modal';

  var TXT = {
    es: {
      boton: 'Activar mi licencia',
      titulo: 'Activa ARPA Suite para siempre',
      precio: 'Pago único de <b>83 dólares</b> (en México unos $1,535 pesos; en Colombia $269.000). Sin mensualidades.',
      tarjeta: '<b>Con tarjeta de débito o crédito:</b> toca "Pagar con tarjeta", pon tu correo y tu tarjeta. La página está en inglés: el botón dice "I want this!". En 2 minutos te llega tu código al correo.',
      colombia: '<b>¿En Colombia?</b> Paga por Nequi y envíanos el comprobante por WhatsApp.',
      dudas: '<b>¿Dudas?</b> Escríbenos por WhatsApp.',
      btnTarjeta: 'Pagar con tarjeta',
      btnNequi: 'Pagar por Nequi (Colombia)',
      btnCodigo: 'Ya tengo mi código',
      btnDudas: 'Escribir por WhatsApp',
      cerrar: 'Cerrar',
      msgNequi: 'Hola, quiero pagar ARPA Suite por Nequi ($269.000).',
      msgDudas: 'Hola, tengo una duda para activar ARPA Suite.'
    },
    en: {
      boton: 'Activate my license',
      titulo: 'Activate ARPA Suite for life',
      precio: 'One-time payment of <b>83 USD</b>. No monthly fees.',
      tarjeta: '<b>With a debit or credit card:</b> tap "Pay with card", enter your email and card, and tap "I want this!". Your code arrives by email in about 2 minutes.',
      colombia: '<b>In Colombia?</b> Pay with Nequi and send us the receipt on WhatsApp.',
      dudas: '<b>Questions?</b> Message us on WhatsApp.',
      btnTarjeta: 'Pay with card',
      btnNequi: 'Pay with Nequi (Colombia)',
      btnCodigo: 'I already have my code',
      btnDudas: 'Message us on WhatsApp',
      cerrar: 'Close',
      msgNequi: 'Hi, I want to pay for ARPA Suite with Nequi ($269.000 COP).',
      msgDudas: 'Hi, I have a question about activating ARPA Suite.'
    }
  };

  function t(key) {
    var lang = (global.ArpaI18n && typeof global.ArpaI18n.getLang === 'function' && global.ArpaI18n.getLang() === 'en') ? 'en' : 'es';
    return TXT[lang][key] || TXT.es[key] || key;
  }

  function wa(texto) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  function injectCss() {
    if (document.getElementById('arpa-activar-css')) return;
    var css = [
      '.arpa-activar-btn{margin-left:8px;background:#1a2a4a;color:#fff;border:0;border-radius:999px;padding:4px 12px;font:700 12px "DM Sans",sans-serif;cursor:pointer;}',
      '.arpa-activar-modal{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.6);font-family:"DM Sans",sans-serif;}',
      '.arpa-activar-modal[hidden]{display:none!important;}',
      '.arpa-activar-card{background:#fff;color:#1a2a4a;border-radius:16px;max-width:440px;width:100%;padding:22px 20px;box-shadow:0 20px 50px rgba(15,23,42,.35);max-height:90vh;overflow:auto;}',
      '.arpa-activar-card h2{margin:0 0 10px;font-size:20px;}',
      '.arpa-activar-card p{margin:0 0 10px;font-size:14px;line-height:1.45;}',
      '.arpa-activar-btns{display:flex;flex-direction:column;gap:8px;margin-top:14px;}',
      '.arpa-activar-btns a,.arpa-activar-btns button{display:block;text-align:center;text-decoration:none;border-radius:10px;padding:12px;font:700 15px "DM Sans",sans-serif;cursor:pointer;border:0;}',
      '.arpa-activar-pagar{background:#c9a84c;color:#1a2a4a;}',
      '.arpa-activar-nequi{background:#1a2a4a;color:#fff;}',
      '.arpa-activar-sec{background:#eef2f7;color:#1a2a4a;}',
      '.arpa-activar-cerrar{background:transparent;color:#64748b;text-decoration:underline;font-weight:500!important;}',
      '@media print{.arpa-activar-modal,.arpa-activar-btn{display:none!important;}}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'arpa-activar-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function ensureModal() {
    var m = document.getElementById(MODAL_ID);
    if (m) return m;
    injectCss();
    m = document.createElement('div');
    m.id = MODAL_ID;
    m.className = 'arpa-activar-modal no-print';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.hidden = true;
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    return m;
  }

  function render(m) {
    m.innerHTML =
      '<div class="arpa-activar-card">' +
        '<h2>' + t('titulo') + '</h2>' +
        '<p>' + t('precio') + '</p>' +
        '<p>' + t('tarjeta') + '</p>' +
        '<p>' + t('colombia') + '</p>' +
        '<p>' + t('dudas') + '</p>' +
        '<div class="arpa-activar-btns">' +
          '<a class="arpa-activar-pagar" href="' + GUMROAD_URL + '" target="_blank" rel="noopener">' + t('btnTarjeta') + '</a>' +
          '<a class="arpa-activar-nequi" href="' + wa(t('msgNequi')) + '" target="_blank" rel="noopener">' + t('btnNequi') + '</a>' +
          '<button type="button" class="arpa-activar-sec" data-accion="codigo">' + t('btnCodigo') + '</button>' +
          '<a class="arpa-activar-sec" href="' + wa(t('msgDudas')) + '" target="_blank" rel="noopener">' + t('btnDudas') + '</a>' +
          '<button type="button" class="arpa-activar-cerrar" data-accion="cerrar">' + t('cerrar') + '</button>' +
        '</div>' +
      '</div>';
    m.querySelector('[data-accion="cerrar"]').addEventListener('click', close);
    m.querySelector('[data-accion="codigo"]').addEventListener('click', function () {
      close();
      var gate = global.ArpaLicenseGate;
      var expiredVisible = document.getElementById('license-gate-expired')?.classList.contains('is-visible');
      if (expiredVisible && gate && typeof gate.showActivatePanel === 'function') {
        gate.showActivatePanel();
      } else if (global.ArpaLicense && typeof global.ArpaLicense.requestLicenseChange === 'function') {
        global.ArpaLicense.requestLicenseChange();
      }
    });
  }

  function open() {
    var m = ensureModal();
    render(m);
    m.hidden = false;
    try { global.gtag && global.gtag('event', 'activar_licencia_abrir'); } catch (e) { /* ignore */ }
  }

  function close() {
    var m = document.getElementById(MODAL_ID);
    if (m) m.hidden = true;
  }

  /** Agrega el botón a la franja de días de prueba (se llama cada vez que se actualiza la franja). */
  function decorateTrialBanner() {
    var el = document.getElementById('trial-days-banner');
    if (!el || el.hidden || el.querySelector('.arpa-activar-btn')) return;
    injectCss();
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'arpa-activar-btn';
    b.textContent = t('boton');
    b.addEventListener('click', open);
    el.appendChild(b);
  }

  function bindExpiredButton() {
    var a = document.getElementById('license-btn-comprar');
    if (!a || a.dataset.arpaActivar === '1') return;
    a.dataset.arpaActivar = '1';
    a.addEventListener('click', function (e) { e.preventDefault(); open(); });
  }

  function init() {
    bindExpiredButton();
    decorateTrialBanner();
    var el = document.getElementById('trial-days-banner');
    if (el && typeof MutationObserver === 'function') {
      new MutationObserver(decorateTrialBanner).observe(el, { childList: true, attributes: true, attributeFilter: ['hidden'] });
    }
  }

  global.ArpaActivar = { open: open, close: close, decorateTrialBanner: decorateTrialBanner, GUMROAD_URL: GUMROAD_URL };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
