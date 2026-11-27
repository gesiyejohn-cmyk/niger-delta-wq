import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('geophysics page exposes separate raw four-electrode ERT acquisition and inverted-model import', async () => {
  const source = await readFile(new URL('../src/pages/GeophysicsPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /calculateERTMeasurement/);
  assert.match(source, /saveERTFieldReadings/);
  assert.match(source, /listERTFieldReadings/);
  assert.match(source, /ertFieldReadingsToCSV/);
  assert.match(source, /Export field readings CSV/);
  assert.match(source, /\['A', 'B', 'M', 'N'\]/);
  assert.match(source, /Electrode \{key\} position/);
  assert.match(source, /Save raw ERT field readings/);
  assert.match(source, /Import an inverted ERT model/);
  assert.match(source, /raw field observations, not an inverted subsurface model/);
});


test('geophysics page exposes evidence-led manual ERT geological interpretation', async () => {
  const page = await readFile(new URL('../src/pages/GeophysicsPage.jsx', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../src/pages/ERTGeologicalInterpretation.jsx', import.meta.url), 'utf8');
  assert.match(page, /ERTGeologicalInterpretation/);
  assert.match(page, /model={activeERTModel}/);
  assert.match(editor, /validateGeologicalInterpretation/);
  assert.match(editor, /saveERTInterpretation/);
  assert.match(editor, /confidence/);
  assert.match(editor, /aquiferPotential/);
  assert.match(editor, /Evidence \/ correlation notes/);
  assert.match(editor, /Resistivity values do not automatically determine lithology/);
});
