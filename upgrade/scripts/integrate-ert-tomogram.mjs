import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { integrateERTTomogramSource } from '../src/engine/ertIntegration.js';

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const target = path.resolve('source/niger-delta-wq/src/pages/GeophysicsPage.jsx');
  const source = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(target, integrateERTTomogramSource(source));
  console.log('Integrated selected-line ERT 2D visualisation into GeophysicsPage.');
}
