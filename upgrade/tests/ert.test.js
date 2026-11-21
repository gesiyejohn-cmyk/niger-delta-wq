import test from 'node:test';
import assert from 'node:assert/strict';
import { buildERTGrid, interpolateERTResistivity } from '../src/engine/ert.js';

const gridPoints = [];
for (const depth of [1, 2, 3]) for (const x of [0, 5, 10]) {
  gridPoints.push({ x, depth, resistivity: 100 + x * 2 + depth });
}

test('ERT interpolation returns the exact source value at a model cell', () => {
  assert.equal(interpolateERTResistivity(gridPoints, 5, 2), 112);
});
test('ERT interpolation between source cells is finite and positive', () => {
  const value = interpolateERTResistivity(gridPoints, 2.5, 1.5);
  assert.ok(Number.isFinite(value) && value > 0);
});
test('ERT grid builder creates a 2D grid from sufficiently covered data', () => {
  const result = buildERTGrid(gridPoints);
  assert.ok(result);
  assert.equal(result.method, 'log-resistivity inverse-distance weighting');
  assert.equal(result.inversionPerformed, false);
  assert.ok(result.values.length > 0);
});
test('ERT grid builder refuses sparse or one-dimensional point sets', () => {
  assert.equal(buildERTGrid(gridPoints.slice(0, 4)), null);
  assert.equal(buildERTGrid([{ x: 0, depth: 1, resistivity: 10 }, { x: 5, depth: 1, resistivity: 20 }, { x: 10, depth: 1, resistivity: 30 }]), null);
});

test('ERT interpolation rejects invalid model points and duplicate grid cells', () => {
  assert.throws(() => interpolateERTResistivity([
    { x: 0, depth: 1, resistivity: -10 }
  ], 1, 1), /finite distance, non-negative depth and positive resistivity/);
  assert.throws(() => interpolateERTResistivity([
    { x: 0, depth: 1, resistivity: 10 },
    { x: 0, depth: 1, resistivity: 20 }
  ], 1, 1), /duplicate distance\/depth cells/);
  assert.throws(() => interpolateERTResistivity(gridPoints, Number.NaN, 1), /coordinates must be finite/);
});

test('ERT interpolation remains finite for large but representable survey coordinates', () => {
  const points = [
    { x: 1e150, depth: 1e150, resistivity: 10 },
    { x: 1.1e150, depth: 1e150, resistivity: 100 }
  ];
  const value = interpolateERTResistivity(points, 1.05e150, 1e150);
  assert.ok(Number.isFinite(value) && value > 0);
});

test('ERT grid builder validates malformed sparse input instead of silently declining it', () => {
  assert.throws(() => buildERTGrid([
    { x: 0, depth: 1, resistivity: 0 },
    { x: 1, depth: 1, resistivity: 10 }
  ]), /positive resistivity/);
});

test('ERT interpolation rejects blank, boolean and object-valued coordinates', () => {
  assert.throws(() => interpolateERTResistivity(gridPoints, '', 1), /coordinates must be finite/);
  assert.throws(() => interpolateERTResistivity(gridPoints, false, 1), /coordinates must be finite/);
  assert.throws(() => interpolateERTResistivity([
    { x: false, depth: 1, resistivity: 10 }
  ], 1, 1), /finite distance/);
  assert.throws(() => interpolateERTResistivity([
    { x: 0, depth: 1, resistivity: ' ' }
  ], 1, 1), /positive resistivity/);
});
