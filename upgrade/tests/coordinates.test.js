import test from 'node:test';
import assert from 'node:assert/strict';
import { coordinateToDecimal, decimalToCoordinate, validateCoordinatePair, getStandardUTMZone, convertCoordinatePairFormat, WGS84_GEOGRAPHIC_CRS, validateUTMDisplayCRS } from '../src/engine/coordinates.js';

test('DD coordinates respect hemisphere and axis limits', () => {
  assert.equal(coordinateToDecimal('4.92', 'DD', 'N', 'latitude'), 4.92);
  assert.equal(coordinateToDecimal('6.26', 'DD', 'W', 'longitude'), -6.26);
  assert.throws(() => coordinateToDecimal('91', 'DD', 'N', 'latitude'));
  assert.throws(() => coordinateToDecimal('-91', 'DD', 'S', 'latitude'));
  assert.throws(() => coordinateToDecimal('181', 'DD', 'E', 'longitude'));
  assert.throws(() => coordinateToDecimal('-181', 'DD', 'W', 'longitude'));
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
test('DMS and DDM formatting carry rounded minutes and seconds', () => {
  assert.equal(decimalToCoordinate(4.999999999, 'DMS'), '5° 0\' 0.00"');
  assert.equal(decimalToCoordinate(4.999999999, 'DDM'), "5° 0.0000'");
});
test('DMS and DDM require whole-degree components', () => {
  assert.throws(() => coordinateToDecimal('4.5 12 0', 'DMS', 'N', 'latitude'));
  assert.throws(() => coordinateToDecimal('4.5 12', 'DDM', 'N', 'latitude'));
});
test('coordinate parser rejects embedded hemisphere letters instead of silently discarding them', () => {
  assert.throws(() => coordinateToDecimal('4 55 12 N', 'DMS', 'S', 'latitude'));
});
test('coordinate pair preserves original entry and canonical decimal degrees', () => {
  const result = validateCoordinatePair({ latitude: '4 55 12', longitude: '6 15 36', format: 'DMS', latitudeHemisphere: 'N', longitudeHemisphere: 'E' });
  assert.equal(result.latitude, 4.92);
  assert.equal(result.longitude, 6.26);
  assert.equal(result.coordinateOriginal.latitude, '4 55 12');
  assert.equal(result.coordinateStorageCRS, WGS84_GEOGRAPHIC_CRS);
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
test('UTM display CRS requires a zone and hemisphere consistent with latitude', () => {
  assert.equal(validateUTMDisplayCRS(4.92, 'UTM Zone 32N (WGS84)'), 32);
  assert.equal(validateUTMDisplayCRS(-4.92, 'UTM Zone 32S (WGS84)'), 32);
  assert.throws(() => validateUTMDisplayCRS(-4.92, 'UTM Zone 32N (WGS84)'), /does not match latitude hemisphere S/);
  assert.throws(() => validateUTMDisplayCRS(4.92, 'UTM Zone 32S (WGS84)'), /does not match latitude hemisphere N/);
  assert.throws(() => validateUTMDisplayCRS(4.92, 'UTM Zone 61N (WGS84)'));
});

test('UTM conversion rejects invalid zones and latitude outside UTM limits', () => {
  assert.throws(() => decimalToUTM(4.92, 6.26, 61));
  assert.throws(() => decimalToUTM(85, 6.26, 32));
  assert.throws(() => utmToDecimal(500000, 500000, 0, 'N'));
});

test('WGS84 UTM southern hemisphere uses the matching EPSG code', () => {
  const utm = decimalToUTM(-4.92, 6.26, 32);
  assert.equal(utm.hemisphere, 'S');
  assert.equal(utm.epsg, 32732);
});

test('UTM inverse rejects out-of-grid eastings and coordinates beyond UTM latitude limits', () => {
  assert.throws(() => utmToDecimal(99999, 550000, 32, 'N'));
  assert.throws(() => utmToDecimal(900001, 550000, 32, 'N'));
  assert.throws(() => utmToDecimal(500000, 10000000, 32, 'N'));
});

test('WGS84 UTM Zone 32N matches an independent PROJ EPSG:32632 reference', () => {
  // Reference for latitude 4.92°, longitude 6.26° from PROJ / EPSG:32632.
  // This independent control prevents a forward/inverse round-trip from hiding
  // a shared implementation error in both conversion directions.
  const utm = decimalToUTM(4.92, 6.26, 32);
  assert.equal(utm.epsg, 32632);
  assert.ok(Math.abs(utm.easting - 196107.609) <= 0.001);
  assert.ok(Math.abs(utm.northing - 544444.788) <= 0.001);
});

test('standard UTM zone selection follows longitude bands and Norway exception', () => {
  assert.equal(getStandardUTMZone(4.92, 5.99), 31);
  assert.equal(getStandardUTMZone(4.92, 6.26), 32);
  assert.equal(getStandardUTMZone(60, 4), 32);
});

test('standard UTM zone selection applies Svalbard exceptions', () => {
  assert.equal(getStandardUTMZone(75, 5), 31);
  assert.equal(getStandardUTMZone(75, 15), 33);
  assert.equal(getStandardUTMZone(75, 25), 35);
  assert.equal(getStandardUTMZone(75, 35), 37);
});

test('standard UTM zone selection rejects coordinates outside UTM limits', () => {
  assert.throws(() => getStandardUTMZone(85, 6.26));
  assert.throws(() => getStandardUTMZone(4.92, 181));
});


test('changing coordinate format converts a populated latitude while preserving a blank longitude', () => {
  const converted = convertCoordinatePairFormat({
    latitude: '4.92', longitude: '', format: 'DD', nextFormat: 'DMS',
    latitudeHemisphere: 'N', longitudeHemisphere: 'E'
  });
  assert.equal(converted.format, 'DMS');
  assert.equal(converted.latitude, '4° 55\' 12.00"');
  assert.equal(converted.longitude, '');
  assert.equal(coordinateToDecimal(converted.latitude, converted.format, 'N', 'latitude'), 4.92);
});

test('changing coordinate format preserves southern and western hemispheres', () => {
  const converted = convertCoordinatePairFormat({
    latitude: '4.92', longitude: '6.26', format: 'DD', nextFormat: 'DDM',
    latitudeHemisphere: 'S', longitudeHemisphere: 'W'
  });
  assert.equal(converted.latitude, "4° 55.2000'");
  assert.equal(converted.longitude, "6° 15.6000'");
  assert.equal(coordinateToDecimal(converted.latitude, converted.format, 'S', 'latitude'), -4.92);
  assert.equal(coordinateToDecimal(converted.longitude, converted.format, 'W', 'longitude'), -6.26);
});

test('changing coordinate format converts a populated longitude independently', () => {
  const converted = convertCoordinatePairFormat({
    latitude: '', longitude: '6.26', format: 'DD', nextFormat: 'DMS',
    latitudeHemisphere: 'N', longitudeHemisphere: 'E'
  });
  assert.equal(converted.latitude, '');
  assert.equal(converted.longitude, '6° 15\' 36.00"');
});

test('changing coordinate format rejects invalid partial input instead of reinterpreting it', () => {
  assert.throws(() => convertCoordinatePairFormat({
    latitude: '4 55', longitude: '', format: 'DD', nextFormat: 'DDM',
    latitudeHemisphere: 'N', longitudeHemisphere: 'E'
  }), /Decimal Degrees must contain one number/);
  assert.throws(() => convertCoordinatePairFormat({
    latitude: '', longitude: '', format: 'DD', nextFormat: 'UTM'
  }), /Choose DD, DMS or DDM/);
});


test('coordinate conversions reject missing and non-finite values instead of coercing them to zero', () => {
  const missingOrInvalid = ['', '   ', null, undefined, false, NaN, Infinity];
  for (const value of missingOrInvalid) {
    assert.throws(() => coordinateToDecimal(value, 'DD', 'N', 'latitude'));
    assert.throws(() => decimalToCoordinate(value, 'DD'), /finite number/);
    assert.throws(() => getStandardUTMZone(value, 6.26), /Latitude must be a finite number/);
    assert.throws(() => getStandardUTMZone(4.92, value), /Longitude must be a finite number/);
    assert.throws(() => validateUTMDisplayCRS(value, 'UTM Zone 32N (WGS84)'), /Latitude must be a finite number/);
    assert.throws(() => decimalToUTM(value, 6.26, 32), /Latitude must be a finite number/);
    assert.throws(() => decimalToUTM(4.92, value, 32), /Longitude must be a finite number/);
    assert.throws(() => utmToDecimal(500000, value, 32, 'N'), /UTM northing must be a finite number/);
    assert.throws(() => utmToDecimal(value, 500000, 32, 'N'), /UTM easting must be a finite number/);
  }
  assert.throws(() => utmToDecimal(500000, 500000, null, 'N'), /UTM zone must be a finite number/);
  assert.throws(() => decimalToUTM(4.92, 6.26, ''), /UTM zone must be a finite number/);
});
