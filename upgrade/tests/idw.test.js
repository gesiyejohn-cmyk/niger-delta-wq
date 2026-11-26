import test from 'node:test';
import assert from 'node:assert/strict';
import { convexHull, pointInConvexHull, idwInterpolate, generateIDWGrid } from '../src/engine/idw.js';

const samples = [
  { x: 0, y: 0, tds: 10 },
  { x: 100, y: 0, tds: 20 },
  { x: 0, y: 100, tds: 30 },
  { x: 100, y: 100, tds: 40 }
];

test('convex hull encloses the sample domain and rejects exterior points', () => {
  const hull = convexHull(samples);
  assert.equal(hull.length, 4);
  assert.equal(pointInConvexHull({ x: 50, y: 50 }, hull), true);
  assert.equal(pointInConvexHull({ x: 150, y: 50 }, hull), false);
});

test('IDW returns exact measured value at a sample location', () => {
  const result = idwInterpolate(samples, { x: 0, y: 0 }, { valueKey: 'tds' });
  assert.equal(result.value, 10);
  assert.equal(result.status, 'Exact sample location');
});

test('IDW interpolates inside hull and masks outside hull', () => {
  const inside = idwInterpolate(samples, { x: 50, y: 50 }, { valueKey: 'tds' });
  assert.equal(inside.status, 'Interpolated');
  assert.ok(inside.value > 10 && inside.value < 40);
  const outside = idwInterpolate(samples, { x: 150, y: 50 }, { valueKey: 'tds' });
  assert.equal(outside.value, null);
  assert.equal(outside.status, 'Outside sample convex hull');
});

test('IDW honours maximum search distance and neighbour count', () => {
  const result = idwInterpolate(samples, { x: 50, y: 50 }, {
    valueKey: 'tds', maxDistance: 1000, neighbours: 2, power: 2
  });
  assert.equal(result.used, 2);
  const none = idwInterpolate(samples, { x: 50, y: 50 }, {
    valueKey: 'tds', maxDistance: 1
  });
  assert.equal(none.value, null);
});

test('grid generator produces requested dimensions and hull masking', () => {
  const grid = generateIDWGrid(samples, { valueKey: 'tds', rows: 5, columns: 6 });
  assert.equal(grid.cells.length, 30);
  assert.equal(grid.rows, 5);
  assert.equal(grid.columns, 6);
  assert.ok(grid.cells.some(cell => cell.status === 'Interpolated' || cell.status === 'Exact sample location'));
  assert.match(grid.method, /not a groundwater-potential prediction/);
});

test('IDW rejects duplicate locations, invalid settings and insufficient points', () => {
  assert.throws(() => idwInterpolate([{x:0,y:0,value:1},{x:0,y:0,value:2},{x:1,y:1,value:3}], {x:0,y:0}));
  assert.throws(() => idwInterpolate(samples, {x:50,y:50}, {power:0}));
  assert.throws(() => idwInterpolate(samples, {x:50,y:50}, {neighbours:0}));
  assert.throws(() => idwInterpolate(samples.slice(0,2), {x:0,y:0}));
});
