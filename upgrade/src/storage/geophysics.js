import { getDB } from './db.js';

const makeId = () => globalThis.crypto?.randomUUID?.() || `geo_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export async function saveVES(record) {
  const db = await getDB();
  const { interpretation, ...rawRecord } = record;
  const saved = { ...rawRecord, id: record.id || makeId(), createdAt: record.createdAt || new Date().toISOString() };
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  await tx.objectStore('ves').put(saved);
  if (interpretation) await tx.objectStore('vesInterpretations').put({ ...interpretation, id: saved.id, vesId: saved.id });
  await tx.done;
  return saved;
}

export async function listVES() {
  const db = await getDB();
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  const rawRecords = await tx.objectStore('ves').getAll();
  const interpretations = tx.objectStore('vesInterpretations');
  // One-time, non-destructive migration of earlier records that stored the
  // interpretation object inside the raw VES record.
  for (const record of rawRecords) {
    if (record.interpretation) {
      await interpretations.put({ ...record.interpretation, id: record.id, vesId: record.id });
      delete record.interpretation;
      await tx.objectStore('ves').put(record);
    }
  }
  const savedInterpretations = await interpretations.getAll();
  await tx.done;
  const byVesId = new Map(savedInterpretations.map(item => [item.vesId || item.id, item]));
  return rawRecords.map(record => ({ ...record, interpretation: byVesId.get(record.id) || null }));
}

export async function deleteVES(id) {
  const db = await getDB();
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  await tx.objectStore('ves').delete(id);
  await tx.objectStore('vesInterpretations').delete(id);
  await tx.done;
}

export async function saveVESInterpretation(vesId, interpretation) {
  const db = await getDB();
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  const raw = await tx.objectStore('ves').get(vesId);
  if (!raw) {
    tx.abort();
    throw new Error('The selected raw VES sounding no longer exists.');
  }
  await tx.objectStore('vesInterpretations').put({
    ...interpretation,
    id: vesId,
    vesId
  });
  await tx.done;
  return interpretation;
}

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
