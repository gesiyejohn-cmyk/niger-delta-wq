import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve('source/niger-delta-wq/src/pages/GeophysicsPage.jsx');
let source = fs.readFileSync(target, 'utf8');

if (!source.includes("import ERTTomogram from './ERTTomogram.jsx';")) {
  source = source.replace(
    "import VESInterpretation from './VESInterpretation.jsx';",
    "import VESInterpretation from './VESInterpretation.jsx';\nimport ERTTomogram from './ERTTomogram.jsx';"
  );
}

// Keep interpolation scoped to the selected ERT line. Different survey lines can
// have different distance origins, so combining them would create a misleading
// synthetic section across unrelated coordinate systems.
const tomogramComponent = '<ERTTomogram models={activeERTModel ? [activeERTModel] : []} />';
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

fs.writeFileSync(target, source);
console.log('Integrated selected-line ERT 2D visualisation into GeophysicsPage.');
