import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGod, classifyGod, exportGodCSV, GOD_FACTORS } from '../src/engine/god.js';

test('GOD calculates the product of the three independently supplied factors', () => {
  const result = calculateGod({ g: 0.6, o: 0.7, d: 0.8 });
  assert.equal(result.index, 0.336);
  assert.equal(result.classification, 'Moderate vulnerability');
  assert.deepEqual(result.factors, { g: 0.6, o: 0.7, d: 0.8 });
});

test('GOD accepts the documented factor bounds and computes the endpoints', () => {
  assert.equal(calculateGod({ g: 0, o: 0.4, d: 0.6 }).index, 0);
  assert.equal(calculateGod({ g: 1, o: 1, d: 1 }).index, 1);
  assert.equal(GOD_FACTORS.length, 3);
});

test('GOD rejects missing, boolean, non-finite and out-of-range factor values', () => {
  for (const values of [null, {}, { g: 0.5, o: 0.7 }, { g: true, o: 0.7, d: 0.8 },
    { g: 0.5, o: 0.3, d: 0.8 }, { g: 0.5, o: 0.7, d: 1.1 },
    { g: '0x1', o: 0.7, d: 0.8 }, { g: Infinity, o: 0.7, d: 0.8 }]) {
    assert.throws(() => calculateGod(values));
  }
});

test('GOD classification uses lower-inclusive boundaries and the 0–1 index range', () => {
  assert.equal(classifyGod(0), 'Negligible vulnerability');
  assert.equal(classifyGod(0.1), 'Low vulnerability');
  assert.equal(classifyGod(0.3), 'Moderate vulnerability');
  assert.equal(classifyGod(0.5), 'High vulnerability');
  assert.equal(classifyGod(0.7), 'Extreme vulnerability');
  for (const value of [-0.01, 1.01, NaN, Infinity, '0.5']) assert.throws(() => classifyGod(value));
});

test('GOD CSV exports only GOD records with factor values and protects formula text', () => {
  const csv = exportGodCSV([
    { id: 'g1', siteId: 'Well 1', method: 'GOD intrinsic aquifer-vulnerability index', factors: { g: 0.6, o: 0.7, d: 0.8 }, index: 0.336, classification: 'Moderate vulnerability', notes: 'Field checked' },
    { id: 'd1', method: 'DRASTIC intrinsic vulnerability screening', weightedScore: 120 }
  ]);
  assert.ok(csv.includes('"g1"'));
  assert.ok(csv.includes('"0.6","0.7","0.8","0.336"'));
  assert.ok(!csv.includes('"d1"'));
  assert.throws(() => exportGodCSV(null));
});
