import{getDB}from'./db.js';
const makeId=()=>globalThis.crypto?.randomUUID?.()||`geo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
export async function saveVES(record){const db=await getDB(),saved={...record,id:record.id||makeId(),createdAt:record.createdAt||new Date().toISOString()};await db.put('ves',saved);return saved;}
export async function listVES(){return(await getDB()).getAll('ves');}
export async function deleteVES(id){return(await getDB()).delete('ves',id);}
export async function saveERT(record){const db=await getDB(),saved={...record,id:record.id||makeId(),createdAt:record.createdAt||new Date().toISOString()};await db.put('ert',saved);return saved;}
export async function listERT(){return(await getDB()).getAll('ert');}
export async function deleteERT(id){return(await getDB()).delete('ert',id);}
