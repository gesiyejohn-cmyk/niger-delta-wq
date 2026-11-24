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


test('VES sounding and ERT imported-point graphs expose zoom, pan and reset controls', () => {
  const source = readFileSync(new URL('../src/pages/GeophysicsPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /function InteractiveChartFrame/);
  assert.match(source, /<InteractiveChartFrame title="VES sounding curve">/);
  assert.match(source, /<InteractiveChartFrame title="ERT resistivity point plot">/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /Reset view/);
});

test('ERT section drag suppresses the synthetic click so panning does not select a point', () => {
  const source = readFileSync(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');
  assert.match(source, /const suppressClick = useRef\(false\)/);
  assert.match(source, /Math\.hypot\(dx,dy\)>4/);
  assert.match(source, /function handleSectionClick\(event\)/);
  assert.match(source, /if \(suppressClick\.current\) \{[\s\S]*?suppressClick\.current = false;[\s\S]*?return;/);
  assert.match(source, /onClick=\{handleSectionClick\}/);
});

test('ERT tomogram captures touch gestures for two-axis pan and cleans up lost pointer capture', () => {
  const source = readFileSync(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');
  assert.match(source, /onLostPointerCapture=\{\(\)=>setDrag\(null\)\}/);
  assert.match(source, /touchAction:'none'/);
});
