import test from 'node:test';
import assert from 'node:assert/strict';
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


test('VES graph labels Wenner spacing as a and Schlumberger spacing as AB/2', () => {
  const source = readFileSync(new URL('../src/pages/GeophysicsPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /const spacingLabel = record\.method\?\.toLowerCase\(\)\.startsWith\('wenner'\) \? 'a' : 'AB\/2'/);
  assert.match(source, /\{spacingLabel\} \{point\.ab2 \?\? point\.spacing\}/);
});
