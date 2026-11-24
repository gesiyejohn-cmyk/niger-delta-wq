import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('analytics charts expose zoom, pan and reset controls', () => {
  const source = readFileSync(new URL('../src/pages/AnalyticsPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /Zoom in/);
  assert.match(source, /Zoom out/);
  assert.match(source, /Reset view/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /scale\(\$\{zoom\}\)/);
});

test('hydrochemistry diagrams expose the same zoom and pan interactions', () => {
  const source = readFileSync(new URL('../src/pages/HydrochemistryPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /Zoom in/);
  assert.match(source, /Zoom out/);
  assert.match(source, /Reset view/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
});

test('ERT interpolated sections expose zoom, directional pan, reset and pointer-drag controls', () => {
  const source = readFileSync(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');
  assert.match(source, /Zoom in/);
  assert.match(source, /Zoom out/);
  assert.match(source, /Reset view/);
  assert.match(source, /Pan →/);
  assert.match(source, /Pan ↓/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /onPointerCancel/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /viewBox=\{\x60\$\{view\.x\} \$\{view\.y\} \$\{view\.w\} \$\{view\.h\}\x60\}/);
});
