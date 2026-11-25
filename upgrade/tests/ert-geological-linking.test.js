import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const tomogram = read('../src/pages/ERTTomogram.jsx');
const editor = read('../src/pages/GeologicalInterpretationEditor.jsx');
const page = read('../src/pages/GeophysicsPage.jsx');

test('ERT tomogram receives and renders the shared depth cursor', () => {
  assert.match(tomogram, /selectedDepth = null/);
  assert.match(tomogram, /Selected profile depth/);
  assert.match(tomogram, /y1=\{28 \+ \(\(Number\(selectedDepth\) - grid\.z0\)/);
});

test('geological section sends click depth and arrow-key depth changes to its parent', () => {
  assert.match(editor, /selectedDepth = null/);
  assert.match(editor, /onDepthChange = \(\) => \{\}/);
  assert.match(editor, /const depthFraction = Math\.max\(0, Math\.min\(1, \(plotY - 30\) \/ 300\)\)/);
  assert.match(editor, /event\.key === 'ArrowUp' \|\| event\.key === 'ArrowDown'/);
  assert.match(editor, /selectedDepth != null && <path d=\{'M70 '/);
});

test('geophysics page keeps one shared depth state and wires both views bidirectionally', () => {
  assert.match(page, /const \[selectedERTDepth, setSelectedERTDepth\] = useState\(null\)/);
  assert.match(page, /selectedDepth=\{selectedERTDepth\}/);
  assert.match(page, /onDepthChange=\{depth => \{ setSelectedERTDepth\(depth\)/);
  assert.match(page, /setSelectedERTDistance\(cell\.x\); setSelectedERTDepth\(cell\.depth\)/);
});
