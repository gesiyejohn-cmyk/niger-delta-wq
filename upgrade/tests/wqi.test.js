import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeightedArithmeticWQI } from '../src/engine/wqi.js';

test('weighted arithmetic WQI normalises weights and calculates index', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'tds', label: 'TDS', value: 100, standard: 500, ideal: 0 },
    { key: 'nitrate', label: 'Nitrate', value: 10, standard: 50, ideal: 0 }
  ]);
  assert.equal(result.parameterCount, 2);
  assert.ok(Math.abs(result.details.reduce((sum, row) => sum + row.unitWeight, 0) - 1) < 1e-12);
  assert.ok(result.wqi > 0);
});
test('weighted arithmetic WQI excludes missing readings rather than converting them to zero', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'tds', value: 100, standard: 500, ideal: 0 },
    { key: 'nitrate', value: null, standard: 50, ideal: 0 },
    { key: 'iron', value: 0.1, standard: 0.3, ideal: 0 }
  ]);
  assert.equal(result.parameterCount, 2);
  assert.equal(result.missingExcluded, 1);
});
test('weighted arithmetic WQI requires two complete parameters and valid limits', () => {
  assert.throws(() => calculateWeightedArithmeticWQI([{ value: 1, standard: 2, ideal: 0 }]));
  assert.throws(() => calculateWeightedArithmeticWQI([{ value: 1, standard: 0, ideal: 0 }, { value: 2, standard: 3, ideal: 0 }]));
});
test('weighted arithmetic WQI rejects inputs that overflow quality ratings or weights', () => {
  assert.throws(() => calculateWeightedArithmeticWQI([
    { key: 'a', value: Number.MAX_VALUE, standard: 1, ideal: 0 },
    { key: 'b', value: 1, standard: 2, ideal: 0 }
  ]), /numeric range/);
  assert.throws(() => calculateWeightedArithmeticWQI([
    { key: 'a', value: 1, standard: Number.MIN_VALUE, ideal: 0 },
    { key: 'b', value: 1, standard: 2, ideal: 0 }
  ]), /numeric range/);
});
test('weighted arithmetic WQI gives zero quality rating at the ideal and 100 at the objective limit', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'a', value: 7, standard: 10, ideal: 7 },
    { key: 'b', value: 0, standard: 5, ideal: 0 }
  ]);
  assert.equal(result.details[0].qualityRating, 0);
  assert.equal(result.details[1].qualityRating, 0);
  const atLimit = calculateWeightedArithmeticWQI([
    { key: 'a', value: 10, standard: 10, ideal: 7 },
    { key: 'b', value: 5, standard: 5, ideal: 0 }
  ]);
  assert.equal(atLimit.details[0].qualityRating, 100);
  assert.equal(atLimit.details[1].qualityRating, 100);
});
test('weighted arithmetic WQI measures departures against the appropriate two-sided boundary', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'pH-low', value: 6, minStandard: 6, maxStandard: 8, ideal: 7 },
    { key: 'pH-high', value: 8, minStandard: 6, maxStandard: 8, ideal: 7 }
  ]);
  assert.equal(result.details[0].qualityRating, 100);
  assert.equal(result.details[1].qualityRating, 100);
});
test('weighted arithmetic WQI excludes blank and whitespace-only measurements and limits', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'tds', value: ' ', standard: 500, ideal: 0 },
    { key: 'nitrate', value: 10, standard: '  ', ideal: 0 },
    { key: 'iron', value: 0.1, standard: 0.3, ideal: 0 },
    { key: 'manganese', value: 0.2, standard: 0.5, ideal: 0 }
  ]);
  assert.equal(result.parameterCount, 2);
  assert.equal(result.missingExcluded, 2);
});
test('CCME WQI excludes whitespace-only readings instead of treating them as zero', async () => {
  const { computeDualWQI } = await import('../src/engine/wqi.js');
  const result = computeDualWQI({ ph: ' ', tds: 100, nitrate: 10 });
  assert.ok(!result.who.usedParams.includes('ph'));
  assert.ok(!result.son.usedParams.includes('ph'));
});

test('two-sided weighted arithmetic limits calculate against the relevant side of the ideal', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'pH-low', value: 6, minStandard: 6.5, maxStandard: 8.5, ideal: 7, weightStandard: 8.5 },
    { key: 'pH-high', value: 8, minStandard: 6.5, maxStandard: 8.5, ideal: 7, weightStandard: 8.5 }
  ]);
  assert.equal(result.details[0].applicableLimit, 6.5);
  assert.equal(result.details[1].applicableLimit, 8.5);
  assert.equal(result.details[0].qualityRating, 200);
  assert.ok(Math.abs(result.details[1].qualityRating - (200 / 3)) < 1e-12);
});
test('two-sided limits give zero at ideal and 100 at either boundary', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'low-bound', value: 6.5, minStandard: 6.5, maxStandard: 8.5, ideal: 7, weightStandard: 8.5 },
    { key: 'high-bound', value: 8.5, minStandard: 6.5, maxStandard: 8.5, ideal: 7, weightStandard: 8.5 }
  ]);
  assert.equal(result.details[0].qualityRating, 100);
  assert.equal(result.details[1].qualityRating, 100);
});
test('two-sided limits reject ideals outside the acceptable interval', () => {
  assert.throws(() => calculateWeightedArithmeticWQI([
    { value: 6, minStandard: 6.5, maxStandard: 8.5, ideal: 6 },
    { value: 7, minStandard: 6.5, maxStandard: 8.5, ideal: 7 }
  ]), /ideal value within those limits/);
});
