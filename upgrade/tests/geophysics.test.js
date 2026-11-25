import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildERTGrid, interpolateERTResistivity } from '../src/engine/ert.js';
import {
  schlumbergerGeometricFactor,
  wennerGeometricFactor,
  calculateVES,
  validateVES,
  isCompleteVESReading,
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

test('Wenner alpha geometric factor is 2πa', () => {
  assert.ok(Math.abs(wennerGeometricFactor(5) - 2 * Math.PI * 5) < 1e-10);
});
test('Wenner alpha apparent resistivity is 2πa times measured resistance', () => {
  const result = calculateVES({ array: 'Wenner alpha', spacing: 5, resistance: 10 });
  assert.ok(Math.abs(result.apparentResistivity - 100 * Math.PI) < 1e-10);
  assert.equal(result.array, 'Wenner alpha');
});
test('Wenner alpha validation requires positive, increasing electrode spacing', () => {
  assert.throws(() => validateVES([{ spacing: 0, resistance: 10 }], 'Wenner alpha'));
  assert.throws(() => validateVES([
    { spacing: 5, resistance: 10 }, { spacing: 5, resistance: 12 }
  ], 'Wenner alpha'), /strictly increasing/);
});


test('VES complete-row selection uses Wenner spacing rather than Schlumberger fields', () => {
  const wennerRows = [
    { spacing: '5', resistance: '10', ab2: '', mn2: '' },
    { spacing: '10', resistance: '12', ab2: '', mn2: '' },
    { spacing: '', resistance: '8', ab2: '', mn2: '' }
  ];
  const complete = wennerRows.filter(row => isCompleteVESReading(row, 'Wenner alpha'));
  assert.equal(complete.length, 2);
  assert.deepEqual(validateVES(complete, 'Wenner alpha').map(row => row.spacing), [5, 10]);
  assert.equal(wennerRows.filter(row => isCompleteVESReading(row, 'Schlumberger')).length, 0);
});

test('Schlumberger complete-row selection still requires AB/2, MN/2 and resistance', () => {
  assert.equal(isCompleteVESReading({ ab2: '10', mn2: '2', resistance: '5' }, 'Schlumberger'), true);
  assert.equal(isCompleteVESReading({ ab2: '10', mn2: '', resistance: '5' }, 'Schlumberger'), false);
  assert.equal(isCompleteVESReading({ spacing: '5', resistance: '5' }, 'Schlumberger'), false);
});


test('VES graph uses the method-specific electrode spacing field', () => {
  const source = readFileSync(new URL('../src/pages/GeophysicsPage.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('const spacingFor = point => wenner ? point.spacing : point.ab2;'));
  assert.ok(source.includes("const spacingLabel = wenner ? 'a' : 'AB/2';"));
});

test('Wenner saved rows with an empty AB/2 field still classify using spacing', () => {
  const rows = validateVES([
    { spacing: '5', resistance: '10', ab2: '', mn2: '' },
    { spacing: '10', resistance: '12', ab2: '', mn2: '' },
    { spacing: '15', resistance: '14', ab2: '', mn2: '' }
  ], 'Wenner alpha');
  assert.equal(classifyVESCurve(rows).code, 'A');
});


test('ERT imported model interpolation preserves exact imported resistivity values', () => {
  const points = [
    { x: 0, depth: 0, resistivity: 100 },
    { x: 10, depth: 0, resistivity: 400 }
  ];
  assert.equal(interpolateERTResistivity(points, 0, 0), 100);
  assert.equal(interpolateERTResistivity(points, 10, 0), 400);
});

test('ERT log-resistivity IDW gives the geometric mean at an equal-distance midpoint', () => {
  const points = [
    { x: 0, depth: 0, resistivity: 100 },
    { x: 10, depth: 0, resistivity: 400 }
  ];
  assert.ok(Math.abs(interpolateERTResistivity(points, 5, 0) - 200) < 1e-10);
});

test('ERT interpolated section masks cells outside the imported-point convex hull', () => {
  const points = [
    { x: 0, depth: 0, resistivity: 100 },
    { x: 10, depth: 0, resistivity: 200 },
    { x: 0, depth: 10, resistivity: 300 },
    { x: 2, depth: 2, resistivity: 150 },
    { x: 4, depth: 2, resistivity: 180 },
    { x: 2, depth: 4, resistivity: 220 }
  ];
  const grid = buildERTGrid(points);
  assert.ok(grid);
  assert.equal(grid.inversionPerformed, false);
  assert.ok(grid.values.length < grid.rows * grid.cols);
  for (const cell of grid.values) {
    const x = grid.x0 + (cell.c + 0.5) / grid.cols * (grid.x1 - grid.x0);
    const depth = grid.z0 + (cell.r + 0.5) / grid.rows * (grid.z1 - grid.z0);
    assert.ok(x + depth <= 10 + 1e-9, `cell outside triangular hull: x=${x}, depth=${depth}`);
  }
});

test('ERT interpolation rejects duplicate source cells and invalid depth or resistivity', () => {
  assert.throws(() => interpolateERTResistivity([
    { x: 0, depth: 1, resistivity: 50 },
    { x: 0, depth: 1, resistivity: 80 }
  ], 1, 1), /duplicate distance\/depth cells/);
  assert.throws(() => interpolateERTResistivity([
    { x: 0, depth: -1, resistivity: 50 }
  ], 1, 1), /non-negative depth/);
  assert.throws(() => interpolateERTResistivity([
    { x: 0, depth: 1, resistivity: 0 }
  ], 1, 1), /positive resistivity/);
});

import { parseERTCSV } from '../src/engine/ertCsv.js';

test('ERT CSV recognises case, spacing, punctuation and BOM in headers', () => {
  const csv = '\uFEFFElectrode Distance (m),Depth (m),Resistivity (ohm-m)\n0,1,100\n10,2,250';
  assert.deepEqual(parseERTCSV(csv), [
    { x: 0, depth: 1, resistivity: 100 },
    { x: 10, depth: 2, resistivity: 250 }
  ]);
});

test('ERT CSV accepts documented alternate scientific column names', () => {
  assert.deepEqual(parseERTCSV('X_m,Z_m,Rho_ohm_m\n5,0,75'), [
    { x: 5, depth: 0, resistivity: 75 }
  ]);
});

test('ERT CSV reports missing required columns before validating rows', () => {
  assert.throws(() => parseERTCSV('distance,depth\n0,1'), /missing a required resistivity column/);
});

test('ERT CSV rejects ambiguous duplicate aliases for a required field', () => {
  assert.throws(() => parseERTCSV('x,distance,depth,resistivity\n0,0,1,100'),
    /multiple columns matching x/);
});

test('ERT CSV rejects duplicate cells and invalid physical values', () => {
  assert.throws(() => parseERTCSV('x,depth,resistivity\n0,1,100\n0,1,200'), /duplicate distance\/depth cells/);
  assert.throws(() => parseERTCSV('x,depth,resistivity\n0,-1,100'), /non-negative depth/);
  assert.throws(() => parseERTCSV('x,depth,resistivity\n0,1,0'), /positive resistivity/);
});

test('ERT CSV rejects a header-only file', () => {
  assert.throws(() => parseERTCSV('x,depth,resistivity'), /No ERT model cells were supplied/);
});

test('ERT CSV rejects rows with missing or extra fields instead of silently shifting or ignoring values', () => {
  assert.throws(() => parseERTCSV('x,depth,resistivity\n0,1\n10,2,250'), /row 2 has 2 fields; expected 3/);
  assert.throws(() => parseERTCSV('x,depth,resistivity\n0,1,100,unexpected'), /row 2 has 4 fields; expected 3/);
});
