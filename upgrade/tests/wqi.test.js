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

test('CCME WQI treats blank custom objectives as omitted, not as zero', async () => {
  const { computeDualWQI } = await import('../src/engine/wqi.js');
  const baseline = computeDualWQI({ ph: 7 });
  const withBlankOverride = computeDualWQI({ ph: 7 }, {
    overrides: { ph: { who: { min: ' ' } } }
  });
  assert.equal(withBlankOverride.who.wqi, baseline.who.wqi);
});

test('CCME WQI rejects non-numeric, negative and contradictory custom objectives', async () => {
  const { computeDualWQI } = await import('../src/engine/wqi.js');
  assert.throws(() => computeDualWQI({ ph: 7 }, {
    overrides: { ph: { who: { max: 'not-a-number' } } }
  }), /finite, non-negative number/);
  assert.throws(() => computeDualWQI({ ph: 7 }, {
    overrides: { ph: { who: { min: -1 } } }
  }), /finite, non-negative number/);
  assert.throws(() => computeDualWQI({ ph: 7 }, {
    overrides: { ph: { who: { min: 9, max: 8 } } }
  }), /lower objective must be below/);
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


test('one-sided weighted arithmetic limits penalize only departures toward the stated limit', () => {
  const result = calculateWeightedArithmeticWQI([
    { key: 'upper-only-better-side', value: 0.5, maxStandard: 10, ideal: 1, weightStandard: 10 },
    { key: 'lower-only-better-side', value: 15, minStandard: 5, ideal: 10, weightStandard: 5 },
    { key: 'upper-only-exceedance', value: 5, maxStandard: 10, ideal: 0, weightStandard: 10 },
    { key: 'lower-only-shortfall', value: 7, minStandard: 5, ideal: 10, weightStandard: 5 }
  ]);
  assert.equal(result.details[0].qualityRating, 0);
  assert.equal(result.details[1].qualityRating, 0);
  assert.equal(result.details[2].qualityRating, 50);
  assert.equal(result.details[3].qualityRating, 60);
});


test('one-sided weighted arithmetic limits score the boundary at 100 and scale beyond it', () => {
  const upper = calculateWeightedArithmeticWQI([
    { key: 'upper-at-ideal', value: 0, maxStandard: 10, ideal: 0 },
    { key: 'upper-at-limit', value: 10, maxStandard: 10, ideal: 0 },
    { key: 'upper-beyond-limit', value: 15, maxStandard: 10, ideal: 0 }
  ]);
  assert.deepEqual(upper.details.map(row => row.qualityRating), [0, 100, 150]);

  const lower = calculateWeightedArithmeticWQI([
    { key: 'lower-at-ideal', value: 10, minStandard: 5, ideal: 10 },
    { key: 'lower-at-limit', value: 5, minStandard: 5, ideal: 10 },
    { key: 'lower-beyond-limit', value: 2.5, minStandard: 5, ideal: 10 }
  ]);
  assert.deepEqual(lower.details.map(row => row.qualityRating), [0, 100, 150]);
});

test('CCME WQI rejects nonblank measurements that are not finite numbers', async () => {
  const { computeDualWQI } = await import('../src/engine/wqi.js');
  assert.throws(() => computeDualWQI({ ph: 'not-a-number', tds: 100 }),
    /pH: measurement must be a finite number/);
  assert.throws(() => computeDualWQI({ ph: Infinity, tds: 100 }),
    /pH: measurement must be a finite number/);
  assert.throws(() => computeDualWQI({ ph: 'NaN', tds: 100 }),
    /pH: measurement must be a finite number/);
});

test('single-sample CCME WQI explicitly discloses that F1 and F2 have identical coverage', async () => {
  const { computeDualWQI } = await import('../src/engine/wqi.js');
  const result = computeDualWQI({ ph: 7, tds: 100, nitrate: 10 });
  assert.equal(result.who.F1, result.who.F2);
  assert.equal(result.son.F1, result.son.F2);
  assert.match(result.disclaimer, /one observation per parameter/);
  assert.match(result.disclaimer, /multi-sample dataset/);
});

test('dataset-level CCME WQI distinguishes failed variables from failed individual tests', async () => {
  const { computeDualWQIDataset } = await import('../src/engine/wqi.js');
  const result = computeDualWQIDataset([
    { sampleCode: 'A', ph: 7, tds: 100 },
    { sampleCode: 'B', ph: 10, tds: 100 }
  ]);
  assert.equal(result.method, 'CCME WQI (multi-sample dataset)');
  assert.equal(result.who.samples, 2);
  assert.equal(result.who.tests, 4);
  assert.equal(result.who.testedVariables, 2);
  assert.equal(result.who.F1, 50);
  assert.equal(result.who.F2, 25);
  assert.notEqual(result.who.F1, result.who.F2);
  assert.equal(result.son.F1, 50);
  assert.equal(result.son.F2, 25);
});

test('dataset-level CCME WQI excludes missing observations and rejects invalid nonblank values', async () => {
  const { computeDualWQIDataset } = await import('../src/engine/wqi.js');
  const result = computeDualWQIDataset([
    { sampleCode: 'A', ph: 7, tds: 100 },
    { sampleCode: 'B', ph: ' ', tds: 100 }
  ]);
  assert.equal(result.who.tests, 3);
  assert.equal(result.who.testedVariables, 2);
  assert.throws(() => computeDualWQIDataset([
    { sampleCode: 'A', ph: 'invalid', tds: 100 }
  ]), /A — pH: measurement must be a finite number/);
});

test('dataset-level CCME WQI handles an empty dataset without inventing a score', async () => {
  const { computeDualWQIDataset } = await import('../src/engine/wqi.js');
  const result = computeDualWQIDataset([]);
  assert.equal(result.who.wqi, null);
  assert.equal(result.son.wqi, null);
  assert.equal(result.who.status, 'No data');
});


test('WQI calculations reject booleans and object-valued measurements and limits', async () => {
  const { computeDualWQI, computeDualWQIDataset } = await import('../src/engine/wqi.js');
  assert.throws(() => calculateWeightedArithmeticWQI([
    { key: 'a', value: true, standard: 10, ideal: 0 },
    { key: 'b', value: 2, standard: 10, ideal: 0 }
  ]), /valid lower\/upper limits/);
  assert.throws(() => calculateWeightedArithmeticWQI([
    { key: 'a', value: 1, standard: {}, ideal: 0 },
    { key: 'b', value: 2, standard: 10, ideal: 0 }
  ]), /valid lower\/upper limits/);
  assert.throws(() => computeDualWQI({ ph: true, tds: 100 }),
    /pH: measurement must be a finite number/);
  assert.throws(() => computeDualWQIDataset([{ ph: {}, tds: 100 }]),
    /pH: measurement must be a finite number/);
});


test('weighted arithmetic WQI rejects malformed nonblank readings even before limits are configured', () => {
  assert.throws(() => calculateWeightedArithmeticWQI([
    { key: 'lead', label: 'Lead', value: 'not recorded?' },
    { key: 'tds', value: 100, standard: 500, ideal: 0 },
    { key: 'nitrate', value: 10, standard: 50, ideal: 0 }
  ]), /Lead: measurement must be a finite number/);
  assert.throws(() => calculateWeightedArithmeticWQI([
    { key: 'lead', value: true },
    { key: 'tds', value: 100, standard: 500, ideal: 0 },
    { key: 'nitrate', value: 10, standard: 50, ideal: 0 }
  ]), /Lead: measurement must be a finite number/);
});
