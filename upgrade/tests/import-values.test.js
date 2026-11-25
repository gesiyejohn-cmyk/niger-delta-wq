import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  isBlankImportValue,
  parseImportedNumericValue
} from '../src/engine/importValues.js';

test('bulk-import blank detection ignores whitespace without treating measured zero as missing', () => {
  for (const value of [null, undefined, '', ' ', '\t', '\r\n', '  \t  ']) {
    assert.equal(isBlankImportValue(value), true);
  }
  for (const value of [0, -0, '0', ' 0 ', 0.0, 0.0001, false]) {
    assert.equal(isBlankImportValue(value), false);
  }
});

test('bulk-import numeric parsing skips blank cells but preserves real zero values', () => {
  for (const value of [null, undefined, '', ' ', '\t', '\r\n']) {
    assert.equal(parseImportedNumericValue(value), null);
  }
  assert.equal(parseImportedNumericValue(0), 0);
  assert.equal(parseImportedNumericValue('0'), 0);
  assert.equal(parseImportedNumericValue(' 0 '), 0);
  assert.equal(parseImportedNumericValue(' 7.25 '), 7.25);
});

test('bulk-import numeric parsing rejects booleans and non-finite or non-numeric cells', () => {
  for (const value of [false, true, 'not a number', 'NaN', 'Infinity', Infinity, -Infinity, NaN]) {
    assert.throws(() => parseImportedNumericValue(value), /Boolean spreadsheet cells|finite numeric measurement/);
  }
});

test('bulk importer applies blank and numeric guards to mapped metadata and parameter cells', async () => {
  const importer = await readFile(new URL('../src/pages/ImportPage.jsx', import.meta.url), 'utf8');
  assert.match(importer, /if \(!isBlankImportValue\(value\)\) meta\[key\] = value;/);
  assert.match(importer, /const numericValue = parseImportedNumericValue\(raw\);/);
  assert.match(importer, /toCanonical\(key, numericValue, unit\)/);
  assert.doesNotMatch(importer, /value: Number\(raw\)/);
});
