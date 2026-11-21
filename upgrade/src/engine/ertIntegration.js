const importLine = "import ERTTomogram from './ERTTomogram.jsx';";

export function integrateERTTomogramSource(input) {
  let source = input;
  if (!source.includes(importLine)) {
    const importAnchor = "import VESInterpretation from './VESInterpretation.jsx';";
    if (!source.includes(importAnchor)) throw new Error('ERT import anchor not found; refusing to patch an unexpected page layout.');
    source = source.replace(importAnchor, importAnchor + '\n' + importLine);
  }
  if (source.split(importLine).length !== 2) throw new Error('Expected exactly one ERTTomogram import.');
  source = source.replaceAll('<ERTTomogram models={ert} />', '<ERTTomogram models={activeERTModel ? [activeERTModel] : []} />');
  const invocations = source.match(/<ERTTomogram\b/g) || [];
  if (invocations.length === 0) {
    const marker = '          <h3>Imported model data table</h3>';
    if (!source.includes(marker)) throw new Error('ERT insertion point not found; refusing to patch an unexpected page layout.');
    source = source.replace(marker, '          <ERTTomogram models={activeERTModel ? [activeERTModel] : []} />\n' + marker);
  }
  if ((source.match(/<ERTTomogram\b/g) || []).length !== 1) throw new Error('Expected exactly one ERT tomogram component.');
  return source;
}
