/**
 * PDF para compartir (WhatsApp) con los MISMOS estilos de impresión que "Guardar como PDF".
 *
 * El navegador no deja obtener como archivo el PDF de window.print(), así que se toma una
 * imagen de la página con html2canvas. Antes de la captura, en la copia de la página se activan
 * las reglas @media print del sitio (botones, avisos, pastilla de estado, placeholders y secciones
 * vacías quedan ocultos igual que al imprimir) y la copia se arma con el ancho de una hoja Carta.
 * Después las páginas se cortan entre bloques (filas, campos, firmas, fotos, secciones): un bloque
 * nunca queda partido entre dos hojas y cada título queda pegado a lo que lo sigue.
 */
(function (global) {
  const LETTER = { widthMm: 215.9, heightMm: 279.4, marginX: 12, marginTop: 12, marginBottom: 14 };
  const PX_PER_MM = 96 / 25.4;
  // Ancho útil de la hoja Carta impresa (215,9 mm − 2 × 12 mm) en px CSS: el mismo que usa la impresión.
  const PRINT_WIDTH_PX = Math.round((LETTER.widthMm - LETTER.marginX * 2) * PX_PER_MM);

  // Lo que nunca va en un documento para el cliente, aunque una regla de impresión se escape.
  const CAPTURE_CSS = [
    'html, body { background:#ffffff !important; overflow:visible !important; height:auto !important; }',
    'body { margin:0 !important; padding:0 !important; }',
    '.page { width:' + PRINT_WIDTH_PX + 'px !important; min-width:0 !important; max-width:none !important; margin:0 !important; box-shadow:none !important; border-radius:0 !important; overflow:visible !important; }',
    'button, .no-print, #validation-badge, [id^="sync-status-"], #arpa-demo-banner, #arpa-install-banner,',
    '.trial-days-banner, .main-menu, .settings-overlay, .lang-switch, .settings-btn, .btn-firma-clear,',
    '.print-hide-empty { display:none !important; }',
    'input::placeholder, textarea::placeholder { color:transparent !important; opacity:0 !important; }',
    // html2canvas 1.4.1 pierde espacios entre palabras con kerning/ligaduras activas ("Colombiaa través").
    '.page, .page * { font-kerning:none !important; font-variant-ligatures:none !important; }'
  ].join('\n');

  /** Reglas @media print del sitio, sin el envoltorio de "print", para aplicarlas en pantalla. */
  function collectPrintCss(doc) {
    doc = doc || document;
    const out = [];
    const isPrint = (media) => /(^|[\s,(])print\b/i.test(String(media && media.mediaText || ''));
    const walk = (rules, outer) => {
      Array.from(rules || []).forEach((rule) => {
        // CSSMediaRule
        if (rule.type === 4 || (global.CSSMediaRule && rule instanceof global.CSSMediaRule)) {
          if (isPrint(rule.media)) {
            const inner = Array.from(rule.cssRules || [])
              .filter((r) => r.type !== 6) // @page no aplica a la captura
              .map((r) => r.cssText)
              .join('\n');
            out.push(outer ? `@media ${outer} {\n${inner}\n}` : inner);
          } else {
            walk(rule.cssRules, rule.media.mediaText);
          }
        } else if (rule.type === 12 && rule.cssRules) { // @supports
          walk(rule.cssRules, outer);
        }
      });
    };
    Array.from(doc.styleSheets || []).forEach((sheet) => {
      let rules = null;
      try { rules = sheet.cssRules; } catch (e) { rules = null; } // hojas de otro dominio (Google Fonts)
      if (!rules) return;
      if (sheet.media && isPrint(sheet.media) && !/screen|all/i.test(sheet.media.mediaText)) {
        out.push(Array.from(rules).map((r) => r.cssText).join('\n'));
        return;
      }
      walk(rules, '');
    });
    return out.join('\n');
  }

  /** Resta los espacios de html2canvas: los saltos de línea "duros" dentro de textos se vuelven espacios. */
  function normalizeTextNodes(root) {
    const doc = root.ownerDocument;
    const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
    let n = walker.nextNode();
    while (n) {
      if (/[\n\r\t]/.test(n.nodeValue) && !n.parentElement?.closest('pre, textarea')) {
        n.nodeValue = n.nodeValue.replace(/[\n\r\t]+/g, ' ');
      }
      n = walker.nextNode();
    }
  }

  function isShown(el, win) {
    if (!el || el.nodeType !== 1) return false;
    if (/^(COL|COLGROUP|SCRIPT|STYLE|TEMPLATE)$/i.test(el.tagName)) return false;
    const cs = win.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.height > 1 && r.width > 1;
  }

  const LEAF_TAGS = /^(TR|IMG|CANVAS|SVG|P|LABEL|H1|H2|H3|H4|LI|FIGURE|svg)$/i;
  const TITLE_SEL = '.section-title, .garantia-header, h2, h3, h4';

  /**
   * Bloques que no se pueden partir, medidos en la copia (px relativos a la parte de arriba de root).
   * Un bloque grande (más de ~media hoja) se abre en sus hijos; uno pequeño queda entero.
   * Los títulos se pegan al primer bloque que los sigue.
   */
  function collectBlocks(root, win, pageHpx) {
    const rootTop = root.getBoundingClientRect().top;
    const blocks = [];
    const bigLimit = pageHpx * 0.45;
    const rangeOf = (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - rootTop, bottom: r.bottom - rootTop };
    };
    const describe = (el) => {
      const base = el.id ? '#' + el.id : (el.className && typeof el.className === 'string'
        ? el.tagName.toLowerCase() + '.' + el.className.trim().split(/\s+/)[0] : el.tagName.toLowerCase());
      // Marcas para las pruebas: qué bloques importantes quedaron enteros.
      const tags = [];
      if (el.matches('.firmas, .firma-box') || el.querySelector('.firmas, .firma-box')) tags.push('firmas');
      if (el.matches('.totales-box') || el.querySelector('.totales-box')) tags.push('resumen');
      return tags.length ? base + ' [' + tags.join(',') + ']' : base;
    };

    function visit(el, depth) {
      const kids = Array.from(el.children).filter((c) => isShown(c, win));
      for (let i = 0; i < kids.length; i += 1) {
        const k = kids[i];
        const r = rangeOf(k);
        const h = r.bottom - r.top;
        const isTitle = k.matches(TITLE_SEL);
        if (isTitle) {
          // Título + lo primero que viene después (su bloque, o al menos su primera fila).
          const next = kids[i + 1];
          let bottom = r.bottom;
          if (next) {
            const nr = rangeOf(next);
            if (nr.bottom - r.top <= bigLimit) bottom = nr.bottom;
            else {
              const firstLeaf = firstLeafRange(next, depth + 1);
              bottom = Math.max(bottom, firstLeaf ? firstLeaf.bottom : nr.top + Math.min(80, nr.bottom - nr.top));
            }
          }
          blocks.push({ name: 'titulo:' + (k.textContent || '').trim().slice(0, 30), top: r.top, bottom, title: true });
          continue;
        }
        const childKids = Array.from(k.children).filter((c) => isShown(c, win));
        const atomic = h <= bigLimit || LEAF_TAGS.test(k.tagName) || !childKids.length || depth > 14;
        if (atomic) {
          if (h <= pageHpx) blocks.push({ name: describe(k), top: r.top, bottom: r.bottom });
        } else {
          visit(k, depth + 1);
        }
      }
    }

    function firstLeafRange(el, depth) {
      const kids = Array.from(el.children).filter((c) => isShown(c, win));
      if (!kids.length || depth > 14) return rangeOf(el);
      const k = kids[0];
      const r = rangeOf(k);
      if (r.bottom - r.top <= bigLimit || LEAF_TAGS.test(k.tagName)) return r;
      return firstLeafRange(k, depth + 1);
    }

    visit(root, 0);
    return blocks;
  }

  /** Dónde empieza cada hoja (px de la imagen) sin partir ningún bloque que quepa en una hoja. */
  function computePageStarts(ranges, pageH, totalH) {
    const items = (ranges || [])
      .filter((r) => r && r.bottom > r.top && r.bottom - r.top <= pageH)
      .slice()
      .sort((a, b) => a.top - b.top || a.bottom - b.bottom);
    const starts = [0];
    let pageStart = 0;
    const EPS = 1.5;
    let guard = 0;
    while (pageStart + pageH < totalH - EPS && guard < 60) {
      guard += 1;
      const pageEnd = pageStart + pageH;
      let cutAt = pageEnd;
      // El corte sube hasta el inicio de cualquier bloque que cruce el borde de la hoja
      // (también si ese corte cruza otro bloque más arriba: se repite hasta quedar limpio).
      let moved = true;
      let loops = 0;
      while (moved && loops < 50) {
        moved = false;
        loops += 1;
        for (let i = 0; i < items.length; i += 1) {
          const it = items[i];
          if (it.top >= cutAt - EPS) break;
          if (it.bottom <= cutAt + EPS) continue;
          if (it.top > pageStart + EPS && it.top < cutAt) {
            cutAt = it.top;
            moved = true;
          }
        }
      }
      if (cutAt <= pageStart + EPS) cutAt = pageEnd;
      if (cutAt >= totalH - EPS) break;
      starts.push(cutAt);
      pageStart = cutAt;
    }
    return starts;
  }

  function waitFrames() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  /**
   * Captura `element` (normalmente .page, ya preparado como para imprimir) y arma un PDF Carta.
   * @returns {Promise<{blob: Blob, debug: object}>}
   */
  async function capturarPdf(element, opts) {
    opts = opts || {};
    const jsPDF = global.jspdf?.jsPDF || global.jsPDF;
    const html2canvas = global.html2canvas;
    if (!jsPDF || !html2canvas || !element) throw new Error('pdf-captura: falta jsPDF/html2canvas');
    if (document.fonts?.ready) await document.fonts.ready;
    await waitFrames();

    const contentWmm = LETTER.widthMm - LETTER.marginX * 2;
    const contentHmm = LETTER.heightMm - LETTER.marginTop - LETTER.marginBottom;
    const pageHcss = contentHmm * PX_PER_MM; // alto útil de una hoja, en px CSS al ancho de impresión
    const printCss = collectPrintCss(document);
    const marker = 'arpa-pdf-captura-' + Date.now();
    element.setAttribute('data-arpa-pdf-root', marker);

    let measured = null;
    const scale = opts.scale || 2;
    let canvas;
    try {
      canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: PRINT_WIDTH_PX,
        windowHeight: Math.max(800, Math.ceil(pageHcss)),
        scrollX: 0,
        scrollY: 0,
        onclone: async (cloneDoc) => {
          const style = cloneDoc.createElement('style');
          style.setAttribute('data-arpa-pdf-captura', '1');
          style.textContent = printCss + '\n' + CAPTURE_CSS + '\n' + (opts.extraCss || '');
          cloneDoc.head.appendChild(style);
          const root = cloneDoc.querySelector(`[data-arpa-pdf-root="${marker}"]`);
          if (!root) return;
          normalizeTextNodes(root);
          if (cloneDoc.fonts?.ready) { try { await cloneDoc.fonts.ready; } catch (e) { /* sigue */ } }
          const win = cloneDoc.defaultView;
          const rect = root.getBoundingClientRect();
          measured = {
            width: rect.width,
            height: Math.max(root.scrollHeight, rect.height),
            blocks: collectBlocks(root, win, pageHcss),
            // Encabezados de tabla: se repiten arriba de la hoja cuando una tabla sigue en la hoja siguiente (como al imprimir).
            theads: Array.from(root.querySelectorAll('table thead')).filter((t) => isShown(t, win)).map((t) => {
              const rt = root.getBoundingClientRect().top;
              const r = t.getBoundingClientRect();
              const tb = t.closest('table').getBoundingClientRect();
              return { top: r.top - rt, bottom: r.bottom - rt, tableBottom: tb.bottom - rt };
            }),
            hiddenCheck: {
              badge: !isShown(cloneDoc.getElementById('validation-badge'), win),
              buttons: Array.from(root.querySelectorAll('button')).filter((b) => isShown(b, win)).length,
              demoBanner: !isShown(cloneDoc.getElementById('arpa-demo-banner'), win),
              // Campos vacíos que mostrarían su texto de ayuda (placeholder) en el PDF.
              placeholders: Array.from(root.querySelectorAll('input[placeholder], textarea[placeholder]'))
                .filter((el) => isShown(el, win) && !String(el.value || '').trim() && String(el.placeholder || '').trim()
                  && win.getComputedStyle(el, '::placeholder').color !== 'rgba(0, 0, 0, 0)')
                .map((el) => el.id || el.placeholder)
            },
            // Texto que queda en el documento (para pruebas: avisos de la app no deben aparecer).
            text: String(root.innerText || '').slice(0, 30000)
          };
        }
      });
    } finally {
      element.removeAttribute('data-arpa-pdf-root');
    }

    const cssW = measured?.width || element.getBoundingClientRect().width || PRINT_WIDTH_PX;
    const k = canvas.width / cssW; // px de la imagen por px CSS
    const pageCanvasH = contentHmm * (canvas.width / contentWmm);
    const ranges = (measured?.blocks || []).map((b) => ({ name: b.name, top: b.top * k, bottom: b.bottom * k, title: !!b.title }));
    const theads = (measured?.theads || []).map((t) => ({ top: t.top * k, bottom: t.bottom * k, tableBottom: t.tableBottom * k }));
    // Si hay tablas, cada hoja deja lugar para repetir su encabezado.
    const theadMax = theads.reduce((m, t) => Math.max(m, t.bottom - t.top), 0);
    const starts = computePageStarts(ranges, pageCanvasH - theadMax, canvas.height);

    const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    for (let i = 0; i < starts.length; i += 1) {
      // Desde la 2.ª hoja se saltan 2 px de la imagen: así no asoma el borde del bloque anterior.
      const srcY = i === 0 ? 0 : Math.min(canvas.height - 1, Math.ceil(starts[i]) + 2);
      const nextY = i + 1 < starts.length ? Math.floor(starts[i + 1]) : canvas.height;
      const srcH = Math.max(1, Math.min(nextY - srcY, canvas.height - srcY));
      const head = i === 0 ? null : theads.find((t) => starts[i] > t.bottom + 2 && starts[i] < t.tableBottom - 2);
      const headH = head ? Math.ceil(head.bottom - head.top) : 0;
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = srcH + headH;
      const sctx = slice.getContext('2d');
      sctx.fillStyle = '#ffffff';
      sctx.fillRect(0, 0, slice.width, slice.height);
      if (head) sctx.drawImage(canvas, 0, Math.floor(head.top), canvas.width, headH, 0, 0, canvas.width, headH);
      sctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, headH, canvas.width, srcH);
      const destH = slice.height * contentWmm / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', LETTER.marginX, LETTER.marginTop, contentWmm, destH);
      if (i === 0 && opts.searchableText?.length) stampSearchableText(pdf, opts.searchableText);
    }

    const debug = {
      format: 'letter',
      pageWidthMm: pdf.internal.pageSize.getWidth(),
      pageHeightMm: pdf.internal.pageSize.getHeight(),
      canvasH: canvas.height,
      pageCanvasH,
      starts,
      ranges,
      hidden: measured?.hiddenCheck || null,
      text: measured?.text || '',
      printCssChars: printCss.length
    };
    global.__arpaPdfCapturaDebug = debug;
    return { blob: pdf.output('blob'), debug, pdf };
  }

  // Texto invisible (blanco) en la primera hoja para que el PDF se pueda buscar por empresa y número.
  function stampSearchableText(pdf, lines) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    let y = 5;
    lines.forEach((line) => {
      const text = String(line || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      pdf.text(text, LETTER.marginX, y);
      y += 3.2;
    });
  }

  global.ArpaPdfCaptura = {
    LETTER,
    PRINT_WIDTH_PX,
    CAPTURE_CSS,
    collectPrintCss,
    collectBlocks,
    computePageStarts,
    capturarPdf
  };
})(window);
