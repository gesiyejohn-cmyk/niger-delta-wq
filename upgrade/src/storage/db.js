import { openDB } from 'idb';

export const DATABASE_NAME = 'niger-delta-wq';
export const DATABASE_VERSION = 9;

export function upgradeDatabase(db, oldVersion, newVersion, transaction) {
  // Repair missing indexes on an existing samples store without replacing
  // the store or disturbing any records from an earlier installation.
  const samples = db.objectStoreNames.contains('samples')
    ? transaction.objectStore('samples')
    : db.createObjectStore('samples', { keyPath: 'id' });
  if (!samples.indexNames.contains('byCode')) samples.createIndex('byCode', 'sampleCode');
  if (!samples.indexNames.contains('byDate')) samples.createIndex('byDate', 'collectionDate');
  if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
  if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
  if (!db.objectStoreNames.contains('ves')) db.createObjectStore('ves', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('vesInterpretations')) db.createObjectStore('vesInterpretations', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('ert')) db.createObjectStore('ert', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('ertSource')) db.createObjectStore('ertSource', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('ertFieldReadings')) db.createObjectStore('ertFieldReadings', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('ertInterpretations')) db.createObjectStore('ertInterpretations', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('vulnerability')) db.createObjectStore('vulnerability', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('wqiAssessments')) db.createObjectStore('wqiAssessments', { keyPath: 'id' });
}

let promise;

export function getDB() {
  if (!promise) promise = openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: upgradeDatabase
  });
  return promise;
}
