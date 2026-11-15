import { getDB } from './db.js';

const makeId = () => globalThis.crypto?.randomUUID?.() || `geo_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export async function saveVES(record) {
  const db = await getDB();
  const saved = { ...record, id: record.id || makeId(), createdAt: record.createdAt || new Date().toISOString() };
  await db.put('ves', saved);
  return saved;
}
export async function listVES() { return (await getDB()).getAll('ves'); }
export async function deleteVES(id) { return (await getDB()).delete('ves', id); }

export async function saveERT(record) {
  const db = await getDB();
  const id = record.id || makeId();
  const { sourceImport, ...model } = record;
  const saved = { ...model, id, createdAt: record.createdAt || new Date().toISOString() };
  const tx = db.transaction(['ert', 'ertSource'], 'readwrite');
  if (sourceImport?.content != null) {
    await tx.objectStore('ertSource').put({
      id,
      fileName: sourceImport.fileName || 'imported-ert-model.csv',
      content: sourceImport.content,
      contentType: 'text/csv',
      importedAt: sourceImport.importedAt || new Date().toISOString()
    });
    saved.sourceImportId = id;
  }
  await tx.objectStore('ert').put(saved);
  await tx.done;
  return saved;
}
export async function listERT() { return (await getDB()).getAll('ert'); }
export async function getERTSource(id) { return (await getDB()).get('ertSource', id); }
export async function deleteERT(id) {
  const db = await getDB();
  const tx = db.transaction(['ert', 'ertSource'], 'readwrite');
  await tx.objectStore('ert').delete(id);
  await tx.objectStore('ertSource').delete(id);
  await tx.done;
}
