const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const CONFIGURED_KEY = 'arpa_suite_settings_configured';

function mockLocalStorage(initial) {
  const store = Object.assign({}, initial || {});
  global.localStorage = {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem: function (key, value) {
      store[key] = String(value);
    },
    removeItem: function (key) {
      delete store[key];
    }
  };
}

mockLocalStorage({});
const brand = require('../js/arpa-brand.js');

describe('containsLegacyBrandText', () => {
  it('no da true con oficio automatismos + técnico real (falso positivo de hoy)', () => {
    const draft = JSON.stringify({
      _formatoOficio: 'automatismos',
      'campo-tecnico-responsable': 'Carlos Ruiz'
    });
    assert.equal(brand.containsLegacyBrandText(draft), false);
  });

  it('no da true con "automatismos" y "arlen" sueltos sin las frases del regex', () => {
    const blob = 'oficio automatismos, cliente Marlen Gomez, ciudad Medellin';
    assert.equal(brand.containsLegacyBrandText(blob), false);
  });

  it('sigue detectando el placeholder Automatismos Arlen Pav', () => {
    assert.equal(brand.containsLegacyBrandText('Automatismos Arlen Pav'), true);
  });

  it('sigue detectando el placeholder Automatismos Arlenpav', () => {
    assert.equal(brand.containsLegacyBrandText('Automatismos Arlenpav'), true);
  });
});

describe('isFakeDefaultSettings / isLegacyPreset / isLegacyFieldValue', () => {
  it('isFakeDefaultSettings reconoce Su Empresa S.A.S. + NIT 000', () => {
    assert.equal(brand.isFakeDefaultSettings({
      companyName: 'Su Empresa S.A.S.',
      nit: '000.000.000-0'
    }), true);
  });

  it('isLegacyFieldValue reconoce NIT legacy 901.473.259', () => {
    assert.equal(brand.isLegacyFieldValue('901.473.259'), true);
  });

  it('isLegacyPreset es false con empresa real sin patrones legacy', () => {
    assert.equal(brand.isLegacyPreset({
      companyName: 'Puertas del Norte SAS',
      nit: '900.111.222-3',
      technicianName: 'Carlos Ruiz'
    }), false);
  });
});

describe('shouldPurgeSettings / shouldPurgeDraft / hasUserSettings', () => {
  beforeEach(() => {
    mockLocalStorage({ [CONFIGURED_KEY]: 'true' });
  });

  it('hasUserSettings es true con el flag configurado', () => {
    assert.equal(brand.hasUserSettings(), true);
  });

  it('shouldPurgeSettings siempre false si el usuario ya configuró', () => {
    assert.equal(brand.shouldPurgeSettings({
      companyName: 'Automatismos Arlenpav',
      technicianName: 'arlen pavon',
      activeOficios: ['automatismos']
    }), false);
    assert.equal(brand.shouldPurgeSettings(null), false);
    assert.equal(brand.shouldPurgeSettings({}), false);
  });

  it('shouldPurgeDraft siempre false si el usuario ya configuró', () => {
    const dirty = JSON.stringify({
      _formatoOficio: 'automatismos',
      technicianName: 'arlen pavon'
    });
    assert.equal(brand.shouldPurgeDraft(dirty), false);
    assert.equal(brand.shouldPurgeDraft('{}'), false);
    assert.equal(brand.shouldPurgeDraft(''), false);
  });
});
