import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { panERTView, zoomERTView } from '../src/engine/ertView.js';

test('ERT tomogram exposes accessible zoom controls and a reset action', async () => {
  const page = await readFile(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');
  assert.match(page, /import \{ panERTView, zoomERTView \} from ['"]\.\.\/engine\/ertView\.js['"]/);
  assert.match(page, /aria-label="ERT tomogram navigation"/);
  assert.match(page, /aria-label="Zoom in on ERT tomogram"/);
  assert.match(page, /aria-label="Zoom out on ERT tomogram"/);
  assert.match(page, /setView\(\{x:0,y:0,zoom:1\}\)/);
  assert.match(page, /aria-label="Interpolated resistivity section"/);
});

test('ERT tomogram captures pointer input and converts drag movement through the tested view helper', async () => {
  const page = await readFile(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');
  assert.match(page, /setPointerCapture\(event\.pointerId\)/);
  assert.match(page, /onPointerDown=\{startPan\}/);
  assert.match(page, /onPointerMove=\{movePan\}/);
  assert.match(page, /onPointerUp=\{endPan\}/);
  assert.match(page, /onPointerCancel=\{endPan\}/);
  assert.match(page, /panERTView\(\s*drag\.current\.view/);
  assert.match(page, /touchAction:'none'/);
});

test('ERT zoom and pan remain bounded for the rendered tomogram viewBox', () => {
  const zoomed = zoomERTView({ x: 0, y: 0, zoom: 1 }, 2);
  assert.deepEqual(zoomed, { x: 190, y: 97.5, zoom: 2 });
  const panned = panERTView(zoomed, -10000, -10000, 760, 390);
  assert.deepEqual(panned, { x: 380, y: 195, zoom: 2 });
  const restored = zoomERTView(panned, 0.01);
  assert.deepEqual(restored, { x: 0, y: 0, zoom: 1 });
});
