import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_FORMAT, validateDatabaseBackup } from '../src/storage/backup.js';

test('backup validator accepts an empty versioned database backup', () => {
  const backup = { format: BACKUP_FORMAT, version: 1, stores: { samples: [], settings: [], syncQueue: [], ves: [], ert: [] } };
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
