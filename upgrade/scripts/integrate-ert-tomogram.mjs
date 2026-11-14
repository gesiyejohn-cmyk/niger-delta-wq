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
if (!source.includes('<ERTTomogram models={ert} />')) {
  const marker = '          <h3>Imported model data table</h3>';
  if (!source.includes(marker)) throw new Error('ERT insertion point not found; refusing to patch an unexpected page layout.');
  source = source.replace(marker, '          <ERTTomogram models={ert} />\n' + marker);
}
fs.writeFileSync(target, source);
console.log('Integrated guarded ERT 2D visualisation into GeophysicsPage.');
