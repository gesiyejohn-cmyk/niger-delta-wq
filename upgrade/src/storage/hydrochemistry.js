import { getDB } from './db.js';
const makeId=()=>globalThis.crypto?.randomUUID?.()||'chem_'+Date.now()+'_'+Math.random().toString(36).slice(2);
export async function saveHydrochemistrySample(record){const db=await getDB();const saved={...record,id:record.id||makeId(),updatedAt:new Date().toISOString()};await db.put('hydrochemistry',saved);return saved;}
export async function listHydrochemistrySamples(){const db=await getDB();return db.getAll('hydrochemistry');}
export async function deleteHydrochemistrySample(id){const db=await getDB();await db.delete('hydrochemistry',id);}
