import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/storage/db.js';
import { saveVES, listVES, saveERT, getERTSource } from '../src/storage/geophysics.js';
import { createDatabaseBackup, restoreDatabaseBackup } from '../src/storage/backup.js';
import { validateCoordinatePair } from '../src/engine/coordinates.js';

const STORE_NAMES = [
  'samples', 'settings', 'syncQueue', 'ves', 'vesInterpretations',
  'ert', 'ertSource', 'vulnerability', 'wqiAssessments'
];

async function clearAllStores(db) {
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  await Promise.all(STORE_NAMES.map(name => tx.objectStore(name).clear()));
  await tx.done;
}

test('canonical WGS84 coordinates and original DD/DMS/DDM entries survive geophysics storage and backup restore', async () => {
  const db = await getDB();
  await clearAllStores(db);

  const vesCoordinates = {
    ...validateCoordinatePair({
      latitude: '4 55 12',
      longitude: '6 15 36',
      format: 'DMS',
      latitudeHemisphere: 'N',
      longitudeHemisphere: 'E'
    }),
    coordinateDatum: 'WGS84',
    coordinateCRS: 'Geographic (WGS84)'
  };
  const ertCoordinates = {
    ...validateCoordinatePair({
      latitude: '4 55.2000',
      longitude: '6 15.6000',
      format: 'DDM',
      latitudeHemisphere: 'S',
      longitudeHemisphere: 'W'
    }),
    coordinateDatum: 'WGS84',
    coordinateCRS: 'UTM Zone 32S (WGS84)'
  };

  await saveVES({
    id: 'coord-ves-01',
    stationId: 'VES-COORD-01',
    ...vesCoordinates,
    readings: [{ ab2: 5, mn2: 1, resistance: 10 }]
  });
  await saveERT({
    id: 'coord-ert-01',
    lineId: 'ERT-COORD-01',
    ...ertCoordinates,
    cells: [{ x: 0, depth: 1, resistivity: 75 }],
    sourceImport: {
      fileName: 'ert-coordinate-source.csv',
      content: 'x,depth,resistivity\n0,1,75',
      importedAt: '2026-11-21T12:00:00.000Z'
    }
  });
  await db.put('samples', {
    id: 'coord-sample-01',
    sampleCode: 'GW-COORD-01',
    latitude: 4.92,
    longitude: 6.26,
    coordinateFormat: 'DDM',
    coordinateOriginal: {
      latitude: '4 55.2000',
      longitude: '6 15.6000',
      latitudeHemisphere: 'N',
      longitudeHemisphere: 'E'
    },
    coordinateDatum: 'WGS84',
    coordinateCRS: 'Geographic (WGS84)',
    coordinateStorageCRS: 'EPSG:4326',
    nitrate: null
  });

  const savedVES = (await listVES()).find(record => record.id === 'coord-ves-01');
  const savedERT = await db.get('ert', 'coord-ert-01');
  assert.equal(savedVES.latitude, 4.92);
  assert.equal(savedVES.longitude, 6.26);
  assert.equal(savedVES.coordinateOriginal.latitude, '4 55 12');
  assert.equal(savedVES.coordinateFormat, 'DMS');
  assert.equal(savedVES.coordinateStorageCRS, 'EPSG:4326');
  assert.equal(savedERT.latitude, -4.92);
  assert.equal(savedERT.longitude, -6.26);
  assert.equal(savedERT.coordinateOriginal.longitudeHemisphere, 'W');
  assert.equal(savedERT.coordinateFormat, 'DDM');
  assert.equal(savedERT.coordinateStorageCRS, 'EPSG:4326');
  assert.equal(savedERT.coordinateCRS, 'UTM Zone 32S (WGS84)');
  assert.equal((await getERTSource('coord-ert-01')).content, 'x,depth,resistivity\n0,1,75');

  const backup = await createDatabaseBackup();
  await clearAllStores(db);
  const result = await restoreDatabaseBackup(backup, 'replace');
  assert.equal(result.restored, 4);

  const restoredVES = (await listVES()).find(record => record.id === 'coord-ves-01');
  const restoredERT = await db.get('ert', 'coord-ert-01');
  const restoredSample = await db.get('samples', 'coord-sample-01');
  assert.equal(restoredVES.latitude, 4.92);
  assert.equal(restoredVES.longitude, 6.26);
  assert.equal(restoredVES.coordinateOriginal.latitude, '4 55 12');
  assert.equal(restoredVES.coordinateDatum, 'WGS84');
  assert.equal(restoredVES.coordinateStorageCRS, 'EPSG:4326');
  assert.equal(restoredERT.latitude, -4.92);
  assert.equal(restoredERT.longitude, -6.26);
  assert.equal(restoredERT.coordinateOriginal.longitude, '6 15.6000');
  assert.equal(restoredERT.coordinateCRS, 'UTM Zone 32S (WGS84)');
  assert.equal(restoredERT.coordinateStorageCRS, 'EPSG:4326');
  assert.equal((await getERTSource('coord-ert-01')).fileName, 'ert-coordinate-source.csv');
  assert.equal(restoredSample.latitude, 4.92);
  assert.equal(restoredSample.longitude, 6.26);
  assert.equal(restoredSample.coordinateFormat, 'DDM');
  assert.equal(restoredSample.coordinateOriginal.longitude, '6 15.6000');
  assert.equal(restoredSample.coordinateStorageCRS, 'EPSG:4326');
  assert.equal(restoredSample.nitrate, null);
});
