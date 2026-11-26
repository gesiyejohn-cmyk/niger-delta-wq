import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHydrochemistryCSV } from '../src/engine/hydrochemistryExport.js';

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
  const definitions = {
    Ca: { type: 'cation' }, Mg: { type: 'cation' }, Cl: { type: 'anion' }
  };
  const csv = buildHydrochemistryCSV(sample, ions, balance, definitions);
  const lines = csv.split('\\r\\n');
  const header = lines[0].split(',').length;
  assert.equal(lines.length, 5);
  assert.ok(lines.every(line => line.split(',').length === header));
  assert.match(csv, /"NDWQ,""01"""/);
  assert.match(csv, /"charge_balance_totals"/);
  assert.match(csv, /"2","1","33.333333","Outside ±5% screening tolerance"/);
  assert.match(csv, /"Mg","cation","",""/);
});

test('hydrochemistry CSV rejects incomplete inputs', () => {
  assert.throws(() => buildHydrochemistryCSV(null, {}, {}, {}), /required/);
});
