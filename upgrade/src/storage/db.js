import { openDB } from 'idb';

let promise;

export function getDB() {
  if (!promise) promise = openDB('niger-delta-wq', 5, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('samples')) {
        const store = db.createObjectStore('samples', { keyPath: 'id' });
        store.createIndex('byCode', 'sampleCode');
        store.createIndex('byDate', 'collectionDate');
      }
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('ves')) db.createObjectStore('ves', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('ert')) db.createObjectStore('ert', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('ertSource')) db.createObjectStore('ertSource', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('vulnerability')) db.createObjectStore('vulnerability', { keyPath: 'id' });
    }
  });
  return promise;
}
