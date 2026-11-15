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

import { decimalToUTM, utmToDecimal } from '../src/engine/coordinates.js';

test('WGS84 forward and inverse UTM conversion round-trip Niger Delta coordinates', () => {
  const utm = decimalToUTM(4.92, 6.26, 32);
  assert.equal(utm.zone, 32);
  assert.equal(utm.hemisphere, 'N');
  assert.equal(utm.epsg, 32632);
  const geographic = utmToDecimal(utm.easting, utm.northing, 32, 'N');
  assert.ok(Math.abs(geographic.latitude - 4.92) < 0.00001);
  assert.ok(Math.abs(geographic.longitude - 6.26) < 0.00001);
});
test('UTM conversion rejects invalid zones and latitude outside UTM limits', () => {
  assert.throws(() => decimalToUTM(4.92, 6.26, 61));
  assert.throws(() => decimalToUTM(85, 6.26, 32));
  assert.throws(() => utmToDecimal(500000, 500000, 0, 'N'));
});

test('UTM inverse rejects out-of-grid eastings and coordinates beyond UTM latitude limits', () => {
  assert.throws(() => utmToDecimal(99999, 550000, 32, 'N'));
  assert.throws(() => utmToDecimal(900001, 550000, 32, 'N'));
  assert.throws(() => utmToDecimal(500000, 10000000, 32, 'N'));
});
