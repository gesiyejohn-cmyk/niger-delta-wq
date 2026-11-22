import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHydrochemistry, validateHydrochemistrySample } from '../src/engine/hydrochemistry.js';
const sample={sampleId:'S1',ca:40.078,mg:24.305,na:22.9898,k:39.0983,hco3:61.0168,co3:30.004,cl:35.453,so4:48.03};\nfunction parseCSVRow(line) {\n const cells=[]; let value='', quoted=false;\n for(let i=0;i<line.length;i++){ const ch=line[i]; if(quoted){ if(ch==='"'&&line[i+1]==='"'){value+='"';i++;} else if(ch==='"') quoted=false; else value+=ch; } else if(ch==='"') quoted=true; else if(ch===','){cells.push(value);value='';} else value+=ch; }\n cells.push(value); return cells;\n}\n
test('converts major ions from mg/L to meq/L',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.meqL.ca-2)<1e-9);assert.ok(Math.abs(r.meqL.mg-2)<1e-9);assert.ok(Math.abs(r.meqL.na-1)<1e-9);});
test('calculates cation and anion charge balance from equivalents',()=>{const r=calculateHydrochemistry(sample);assert.equal(r.totalCationsMeqL,6);assert.equal(r.totalAnionsMeqL,4);assert.equal(r.chargeBalanceErrorPercent,20);});
test('returns normalized cation and anion percentages',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.cationPercent.ca+r.cationPercent.mg+r.cationPercent.naK-100)<1e-9);assert.ok(Math.abs(r.anionPercent.hco3Co3+r.anionPercent.so4+r.anionPercent.cl-100)<1e-9);});
test('does not silently treat missing core ions as zero',()=>{const incomplete={...sample,co3:''};assert.throws(()=>calculateHydrochemistry(incomplete),/require measured values/);});
test('rejects negative or malformed laboratory concentrations',()=>{assert.throws(()=>validateHydrochemistrySample({...sample,ca:-1}),/non-negative/);assert.throws(()=>validateHydrochemistrySample({...sample,mg:'abc'}),/non-negative/);});
test('allows optional nitrate to remain missing',()=>{const r=calculateHydrochemistry(sample);assert.equal(r.meqL.no3,null);assert.ok(r.totalAnionsMeqL>0);});
test('Durov central square coordinates project the normalized cation and anion groups',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.durovs.central.x-.625)<1e-9);assert.ok(Math.abs(r.durovs.central.y-.5)<1e-9);});

test('Piper coordinates remain finite and chloride facies uses the chloride group',()=>{const r=calculateHydrochemistry(sample);assert.ok(Number.isFinite(r.piper.anion.x));assert.ok(Number.isFinite(r.piper.anion.y));assert.ok(Number.isFinite(r.piper.cation.x));assert.ok(Number.isFinite(r.piper.cation.y));assert.equal(r.classification.dominantAnion,'bicarbonate-carbonate');assert.ok(!r.classification.facies.includes('undefined'));});
test('Gibbs sodium ratio uses Na divided by Na plus Ca, excluding potassium',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.gibbs.naCaRatio-(1/(1+2)))<1e-9);});

test('eight balanced synthetic Niger Delta chemistry samples retain charge balance and defined facies',()=>{
 const eq={ca:20.039,mg:12.1525,na:22.9898,k:39.0983,hco3:61.0168,co3:30.004,cl:35.453,so4:48.03,no3:62.0049};
 const rows=[
  ['SYN-01',[1.20,.80,1.50,.10],[2.70,.10,.60,.20]],
  ['SYN-02',[1.40,.90,1.70,.10],[3.00,.10,.70,.30]],
  ['SYN-03',[1.00,.70,1.30,.10],[2.30,.10,.50,.20]],
  ['SYN-04',[1.60,1.00,2.00,.10],[3.30,.10,1.00,.30]],
  ['SYN-05',[1.10,.80,1.40,.10],[2.50,.10,.60,.20]],
  ['SYN-06',[1.80,1.10,2.20,.10],[3.60,.10,1.20,.30]],
  ['SYN-07',[.90,.60,1.20,.10],[2.10,.10,.40,.20]],
  ['SYN-08',[1.30,.85,1.60,.10],[2.80,.10,.75,.20]]
 ];
 const c=['ca','mg','na','k'],a=['hco3','co3','cl','so4'];
 for(const[id,cv,av]of rows){
  const input={sampleId:id};
  c.forEach((k,i)=>input[k]=cv[i]*eq[k]);
  a.forEach((k,i)=>input[k]=av[i]*eq[k]);
  input.no3=0;
  const r=calculateHydrochemistry(input);
  assert.ok(Math.abs(r.totalCationsMeqL-cv.reduce((sum,v)=>sum+v,0))<1e-9,id+' cation total');
  assert.ok(Math.abs(r.totalAnionsMeqL-av.reduce((sum,v)=>sum+v,0))<1e-9,id+' anion total');
  assert.ok(Math.abs(r.chargeBalanceErrorPercent)<1e-9,id+' charge balance');
  assert.ok(r.classification.facies&&!r.classification.facies.includes('undefined'),id+' facies');
 }
});


test('hydrochemistry CSV clearly labels total cations and total anions and exports mg/L and meq/L', async () => {
 const { buildHydrochemistryCSV } = await import('../src/engine/hydrochemistry.js');
 const csv = buildHydrochemistryCSV([{...sample,date:'2026-11-22',latitude:4.97,longitude:6.1,coordinateDatum:'WGS84'}]);
 const header = csv.split(String.fromCharCode(13,10))[0];
 assert.match(header,/Total Cations \(meq\/L\)/);
 assert.match(header,/Total Anions \(meq\/L\)/);
 assert.match(header,/Calcium \(mg\/L\)/);
 assert.match(header,/Calcium \(meq\/L\)/);
 const headers=header.split(',').map(cell=>cell.slice(1,-1));
 const data=csv.split(String.fromCharCode(13,10))[1].split(',').map(cell=>cell.slice(1,-1));
 assert.equal(data[headers.indexOf('Total Cations (meq/L)')],'6');
 assert.equal(data[headers.indexOf('Total Anions (meq/L)')],'4');
 assert.equal(data[headers.indexOf('Charge Balance Error (%)')],'20');
});

test('hydrochemistry CSV preserves unmeasured nitrate as blank and quotes station metadata', async () => {
 const { buildHydrochemistryCSV } = await import('../src/engine/hydrochemistry.js');
 const csv = buildHydrochemistryCSV([{...sample,sampleId:'S1'}]);
 const cells=csv.split(String.fromCharCode(13,10))[1].split(',').map(cell=>cell.slice(1,-1));
 const header=csv.split(String.fromCharCode(13,10))[0].split(',').map(cell=>cell.slice(1,-1));
 assert.equal(cells[header.indexOf('Nitrate (mg/L)')], '');
 assert.equal(cells[header.indexOf('Nitrate (meq/L)')], '');
});

test('hydrochemistry CSV neutralises spreadsheet formula-like sample IDs', async () => {
 const { buildHydrochemistryCSV } = await import('../src/engine/hydrochemistry.js');
 const csv=buildHydrochemistryCSV([{...sample,sampleId:'=HYPERLINK("https://example.invalid","open")'}]);
 assert.match(csv,/'=HYPERLINK/);
});

test('hydrochemistry CSV refuses an empty export', async () => {
 const { buildHydrochemistryCSV } = await import('../src/engine/hydrochemistry.js');
 assert.throws(()=>buildHydrochemistryCSV([]),/at least one hydrochemistry sample/i);
});

\ntest('hydrochemistry CSV recalculates edited laboratory values instead of exporting stale cached results', async () => {
 const { buildHydrochemistryCSV } = await import('../src/engine/hydrochemistry.js');
 const edited={...sample,ca:80.156,calculation:calculateHydrochemistry(sample)};
 const lines=buildHydrochemistryCSV([edited]).split(String.fromCharCode(13,10));
 const headers=parseCSVRow(lines[0]),cells=parseCSVRow(lines[1]);
 assert.equal(cells[headers.indexOf('Calcium (meq/L)')],'4');
 assert.equal(cells[headers.indexOf('Total Cations (meq/L)')],'8');
});

test('hydrochemistry CSV preserves negative numeric charge-balance values as numbers', async () => {
 const { buildHydrochemistryCSV } = await import('../src/engine/hydrochemistry.js');
 const record={...sample,no3:200};
 const lines=buildHydrochemistryCSV([record]).split(String.fromCharCode(13,10));
 const headers=parseCSVRow(lines[0]),cells=parseCSVRow(lines[1]);
 const cbe=Number(cells[headers.indexOf('Charge Balance Error (%)')]);
 assert.ok(cbe<0);
 assert.ok(!cells[headers.indexOf('Charge Balance Error (%)')].startsWith("'"));
});

test('hydrochemistry CSV safely neutralises formula-like text while preserving quoted commas', async () => {
 const { buildHydrochemistryCSV } = await import('../src/engine/hydrochemistry.js');
 const id='=HYPERLINK("https://example.invalid","open")';
 const lines=buildHydrochemistryCSV([{...sample,sampleId:id}]).split(String.fromCharCode(13,10));
 const headers=parseCSVRow(lines[0]),cells=parseCSVRow(lines[1]);
 assert.equal(cells[headers.indexOf('Sample ID')],"'"+id);
});
