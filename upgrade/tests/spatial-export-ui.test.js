import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('IDW grid CSV export remains accessible when mobile downloads fail', () => {
  const source = readFileSync(new URL('../src/pages/SpatialAnalysisPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /setIdwCsv\\(csv\\)/);
  assert.match(source, /IDW grid CSV fallback/);
  assert.match(source, /navigator\\.clipboard\\?\\.writeText/);
  assert.match(source, /ndwq-idw-grid-csv/);
  assert.match(source, /setSelectionRange\\(0,field\\.value\\.length\\)/);
  assert.match(source, /a\\.download=/);
});
