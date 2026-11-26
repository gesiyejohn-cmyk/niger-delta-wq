import test from 'node:test';
import assert from 'node:assert/strict';
test('ERT field CSV export includes survey geometry, signed resistance and calculated apparent resistivity', async () => {
  const { ertFieldReadingsToCSV } = await import('../src/engine/ertAcquisitionCsv.js');
  const csv = ertFieldReadingsToCSV([{
    surveyId: 'LINE-01',
    array: 'Wenner',
    electrodes: { A: 0, B: 3, M: 1, N: 2 },
    signedResistanceOhm: -10,
    polarity: -1,
    geometricFactor: 6.283185,
    apparentResistivity: 62.83185,
    recordedAt: '2026-11-27T10:00:00.000Z'
  }]);
  assert.equal(csv.split('\\r\\n').length, 2, 'CSV records must use standard CRLF line endings');
  assert.match(csv, /survey_id,array,A_m,B_m,M_m,N_m/);
  assert.match(csv, /LINE-01,Wenner,0,3,1,2,-10,-1,6.283185,62.83185/);
  assert.match(csv, /2026-11-27T10:00:00.000Z/);
});

test('ERT field CSV export escapes quotes and neutralizes spreadsheet formula text', async () => {
  const { ertFieldReadingsToCSV } = await import('../src/engine/ertAcquisitionCsv.js');
  const csv = ertFieldReadingsToCSV([{
    surveyId: '=HYPERLINK("https://bad.example")',
    array: 'Custom',
    electrodes: { A: 0, B: 3, M: 1, N: 2 },
    signedResistanceOhm: 1,
    geometricFactor: 1,
    apparentResistivity: 1
  }]);
  assert.match(csv, /"'=HYPERLINK(""https://bad.example"")"/);
});

test('ERT field CSV export rejects an empty reading list', async () => {
  const { ertFieldReadingsToCSV } = await import('../src/engine/ertAcquisitionCsv.js');
  assert.throws(() => ertFieldReadingsToCSV([]), /no saved ERT field readings/);
});
