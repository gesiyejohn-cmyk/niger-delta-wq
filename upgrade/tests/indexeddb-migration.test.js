import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openDB, deleteDB } from 'idb';
import { getDB } from '../src/storage/db.js';
import { listVES, listERT, getERTSource } from '../src/storage/geophysics.js';
import { createDatabaseBackup } from '../src/storage/backup.js';

test('upgrades a version 6 database to version 9 without losing records or embedded source data', async () => {
  const databaseName = 'niger-delta-wq';
  await deleteDB(databaseName);

  let legacyDb;
  let db;
  try {
    legacyDb = await openDB(databaseName, 6, {
      upgrade(database) {
        const samples = database.createObjectStore('samples', { keyPath: 'id' });
        samples.createIndex('byCode', 'sampleCode');
        samples.createIndex('byDate', 'collectionDate');
        database.createObjectStore('settings', { keyPath: 'key' });
        database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        database.createObjectStore('ves', { keyPath: 'id' });
        database.createObjectStore('ert', { keyPath: 'id' });
      }
    });

    const legacySample = {
      id: 'legacy-sample-v6',
      sampleCode: 'GW-V6-01',
      measurements: { pH: 7, nitrate: null }
    };
    await legacyDb.put('samples', legacySample);
    await legacyDb.put('settings', { key: 'units', value: 'metric' });
    const queueId = await legacyDb.add('syncQueue', {
      action: 'sample-upsert',
      recordId: legacySample.id
    });
    await legacyDb.put('ves', {
      id: 'legacy-ves-v6',
      stationId: 'VES-V6-01',
      readings: [{ ab2: 5, mn2: 1, resistance: 10, apparentResistivity: 100 }],
      interpretation: {
        method: 'legacy manual interpretation',
        layers: [{ layer: 1, resistivity: 100, thickness: null, bottomDepth: null }]
      }
    });
    const originalCsv = 'x,depth,resistivity\n0,1,55';
    await legacyDb.put('ert', {
      id: 'legacy-ert-v6',
      lineId: 'ERT-V6-01',
      cells: [{ x: 0, depth: 1, resistivity: 55 }],
      sourceImport: {
        fileName: 'legacy-line.csv',
        content: originalCsv,
        importedAt: '2026-11-14T10:00:00.000Z'
      }
    });
    legacyDb.close();
    legacyDb = undefined;

    db = await getDB();
    assert.equal(db.version, 9);
    for (const name of ['vesInterpretations', 'ertSource', 'ertFieldReadings', 'ertInterpretations', 'vulnerability', 'wqiAssessments']) {
      assert.equal(db.objectStoreNames.contains(name), true, `missing upgraded store: ${name}`);
    }

    assert.deepEqual(await db.get('samples', legacySample.id), legacySample);
    assert.deepEqual(await db.get('settings', 'units'), { key: 'units', value: 'metric' });
    assert.equal((await db.get('syncQueue', queueId)).recordId, legacySample.id);
    assert.equal(db.transaction('samples', 'readonly').store.indexNames.contains('byCode'), true);
    assert.equal(db.transaction('samples', 'readonly').store.indexNames.contains('byDate'), true);

    const vesRecords = await listVES();
    assert.equal(vesRecords[0].interpretation.method, 'legacy manual interpretation');
    assert.deepEqual(vesRecords[0].readings, [{ ab2: 5, mn2: 1, resistance: 10, apparentResistivity: 100 }]);
    const rawVes = await db.get('ves', 'legacy-ves-v6');
    assert.equal(Object.hasOwn(rawVes, 'interpretation'), false);
    assert.equal((await db.get('vesInterpretations', 'legacy-ves-v6')).vesId, 'legacy-ves-v6');

    // A conflicting separately stored source must abort the whole lazy migration,
    // leaving embedded legacy files intact rather than silently overwriting either copy.
    await db.put('ert', {
      id: 'zz-conflicting-ert',
      lineId: 'ERT-CONFLICT',
      cells: [],
      sourceImport: { fileName: 'embedded.csv', content: 'embedded-source' }
    });
    await db.put('ertSource', {
      id: 'zz-conflicting-ert',
      fileName: 'existing.csv',
      content: 'different-existing-source',
      contentType: 'text/csv'
    });
    await assert.rejects(listERT(), /different separately stored source file/);
    assert.equal((await db.get('ert', 'legacy-ert-v6')).sourceImport.content, originalCsv);
    assert.equal(await db.get('ertSource', 'legacy-ert-v6'), undefined);
    assert.equal((await db.get('ertSource', 'zz-conflicting-ert')).content, 'different-existing-source');

    await db.delete('ert', 'zz-conflicting-ert');
    await db.delete('ertSource', 'zz-conflicting-ert');
    const ertRecords = await listERT();
    assert.equal(ertRecords[0].sourceImport, undefined);
    assert.equal(ertRecords[0].sourceImportId, 'legacy-ert-v6');
    assert.deepEqual(ertRecords[0].cells, [{ x: 0, depth: 1, resistivity: 55 }]);

    const source = await getERTSource('legacy-ert-v6');
    assert.equal(source.fileName, 'legacy-line.csv');
    assert.equal(source.content, originalCsv);
    assert.equal(source.importedAt, '2026-11-14T10:00:00.000Z');

    const backup = await createDatabaseBackup();
    assert.equal(backup.stores.ves.length, 1);
    assert.equal(backup.stores.vesInterpretations.length, 1);
    assert.equal(backup.stores.ert.length, 1);
    assert.equal(backup.stores.ertSource.length, 1);
    assert.equal(backup.stores.ertSource[0].content, originalCsv);
    assert.equal(backup.stores.samples[0].measurements.nitrate, null);
  } finally {
    legacyDb?.close();
    db?.close();
    await deleteDB(databaseName);
  }
});


test('version 8 to 9 migration adds ERT interpretations without replacing any existing store or record', async () => {
  const databaseName = 'niger-delta-wq-v8-upgrade-regression';
  await deleteDB(databaseName);
  const legacyStoreNames = [
    'samples', 'settings', 'syncQueue', 'ves', 'vesInterpretations',
    'ert', 'ertSource', 'ertFieldReadings', 'vulnerability', 'wqiAssessments'
  ];
  let legacyDb;
  let upgradedDb;
  try {
    legacyDb = await openDB(databaseName, 8, {
      upgrade(database) {
        const samples = database.createObjectStore('samples', { keyPath: 'id' });
        samples.createIndex('byCode', 'sampleCode');
        samples.createIndex('byDate', 'collectionDate');
        database.createObjectStore('settings', { keyPath: 'key' });
        database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        for (const name of legacyStoreNames.filter(name =>
          !['samples', 'settings', 'syncQueue'].includes(name)
        )) database.createObjectStore(name, { keyPath: 'id' });
      }
    });

    const records = {
      samples: { id: 'v8-sample', sampleCode: 'GW-V8-01', nitrate: null },
      settings: { key: 'coordinateFormat', value: 'DMS' },
      ves: { id: 'v8-ves', readings: [{ ab2: 5, apparentResistivity: 120 }] },
      vesInterpretations: { id: 'v8-ves', vesId: 'v8-ves', layers: [{ resistivity: 120 }] },
      ert: { id: 'v8-ert', cells: [{ x: 0, depth: 1, resistivity: 80 }] },
      ertSource: { id: 'v8-ert', fileName: 'v8-line.csv', content: 'x,depth,resistivity\\n0,1,80' },
      ertFieldReadings: { id: 'v8-reading', array: 'Wenner', apparentResistivity: 80 },
      vulnerability: { id: 'v8-vulnerability', method: 'DRASTIC', weightedScore: 120 },
      wqiAssessments: { id: 'v8-wqi', result: { wqi: 42 } }
    };
    for (const [name, record] of Object.entries(records)) await legacyDb.put(name, record);
    const queueId = await legacyDb.add('syncQueue', { action: 'sample-upsert', recordId: 'v8-sample' });
    legacyDb.close();
    legacyDb = undefined;

    const { upgradeDatabase, DATABASE_VERSION } = await import('../src/storage/db.js');
    assert.equal(DATABASE_VERSION, 9);
    upgradedDb = await openDB(databaseName, DATABASE_VERSION, { upgrade: upgradeDatabase });

    assert.equal(upgradedDb.version, 9);
    for (const name of legacyStoreNames) {
      assert.equal(upgradedDb.objectStoreNames.contains(name), true, 'existing store retained: ' + name);
    }
    assert.equal(upgradedDb.objectStoreNames.contains('ertInterpretations'), true);
    for (const [name, record] of Object.entries(records)) {
      assert.deepEqual(await upgradedDb.get(name, name === 'settings' ? record.key : record.id), record, name);
    }
    assert.equal((await upgradedDb.get('syncQueue', queueId)).recordId, 'v8-sample');
    assert.equal(upgradedDb.transaction('samples', 'readonly').store.indexNames.contains('byCode'), true);
    assert.equal(upgradedDb.transaction('samples', 'readonly').store.indexNames.contains('byDate'), true);
    assert.deepEqual(await upgradedDb.getAll('ertInterpretations'), []);
  } finally {
    legacyDb?.close();
    upgradedDb?.close();
    await deleteDB(databaseName);
  }
});
