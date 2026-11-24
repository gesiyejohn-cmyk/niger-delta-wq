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
  assert.match(source, /Total Cations \(meq\/L\)/);
  assert.match(source, /Total Anions \(meq\/L\)/);
  assert.match(source, /sum of all measured major-ion equivalents for each sample/);
});
