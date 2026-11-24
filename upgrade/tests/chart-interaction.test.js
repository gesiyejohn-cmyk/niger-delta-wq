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

test('spatial IDW map explicitly enables zoom, drag, touch and keyboard navigation', () => {
  const source = readFileSync(new URL('../src/pages/SpatialAnalysisPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /L\.map\(el\.current,\{zoomControl:true,dragging:true,touchZoom:true,scrollWheelZoom:true,doubleClickZoom:true,keyboard:true\}\)/);
  assert.match(source, /aria-label="Interactive groundwater IDW map"/);
  assert.match(source, /Map controls: use \+\/− to zoom, drag to pan/);
});

test('vulnerability map explicitly enables zoom, drag, touch and keyboard navigation', () => {
  const source = readFileSync(new URL('../src/pages/VulnerabilityPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /L\.map\(mapElement\.current, \{ zoomControl: true, dragging: true, touchZoom: true, scrollWheelZoom: true, doubleClickZoom: true, keyboard: true \}\)/);
  assert.match(source, /aria-label="Interactive groundwater vulnerability map"/);
});


test('chart pan handlers track the initiating primary pointer and release cleanly', () => {
  for (const path of ['HydrochemistryPage.jsx', 'AnalyticsPage.jsx', 'GeophysicsPage.jsx']) {
    const source = readFileSync(new URL('../src/pages/' + path, import.meta.url), 'utf8');
    assert.match(source, /(?:event|e)\.isPrimary\s*===\s*false/);
    assert.match(source, /pointerId/);
    assert.match(source, /onLostPointerCapture/);
  }
  const ert = readFileSync(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');
  assert.match(ert, /drag\.pointerId!==event\.pointerId/);
  assert.match(ert, /onLostPointerCapture=\{\(\)=>setDrag\(null\)\}/);
  assert.match(ert, /suppressClick\.current=false/);
});


test('analytics correlation heatmap safely renders undefined correlations for zero-variance parameters', () => {
  const source = readFileSync(new URL('../src/pages/AnalyticsPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /title=\{v==null\?'Undefined: zero variance or insufficient paired data':v\.toFixed\(3\)\}/);
  assert.match(source, /v==null\?'—':v\.toFixed\(2\)/);
});

test('ERT and geological interpretation views share a responsive two-panel layout and selected-distance marker', () => {
  const page = readFileSync(new URL('../src/pages/GeophysicsPage.jsx', import.meta.url), 'utf8');
  const tomogram = readFileSync(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');
  assert.ok(page.includes("gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))'"));
  assert.match(page, /<ERTTomogram models=\{\[activeERTModel\]\} selectedDistance=\{selectedDistance\}/);
  assert.match(page, /<GeologicalInterpretationEditor model=\{activeERTModel\} selectedDistance=\{selectedDistance\}/);
  assert.match(tomogram, /selectedDistance = null/);
  assert.match(tomogram, /Selected profile distance/);
  assert.match(tomogram, /strokeDasharray="6 4"/);
  assert.match(page, /setSelectedDistance\(null\)/);
});
