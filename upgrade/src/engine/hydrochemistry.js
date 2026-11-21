const IONS = {
  ca: { name: 'Calcium', charge: 2, equivalentWeight: 20.039 },
  mg: { name: 'Magnesium', charge: 2, equivalentWeight: 12.1525 },
  na: { name: 'Sodium', charge: 1, equivalentWeight: 22.9898 },
  k: { name: 'Potassium', charge: 1, equivalentWeight: 39.0983 },
  hco3: { name: 'Bicarbonate', charge: 1, equivalentWeight: 61.0168 },
  co3: { name: 'Carbonate', charge: 2, equivalentWeight: 30.004 },
  cl: { name: 'Chloride', charge: 1, equivalentWeight: 35.453 },
  so4: { name: 'Sulphate', charge: 2, equivalentWeight: 48.03 },
  no3: { name: 'Nitrate', charge: 1, equivalentWeight: 62.0049 }
};
const finite = v => v != null && !(typeof v === 'string' && v.trim() === '') && Number.isFinite(Number(v));
function ionMeq(sample,key) {
  const value=sample?.[key];
  if(value==null || (typeof value==='string'&&value.trim()==='')) return null;
  if(!finite(value) || Number(value)<0) throw new Error(IONS[key].name+' must be a finite, non-negative mg/L value.');
  return Number(value)/IONS[key].equivalentWeight;
}
const sum = (o,keys) => keys.reduce((v,k)=>v+o[k],0);
const pct = (v,total) => total>0 ? v/total*100 : null;
export function calculateHydrochemistry(sample) {
  if(!sample || typeof sample!=='object') throw new Error('Enter a water chemistry sample.');
  const meq=Object.fromEntries(Object.keys(IONS).map(key=>[key,ionMeq(sample,key)]));
  const required=['ca','mg','na','k','hco3','co3','cl','so4'];
  const missing=required.filter(key=>meq[key]==null);
  if(missing.length) throw new Error('Major-ion diagrams require measured values for Ca, Mg, Na, K, HCO₃, CO₃, Cl and SO₄. Enter 0 only where the laboratory result confirms zero or below-detection according to its reporting convention. Missing: '+missing.map(k=>IONS[k].name).join(', ')+'.');
  const cations=sum(meq,['ca','mg','na','k']);
  const anions=sum(meq,['hco3','co3','cl','so4'])+(meq.no3??0);
  if(cations<=0 || anions<=0) throw new Error('At least one measured major cation and one measured major anion are required.');
  const cationPct={ca:pct(meq.ca,cations),mg:pct(meq.mg,cations),naK:pct(meq.na+meq.k,cations)};
  const diagramAnions=meq.hco3+meq.co3+meq.cl+meq.so4;
  const anionPct={hco3Co3:pct(meq.hco3+meq.co3,diagramAnions),so4:pct(meq.so4,diagramAnions),cl:pct(meq.cl,diagramAnions)};
  const balanceError=(cations-anions)/(cations+anions)*100;
  const totalDissolvedIons=Object.keys(IONS).reduce((v,k)=>v+(finite(sample[k])?Number(sample[k]):0),0);
  const piperPoint=(parts)=>({x:parts[1]*0.5/100+parts[2]*1/100,y:parts[1]*Math.sqrt(3)/2/100});
  const cationXY=piperPoint([cationPct.ca,cationPct.mg,cationPct.naK]);
  const anionXY=piperPoint([anionPct.hco3Co3,anionPct.so4,anionPct.clNo3]);
  // Two equilateral triangles are offset and joined to the central diamond.
  const triangle=(p,ox,oy,scale)=>({x:ox+p.x*scale,y:oy+p.y*scale});
  const cp=triangle(cationXY,0,0,100), ap=triangle(anionXY,220,0,100);
  const cationDominant=Object.entries(cationPct).sort((a,b)=>b[1]-a[1])[0][0];
  const anionDominant=Object.entries(anionPct).sort((a,b)=>b[1]-a[1])[0][0];
  const cationName={ca:'calcium',mg:'magnesium',naK:'sodium-potassium'}[cationDominant];
  const anionName={hco3Co3:'bicarbonate-carbonate',so4:'sulphate',clNo3:'chloride-nitrate'}[anionDominant];
  const facies=(cationPct[cationDominant]>=50?'':'mixed ')+cationName+'-'+(anionPct[anionDominant]>=50?'':'mixed ')+anionName;
  const sodiumCalcium=meq.na+meq.k+meq.ca>0?meq.na/(meq.na+meq.ca):null;
  const chlorideBicarbonate=meq.cl+meq.hco3+meq.co3>0?meq.cl/(meq.cl+meq.hco3+meq.co3):null;
  const bicarbonateCalcium=pct(meq.hco3+meq.co3,cations+anions);
  const alkalineEarths=pct(meq.ca+meq.mg,cations);
  const strongAcids=pct(meq.cl+meq.so4,diagramAnions);
  const weakAcids=pct(meq.hco3+meq.co3,diagramAnions);
  return {
    meqL:meq,totalCationsMeqL:cations,totalAnionsMeqL:anions,chargeBalanceErrorPercent:balanceError,
    cationPercent: cationPct, anionPercent: anionPct, piper:{cation:cp,anion:ap,facies},
    durovs:{cation: cationPct, anion: anionPct, central:{x:(meq.hco3+meq.co3+meq.so4/2)/diagramAnions,y:(meq.ca+meq.mg/2)/cations}},
    schoeller:Object.keys(IONS).map(key=>({key,name:IONS[key].name,meqL:meq[key]})),
    gibbs:{naCaRatio:sodiumCalcium,clHco3Ratio:chlorideBicarbonate,tdsMgL:totalDissolvedIons},
    chadha:{x:alkalineEarths==null?null:alkalineEarths-pct(meq.na+meq.k,cations),y:weakAcids==null?null:weakAcids-strongAcids},
    classification:{dominantCation:cationName,dominantAnion:anionName,facies},
    cautions:['Major-ion diagrams require complete and representative laboratory chemistry.','Ionic charge-balance error is a screening check; investigate analytical quality when its absolute value exceeds the study acceptance criterion.','Hydrochemical facies describe relative ionic composition and do not by themselves identify contamination sources.']
  };
}
export function validateHydrochemistrySample(sample) {
  const clean={...sample};
  if(!String(clean.sampleId||'').trim()) throw new Error('A sample or station ID is required.');
  for(const key of Object.keys(IONS)) {
    if(clean[key]==null || (typeof clean[key]==='string'&&clean[key].trim()==='')) continue;
    if(!finite(clean[key])||Number(clean[key])<0) throw new Error(IONS[key].name+' must be a non-negative mg/L value or left blank if not measured.');
    clean[key]=Number(clean[key]);
  }
  const result=calculateHydrochemistry(clean);
  return {...clean,calculation:result};
}
