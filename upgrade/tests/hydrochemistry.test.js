import test from 'node:test';
import assert from 'node:assert/strict';
import { mgLToMeqL, convertIonConcentrations, calculateChargeBalance, calculatePiperPercentages } from '../src/engine/hydrochemistry.js';

test('mg/L converts to meq/L using ionic charge and molar mass', () => {
  assert.ok(Math.abs(mgLToMeqL('Ca', 40.078) - 2) < 1e-10);
  assert.ok(Math.abs(mgLToMeqL('Cl', 35.45) - 1) < 1e-10);
});

test('blank and missing ion concentrations remain unmeasured', () => {
  const result = convertIonConcentrations({ Ca: 40.078, Mg: '', Na: null, Cl: 35.45 });
  assert.equal(result.Ca, 2);
  assert.equal(result.Mg, null);
  assert.equal(result.Na, null);
  assert.equal(result.Cl, 1);
});

test('charge balance is zero for equal measured cation and anion equivalents', () => {
  const result = calculateChargeBalance({ Na: 22.989769, Cl: 35.45 });
  assert.ok(Math.abs(result.errorPercent) < 1e-10);
  assert.equal(result.status, 'Within ±5% screening tolerance');
});

test('charge balance reports insufficient data instead of zero-filling an unmeasured side', () => {
  const result = calculateChargeBalance({ Ca: 20, Mg: '', Cl: null });
  assert.equal(result.errorPercent, null);
  assert.equal(result.status, 'Insufficient measured ions');
});

test('Piper cation and anion groups are normalized independently to 100 percent', () => {
  const result = calculatePiperPercentages({
    Ca: 40.078, Mg: 24.305, Na: 22.989769, K: '',
    Cl: 35.45, SO4: 48.03, HCO3: 61.0168, CO3: null
  });
  const cationSum = Object.values(result.cations).reduce((a, b) => a + b, 0);
  const anionSum = Object.values(result.anions).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(cationSum - 100) < 1e-10);
  assert.ok(Math.abs(anionSum - 100) < 1e-10);
  assert.equal('NaK' in result.cations, true);
  assert.equal('HCO3CO3' in result.anions, true);
});

test('negative and non-numeric concentrations are rejected', () => {
  assert.throws(() => mgLToMeqL('Ca', -1));
  assert.throws(() => mgLToMeqL('Ca', 'bad'));
  assert.throws(() => mgLToMeqL('Unknown', 1));
});
