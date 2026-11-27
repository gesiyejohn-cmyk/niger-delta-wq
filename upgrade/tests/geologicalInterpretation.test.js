import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGeologicalInterpretation,
  validateGeologicalInterpretation,
  getGeologicalColumnAtDistance
} from '../src/engine/geologicalInterpretation.js';

const model = {
  id: 'ert-line-01',
  lineId: 'ERT-01',
  cells: [
    { x: 0, depth: 0, resistivity: 100 },
    { x: 10, depth: 0, resistivity: 120 },
    { x: 0, depth: 20, resistivity: 80 },
    { x: 10, depth: 20, resistivity: 90 }
  ]
};
const validInterpretation = {
  schemaVersion: 1,
  ertModelId: 'ert-line-01',
  lineId: 'ERT-01',
  xRange: [0, 10],
  depthRange: [0, 20],
  interpretationStatus: 'provisional',
  notes: 'Illustrative manual interpretation; requires borehole correlation.',
  units: [
    { id: 'u1', name: 'Topsoil', confidence: 'moderate', evidence: 'Surface description', aquiferPotential: 'unlikely' },
    { id: 'u2', name: 'Sandy clay', confidence: 'low', evidence: 'Provisional geophysical correlation', aquiferPotential: 'unknown' },
    { id: 'u3', name: 'Sand', confidence: 'low', evidence: 'Requires borehole confirmation', aquiferPotential: 'possible' }
  ],
  stations: [
    { x: 0, boundaries: [0, 2, 8, 20] },
    { x: 10, boundaries: [0, 3, 10, 20] }
  ]
};

test('creates a blank interpretation scaffold without assigning lithology', () => {
  const draft = createGeologicalInterpretation(model);
  assert.equal(draft.ertModelId, model.id);
  assert.deepEqual(draft.xRange, [0, 10]);
  assert.deepEqual(draft.depthRange, [0, 20]);
  assert.deepEqual(draft.units, []);
  assert.deepEqual(draft.stations, []);
});

test('validates a layered interpretation linked to the correct ERT model', () => {
  assert.equal(validateGeologicalInterpretation(validInterpretation, model).units.length, 3);
  assert.throws(() => validateGeologicalInterpretation(validInterpretation, { ...model, id: 'other' }), /different ERT model/);
});

test('rejects crossed boundaries and zero or negative layer thickness', () => {
  const invalid = structuredClone(validInterpretation);
  invalid.stations[0].boundaries = [0, 8, 4, 20];
  assert.throws(() => validateGeologicalInterpretation(invalid), /crossed boundaries|zero\/negative/);
});

test('rejects incomplete depth coverage and non-increasing stations', () => {
  const short = structuredClone(validInterpretation);
  short.stations[0].boundaries[0] = 1;
  assert.throws(() => validateGeologicalInterpretation(short), /span the full ERT depth range/);
  const duplicate = structuredClone(validInterpretation);
  duplicate.stations[1].x = 0;
  assert.throws(() => validateGeologicalInterpretation(duplicate), /unique, increasing distances/);
});

test('rejects a station with an extra boundary for its geological unit count', () => {
  const invalid = structuredClone(validInterpretation);
  invalid.units = [invalid.units[0]];
  invalid.stations = invalid.stations.map(station => ({
    ...station,
    boundaries: [station.boundaries[0], 0, station.boundaries.at(-1)]
  }));
  assert.throws(() => validateGeologicalInterpretation(invalid), /one more depth boundary/);
});

test('interpolates interpreted boundaries at the selected profile distance', () => {
  const column = getGeologicalColumnAtDistance(validInterpretation, 5);
  assert.equal(column.layers.length, 3);
  assert.equal(column.layers[0].topDepth, 0);
  assert.equal(column.layers[0].bottomDepth, 2.5);
  assert.equal(column.layers[1].topDepth, 2.5);
  assert.equal(column.layers[1].bottomDepth, 9);
  assert.equal(column.layers[2].bottomDepth, 20);
  assert.ok(column.layers.every(layer => layer.thickness > 0));
});

test('rejects a selected distance outside the ERT profile', () => {
  assert.throws(() => getGeologicalColumnAtDistance(validInterpretation, 11), /outside the interpreted section/);
});

test('requires interpretation extents to match the linked imported ERT model', () => {
  const shifted = structuredClone(validInterpretation);
  shifted.depthRange = [0, 25];
  shifted.stations = [
    { x: 0, boundaries: [0, 2, 8, 25] },
    { x: 10, boundaries: [0, 3, 10, 25] }
  ];
  assert.throws(() => validateGeologicalInterpretation(shifted, model), /match the associated ERT model extent/);
  const oneDepth = { ...model, cells: model.cells.map(cell => ({ ...cell, depth: 0 })) };
  assert.throws(() => validateGeologicalInterpretation(validInterpretation, oneDepth), /does not span a two-dimensional section/);
});

test('requires evidence metadata and explicit uncertainty categories', () => {
  const missing = structuredClone(validInterpretation);
  missing.units[0].confidence = 'certain';
  assert.throws(() => validateGeologicalInterpretation(missing), /valid confidence level/);
});
