import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { detectMetadataMapping } from '../src/engine/importMapping.js';

test('metadata auto-mapping recognizes coordinate aliases and initializes every field', () => {
  const mapping = detectMetadataMapping([
    'Sample ID',
    'Station',
    'Latitude',
    'Longitude',
    'Coordinate_Format',
    'Lat Hemi',
    'Lon Hemisphere',
    'Datum',
    'Coordinate Reference System',
    'Collection Date',
    'Water Source',
    'Collector',
    'Notes'
  ]);

  assert.deepEqual(mapping, {
    sampleCode: 'Sample ID',
    stationName: 'Station',
    latitude: 'Latitude',
    longitude: 'Longitude',
    coordinateFormat: 'Coordinate_Format',
    latitudeHemisphere: 'Lat Hemi',
    longitudeHemisphere: 'Lon Hemisphere',
    coordinateDatum: 'Datum',
    coordinateCRS: 'Coordinate Reference System',
    collectionDate: 'Collection Date',
    waterSourceType: 'Water Source',
    collector: 'Collector',
    notes: 'Notes'
  });
});

test('loading a new file returns a fresh mapping and clears coordinate columns absent from its headers', async () => {
  const firstFileMapping = detectMetadataMapping([
    'Sample ID', 'Latitude', 'Longitude', 'Coordinate Format',
    'Latitude Hemisphere', 'Longitude Hemisphere', 'CRS'
  ]);
  assert.equal(firstFileMapping.latitude, 'Latitude');
  assert.equal(firstFileMapping.coordinateFormat, 'Coordinate Format');

  const secondFileMapping = detectMetadataMapping(['Sample ID', 'TDS (mg/L)']);
  assert.equal(secondFileMapping.sampleCode, 'Sample ID');
  for (const field of [
    'latitude', 'longitude', 'coordinateFormat',
    'latitudeHemisphere', 'longitudeHemisphere',
    'coordinateDatum', 'coordinateCRS'
  ]) {
    assert.equal(secondFileMapping[field], '', field + ' should reset when absent from the new file');
  }

  const importer = await readFile(new URL('../src/pages/ImportPage.jsx', import.meta.url), 'utf8');
  assert.match(importer, /const detectedMeta = detectMetadataMapping\(sourceHeaders\);/);
  assert.match(importer, /setMapping\(detectedMeta\);/);
  assert.doesNotMatch(importer, /setMapping\(previous\s*=>\s*\(\{\s*\.\.\.previous,\s*\.\.\.detectedMeta/);
});
