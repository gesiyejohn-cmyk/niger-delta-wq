import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('hydrochemistry CSV export remains accessible when Android download hand-off fails', () => {
  const source = readFileSync(new URL('../src/pages/HydrochemistryPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /setExportText\(csv\)/);
  assert.match(source, /CSV export fallback/);
  assert.match(source, /ndwq-hydrochemistry-csv/);
  assert.match(source, /navigator\.clipboard\?\.writeText/);
  assert.match(source, /document\.execCommand\('copy'\)/);
  assert.match(source, /Select and copy the CSV text below/);
});


test('charge-balance table labels cation and anion sums explicitly as totals', () => {
  const source = readFileSync(new URL('../src/pages/HydrochemistryPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /Total Cations \(meq\/L\)/);
  assert.match(source, /Total Anions \(meq\/L\)/);
  assert.match(source, /cation and anion columns are the sum of measured major-ion equivalents/);
});


test('hydrochemistry CSV export follows the checked sample selection', () => {
  const source = readFileSync(new URL('../src/pages/HydrochemistryPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /const exportSamples=samples\.filter\(s=>selected\.includes\(s\.id\)\)/);
  assert.match(source, /buildHydrochemistryCSV\(exportSamples\)/);
  assert.match(source, /disabled=\{!exportSamples\.length\}/);
  assert.match(source, /Download selected chemistry and facies CSV/);
});


test('hydrochemistry export exposes select-all, clear-selection and a visible selection count', () => {
  const source = readFileSync(new URL('../src/pages/HydrochemistryPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /onClick=\{\(\)=>setSelected\(samples\.map\(s=>s\.id\)\)\}>Select all/);
  assert.match(source, /onClick=\{\(\)=>setSelected\(\[\]\)\}>Clear selection/);
  assert.match(source, /\{exportSamples\.length\} of \{samples\.length\} sample\(s\) selected/);
});
