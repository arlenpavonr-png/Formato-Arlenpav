/**
 * Formato por WhatsApp: el archivo lleva el nombre del cliente.
 * Antes salía "Formato_AP-031_Formato.pdf" porque el nombre se leía después de que
 * prepararFormatoParaPdf cambiara las casillas por texto (la casilla ya no estaba).
 * node --test tests/formato-nombre-pdf.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function loadConFormulario(campos) {
  // Casillas "vivas"; prepararFormatoParaPdf las quita como hace la app de verdad.
  const vivos = {
    'numero-formato': { value: campos.numero, placeholder: '' },
    'formato-cliente-nombre': { value: campos.cliente, placeholder: 'Nombre completo o razón social' }
  };
  const sb = { console, File, Promise };
  sb.window = sb;
  sb.globalThis = sb;
  sb.document = {
    querySelector: (sel) => (sel === '.page' ? {} : null),
    getElementById: (id) => vivos[id] || null
  };
  sb.ArpaPdfCaptura = { capturarPdf: async () => ({ blob: new Blob(['%PDF']) }) };
  sb.prepararFormatoParaPdf = () => {
    delete vivos['formato-cliente-nombre'];
    return { ready: Promise.resolve(), restore() {} };
  };
  vm.createContext(sb);
  vm.runInContext(read('js/arpa-whatsapp.js'), sb, { filename: 'arpa-whatsapp.js' });
  return sb.ArpaWhatsApp;
}

test('el PDF del formato compartido lleva el nombre del cliente', async () => {
  const wa = loadConFormulario({ numero: 'AP-031', cliente: 'Ingealianza  S.A.S' });
  const file = await wa.generarFormatoPdfFile();
  assert.strictEqual(file.name, 'Formato_AP-031_Ingealianza_SAS.pdf');
});

test('sin cliente escrito sigue saliendo un nombre válido', async () => {
  const wa = loadConFormulario({ numero: 'AP-032', cliente: '' });
  const file = await wa.generarFormatoPdfFile();
  assert.match(file.name, /^Formato_AP-032_.+\.pdf$/);
});
