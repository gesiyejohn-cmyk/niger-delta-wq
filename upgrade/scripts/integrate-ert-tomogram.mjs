import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const importLine = "import ERTTomogram from './ERTTomogram.jsx';";
const tomogramComponent = '<ERTTomogram models={activeERTModel ? [activeERTModel] : []} />';

export function integrateERTTomogramSource(input) {
  let source = input;

  if (!source.includes(importLine)) {
    const importAnchor = "import VESInterpretation from './VESInterpretation.jsx';";
    if (!source.includes(importAnchor)) {
      throw new Error('ERT import anchor not found; refusing to patch an unexpected page layout.');
    }
    source = source.replace(importAnchor, importAnchor + '\n' + importLine);
  }

  if (source.split(importLine).length !== 2) {
    throw new Error('Expected exactly one ERTTomogram import.');
  }

  // Keep interpolation scoped to the selected ERT line. Different survey lines can
  // have different distance origins, so combining them would create a misleading
  // synthetic section across unrelated coordinate systems.
  source = source.replaceAll('<ERTTomogram models={ert} />', tomogramComponent);

  if (!source.includes(tomogramComponent)) {
    const marker = '          <h3>Imported model data table</h3>';
    if (!source.includes(marker)) {
      throw new Error('ERT insertion point not found; refusing to patch an unexpected page layout.');
    }
    source = source.replace(marker, '          ' + tomogramComponent + '\n' + marker);
  }

  if (source.split(tomogramComponent).length !== 2) {
    throw new Error('Expected exactly one ERT tomogram component scoped to the selected survey line.');
  }

  return source;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const target = path.resolve('source/niger-delta-wq/src/pages/GeophysicsPage.jsx');
  const source = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(target, integrateERTTomogramSource(source));
  console.log('Integrated selected-line ERT 2D visualisation into GeophysicsPage.');
}
