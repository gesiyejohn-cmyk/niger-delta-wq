import test from 'node:test';
import assert from 'node:assert/strict';
import { panERTView, zoomERTView } from '../src/engine/ertView.js';

test('ERT zoom preserves the view centre while increasing magnification', () => {
  const view = zoomERTView({ x: 0, y: 0, zoom: 1 }, 2);
  assert.deepEqual(view, { x: 190, y: 97.5, zoom: 2 });
});

test('ERT zoom is bounded and zooming back out returns to the full section', () => {
  const maximum = zoomERTView({ x: 0, y: 0, zoom: 4 }, 10);
  assert.deepEqual(maximum, { x: 304, y: 156, zoom: 5 });
  const full = zoomERTView(maximum, 0.01);
  assert.deepEqual(full, { x: 0, y: 0, zoom: 1 });
});

test('ERT pan converts pointer movement into viewBox movement at current scale', () => {
  const start = { x: 100, y: 50, zoom: 2 };
  assert.deepEqual(panERTView(start, -50, -25, 380, 195), {
    x: 150, y: 75, zoom: 2
  });
});

test('ERT pan clamps the view to the tomogram bounds', () => {
  assert.deepEqual(panERTView({ x: 0, y: 0, zoom: 2 }, 10000, 10000, 760, 390), {
    x: 0, y: 0, zoom: 2
  });
  assert.deepEqual(panERTView({ x: 380, y: 195, zoom: 2 }, -10000, -10000, 760, 390), {
    x: 380, y: 195, zoom: 2
  });
});

test('ERT view navigation rejects invalid zoom and viewport inputs', () => {
  assert.throws(() => zoomERTView({ x: 0, y: 0, zoom: 1 }, 0), /positive number/);
  assert.throws(() => zoomERTView({ x: 0, y: 0, zoom: 6 }, 1), /zoom between 1 and 5/);
  assert.throws(() => panERTView({ x: 0, y: 0, zoom: 2 }, 1, 1, 0, 100), /positive viewport/);
});
