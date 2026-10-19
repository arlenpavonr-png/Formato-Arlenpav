/**
 * País por defecto: la zona horaria manda sobre el idioma (celulares en México con idioma "es" o "es-US").
 * node --test tests/pais-zona-horaria.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'arpa-pricing.js'), 'utf8');

function loadPricing(timeZone, language) {
  const RealDTF = Intl.DateTimeFormat;
  const fakeIntl = Object.assign({}, Intl, {
    DateTimeFormat: function (...args) {
      const dtf = new RealDTF(...args);
      const opts = dtf.resolvedOptions();
      dtf.resolvedOptions = () => Object.assign({}, opts, { timeZone });
      return dtf;
    }
  });
  const win = { console, Intl: fakeIntl, navigator: { language }, localStorage: { getItem: () => null, setItem() {} } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(code, win);
  return win.ArpaPricing;
}

test('celular en México con idioma genérico: México, MXN y RFC', () => {
  for (const tz of ['America/Monterrey', 'America/Mexico_City', 'America/Cancun', 'America/Tijuana']) {
    for (const lang of ['es', 'es-US', 'es-419', 'en-US']) {
      const p = loadPricing(tz, lang);
      assert.strictEqual(p.detectDefaultCountryFromLocale(), 'MX', `${tz} ${lang}`);
      assert.strictEqual(p.getDefaultCurrency(), 'MXN', `${tz} ${lang}`);
      assert.strictEqual(p.getTaxIdLabel(), 'RFC', `${tz} ${lang}`);
    }
  }
});

test('Colombia, Perú y Chile por zona horaria', () => {
  assert.strictEqual(loadPricing('America/Bogota', 'es-MX').detectDefaultCountryFromLocale(), 'CO');
  assert.strictEqual(loadPricing('America/Lima', 'es').getDefaultCurrency(), 'PEN');
  assert.strictEqual(loadPricing('America/Santiago', 'es').getDefaultCurrency(), 'CLP');
});

test('zona horaria desconocida: se usa el idioma como antes', () => {
  assert.strictEqual(loadPricing('Europe/Madrid', 'es-MX').detectDefaultCountryFromLocale(), 'MX');
  assert.strictEqual(loadPricing('America/New_York', 'es-US').detectDefaultCountryFromLocale(), 'US');
  assert.strictEqual(loadPricing('', 'es').detectDefaultCountryFromLocale(), 'CO');
  assert.strictEqual(loadPricing('Europe/Madrid', 'es').getDefaultCurrency(), 'COP');
});
