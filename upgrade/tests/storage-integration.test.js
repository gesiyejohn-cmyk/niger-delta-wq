import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/storage/db.js';
import { saveVES, listVES, saveVESInterpretation, saveERT, getERTSource } from '../src/storage/geophysics.js';
import { createDatabaseBackup, restoreDatabaseBackup } from '../src/storage/backup.js';

test('IndexedDB separates raw VES readings and interpretations, preserves original ERT CSV, and round-trips full backup', async () => {
  const db = await getDB();
  const stores = ['samples', 'settings', 'syncQueue', 'ves', 'vesInterpretations', 'ert', 'ertSource', 'vulnerability'];
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

  const backup = await createDatabaseBackup();
  assert.equal(backup.stores.ves.length, 1);
  assert.equal(backup.stores.vesInterpretations.length, 1);
  assert.equal(backup.stores.ert.length, 1);
  assert.equal(backup.stores.ertSource.length, 1);

  const emptyTx = db.transaction(stores, 'readwrite');
  for (const name of stores) await emptyTx.objectStore(name).clear();
  await emptyTx.done;
  const result = await restoreDatabaseBackup(backup, 'replace');
  assert.equal(result.restored, 4);
  assert.equal((await listVES())[0].interpretation.layers[0].resistivity, 125);
  assert.equal((await getERTSource('ert-model-1')).fileName, 'field-export.csv');
});

test('replace restore leaves local stores untouched when a partial backup omits them', async () => {
  const db = await getDB();
  const tx = db.transaction(['samples', 'settings'], 'readwrite');
  await tx.objectStore('samples').put({ id: 'partial-old-sample', sampleCode: 'OLD' });
  await tx.objectStore('settings').put({ key: 'local-setting', value: 'keep-me' });
  await tx.done;

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
