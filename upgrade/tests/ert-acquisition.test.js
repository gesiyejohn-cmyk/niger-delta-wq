import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateERTGeometricFactor,
  calculateERTMeasurement,
  validateERTMeasurements
} from '../src/engine/ertAcquisition.js';

test('general four-electrode geometry reproduces Wenner geometric factor', () => {
  const factor = calculateERTGeometricFactor({ A: 0, M: 1, N: 2, B: 3 });
  assert.ok(Math.abs(factor - 2 * Math.PI) < 1e-10);
});

test('general four-electrode geometry reproduces Schlumberger geometric factor', () => {
  const factor = calculateERTGeometricFactor({ A: -10, M: -2, N: 2, B: 10 });
  assert.ok(Math.abs(factor - 24 * Math.PI) < 1e-9);
});

test('general four-electrode geometry reproduces dipole-dipole n=1 factor', () => {
  const factor = calculateERTGeometricFactor({ A: 0, B: 1, M: 2, N: 3 });
  assert.ok(Math.abs(factor - 6 * Math.PI) < 1e-10);
});

test('ERT field measurement calculates apparent resistivity from measured resistance', () => {
  const result = calculateERTMeasurement({
    array: 'Wenner',
    electrodes: { A: 0, M: 1, N: 2, B: 3 },
    resistanceOhm: 10
  });
  assert.ok(Math.abs(result.apparentResistivity - 20 * Math.PI) < 1e-9);
  assert.equal(result.signedResistanceOhm, 10);
  assert.equal(result.inversionPerformed, false);
});

test('ERT field measurement derives signed transfer resistance from voltage/current', () => {
  const result = calculateERTMeasurement({
    array: 'Dipole-dipole',
    electrodes: { A: 0, B: 1, M: 2, N: 3 },
    voltageMv: -20,
    currentMa: 2
  });
  assert.equal(result.signedResistanceOhm, -10);
  assert.equal(result.polarity, -1);
  assert.ok(Math.abs(result.apparentResistivity - 60 * Math.PI) < 1e-9);
});

test('ERT field validation annotates the failing reading and does not accept zero current', () => {
  assert.throws(() => validateERTMeasurements([{
    array: 'Wenner',
    electrodes: { A: 0, M: 1, N: 2, B: 3 },
    voltageMv: 10,
    currentMa: 0
  }]), /ERT reading 1: Measured current must not be zero/);
});

test('ERT geometry rejects coincident or non-numeric electrodes', () => {
  assert.throws(() => calculateERTGeometricFactor({ A: 0, B: 1, M: 1, N: 3 }), /distinct positions/);
  assert.throws(() => calculateERTGeometricFactor({ A: 0, B: 1, M: '', N: 3 }), /finite position/);
});

test('ERT measurement rejects zero transfer resistance and unsupported arrays', () => {
  assert.throws(() => calculateERTMeasurement({
    array: 'Wenner',
    electrodes: { A: 0, M: 1, N: 2, B: 3 },
    resistanceOhm: 0
  }), /non-zero/);
  assert.throws(() => calculateERTMeasurement({
    array: 'Gradient',
    electrodes: { A: 0, M: 1, N: 2, B: 3 },
    resistanceOhm: 10
  }), /Unsupported ERT array/);
});

test('ERT measurement list rejects an empty field sequence', () => {
  assert.throws(() => validateERTMeasurements([]), /at least one complete ERT field measurement/);
});
