import test from 'node:test';
import assert from 'node:assert/strict';
import { PARAMETER_REGISTRY } from '../src/engine/parameters.js';
import { availableUnits, toCanonical } from '../src/engine/units.js';
import {
  ION_DEFINITIONS,
  calculateChargeBalance,
  calculatePiperPercentages
} from '../src/engine/hydrochemistry.js';

// Mirror the persisted parameter record produced by SampleEditor and the
// ion-key lookup used by HydrochemistryPage. This guards the integration seam
// between the base application registry and the upgrade calculation engine.
function savedSample(measurements) {
  const parameters = {};
  for (const [key, raw] of Object.entries(measurements)) {
    if (raw === null || raw === undefined || raw === '') continue;
    const unit = availableUnits(key)[0];
    const converted = toCanonical(key, raw, unit);
    parameters[key] = {
      value: Number(raw),
      unit,
      canonical: converted.canonical,
      canonicalUnit: converted.unit
    };
  }
  return { sampleCode: 'REGISTRY-INTEGRATION', parameters };
}

function hydrochemistryInputs(sample) {
  return Object.fromEntries(
    Object.keys(ION_DEFINITIONS).map(ion => [
      ion,
      sample.parameters?.[ion.toLowerCase()]?.canonical ?? null
    ])
  );
}

test('hydrochemistry ion keys and canonical concentration units match the sample registry', () => {
  const expected = {
    Ca: 'ca', Mg: 'mg', Na: 'na', K: 'k',
    Cl: 'cl', SO4: 'so4', HCO3: 'hco3', CO3: 'co3',
    NO3: 'no3', F: 'f'
  };
  for (const [ion, key] of Object.entries(expected)) {
    assert.ok(PARAMETER_REGISTRY[key], `missing registry parameter: ${key}`);
    assert.equal(PARAMETER_REGISTRY[key].group, ION_DEFINITIONS[ion].type);
    assert.ok(availableUnits(key).length > 0);
  }
});

test('saved-sample-shaped records feed the hydrochemistry engine without key or unit mismatch', () => {
  const sample = savedSample({
    ca: 40.078, mg: 24.305, na: 22.989769, k: 39.0983,
    cl: 35.45, so4: 48.03, hco3: 61.0168, co3: 60.0089,
    no3: 62.0049, f: 18.9984
  });
  const inputs = hydrochemistryInputs(sample);
  for (const [ion, value] of Object.entries(inputs)) {
    assert.ok(Math.abs(value - ({
      Ca: 40.078, Mg: 24.305, Na: 22.989769, K: 39.0983,
      Cl: 35.45, SO4: 48.03, HCO3: 61.0168, CO3: 60.0089,
      NO3: 62.0049, F: 18.9984
    })[ion]) < 1e-9, `unexpected canonical value for ${ion}`);
  }
  const balance = calculateChargeBalance(inputs);
  assert.ok(Number.isFinite(balance.errorPercent));
  const piper = calculatePiperPercentages(inputs);
  assert.ok(Math.abs(Object.values(piper.cations).reduce((a, b) => a + b, 0) - 100) < 1e-9);
  assert.ok(Math.abs(Object.values(piper.anions).reduce((a, b) => a + b, 0) - 100) < 1e-9);
});

test('nitrate reported as nitrate-n is converted to canonical mg/L as nitrate before charge balance', () => {
  const converted = toCanonical('no3', 10, 'mg/L as NO3-N');
  assert.equal(converted.unit, 'mg/L as NO3');
  assert.ok(Math.abs(converted.canonical - 44.27) < 1e-9);
  const sample = {
    parameters: {
      no3: {
        value: 10,
        unit: 'mg/L as NO3-N',
        canonical: converted.canonical,
        canonicalUnit: converted.unit
      },
      na: {
        value: 22.989769,
        unit: 'mg/L',
        canonical: 22.989769,
        canonicalUnit: 'mg/L'
      }
    }
  };
  const inputs = hydrochemistryInputs(sample);
  assert.equal(inputs.NO3, converted.canonical);
  assert.ok(inputs.NO3 > 10);
});

test('blank registry values remain unmeasured while a measured zero remains zero', () => {
  const sample = savedSample({ ca: 0, mg: '', na: 22.989769 });
  const inputs = hydrochemistryInputs(sample);
  assert.equal(inputs.Ca, 0);
  assert.equal(inputs.Mg, null);
  assert.equal(inputs.Na, 22.989769);
});
