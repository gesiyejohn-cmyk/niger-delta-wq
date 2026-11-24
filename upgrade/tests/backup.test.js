import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_FORMAT,
  createDatabaseBackup,
  restoreDatabaseBackup,
  validateDatabaseBackup
} from '../src/storage/backup.js';
import { getDB } from '../src/storage/db.js';

const STORE_NAMES = [
  'samples', 'settings', 'syncQueue', 'ves', 'vesInterpretations',
  'ert', 'ertSource', 'ertInterpretations', 'hydrochemistry', 'vulnerability', 'wqiAssessments'
];

async function clearStores(db, names = STORE_NAMES) {
  const tx = db.transaction(names, 'readwrite');
  await Promise.all(names.map(name => tx.objectStore(name).clear()));
  await tx.done;
}

test('backup export includes every current IndexedDB store', async () => {
  const db = await getDB();
  const backup = await createDatabaseBackup();
  const expected = Array.from(db.objectStoreNames).sort();
  assert.deepEqual(Object.keys(backup.stores).sort(), expected);
});

test('backup validator accepts an empty versioned database backup', () => {
  const backup = { format: BACKUP_FORMAT, version: 1, stores: { samples: [], settings: [], syncQueue: [], ves: [], vesInterpretations: [], ert: [], ertSource: [], vulnerability: [], wqiAssessments: [] } };
  assert.equal(validateDatabaseBackup(backup), backup);
});

test('backup validator rejects unknown format and unsupported version', () => {
  assert.throws(() => validateDatabaseBackup({ format: 'other', version: 1, stores: {} }));
  assert.throws(() => validateDatabaseBackup({ format: BACKUP_FORMAT, version: 99, stores: {} }));
});

test('backup validator rejects malformed stores and records without keys', () => {
  assert.throws(() => validateDatabaseBackup({ format: BACKUP_FORMAT, version: 1, stores: { samples: {} } }));
  assert.throws(() => validateDatabaseBackup({ format: BACKUP_FORMAT, version: 1, stores: { samples: [{ sampleCode: 'S-1' }] } }));
  assert.throws(() => validateDatabaseBackup({ format: BACKUP_FORMAT, version: 1, stores: { settings: [{ id: 'wrong-key' }] } }));
});

test('backup validator rejects primary keys that IndexedDB cannot use', () => {
  for (const key of [true, false, {}, [], '', '   ', NaN, Infinity, -Infinity]) {
    assert.throws(
      () => validateDatabaseBackup({ format: BACKUP_FORMAT, version: 1, stores: { samples: [{ id: key }] } }),
      /non-empty string or finite numeric primary key/
    );
  }
  assert.doesNotThrow(() => validateDatabaseBackup({
    format: BACKUP_FORMAT,
    version: 1,
    stores: {
      settings: [{ key: 'coordinateFormat', value: 'DMS' }],
      syncQueue: [{ id: 12, status: 'pending' }]
    }
  }));
});

test('backup validator accepts separately stored VES interpretations and original ERT CSV records', () => {
  const backup = {
    format: BACKUP_FORMAT,
    version: 1,
    stores: {
      ves: [{ id: 'ves-1', readings: [{ ab2: 5, mn2: 1, resistance: 10 }] }],
      vesInterpretations: [{ id: 'ves-1', vesId: 'ves-1', layers: [{ layer: 1, resistivity: 100 }] }],
      ert: [{ id: 'ert-1', sourceImportId: 'ert-1', cells: [{ x: 0, depth: 1, resistivity: 50 }] }],
      ertSource: [{ id: 'ert-1', fileName: 'line.csv', content: 'x,depth,resistivity\\n0,1,50' }]
    }
  };
  assert.equal(validateDatabaseBackup(backup), backup);
});

test('backup validator rejects null and unknown store entries', () => {
  assert.throws(() => validateDatabaseBackup({ format: BACKUP_FORMAT, version: 1, stores: { samples: null } }));
  assert.throws(() => validateDatabaseBackup({ format: BACKUP_FORMAT, version: 1, stores: { unexpected: [] } }));
});

test('full backup and replace restore preserve raw data, interpretations and missing values', async () => {
  const db = await getDB();
  await clearStores(db);
  const fixture = {
    samples: [{ id: 'sample-1', sampleCode: 'GW-01', nitrate: null, coordinates: { latitude: 4.92, longitude: 6.26, datum: 'WGS84' } }],
    settings: [{ key: 'coordinateFormat', value: 'DMS' }],
    syncQueue: [{ id: 12, sampleId: 'sample-1', status: 'pending' }],
    ves: [{ id: 'ves-1', station: 'VES-01', readings: [{ ab2: 5, mn2: 1, resistance: 10 }] }],
    vesInterpretations: [{ id: 'ves-1', vesId: 'ves-1', layers: [{ layer: 1, resistivity: 100, thickness: 2 }] }],
    ert: [{ id: 'ert-1', line: 'LINE-01', sourceImportId: 'ert-1', cells: [{ x: 0, depth: 1, resistivity: 50 }] }],
    ertInterpretations: [{ id: 'ert-1', ertModelId: 'ert-1', interpretationStatus: 'provisional', units: [{ id: 'unit-1', name: 'Sand', confidence: 'low' }] }],
    ertSource: [{ id: 'ert-1', fileName: 'line.csv', contentType: 'text/csv', content: 'x,depth,resistivity\\n0,1,50' }],
    hydrochemistry: [{ id: 'chem-1', sampleId: 'CHEM-01', ca: 18, mg: 7, na: 22, coordinateFormat: 'DDM' }],
    vulnerability: [{ id: 'vuln-1', method: 'DRASTIC', weightedScore: 120, ratings: { depth: 5 } }],
    wqiAssessments: [{ id: 'wqi-1', sample: { id: 'sample-1' }, measurements: [{ key: 'nitrate', measuredValue: null }], result: { wqi: 20, details: [] }, standardSource: 'Project reference' }]
  };
  const seed = db.transaction(STORE_NAMES, 'readwrite');
  for (const name of STORE_NAMES) {
    for (const record of fixture[name]) await seed.objectStore(name).put(record);
  }
  await seed.done;

  const backup = await createDatabaseBackup();
  assert.equal(backup.stores.samples[0].nitrate, null);
  assert.equal(backup.stores.ertSource[0].content, fixture.ertSource[0].content);
  await clearStores(db);

  const restored = await restoreDatabaseBackup(backup, 'replace');
  assert.deepEqual(restored, { restored: 11, skipped: 0, mode: 'replace' });
  for (const name of STORE_NAMES) {
    assert.deepEqual(await db.getAll(name), fixture[name], name + ' should round-trip without data loss');
  }
  assert.equal((await db.get('samples', 'sample-1')).nitrate, null);
  assert.equal((await db.get('vesInterpretations', 'ves-1')).vesId, 'ves-1');
  assert.equal((await db.get('ertSource', 'ert-1')).content, 'x,depth,resistivity\\n0,1,50');
  assert.equal((await db.get('ertInterpretations', 'ert-1')).units[0].name, 'Sand');
  assert.equal((await db.get('hydrochemistry', 'chem-1')).ca, 18);
});

test('merge restore keeps existing records and adds only records with new IDs', async () => {
  const db = await getDB();
  await clearStores(db);
  await db.put('samples', { id: 'sample-existing', sampleCode: 'LOCAL' });
  const backup = {
    format: BACKUP_FORMAT,
    version: 1,
    stores: {
      samples: [
        { id: 'sample-existing', sampleCode: 'BACKUP' },
        { id: 'sample-new', sampleCode: 'RESTORED', nitrate: null }
      ]
    }
  };

  const result = await restoreDatabaseBackup(backup, 'merge');
  assert.deepEqual(result, { restored: 1, skipped: 1, mode: 'merge' });
  assert.equal((await db.get('samples', 'sample-existing')).sampleCode, 'LOCAL');
  assert.equal((await db.get('samples', 'sample-new')).nitrate, null);
});

test('partial replace touches only stores present in the backup', async () => {
  const db = await getDB();
  await clearStores(db);
  await db.put('samples', { id: 'sample-old', sampleCode: 'OLD' });
  await db.put('settings', { key: 'keep-setting', value: 'preserve' });
  await db.put('hydrochemistry', { id: 'chem-keep', sampleId: 'GW-KEEP', ca: 18, mg: 7, na: 22 });
  const backup = {
    format: BACKUP_FORMAT,
    version: 1,
    stores: { samples: [{ id: 'sample-new', sampleCode: 'NEW' }] }
  };

  const result = await restoreDatabaseBackup(backup, 'replace');
  assert.deepEqual(result, { restored: 1, skipped: 0, mode: 'replace' });
  assert.deepEqual(await db.getAll('samples'), [{ id: 'sample-new', sampleCode: 'NEW' }]);
  assert.deepEqual(await db.get('settings', 'keep-setting'), { key: 'keep-setting', value: 'preserve' });
  assert.deepEqual(await db.get('hydrochemistry', 'chem-keep'), {
    id: 'chem-keep', sampleId: 'GW-KEEP', ca: 18, mg: 7, na: 22
  });
});

test('replace refuses an empty backup before clearing current records', async () => {
  const db = await getDB();
  await clearStores(db);
  await db.put('samples', { id: 'sample-safe', sampleCode: 'KEEP' });
  const emptyBackup = { format: BACKUP_FORMAT, version: 1, stores: { samples: [] } };

  await assert.rejects(restoreDatabaseBackup(emptyBackup, 'replace'), /Cannot replace current data with an empty backup/);
  assert.deepEqual(await db.get('samples', 'sample-safe'), { id: 'sample-safe', sampleCode: 'KEEP' });
});
