/**
 * Prompt de instalación PWA: captura beforeinstallprompt y muestra
 * el botón "Instalar App" solo cuando Chrome confirma que el sitio es instalable.
 * En iOS muestra instrucciones manuales (el evento nativo no existe).
 */
(function (global) {
  'use strict';

  var deferredPrompt = null;
  var DISMISS_KEY = 'arpa_install_banner_dismissed';

  function safe(fn) {
    try { return fn(); }
    catch (e) { return undefined; }
  }

  function isStandalone() {
    return !!safe(function () {
      if (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) return true;
      if (global.navigator && global.navigator.standalone === true) return true;
      return false;
    });
  }

  function iosUserAgent() {
    return ((global.navigator && global.navigator.userAgent) || '');
  }

  function isIosDevice() {
    return !!safe(function () {
      return /iPhone|iPad|iPod/i.test(iosUserAgent());
    });
  }

  /** Navegador interno de WhatsApp, Instagram o Facebook: ahí no se puede instalar la app. */
  function isInAppBrowser() {
    return !!safe(function () {
      return /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|FBIOS/i.test(iosUserAgent());
    });
  }

  function isIosSafari() {
    return !!safe(function () {
      var ua = iosUserAgent();
      if (!/iPhone|iPad|iPod/i.test(ua)) return false;
      if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua)) return false;
      if (isInAppBrowser()) return false;
      return true;
    });
  }

  function isIosOther() {
    return isIosDevice() && !isIosSafari();
  }

  function isBannerDismissed() {
    return !!safe(function () {
      return global.sessionStorage && global.sessionStorage.getItem(DISMISS_KEY) === '1';
    });
  }

  /** Técnico nuevo que aún no saca su primer PDF: el aviso sale después, en la pantalla de logro de la guía. */
  function waitingFirstPdf() {
    return !!safe(function () {
      if (global.localStorage.getItem('arpa_tecnico_nuevo') !== 'true') return false;
      var guia = JSON.parse(global.localStorage.getItem('arpa_guia') || 'null');
      return !(guia && guia.logro);
    });
  }

  function markBannerDismissed() {
    safe(function () {
      if (global.sessionStorage) global.sessionStorage.setItem(DISMISS_KEY, '1');
    });
  }

  function roots() {
    return safe(function () {
      return document.querySelectorAll('[data-arpa-install-root]');
    }) || [];
  }

  function hideRoot(root) {
    if (!root) return;
    root.style.display = 'none';
  }

  function hideAll() {
    Array.prototype.forEach.call(roots(), hideRoot);
  }

  function bindRoot(root) {
    if (!root || root.getAttribute('data-arpa-install-bound') === '1') return;
    root.setAttribute('data-arpa-install-bound', '1');
    var btn = root.querySelector('[data-arpa-install-btn]');
    if (btn) {
      btn.addEventListener('click', function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        promptInstall();
      });
    }
    var dismiss = root.querySelector('[data-arpa-install-dismiss]');
    if (dismiss) {
      dismiss.addEventListener('click', function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        markBannerDismissed();
        hideRoot(root);
      });
    }
  }

  function mostrarBoton() {
    safe(function () {
      if (isStandalone() || isInAppBrowser()) {
        // Dentro de WhatsApp/Instagram/Facebook la guía muestra su propia franja ("ábrela en Chrome/Safari").
        hideAll();
        return;
      }
      var safariIos = isIosSafari();
      var otherIos = isIosOther();
      var canChrome = !!deferredPrompt;
      if (!safariIos && !otherIos && !canChrome) return;
      if (waitingFirstPdf()) {
        hideAll();
        return;
      }

      Array.prototype.forEach.call(roots(), function (root) {
        bindRoot(root);
        if (root.getAttribute('data-arpa-install-dismissable') === '1' && isBannerDismissed()) {
          hideRoot(root);
          return;
        }
        var showAs = root.getAttribute('data-arpa-install-display') || 'block';
        root.style.display = showAs;
        var btn = root.querySelector('[data-arpa-install-btn]');
        var iosEl = root.querySelector('[data-arpa-install-ios]');
        var iosOtherEl = root.querySelector('[data-arpa-install-ios-other]');
        if (safariIos) {
          if (btn) btn.style.display = 'none';
          if (iosEl) iosEl.style.display = 'block';
          if (iosOtherEl) iosOtherEl.style.display = 'none';
        } else if (otherIos) {
          if (btn) btn.style.display = 'none';
          if (iosEl) iosEl.style.display = 'none';
          if (iosOtherEl) iosOtherEl.style.display = 'block';
        } else {
          if (btn) btn.style.display = '';
          if (iosEl) iosEl.style.display = 'none';
          if (iosOtherEl) iosOtherEl.style.display = 'none';
        }
      });
    });
  }

  function promptInstall() {
    safe(function () {
      var promptEvent = deferredPrompt;
      if (!promptEvent || typeof promptEvent.prompt !== 'function') return;
      deferredPrompt = null;
      hideAll();
      var result = promptEvent.prompt();
      var choice = promptEvent.userChoice;
      Promise.resolve(result)
        .then(function () { return choice; })
        .catch(function () { return choice; })
        .then(function () {
          deferredPrompt = null;
          hideAll();
        })
        .catch(function () {
          deferredPrompt = null;
          hideAll();
        });
    });
  }

  function onBeforeInstallPrompt(e) {
    safe(function () {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      deferredPrompt = e;
      mostrarBoton();
    });
  }

  function onAppInstalled() {
    safe(function () {
      deferredPrompt = null;
      hideAll();
    });
  }

  safe(function () {
    global.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    global.addEventListener('appinstalled', onAppInstalled);
  });

  // El aviso fijo de iPhone ya no sale al abrir la app: la guía lo muestra una sola vez,
  // después del primer PDF (pantalla de logro). Se deja la función por si se quiere volver.
  function tryIosOnReady() {
    return false;
  }

  safe(function () {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryIosOnReady);
    } else {
      tryIosOnReady();
    }
  });

  global.ArpaInstall = {
    mostrarBoton: mostrarBoton,
    canInstall: function () { return !!deferredPrompt; },
    promptInstall: promptInstall,
    isInAppBrowser: isInAppBrowser
  };
})(typeof window !== 'undefined' ? window : this);
