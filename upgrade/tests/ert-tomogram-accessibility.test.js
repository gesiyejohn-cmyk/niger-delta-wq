import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/ERTTomogram.jsx', import.meta.url), 'utf8');

test('ERT interpolated cells are keyboard reachable and expose measured context', () => {
  assert.match(source, /role="button" tabIndex=\{0\}/);
  assert.match(source, /aria-label=\{\x60Interpolated resistivity/);
  assert.match(source, /onKeyDown=\{event => \{/);
  assert.match(source, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(source, /event\.preventDefault\(\); event\.stopPropagation\(\); selectGridCell\(cell\)/);
});

test('ERT cell selection reports the nearest imported measurement through the parent callback', () => {
  assert.match(source, /function selectGridCell\(cell\)/);
  assert.match(source, /const nearest = points\.reduce/);
  assert.match(source, /setSelectedCell\(\{ r: cell\.r, c: cell\.c, x, depth, value: cell\.value, nearest \}\)/);
  assert.match(source, /if \(nearest\) onCellSelect\(nearest\.point\)/);
});

test('ERT selected-cell details distinguish interpolation from imported measurements', () => {
  assert.match(source, /Selected tomogram cell/);
  assert.match(source, /Interpolated resistivity:/);
  assert.match(source, /Nearest imported measurement \(not the interpolated value\)/);
  assert.match(source, /Measured resistivity:/);
  assert.match(source, /Normalized offset:/);
  assert.match(source, /interpolation is not a new measurement/i);
});

test('ERT selected-cell state can be cleared and its detail panel is announced accessibly', () => {
  assert.match(source, /\{selectedCell && <section aria-live="polite"/);
  assert.match(source, /onClick=\{\(\) => setSelectedCell\(null\)\}>Clear selection/);
});
