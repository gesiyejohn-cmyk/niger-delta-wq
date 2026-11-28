import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/HydrochemistryPage.jsx', import.meta.url), 'utf8');

test('hydrochemistry page wires the CSV export button to the download path', () => {
  assert.match(page, /import\s*\{\s*downloadText\s*\}\s*from\s*['"]\.\.\/storage\/export\.js['"]/);
  assert.match(page, /import\s*\{\s*buildHydrochemistryCSV\s*\}\s*from\s*['"]\.\.\/engine\/hydrochemistryExport\.js['"]/);
  assert.match(page, /function\s+exportCSV\s*\(\)/);
  assert.match(page, /buildHydrochemistryCSV\(sample,\s*chemistry\.ions,\s*chemistry\.balance,\s*ION_DEFINITIONS\)/);
  assert.match(page, /downloadText\(['"]hydrochemistry-/);
  assert.match(page, /onClick=\{exportCSV\}>Export hydrochemistry CSV/);
});

test('hydrochemistry summary table visibly reports both measured ion totals', () => {
  assert.match(page, /Total measured cations \(meq\/L\)/);
  assert.match(page, /chemistry\.balance\.cationTotal\.toFixed\(4\)/);
  assert.match(page, /Total measured anions \(meq\/L\)/);
  assert.match(page, /chemistry\.balance\.anionTotal\.toFixed\(4\)/);
});


test('Durov analysis receives only measured canonical pH and TDS values from the selected sample', () => {
  assert.match(page, /<DurovSchoellerPanel ions=\{chemistry\.ions\} auxiliary=\{\{/);
  assert.match(page, /pH:\s*sample\.parameters\?\.ph\?\.canonical\s*\?\?\s*null/);
  assert.match(page, /tds:\s*sample\.parameters\?\.tds\?\.canonical\s*\?\?\s*null/);
  const panel = readFileSync(new URL('../src/components/DurovSchoellerPanel.jsx', import.meta.url), 'utf8');
  assert.match(panel, /calculateDurovDiagram\(ions, auxiliary\)/);
  assert.match(panel, /result\.auxiliary\.pH/);
  assert.match(panel, /result\.auxiliary\.tds/);
});

test('Piper diagram exposes accessible zoom, drag-pan, and reset interactions', () => {
  assert.match(page, /aria-label="Piper diagram navigation"/);
  assert.match(page, /aria-label="Zoom in on Piper diagram"/);
  assert.match(page, /aria-label="Zoom out on Piper diagram"/);
  assert.match(page, /setPiperView\(\{ x: 0, y: 0, zoom: 1 \}\)/);
  assert.match(page, /setPointerCapture\(event\.pointerId\)/);
  assert.match(page, /onPointerDown=\{startPiperPan\}/);
  assert.match(page, /onPointerMove=\{movePiperPan\}/);
  assert.match(page, /onPointerUp=\{endPiperPan\}/);
  assert.match(page, /onPointerCancel=\{endPiperPan\}/);
  assert.match(page, /touchAction:'none'/);
});

test('hydrochemistry page labels unmeasured ions and does not infer zero for missing Piper groups', () => {
  assert.match(page, /Blank ions remain unmeasured/);
  assert.match(page, /Unmeasured/);
  assert.match(page, /Missing groups are not treated as zero/);
});
