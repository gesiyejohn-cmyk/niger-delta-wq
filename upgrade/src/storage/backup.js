import { getDB } from './db.js';

export const BACKUP_FORMAT = 'niger-delta-wq-backup';
export const BACKUP_VERSION = 1;
const STORE_NAMES = ['samples', 'settings', 'syncQueue', 'ves', 'vesInterpretations', 'ert', 'ertSource', 'vulnerability', 'wqiAssessments'];

export async function createDatabaseBackup() {
  const db = await getDB();
  const names = STORE_NAMES.filter(name => db.objectStoreNames.contains(name));
  const tx = db.transaction(names, 'readonly');
  const stores = {};
  try {
    await Promise.all(names.map(async name => {
      stores[name] = await tx.objectStore(name).getAll();
    }));
    await tx.done;
  } catch (error) {
    try { tx.abort(); } catch { /* transaction may already be closed */ }
    throw new Error('Backup could not be completed: ' + error.message);
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    application: 'Niger Delta WQ',
    exportedAt: new Date().toISOString(),
    stores
  };
}

export function validateDatabaseBackup(backup) {
  if (!backup || backup.format !== BACKUP_FORMAT) throw new Error('This file is not a Niger Delta WQ backup.');
  if (backup.version !== BACKUP_VERSION) throw new Error('Unsupported backup version: ' + backup.version);
  if (!backup.stores || typeof backup.stores !== 'object' || Array.isArray(backup.stores)) throw new Error('Backup data section is missing or invalid.');
  for (const name of Object.keys(backup.stores)) {
    if (!STORE_NAMES.includes(name)) throw new Error('Backup contains an unsupported data store: ' + name);
    if (!Array.isArray(backup.stores[name])) throw new Error('Backup store ' + name + ' is not a valid record list.');
  }
  for (const name of STORE_NAMES) {
    const keys = new Set();
    for (const record of backup.stores[name] || []) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Backup contains an invalid record in ' + name + '.');
      const key = name === 'settings' ? record.key : record.id;
      if (key == null) throw new Error('A record in ' + name + ' is missing its primary key.');
      if (keys.has(key)) throw new Error('Backup contains duplicate primary keys in ' + name + '.');
      keys.add(key);
    }
  }
  return backup;
}

export async function restoreDatabaseBackup(input, mode = 'merge') {
  const backup = validateDatabaseBackup(input);
  if (!['merge', 'replace'].includes(mode)) throw new Error('Choose merge or replace restore mode.');
  const db = await getDB();
  // A partial backup must never clear stores it does not contain.
  const names = STORE_NAMES.filter(name =>
    db.objectStoreNames.contains(name) && Object.hasOwn(backup.stores, name)
  );
  const result = { restored: 0, skipped: 0, mode };
  if (!names.length) return result;
  if (mode === 'replace' && names.every(name => backup.stores[name].length === 0)) {
    throw new Error('Cannot replace current data with an empty backup. Select a backup that contains records.');
  }
  const tx = db.transaction(names, 'readwrite');
  // Attach a rejection handler immediately: an IndexedDB request failure also
  // rejects idb's transaction-done promise, even when the request is caught below.
  const transactionDone = tx.done;
  transactionDone.catch(() => {});
  try {
    for (const name of names) {
      const store = tx.objectStore(name);
      if (mode === 'replace') await store.clear();
      for (const record of backup.stores[name] || []) {
        const key = name === 'settings' ? record.key : record.id;
        if (mode === 'merge' && await store.get(key) !== undefined) {
          result.skipped++;
          continue;
        }
        await store.put(record);
        result.restored++;
      }
    }
    await transactionDone;
    return result;
  } catch (error) {
    try { tx.abort(); } catch { /* transaction may already be closed */ }
    await transactionDone.catch(() => {});
    throw new Error('Restore was not completed: ' + error.message);
  }
}
