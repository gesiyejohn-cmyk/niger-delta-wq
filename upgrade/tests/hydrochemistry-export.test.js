import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHydrochemistryCSV } from '../src/engine/hydrochemistryExport.js';

function parseCsvRow(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { fields.push(field); field = ''; }
    else field += char;
  }
  fields.push(field);
  return fields;
}

test('hydrochemistry CSV uses one consistent schema for ion and total rows', () => {
  const sample = { sampleCode: 'NDWQ,"01"', stationName: 'Station A', collectionDate: '2026-11-26' };
  const ions = { Ca: 40.078, Mg: null, Cl: 35.45 };
  const balance = {
    meq: { Ca: 2, Mg: null, Cl: 1 },
    cationTotal: 2,
    anionTotal: 1,
    errorPercent: 33.333333,
    status: 'Outside ±5% screening tolerance'
  };
  const definitions = { Ca: { type: 'cation' }, Mg: { type: 'cation' }, Cl: { type: 'anion' } };
  const csv = buildHydrochemistryCSV(sample, ions, balance, definitions);
  const lines = csv.split('\r\n');
  const header = lines[0].split(',').length;
  assert.equal(lines.length, 5);
  assert.ok(lines.every(line => parseCsvRow(line).length === header));
  assert.match(csv, /"NDWQ,""01"""/);
  assert.match(csv, /"charge_balance_totals"/);
  assert.match(csv, /"2","1","33.333333","Outside ±5% screening tolerance"/);
  assert.match(csv, /"Mg","cation","",""/);
});

test('hydrochemistry CSV neutralizes spreadsheet formulas in sample and station text', () => {
  const csv = buildHydrochemistryCSV(
    { sampleCode: '=HYPERLINK("https://bad.example")', stationName: ' @SUM(1,1)', collectionDate: '2026-11-27' },
    { Ca: 1 },
    { meq: { Ca: 1 }, cationTotal: 1, anionTotal: 0, errorPercent: 100, status: 'Outside tolerance' },
    { Ca: { type: 'cation' } }
  );
  assert.ok(csv.includes(`"'=HYPERLINK(""https://bad.example"")"`));
  assert.ok(csv.includes(`"' @SUM(1,1)"`));
});

test('hydrochemistry CSV neutralizes formula-like text after a leading line break', () => {
  const csv = buildHydrochemistryCSV(
    { sampleCode: 'SAFE', stationName: '\n=HYPERLINK("https://bad.example")', collectionDate: '2026-11-27' },
    { Ca: 1 },
    { meq: { Ca: 1 }, cationTotal: 1, anionTotal: 0, errorPercent: 100, status: 'Outside tolerance' },
    { Ca: { type: 'cation' } }
  );
  assert.ok(csv.includes("'\n=HYPERLINK"));
});

test('hydrochemistry CSV rejects incomplete inputs', () => {
  assert.throws(() => buildHydrochemistryCSV(null, {}, {}, {}), /required/);
});
