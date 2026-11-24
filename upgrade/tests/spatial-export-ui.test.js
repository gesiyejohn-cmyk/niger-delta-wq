import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('IDW grid CSV export remains accessible when mobile downloads fail', () => {
  const source = readFileSync(new URL('../src/pages/SpatialAnalysisPage.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('setIdwCsv(csv)'));
  assert.ok(source.includes('IDW grid CSV fallback'));
  assert.ok(source.includes('navigator.clipboard?.writeText'));
  assert.ok(source.includes('ndwq-idw-grid-csv'));
  assert.ok(source.includes('setSelectionRange(0,field.value.length)'));
  assert.ok(source.includes("a.download='ndwq-idw-'+parameter+'.csv'"));
});
