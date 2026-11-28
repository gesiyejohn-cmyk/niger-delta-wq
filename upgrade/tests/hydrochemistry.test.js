import test from 'node:test';
import assert from 'node:assert/strict';
import { mgLToMeqL, convertIonConcentrations, calculateChargeBalance, calculatePiperPercentages, calculateDurovDiagram, calculateSchoellerSeries } from '../src/engine/hydrochemistry.js';

test('mg/L converts to meq/L using ionic charge and molar mass', () => {
  assert.ok(Math.abs(mgLToMeqL('Ca', 40.078) - 2) < 1e-10);
  assert.ok(Math.abs(mgLToMeqL('Cl', 35.45) - 1) < 1e-10);
});

test('blank and missing ion concentrations remain unmeasured', () => {
  const result = convertIonConcentrations({ Ca: 40.078, Mg: '', Na: null, Cl: 35.45 });
  assert.equal(result.Ca, 2);
  assert.equal(result.Mg, null);
  assert.equal(result.Na, null);
  assert.equal(result.Cl, 1);
});

test('charge balance is zero for equal measured cation and anion equivalents', () => {
  const result = calculateChargeBalance({ Na: 22.989769, Cl: 35.45 });
  assert.ok(Math.abs(result.errorPercent) < 1e-10);
  assert.equal(result.status, 'Within ±5% screening tolerance');
});

test('charge balance reports insufficient data instead of zero-filling an unmeasured side', () => {
  const result = calculateChargeBalance({ Ca: 20, Mg: '', Cl: null });
  assert.equal(result.errorPercent, null);
  assert.equal(result.status, 'Insufficient measured ions');
});

test('Piper cation and anion groups are normalized independently to 100 percent', () => {
  const result = calculatePiperPercentages({
    Ca: 40.078, Mg: 24.305, Na: 22.989769, K: 0,
    Cl: 35.45, SO4: 48.03, HCO3: 61.0168, CO3: 0
  });
  const cationSum = Object.values(result.cations).reduce((a, b) => a + b, 0);
  const anionSum = Object.values(result.anions).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(cationSum - 100) < 1e-10);
  assert.ok(Math.abs(anionSum - 100) < 1e-10);
  assert.equal('NaK' in result.cations, true);
  assert.equal('HCO3CO3' in result.anions, true);
});

test('negative and non-numeric concentrations are rejected', () => {
  assert.throws(() => mgLToMeqL('Ca', -1));
  assert.throws(() => mgLToMeqL('Ca', 'bad'));
  assert.throws(() => mgLToMeqL('Unknown', 1));
});


test('Piper diagram places pure Ca-HCO3 composition at the corresponding triangle vertices', async () => {
  const { calculatePiperDiagram } = await import('../src/engine/hydrochemistry.js');
  const result = calculatePiperDiagram({
    Ca: 40.078, Mg: 0, Na: 0, K: 0,
    Cl: 0, SO4: 0, HCO3: 61.0168, CO3: 0
  });
  assert.deepEqual(result.coordinates.cations, { x: 0, y: 0 });
  assert.deepEqual(result.coordinates.anions, { x: 1.2, y: 0 });
  assert.equal(result.facies.label, 'Ca–HCO3+CO3');
  assert.ok(Math.abs(result.coordinates.diamond.x - 0.6) < 1e-10);
  assert.ok(Math.abs(result.coordinates.diamond.y - Math.sqrt(3) * 0.6) < 1e-10);
});

test('Piper diagram places pure Mg-SO4 composition at the upper vertices', async () => {
  const { calculatePiperDiagram } = await import('../src/engine/hydrochemistry.js');
  const result = calculatePiperDiagram({
    Ca: 0, Mg: 24.305, Na: 0, K: 0,
    Cl: 0, SO4: 48.03, HCO3: 0, CO3: 0
  });
  assert.ok(Math.abs(result.coordinates.cations.x - 0.5) < 1e-10);
  assert.ok(Math.abs(result.coordinates.cations.y - Math.sqrt(3) / 2) < 1e-10);
  assert.ok(Math.abs(result.coordinates.anions.x - 1.7) < 1e-10);
  assert.ok(Math.abs(result.coordinates.anions.y - Math.sqrt(3) / 2) < 1e-10);
});

test('Piper facies reports mixed compositions when no ion group reaches 50 percent', async () => {
  const { calculatePiperDiagram } = await import('../src/engine/hydrochemistry.js');
  const result = calculatePiperDiagram({
    Ca: 20.039, Mg: 12.1525, Na: 11.4948845, K: 0,
    Cl: 17.725, SO4: 24.015, HCO3: 30.5084, CO3: 0
  });
  assert.equal(result.facies.cation.status, 'mixed');
  assert.equal(result.facies.anion.status, 'mixed');
  assert.equal(result.facies.label, 'Mixed water type');
});

test('Piper combined groups remain unavailable when either component is unmeasured', () => {
  const missingPotassium = calculatePiperPercentages({
    Ca: 40.078, Mg: 24.305, Na: 22.989769, K: null,
    Cl: 35.45, SO4: 48.03, HCO3: 61.0168, CO3: 0
  });
  assert.equal(missingPotassium.cations, null);
  assert.ok(missingPotassium.anions);
  const missingCarbonate = calculatePiperPercentages({
    Ca: 40.078, Mg: 24.305, Na: 22.989769, K: 0,
    Cl: 35.45, SO4: 48.03, HCO3: 61.0168, CO3: null
  });
  assert.ok(missingCarbonate.cations);
  assert.equal(missingCarbonate.anions, null);
});

test('Piper diagram does not invent triangle or diamond coordinates for missing ion groups', async () => {
  const { calculatePiperDiagram } = await import('../src/engine/hydrochemistry.js');
  const result = calculatePiperDiagram({ Ca: 40.078, Cl: '' });
  assert.equal(result.coordinates.cations, null);
  assert.equal(result.coordinates.anions, null);
  assert.equal(result.coordinates.diamond, null);
  assert.equal(result.facies.label, 'Insufficient measured ions');
});

test('Piper coordinate results stay finite for a fully measured mixed sample', async () => {
  const { calculatePiperDiagram } = await import('../src/engine/hydrochemistry.js');
  const result = calculatePiperDiagram({
    Ca: 40.078, Mg: 24.305, Na: 22.989769, K: 39.0983,
    Cl: 35.45, SO4: 48.03, HCO3: 61.0168, CO3: 0
  });
  for (const point of Object.values(result.coordinates)) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
  }
});


test('Durov projection locates pure Ca-HCO3 water at the corresponding square corner', () => {
  const result = calculateDurovDiagram({
    Ca: 40.078, Mg: 0, Na: 0, K: 0,
    Cl: 0, SO4: 0, HCO3: 61.0168, CO3: 0
  }, { pH: 7.2, tds: 250 });
  assert.deepEqual(result.coordinates.square, { x: 1, y: 1 });
  assert.deepEqual(result.coordinates.cationTriangle, { x: 0, y: 0 });
  assert.deepEqual(result.coordinates.anionTriangle, { x: 1, y: 0 });
  assert.equal(result.auxiliary.pH, 7.2);
  assert.equal(result.auxiliary.tds, 250);
  assert.equal(result.extended, true);
});

test('Durov diagram does not infer missing major-ion groups or auxiliary pH/TDS', () => {
  const result = calculateDurovDiagram({ Ca: 40.078, Cl: 35.45 }, { pH: '', tds: null });
  assert.equal(result.coordinates.square, null);
  assert.equal(result.auxiliary.pH, null);
  assert.equal(result.auxiliary.tds, null);
  assert.equal(result.extended, false);
  assert.equal(result.status, 'insufficient-major-ion-data');
});

test('Schoeller series uses log10 meq/L and keeps zero and missing values distinct', () => {
  const result = calculateSchoellerSeries({
    Ca: 20.039, Mg: 24.305, Na: 22.989769, K: 0,
    Cl: 35.45, SO4: 0, HCO3: 61.0168, CO3: 0,
    NO3: '', F: null
  });
  assert.equal(result.find(x => x.key === 'Ca').log10MeqL, 0);
  assert.equal(result.find(x => x.key === 'Na').status, 'plottable');
  assert.equal(result.find(x => x.key === 'K').status, 'measured-zero-not-plottable-on-log-axis');
  assert.equal(result.find(x => x.key === 'SO4').status, 'measured-zero-not-plottable-on-log-axis');
  assert.equal(result.find(x => x.key === 'HCO3').status, 'plottable');
  assert.equal(result.find(x => x.key === 'CO3').status, 'measured-zero-not-plottable-on-log-axis');
  assert.equal(result.find(x => x.key === 'NO3').status, 'unmeasured');
  assert.equal(result.find(x => x.key === 'F').log10MeqL, null);
});

 
test('hydrochemistry rejects finite inputs that overflow equivalent conversion', () => {
  assert.throws(() => mgLToMeqL('Ca', Number.MAX_VALUE), /outside the supported numeric range/);
});

test('hydrochemistry rejects boolean and object concentrations instead of coercing them to numbers', () => {
  assert.throws(() => mgLToMeqL('Ca', true), /measured, non-negative mg\/L value/);
  assert.throws(() => mgLToMeqL('Ca', {}), /measured, non-negative mg\/L value/);
  assert.throws(() => mgLToMeqL('Ca', 'Infinity'), /measured, non-negative mg\/L value/);
});

test('Durov auxiliary pH and TDS ignore boolean and object values', () => {
  const result = calculateDurovDiagram({
    Ca: 40.078, Mg: 0, Na: 0, K: 0,
    Cl: 0, SO4: 0, HCO3: 61.0168, CO3: 0
  }, { pH: true, tds: {} });
  assert.equal(result.auxiliary.pH, null);
  assert.equal(result.auxiliary.tds, null);
  assert.equal(result.extended, false);
});

test('Gibbs ratios use measured meq/L ion pairs and positive measured TDS', async () => {
  const { calculateGibbsRatios } = await import('../src/engine/hydrochemistry.js');
  const result = calculateGibbsRatios({
    Ca: 40.078, Na: 22.989769,
    Cl: 35.45, HCO3: 61.0168
  }, 250);
  assert.ok(Math.abs(result.cation - 1 / 3) < 1e-10);
  assert.equal(result.anion, 0.5);
  assert.equal(result.tds, 250);
  assert.equal(result.status, 'complete');
});

test('Gibbs ratios do not zero-fill missing ions or accept zero TDS as a plotted point', async () => {
  const { calculateGibbsRatios } = await import('../src/engine/hydrochemistry.js');
  const result = calculateGibbsRatios({ Ca: 40.078, Na: '', Cl: 35.45, HCO3: 61.0168 }, 0);
  assert.equal(result.cation, null);
  assert.equal(result.cationStatus, 'incomplete-measured-ion-pair');
  assert.equal(result.anion, 0.5);
  assert.equal(result.tds, null);
  assert.equal(result.status, 'missing-or-nonpositive-tds');
});

test('Chadha coordinates use signed cation and anion equivalent-percentage differences', async () => {
  const { calculateChadhaCoordinates } = await import('../src/engine/hydrochemistry.js');
  const result = calculateChadhaCoordinates({
    Ca: 40.078, Mg: 24.305, Na: 22.989769, K: 39.0983,
    HCO3: 61.0168, CO3: 30.00445, Cl: 35.45, SO4: 48.03
  });
  assert.ok(Math.abs(result.x - 100 / 3) < 1e-10);
  assert.equal(result.y, 0);
  assert.equal(result.status, 'complete');
});

test('Chadha coordinates remain unavailable when any required ion is unmeasured', async () => {
  const { calculateChadhaCoordinates } = await import('../src/engine/hydrochemistry.js');
  const result = calculateChadhaCoordinates({
    Ca: 40.078, Mg: 24.305, Na: 22.989769, K: '',
    HCO3: 61.0168, CO3: 0, Cl: 35.45, SO4: 48.03
  });
  assert.deepEqual(result, { x: null, y: null, status: 'insufficient-measured-major-ions' });
});


test('Gibbs display guard keeps valid TDS values within the logarithmic chart domain', async () => {
  const { isGibbsTdsWithinDisplayRange } = await import('../src/engine/hydrochemistry.js');
  assert.equal(isGibbsTdsWithinDisplayRange(1), true);
  assert.equal(isGibbsTdsWithinDisplayRange(10000), true);
  assert.equal(isGibbsTdsWithinDisplayRange(0.5), false);
  assert.equal(isGibbsTdsWithinDisplayRange(15000), false);
  assert.equal(isGibbsTdsWithinDisplayRange(null), false);
});
