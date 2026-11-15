import { getDB } from './db.js';

export const BACKUP_FORMAT = 'niger-delta-wq-backup';
export const BACKUP_VERSION = 1;
const STORE_NAMES = ['samples', 'settings', 'syncQueue', 'ves', 'ert', 'ertSource', 'vulnerability'];

export async function createDatabaseBackup() {
  const db = await getDB();
  const stores = {};
  for (const name of STORE_NAMES) {
    if (db.objectStoreNames.contains(name)) stores[name] = await db.getAll(name);
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
  for (const name of STORE_NAMES) {
    if (backup.stores[name] != null && !Array.isArray(backup.stores[name])) throw new Error('Backup store ' + name + ' is not a valid record list.');
  }
  for (const name of STORE_NAMES) {
    for (const record of backup.stores[name] || []) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Backup contains an invalid record in ' + name + '.');
      const key = name === 'settings' ? record.key : record.id;
      if (key == null) throw new Error('A record in ' + name + ' is missing its primary key.');
    }
  }
  return backup;
}

export async function restoreDatabaseBackup(input, mode = 'merge') {
  const backup = validateDatabaseBackup(input);
  if (!['merge', 'replace'].includes(mode)) throw new Error('Choose merge or replace restore mode.');
  const db = await getDB();
  const names = STORE_NAMES.filter(name => db.objectStoreNames.contains(name));
  const tx = db.transaction(names, 'readwrite');
  const result = { restored: 0, skipped: 0, mode };
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
    await tx.done;
    return result;
  } catch (error) {
    try { tx.abort(); } catch { /* transaction may already be closed */ }
    throw new Error('Restore was not completed: ' + error.message);
  }
}
