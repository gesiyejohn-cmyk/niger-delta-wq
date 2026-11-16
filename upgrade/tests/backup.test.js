import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_FORMAT, validateDatabaseBackup } from '../src/storage/backup.js';

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
