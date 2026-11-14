import test from 'node:test';
import assert from 'node:assert/strict';
import {
  schlumbergerGeometricFactor,
  calculateVES,
  validateVES,
  validateERT,
  descriptiveStats,
  pearsonCorrelation
} from '../src/engine/geophysics.js';

test('Schlumberger geometric factor uses AB/2 and MN/2', () => {
  assert.ok(Math.abs(schlumbergerGeometricFactor(10, 1) - Math.PI * 99 / 2) < 1e-10);
});
test('VES apparent resistivity is K times measured resistance', () => {
  const result = calculateVES({ ab2: 10, mn2: 1, resistance: 5 });
  assert.ok(Math.abs(result.apparentResistivity - result.geometricFactor * 5) < 1e-10);
});
test('VES example AB/2=10 m, MN/2=2 m, R=20 ohms calculates about 1507.96 ohm metres', () => {
  const result = calculateVES({ ab2: 10, mn2: 2, resistance: 20 });
  assert.ok(Math.abs(result.apparentResistivity - 1507.9644737231006) < 1e-8);
});
test('VES rejects invalid electrode geometry', () => {
  assert.throws(() => calculateVES({ ab2: 1, mn2: 1, resistance: 5 }));
});
test('VES can store one complete reading while curve remains partial', () => {
  const result = validateVES([{ ab2: 10, mn2: 2, resistance: 20 }]);
  assert.equal(result.length, 1);
  assert.ok(result[0].apparentResistivity > 0);
});
test('VES requires strictly increasing AB/2 values', () => {
  assert.throws(() => validateVES([
    { ab2: 10, mn2: 2, resistance: 20 },
    { ab2: 10, mn2: 2, resistance: 15 }
  ]));
});
test('ERT import rejects non-positive resistivity', () => {
  assert.throws(() => validateERT([{ x: 0, depth: 1, resistivity: 0 }]));
});
test('descriptive statistics use measured numeric values', () => {
  const stats = descriptiveStats([1, 2, 3]);
  assert.equal(stats.mean, 2);
  assert.equal(stats.median, 2);
  assert.equal(stats.min, 1);
  assert.equal(stats.max, 3);
});
test('Pearson correlation detects perfect positive association', () => {
  assert.equal(pearsonCorrelation([1, 2, 3], [2, 4, 6]), 1);
});
