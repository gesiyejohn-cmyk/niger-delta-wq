import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/storage/db.js';
import { saveVES, listVES, saveVESInterpretation, saveERT, getERTSource, saveERTInterpretation, getERTInterpretation, deleteERT, saveERTFieldReadings, listERTFieldReadings } from '../src/storage/geophysics.js';
import { createDatabaseBackup, restoreDatabaseBackup, validateDatabaseBackup } from '../src/storage/backup.js';
import { saveWQIAssessment, listWQIAssessments } from '../src/storage/wqi.js';

test('IndexedDB separates raw VES readings and interpretations, preserves original ERT CSV, and round-trips full backup', async () => {
  const db = await getDB();
  const stores = ['samples', 'settings', 'syncQueue', 'ves', 'vesInterpretations', 'ert', 'ertSource', 'ertFieldReadings', 'ertInterpretations', 'vulnerability', 'wqiAssessments'];
  const clearTx = db.transaction(stores, 'readwrite');
  for (const name of stores) await clearTx.objectStore(name).clear();
  await clearTx.done;

  await db.put('ves', {
    id: 'legacy-ves-1',
    stationId: 'VES-LEGACY',
    readings: [{ ab2: 5, mn2: 1, resistance: 10, apparentResistivity: 100 }],
    interpretation: {
      method: 'legacy embedded interpretation',
      layers: [{ layer: 1, resistivity: 100, thickness: null, bottomDepth: null }]
    }
  });

  const migrated = await listVES();
  assert.equal(migrated[0].interpretation.method, 'legacy embedded interpretation');
  const rawVES = await db.get('ves', 'legacy-ves-1');
  assert.equal(Object.hasOwn(rawVES, 'interpretation'), false);
  assert.equal((await db.get('vesInterpretations', 'legacy-ves-1')).vesId, 'legacy-ves-1');

  await saveVESInterpretation('legacy-ves-1', {
    method: 'manual layered-earth interpretation',
    layers: [{ layer: 1, resistivity: 125, thickness: null, bottomDepth: null }]
  });
  assert.equal((await listVES())[0].interpretation.layers[0].resistivity, 125);

  await saveERT({
    id: 'ert-model-1',
    lineId: 'ERT-01',
    cells: [{ x: 0, depth: 1, resistivity: 75 }],
    source: 'Imported inverted resistivity model',
    sourceImport: { fileName: 'field-export.csv', content: 'x,depth,resistivity\\n0,1,75' }
  });
  const ertModel = await db.get('ert', 'ert-model-1');
  assert.equal(Object.hasOwn(ertModel, 'sourceImport'), false);
  assert.equal((await getERTSource('ert-model-1')).content, 'x,depth,resistivity\\n0,1,75');

  const interpretation = {
    schemaVersion: 1,
    ertModelId: 'ert-model-1',
    lineId: 'ERT-01',
    xRange: [0, 10],
    depthRange: [0, 20],
    interpretationStatus: 'provisional',
    units: [{ id: 'unit-1', name: 'Sand', confidence: 'low', evidence: 'Illustrative only; verify with borehole data.', aquiferPotential: 'possible' }],
    stations: [{ x: 0, boundaries: [0, 20] }, { x: 10, boundaries: [0, 20] }]
  };
  const savedInterpretation = await saveERTInterpretation('ert-model-1', interpretation);
  assert.equal(savedInterpretation.ertModelId, 'ert-model-1');
  assert.equal((await getERTInterpretation('ert-model-1')).units[0].name, 'Sand');
  await assert.rejects(saveERTInterpretation('missing-ert-model', interpretation), /raw ERT model no longer exists/);

  await saveWQIAssessment({
    sample: { id: 'sample-wqi-1', sampleCode: 'GW-01', stationName: 'Test borehole', collectionDate: '2026-11-15' },
    standardSource: 'Project-defined test limits',
    method: 'Weighted arithmetic WQI',
    measurements: [{ key: 'tds', label: 'TDS', unit: 'mg/L', measuredValue: 100, minStandard: '', maxStandard: '500', ideal: '0', weightStandard: '500' }],
    result: { wqi: 20, parameterCount: 1, missingExcluded: 0, method: 'Weighted arithmetic WQI', details: [{ key: 'tds', qualityRating: 20, applicableLimit: 500, unitWeight: 1, contribution: 20 }] }
  });
  const fieldRecords = await saveERTFieldReadings('ERT-01', [{ array: 'Wenner', electrodes: { A: 0, M: 1, N: 2, B: 3 }, resistanceOhm: 10 }]);
  assert.equal(fieldRecords.length, 1);
  assert.ok(fieldRecords[0].apparentResistivity > 0);
  assert.equal((await listERTFieldReadings('ERT-01')).length, 1);

  const backup = await createDatabaseBackup();
  assert.equal(backup.stores.ves.length, 1);
  assert.equal(backup.stores.vesInterpretations.length, 1);
  assert.equal(backup.stores.ert.length, 1);
  assert.equal(backup.stores.ertSource.length, 1);
  assert.equal(backup.stores.ertFieldReadings.length, 1);
  assert.equal(backup.stores.ertInterpretations.length, 1);
  assert.equal(backup.stores.wqiAssessments.length, 1);

  const emptyTx = db.transaction(stores, 'readwrite');
  for (const name of stores) await emptyTx.objectStore(name).clear();
  await emptyTx.done;
  const result = await restoreDatabaseBackup(backup, 'replace');
  assert.equal(result.restored, 7);
  assert.equal((await listWQIAssessments())[0].result.wqi, 20);
  assert.equal((await listVES())[0].interpretation.layers[0].resistivity, 125);
  assert.equal((await getERTSource('ert-model-1')).fileName, 'field-export.csv');
  assert.equal((await getERTInterpretation('ert-model-1')).units[0].name, 'Sand');
  assert.equal((await listERTFieldReadings('ERT-01')).length, 1);
});

test('replace restore leaves local stores untouched when a partial backup omits them', async () => {
  const db = await getDB();
  const tx = db.transaction(['samples', 'settings'], 'readwrite');
  await tx.objectStore('samples').put({ id: 'partial-old-sample', sampleCode: 'OLD' });
  await tx.objectStore('settings').put({ key: 'local-setting', value: 'keep-me' });
  await tx.done;
  await db.put('wqiAssessments', {
    id: 'legacy-local-wqi', sample: { id: 'sample-local', sampleCode: 'LOCAL' },
    standardSource: 'Legacy local reference', measurements: [{ key: 'tds', measuredValue: 10 }],
    result: { wqi: 5, details: [] }, createdAt: '2026-11-14T10:00:00.000Z'
  });

  const partialBackup = {
    format: 'niger-delta-wq-backup',
    version: 1,
    stores: { samples: [{ id: 'partial-new-sample', sampleCode: 'NEW' }] }
  };
  const result = await restoreDatabaseBackup(partialBackup, 'replace');

  assert.equal(result.restored, 1);
  assert.equal(result.skipped, 0);
  assert.equal(await db.get('samples', 'partial-old-sample'), undefined);
  assert.equal((await db.get('samples', 'partial-new-sample')).sampleCode, 'NEW');
  assert.equal((await db.get('settings', 'local-setting')).value, 'keep-me');
  assert.equal((await db.get('wqiAssessments', 'legacy-local-wqi')).result.wqi, 5);
});

test('replace restore with an empty store map is a safe no-op', async () => {
  const db = await getDB();
  await db.put('settings', { key: 'keep-empty-map-setting', value: 'keep-me' });
  const result = await restoreDatabaseBackup({
    format: 'niger-delta-wq-backup',
    version: 1,
    stores: {}
  }, 'replace');
  assert.deepEqual(result, { restored: 0, skipped: 0, mode: 'replace' });
  assert.equal((await db.get('settings', 'keep-empty-map-setting')).value, 'keep-me');
});

test('replace restore refuses a backup whose included stores are all empty', async () => {
  const db = await getDB();
  await db.put('samples', { id: 'empty-backup-protected', sampleCode: 'KEEP' });

  await assert.rejects(
    restoreDatabaseBackup({
      format: 'niger-delta-wq-backup',
      version: 1,
      stores: { samples: [], settings: [] }
    }, 'replace'),
    /Cannot replace current data with an empty backup/
  );

  assert.equal((await db.get('samples', 'empty-backup-protected')).sampleCode, 'KEEP');
});

test('failed replace restore rolls back the clear and preserves existing records', async () => {
  const db = await getDB();
  await db.put('samples', { id: 'atomic-restore-protected', sampleCode: 'KEEP' });

  const invalidBackup = {
    format: 'niger-delta-wq-backup',
    version: 1,
    stores: {
      samples: [
        { id: 'valid-before-failure', sampleCode: 'NEW' },
        { id: 'not-cloneable', sampleCode: 'BAD', invalidValue() {} }
      ]
    }
  };

  await assert.rejects(
    restoreDatabaseBackup(invalidBackup, 'replace'),
    /Restore was not completed/
  );

  assert.equal((await db.get('samples', 'atomic-restore-protected')).sampleCode, 'KEEP');
  assert.equal(await db.get('samples', 'valid-before-failure'), undefined);
});


test('backup validation rejects duplicate primary keys before restore', () => {
  const duplicateIdBackup = {
    format: 'niger-delta-wq-backup',
    version: 1,
    stores: {
      samples: [
        { id: 'duplicate-sample', sampleCode: 'FIRST' },
        { id: 'duplicate-sample', sampleCode: 'SECOND' }
      ]
    }
  };

  assert.throws(
    () => validateDatabaseBackup(duplicateIdBackup),
    /duplicate primary keys in samples/
  );

  const duplicateSettingBackup = {
    format: 'niger-delta-wq-backup',
    version: 1,
    stores: {
      settings: [
        { key: 'duplicate-setting', value: 'FIRST' },
        { key: 'duplicate-setting', value: 'SECOND' }
      ]
    }
  };

  assert.throws(
    () => validateDatabaseBackup(duplicateSettingBackup),
    /duplicate primary keys in settings/
  );
});


test('deleting an ERT model also deletes its linked interpretation and imported source', async () => {
  const db = await getDB();
  await saveERT({
    id: 'ert-delete-model',
    lineId: 'ERT-DELETE',
    cells: [{ x: 0, depth: 0, resistivity: 50 }, { x: 10, depth: 10, resistivity: 80 }],
    sourceImport: { fileName: 'delete-me.csv', content: 'x,depth,resistivity\\n0,0,50' }
  });
  await saveERTInterpretation('ert-delete-model', {
    schemaVersion: 1,
    ertModelId: 'ert-delete-model',
    units: [{ id: 'u1', name: 'Sand', confidence: 'low', evidence: 'Test only', aquiferPotential: 'unknown' }]
  });
  await deleteERT('ert-delete-model');
  assert.equal(await db.get('ert', 'ert-delete-model'), undefined);
  assert.equal(await db.get('ertSource', 'ert-delete-model'), undefined);
  assert.equal(await getERTInterpretation('ert-delete-model'), undefined);
});
