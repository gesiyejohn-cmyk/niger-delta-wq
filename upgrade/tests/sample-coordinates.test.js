import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getDB } from '../src/storage/db.js';
import { saveSample, getSample } from '../src/storage/samples.js';
import { exportSamplesCSV, exportSamplesGeoJSON } from '../src/storage/export.js';
import {
  buildSampleCoordinateMetadata,
  sampleCoordinateInputFromRecord
} from '../src/engine/sampleCoordinates.js';

async function clearSampleStores() {
  const db = await getDB();
  const tx = db.transaction(['samples', 'syncQueue', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('samples').clear(),
    tx.objectStore('syncQueue').clear(),
    tx.objectStore('settings').clear()
  ]);
  await tx.done;
}

test('water-quality sample storage normalises DMS input and preserves original coordinates', async () => {
  await clearSampleStores();
  const saved = await saveSample({
    meta: {
      sampleCode: 'GW-DMS-01',
      latitude: '4 55 12',
      longitude: '6 15 36',
      coordinateFormat: 'DMS',
      latitudeHemisphere: 'N',
      longitudeHemisphere: 'E',
      coordinateDatum: 'WGS84',
      coordinateCRS: 'Geographic (WGS84)'
    },
    params: {}
  });

  assert.equal(saved.latitude, 4.92);
  assert.equal(saved.longitude, 6.26);
  assert.equal(saved.coordinateFormat, 'DMS');
  assert.deepEqual(saved.coordinateOriginal, {
    latitude: '4 55 12',
    longitude: '6 15 36',
    latitudeHemisphere: 'N',
    longitudeHemisphere: 'E'
  });
  assert.equal(saved.coordinateDatum, 'WGS84');
  assert.equal(saved.coordinateCRS, 'Geographic (WGS84)');
  assert.equal(saved.coordinateStorageCRS, 'EPSG:4326');

  const restoredInput = sampleCoordinateInputFromRecord(await getSample(saved.id));
  assert.equal(restoredInput.latitude, '4 55 12');
  assert.equal(restoredInput.longitude, '6 15 36');
  assert.equal(restoredInput.format, 'DMS');
});

test('sample editing converts DDM south/west entries to canonical WGS84 and updates display CRS', async () => {
  await clearSampleStores();
  const first = await saveSample({
    meta: { sampleCode: 'GW-EDIT-01', latitude: '4.92', longitude: '6.26' },
    params: {}
  });
  const coordinates = buildSampleCoordinateMetadata({
    latitude: '4 55.2000',
    longitude: '6 15.6000',
    format: 'DDM',
    latitudeHemisphere: 'S',
    longitudeHemisphere: 'W',
    datum: 'WGS 84',
    crs: 'EPSG:32732'
  });
  const updated = await saveSample({
    meta: { sampleCode: 'GW-EDIT-01', ...coordinates },
    params: {},
    existingId: first.id
  });

  assert.equal(updated.latitude, -4.92);
  assert.equal(updated.longitude, -6.26);
  assert.equal(updated.coordinateFormat, 'DDM');
  assert.equal(updated.coordinateOriginal.latitude, '4 55.2000');
  assert.equal(updated.coordinateOriginal.longitudeHemisphere, 'W');
  assert.equal(updated.coordinateCRS, 'UTM Zone 32S (WGS84)');
  assert.equal(updated.coordinateStorageCRS, 'EPSG:4326');

  const exported = await exportSamplesGeoJSON();
  assert.deepEqual(exported.features[0].geometry.coordinates, [-6.26, -4.92]);
  assert.equal(exported.features[0].properties.coordinate_storage_crs, 'EPSG:4326');

  const csv = await exportSamplesCSV();
  assert.ok(csv.includes('"coordinate_format"'));
  assert.ok(csv.includes('"original_latitude"'));
  assert.ok(csv.includes('"coordinate_storage_crs"'));
  assert.ok(csv.includes('"4 55.2000"'));
  assert.ok(csv.includes('"UTM Zone 32S (WGS84)"'));
});

test('sample save removes stale coordinate metadata when both coordinates are cleared', async () => {
  await clearSampleStores();
  const first = await saveSample({
    meta: {
      sampleCode: 'GW-CLEAR-01',
      latitude: '4.92',
      longitude: '6.26',
      coordinateFormat: 'DD'
    },
    params: {}
  });
  const cleared = await saveSample({
    meta: { sampleCode: 'GW-CLEAR-01' },
    params: {},
    existingId: first.id
  });

  assert.equal(cleared.latitude, null);
  assert.equal(cleared.longitude, null);
  assert.equal(Object.hasOwn(cleared, 'coordinateFormat'), false);
  assert.equal(Object.hasOwn(cleared, 'coordinateOriginal'), false);
});

test('sample storage rejects partial, invalid-datum, invalid-CRS and inconsistent canonical coordinates', async () => {
  await clearSampleStores();
  await assert.rejects(saveSample({
    meta: { sampleCode: 'BAD-PAIR', latitude: '4.92', longitude: '' },
    params: {}
  }), /Enter both latitude and longitude/);

  await assert.rejects(saveSample({
    meta: {
      sampleCode: 'BAD-DATUM',
      latitude: '4.92',
      longitude: '6.26',
      coordinateDatum: 'NAD83'
    },
    params: {}
  }), /Only WGS84/);

  await assert.rejects(saveSample({
    meta: {
      sampleCode: 'BAD-CRS',
      latitude: '4.92',
      longitude: '6.26',
      coordinateCRS: 'EPSG:3857'
    },
    params: {}
  }), /display CRS must be Geographic/);

  const coordinates = buildSampleCoordinateMetadata({
    latitude: '4.92',
    longitude: '6.26',
    format: 'DD'
  });
  await assert.rejects(saveSample({
    meta: {
      sampleCode: 'MISMATCH',
      ...coordinates,
      latitude: 5.1
    },
    params: {}
  }), /does not match the preserved original/);
});

test('bulk-import coordinate metadata shape supports DDM with mapped hemispheres and EPSG display CRS', async () => {
  await clearSampleStores();
  const imported = await saveSample({
    meta: {
      sampleCode: 'GW-IMPORT-01',
      latitude: '4 55.2000',
      longitude: '6 15.6000',
      coordinateFormat: 'DDM',
      latitudeHemisphere: 'S',
      longitudeHemisphere: 'W',
      coordinateDatum: 'WGS 84',
      coordinateCRS: 'EPSG:32732'
    },
    params: { ph: { value: 7, unit: 'pH', canonical: 7, canonicalUnit: 'pH' } }
  });

  assert.equal(imported.latitude, -4.92);
  assert.equal(imported.longitude, -6.26);
  assert.equal(imported.coordinateFormat, 'DDM');
  assert.equal(imported.coordinateCRS, 'UTM Zone 32S (WGS84)');
});

test('manual sample form and bulk importer expose coordinate-format metadata controls', async () => {
  const editor = await readFile(new URL('../src/pages/SampleEditor.jsx', import.meta.url), 'utf8');
  const importer = await readFile(new URL('../src/pages/ImportPage.jsx', import.meta.url), 'utf8');
  assert.match(editor, /<CoordinateFields/);
  assert.match(editor, /buildSampleCoordinateMetadata/);
  assert.match(importer, /coordinateFormat/);
  assert.match(importer, /latitudeHemisphere/);
  assert.match(importer, /coordinateCRS/);
});

test('legacy samples without coordinate metadata reopen as DD with hemisphere inferred from sign', () => {
  const input = sampleCoordinateInputFromRecord({
    latitude: -4.92,
    longitude: -6.26
  });
  assert.equal(input.format, 'DD');
  assert.equal(input.latitude, '4.920000');
  assert.equal(input.longitude, '6.260000');
  assert.equal(input.latitudeHemisphere, 'S');
  assert.equal(input.longitudeHemisphere, 'W');
});


test('bulk import infers hemispheres from signed DD strings and canonicalizes format and CRS labels', async () => {
  await clearSampleStores();
  const imported = await saveSample({
    meta: {
      sampleCode: 'GW-IMPORT-SIGNED-01',
      latitude: '-4.92',
      longitude: '-6.26',
      coordinateFormat: 'dd',
      coordinateDatum: 'wgs 84',
      coordinateCRS: 'utm zone 32s (wgs84)'
    },
    params: {}
  });

  assert.equal(imported.latitude, -4.92);
  assert.equal(imported.longitude, -6.26);
  assert.equal(imported.coordinateFormat, 'DD');
  assert.equal(imported.coordinateOriginal.latitudeHemisphere, 'S');
  assert.equal(imported.coordinateOriginal.longitudeHemisphere, 'W');
  assert.equal(imported.coordinateCRS, 'UTM Zone 32S (WGS84)');
});


test('GeoJSON excludes legacy coordinates without verified WGS84 storage metadata', async () => {
  await clearSampleStores();
  const db = await getDB();
  await db.put('samples', {
    id: 'legacy-unknown-crs',
    sampleCode: 'LEGACY-UNKNOWN-CRS',
    latitude: 4.92,
    longitude: 6.26
  });
  await saveSample({
    meta: {
      sampleCode: 'KNOWN-WGS84',
      latitude: '4.92',
      longitude: '6.26',
      coordinateDatum: 'WGS84',
      coordinateCRS: 'Geographic (WGS84)'
    },
    params: {}
  });

  const geojson = await exportSamplesGeoJSON();
  assert.equal(geojson.features.length, 1);
  assert.equal(geojson.features[0].properties.sampleCode, 'KNOWN-WGS84');
  assert.deepEqual(geojson.features[0].geometry.coordinates, [6.26, 4.92]);

  const csv = await exportSamplesCSV();
  assert.ok(csv.includes('"LEGACY-UNKNOWN-CRS"'));
  assert.ok(csv.includes('"KNOWN-WGS84"'));
});
