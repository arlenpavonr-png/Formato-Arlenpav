/**
 * Firmas digitales: mouse + touch, borrar, captura en PDF
 */
(function (global) {
  const initialized = new Set();
  const printBackups = [];

  function initCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas || initialized.has(id)) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f2044';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    let drawing = false;

    function getPoint(e) {
      const rect = canvas.getBoundingClientRect();
      const source = e.touches ? e.touches[0] : e;
      return {
        x: (source.clientX - rect.left) * (canvas.width / rect.width),
        y: (source.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function start(e) {
      drawing = true;
      const p = getPoint(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }

    function move(e) {
      if (!drawing) return;
      const p = getPoint(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    function end() {
      drawing = false;
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);

    initialized.add(id);
  }

  function clear(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  function canvasHasInk(canvas) {
    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] > 0) return true;
    }
    return false;
  }

  function prepareForPrint(canvasIds) {
    restoreAfterPrint();
    canvasIds.forEach((id) => {
      const canvas = document.getElementById(id);
      if (!canvas || !canvasHasInk(canvas)) return;

      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.alt = 'Firma';
      img.className = 'firma-print-img';
      img.setAttribute('data-firma-for', id);

      canvas.classList.add('firma-canvas-hidden-print');
      canvas.parentNode.insertBefore(img, canvas.nextSibling);
      printBackups.push({ canvas, img });
    });
  }

  function restoreAfterPrint() {
    printBackups.forEach(({ canvas, img }) => {
      img.remove();
      canvas.classList.remove('firma-canvas-hidden-print');
    });
    printBackups.length = 0;
  }

  function initAll(ids) {
    ids.forEach(initCanvas);
  }

  const DEFAULT_CANVASES = [
    'canvas-firma-cliente',
    'canvas-firma-tecnico',
    'canvas-cot-cliente',
    'canvas-cot-elaborado'
  ];

  global.ArpaSignature = {
    initCanvas,
    initAll,
    clear,
    prepareForPrint,
    restoreAfterPrint,
    DEFAULT_CANVASES
  };

  global.limpiarFirma = clear;

  document.addEventListener('DOMContentLoaded', () => {
    initAll(DEFAULT_CANVASES);
  });
})(window);
