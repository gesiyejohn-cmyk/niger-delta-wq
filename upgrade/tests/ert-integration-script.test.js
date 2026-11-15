import test from 'node:test';
import assert from 'node:assert/strict';
import { integrateERTTomogramSource } from '../scripts/integrate-ert-tomogram.mjs';

const importAnchor = "import VESInterpretation from './VESInterpretation.jsx';";
const marker = '          <h3>Imported model data table</h3>';
const selectedLineComponent = '<ERTTomogram models={activeERTModel ? [activeERTModel] : []} />';

function page(source = '') {
  return [
    "import React from 'react';",
    importAnchor,
    'export default function Page() {',
    '  return (',
    '    <section>',
    source,
    marker,
    '    </section>',
    '  );',
    '}'
  ].join('\n');
}

test('ERT integration adds one import and one selected-line component', () => {
  const result = integrateERTTomogramSource(page());
  assert.equal(result.split("import ERTTomogram from './ERTTomogram.jsx';").length - 1, 1);
  assert.equal(result.split(selectedLineComponent).length - 1, 1);
});

test('ERT integration replaces the legacy all-lines component', () => {
  const result = integrateERTTomogramSource(page('<ERTTomogram models={ert} />'));
  assert.equal(result.includes('<ERTTomogram models={ert} />'), false);
  assert.equal(result.split(selectedLineComponent).length - 1, 1);
});

test('ERT integration is idempotent on an already integrated page', () => {
  const once = integrateERTTomogramSource(page());
  assert.equal(integrateERTTomogramSource(once), once);
});

test('ERT integration refuses to patch when its import anchor is missing', () => {
  assert.throws(
    () => integrateERTTomogramSource(page().replace(importAnchor, '')),
    /ERT import anchor not found/
  );
});

test('ERT integration refuses duplicate imports', () => {
  assert.throws(
    () => integrateERTTomogramSource(page().replace(importAnchor, importAnchor + '\n' + "import ERTTomogram from './ERTTomogram.jsx';")),
    /exactly one ERTTomogram import/
  );
});

test('ERT integration refuses to patch when its component insertion marker is missing', () => {
  assert.throws(
    () => integrateERTTomogramSource(page().replace(marker, '')),
    /ERT insertion point not found/
  );
});

test('ERT integration refuses duplicate tomogram components', () => {
  assert.throws(
    () => integrateERTTomogramSource(page(selectedLineComponent + '\n' + selectedLineComponent)),
    /exactly one ERT tomogram component/
  );
});
