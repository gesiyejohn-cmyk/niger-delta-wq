import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PARAMETER_REGISTRY } from '../src/engine/parameters.js';

const page = readFileSync(new URL('../src/pages/WQIPage.jsx', import.meta.url), 'utf8');

test('weighted WQI form follows the complete sample parameter registry', () => {
  const registryEntries = Object.entries(PARAMETER_REGISTRY);
  assert.ok(registryEntries.length > 7, 'the sample registry must remain broader than the former seven-field WQI form');
  assert.ok(registryEntries.every(([key, definition]) => key && definition?.name),
    'every registered parameter must provide a key and display name');

  assert.match(page, /import\s*\{\s*PARAMETER_REGISTRY\s*\}\s*from\s*['"]\.\.\/engine\/parameters\.js['"]/);
  assert.match(page, /const PARAMETERS = Object\.entries\(PARAMETER_REGISTRY\)\s*\.map\(\(\[key, definition\]\) => \[key, definition\.name\]\);/);
  assert.doesNotMatch(page, /const PARAMETERS\s*=\s*\[/,
    'the WQI form must not regress to a hard-coded subset of sample fields');
  assert.match(page, /PARAMETERS\.map\(\(\[key, label\]\) =>/,
    'the input rows must be generated from the registry-derived list');
});

test('weighted WQI form uses canonical sample values and units without inventing missing readings', () => {
  assert.match(page, /const raw = sample\?\.parameters\?\.\[key\]\?\.canonical;/);
  assert.match(page, /const unit = sample\?\.parameters\?\.\[key\]\?\.canonicalUnit \|\| 'canonical unit';/);
  assert.match(page, /unit: sample\?\.parameters\?\.\[key\]\?\.canonicalUnit \|\| 'canonical unit'/);
  assert.match(page, /const isBlank = raw == null \|\| \(typeof raw === 'string' && raw\.trim\(\) === ''\);/);
  assert.match(page, /measuredValue: item\.value \?\? null/);
  assert.doesNotMatch(page, /sample\?\.parameters\?\.\[key\]\?\.canonical\s*\|\|\s*0/,
    'a missing canonical measurement must never be converted to zero');
});
