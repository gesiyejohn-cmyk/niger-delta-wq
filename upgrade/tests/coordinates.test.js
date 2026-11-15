import test from 'node:test';
import assert from 'node:assert/strict';
import { coordinateToDecimal, decimalToCoordinate, validateCoordinatePair } from '../src/engine/coordinates.js';

test('DD coordinates respect hemisphere and axis limits', () => {
  assert.equal(coordinateToDecimal('4.92', 'DD', 'N', 'latitude'), 4.92);
  assert.equal(coordinateToDecimal('6.26', 'DD', 'W', 'longitude'), -6.26);
  assert.throws(() => coordinateToDecimal('91', 'DD', 'N', 'latitude'));
});
test('DMS converts to decimal degrees', () => {
  assert.equal(coordinateToDecimal('4 55 12', 'DMS', 'N', 'latitude'), 4.92);
});
test('DDM converts to decimal degrees', () => {
  assert.equal(coordinateToDecimal('4 55.2', 'DDM', 'N', 'latitude'), 4.92);
});
test('decimal degrees format back to DMS and DDM', () => {
  assert.equal(decimalToCoordinate(4.92, 'DMS'), '4° 55\' 12.00"');
  assert.equal(decimalToCoordinate(4.92, 'DDM'), "4° 55.2000'");
});
test('coordinate pair preserves original entry and canonical decimal degrees', () => {
  const result = validateCoordinatePair({ latitude: '4 55 12', longitude: '6 15 36', format: 'DMS', latitudeHemisphere: 'N', longitudeHemisphere: 'E' });
  assert.equal(result.latitude, 4.92);
  assert.equal(result.longitude, 6.26);
  assert.equal(result.coordinateOriginal.latitude, '4 55 12');
});
test('coordinate pair rejects a single missing coordinate', () => {
  assert.throws(() => validateCoordinatePair({ latitude: '4.9', longitude: '' }));
});
