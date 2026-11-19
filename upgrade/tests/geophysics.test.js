import test from 'node:test';
import assert from 'node:assert/strict';
import {
  schlumbergerGeometricFactor,
  calculateVES,
  validateVES,
  assessVESQuality,
  validateERT,
  descriptiveStats,
  pearsonCorrelation,
  classifyVESCurve,
  validateVESLayers
} from '../src/engine/geophysics.js';

test('Schlumberger geometric factor uses AB/2 and MN/2', () => {
  assert.ok(Math.abs(schlumbergerGeometricFactor(10, 1) - Math.PI * 99 / 2) < 1e-10);
});
test('VES apparent resistivity is K times measured resistance', () => {
  const result = calculateVES({ ab2: 10, mn2: 1, resistance: 5 });
  assert.ok(Math.abs(result.apparentResistivity - result.geometricFactor * 5) < 1e-10);
});
test('VES example AB/2=10 m, MN/2=2 m, R=20 ohms calculates about 1507.96 ohm metres', () => {
  const result = calculateVES({ ab2: 10, mn2: 2, resistance: 20 });
  assert.ok(Math.abs(result.apparentResistivity - 1507.9644737231006) < 1e-8);
});
test('VES rejects invalid electrode geometry', () => {
  assert.throws(() => calculateVES({ ab2: 1, mn2: 1, resistance: 5 }));
});
test('VES can store one complete reading while curve remains partial', () => {
  const result = validateVES([{ ab2: 10, mn2: 2, resistance: 20 }]);
  assert.equal(result.length, 1);
  assert.ok(result[0].apparentResistivity > 0);
});
test('VES requires strictly increasing AB/2 values', () => {
  assert.throws(() => validateVES([
    { ab2: 10, mn2: 2, resistance: 20 },
    { ab2: 10, mn2: 2, resistance: 15 }
  ]));
});
test('ERT import rejects non-positive resistivity', () => {
  assert.throws(() => validateERT([{ x: 0, depth: 1, resistivity: 0 }]));
});
test('descriptive statistics use measured numeric values', () => {
  const stats = descriptiveStats([1, 2, 3]);
  assert.equal(stats.mean, 2);
  assert.equal(stats.median, 2);
  assert.equal(stats.min, 1);
  assert.equal(stats.max, 3);
});
test('Pearson correlation detects perfect positive association', () => {
  assert.equal(pearsonCorrelation([1, 2, 3], [2, 4, 6]), 1);
});


test('VES curve trend classifies an H-type first-three-point trend', () => {
  const rows = [
    { ab2: 5, apparentResistivity: 100 },
    { ab2: 10, apparentResistivity: 70 },
    { ab2: 15, apparentResistivity: 90 }
  ];
  assert.equal(classifyVESCurve(rows).code, 'H');
});

test('VES curve trend requires at least three valid readings', () => {
  assert.equal(classifyVESCurve([{ ab2: 5, apparentResistivity: 100 }]).code, null);
});

test('VES layer validation calculates cumulative interface depths and half-space', () => {
  const result = validateVESLayers([
    { resistivity: 100, thickness: 5 },
    { resistivity: 35, thickness: 12 },
    { resistivity: 250, thickness: '' }
  ]);
  assert.equal(result[0].bottomDepth, 5);
  assert.equal(result[1].bottomDepth, 17);
  assert.equal(result[2].bottomDepth, null);
  assert.equal(result[2].thickness, null);
});

test('VES layer validation rejects missing or non-positive thickness', () => {
  assert.throws(() => validateVESLayers([
    { resistivity: 100, thickness: '' },
    { resistivity: 35, thickness: '' }
  ]));
});

test('descriptive statistics exclude null, undefined, blank and non-numeric values', () => {
  const stats = descriptiveStats([1, null, undefined, '', ' ', '2', 'not-a-number', 3]);
  assert.equal(stats.n, 3);
  assert.equal(stats.mean, 2);
  assert.equal(stats.min, 1);
  assert.equal(stats.max, 3);
  assert.equal(descriptiveStats([null, undefined, '']), null);
});
test('Pearson correlation uses pairwise complete observations without zero-filling', () => {
  assert.equal(pearsonCorrelation([1, null, 3, 4, ''], [2, 100, 6, 8, 10]), 1);
  assert.equal(pearsonCorrelation([1, null, 3], [2, 4, 6]), null);
  assert.equal(pearsonCorrelation([1, 2, 3], [2, '', 6]), null);
});

test('VES rejects finite inputs that overflow the geometric factor', () => {
  assert.throws(() => schlumbergerGeometricFactor(1e308, 1),
    /geometric factor is outside the supported numeric range/);
});

test('VES rejects apparent resistivity overflow and underflow', () => {
  assert.throws(() => calculateVES({ ab2: 10, mn2: 2, resistance: Number.MAX_VALUE }),
    /apparent resistivity is outside the supported numeric range/);
  assert.throws(() => calculateVES({ ab2: 1e-200, mn2: 5e-201, resistance: 1e-200 }),
    /geometric factor is outside the supported numeric range|apparent resistivity is outside the supported numeric range/);
});

test('ERT import rejects duplicate distance/depth cells', () => {
  assert.throws(() => validateERT([
    { x: 10, depth: 2, resistivity: 50 },
    { x: 10, depth: 2, resistivity: 80 }
  ]), /duplicate distance\/depth cells/);
});

test('ERT import accepts distinct cells with numeric strings', () => {
  const result = validateERT([
    { x: '10', depth: '2', resistivity: '50' },
    { x: '15', depth: '2', resistivity: '80' }
  ]);
  assert.equal(result[0].x, 10);
  assert.equal(result[1].resistivity, 80);
});


test('VES quality assessment flags incomplete rows without changing source data', () => {
  const rows = [
    { ab2: 5, mn2: 1, resistance: 10 },
    { ab2: 10, mn2: '', resistance: 12 }
  ];
  const before = structuredClone(rows);
  const result = assessVESQuality(rows);
  assert.equal(result.completeCount, 1);
  assert.equal(result.incompleteCount, 1);
  assert.equal(result.issues[0].code, 'incomplete-row');
  assert.deepEqual(rows, before);
});

test('VES quality assessment flags duplicate AB/2 and reports MN/2 changes as informational', () => {
  const result = assessVESQuality([
    { ab2: 5, mn2: 1, resistance: 10 },
    { ab2: 10, mn2: 1, resistance: 12 },
    { ab2: 10, mn2: 2, resistance: 8 }
  ]);
  assert.ok(result.issues.some(issue => issue.code === 'duplicate-ab2' && issue.severity === 'error'));
  assert.ok(result.issues.some(issue => issue.code === 'mn2-change' && issue.severity === 'info'));
});

test('VES quality assessment flags descending AB/2 but does not reject valid MN/2 expansion', () => {
  const result = assessVESQuality([
    { ab2: 10, mn2: 1, resistance: 10 },
    { ab2: 8, mn2: 2, resistance: 12 }
  ]);
  assert.ok(result.issues.some(issue => issue.code === 'descending-ab2' && issue.severity === 'warning'));
  assert.ok(result.issues.some(issue => issue.code === 'mn2-change' && issue.severity === 'info'));
});

test('VES quality assessment ignores wholly blank input rows', () => {
  const result = assessVESQuality([{ ab2: '', mn2: '', resistance: '' }]);
  assert.equal(result.completeCount, 0);
  assert.equal(result.incompleteCount, 0);
  assert.deepEqual(result.issues, []);
});


test('VES CSV report separates raw readings, quality findings and manual interpretation', async () => {
  const { buildVESReportCSV } = await import('../src/engine/geophysics.js');
  const report = buildVESReportCSV({
    stationId: 'VES-01',
    latitude: 4.9,
    longitude: 6.1,
    coordinateDatum: 'WGS84',
    coordinateCRS: 'Geographic (WGS84)',
    array: 'Schlumberger',
    notes: 'Test station, north sector',
    readings: [
      { ab2: 5, mn2: 1, resistance: 10 },
      { ab2: 10, mn2: 1, resistance: 12 },
      { ab2: 15, mn2: 1, resistance: 8 }
    ],
    interpretation: {
      method: 'User-entered layered-earth model',
      inversionSoftware: 'Example software 1.0',
      rmsErrorPercent: 4.2,
      interpretationStatus: 'Manually reviewed',
      layers: [
        { layer: 1, resistivity: 100, thickness: 5, bottomDepth: 5 },
        { layer: 2, resistivity: 250, thickness: null, bottomDepth: null }
      ],
      notes: 'Compare with borehole log'
    }
  });
  assert.match(report, /RAW FIELD READINGS AND CALCULATED VALUES/);
  assert.match(report, /FIELD QUALITY-CONTROL FINDINGS/);
  assert.match(report, /MANUALLY RECORDED LAYER INTERPRETATION/);
  assert.match(report, /VES-01/);
  assert.match(report, /WGS84/);
  assert.match(report, /Example software 1\.0/);
  assert.match(report, /does not perform automatic 1D VES inversion/);
  assert.match(report, /MN\/2/);
});

test('VES CSV report handles missing interpretation and safely quotes metadata', async () => {
  const { buildVESReportCSV } = await import('../src/engine/geophysics.js');
  const report = buildVESReportCSV({
    stationId: 'VES,"02"',
    notes: 'Line one, with comma',
    readings: [{ ab2: 5, mn2: 1, resistance: 10 }]
  });
  assert.match(report, /"VES,""02"""/);
  assert.match(report, /"Line one, with comma"/);
  assert.match(report, /No layer interpretation is saved/);
  assert.match(report, /Not a full sounding classification|Indicator only/);
});
