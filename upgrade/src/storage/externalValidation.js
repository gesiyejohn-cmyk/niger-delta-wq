import{getDB}from'./db.js';
const KEY='externalValidationDatasets';
export async function listExternalValidationDatasets(){const db=await getDB(),item=await db.get('settings',KEY);return Array.isArray(item?.value)?item.value:[];}
export async function saveExternalValidationDataset(dataset){if(!dataset||!Array.isArray(dataset.records)||!dataset.records.length)throw Error('A validated dataset with accepted records is required.');const db=await getDB(),old=await listExternalValidationDatasets(),id=dataset.id||globalThis.crypto?.randomUUID?.()||'external_'+Date.now(),saved={...dataset,id,savedAt:new Date().toISOString()};await db.put('settings',{key:KEY,value:[...old.filter(x=>x.id!==id),saved]});return saved;}
export async function deleteExternalValidationDataset(id){const db=await getDB(),old=await listExternalValidationDatasets();await db.put('settings',{key:KEY,value:old.filter(x=>x.id!==id)});}
