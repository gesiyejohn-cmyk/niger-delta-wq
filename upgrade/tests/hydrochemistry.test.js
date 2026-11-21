import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHydrochemistry, validateHydrochemistrySample } from '../src/engine/hydrochemistry.js';
const sample={sampleId:'S1',ca:40.078,mg:24.305,na:22.9898,k:39.0983,hco3:61.0168,co3:30.004,cl:35.453,so4:48.03};
test('converts major ions from mg/L to meq/L',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.meqL.ca-2)<1e-9);assert.ok(Math.abs(r.meqL.mg-2)<1e-9);assert.ok(Math.abs(r.meqL.na-1)<1e-9);});
test('calculates cation and anion charge balance from equivalents',()=>{const r=calculateHydrochemistry(sample);assert.equal(r.totalCationsMeqL,6);assert.equal(r.totalAnionsMeqL,4);assert.equal(r.chargeBalanceErrorPercent,20);});
test('returns normalized cation and anion percentages',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.cationPercent.ca+r.cationPercent.mg+r.cationPercent.naK-100)<1e-9);assert.ok(Math.abs(r.anionPercent.hco3Co3+r.anionPercent.so4+r.anionPercent.cl-100)<1e-9);});
test('does not silently treat missing core ions as zero',()=>{const incomplete={...sample,co3:''};assert.throws(()=>calculateHydrochemistry(incomplete),/require measured values/);});
test('rejects negative or malformed laboratory concentrations',()=>{assert.throws(()=>validateHydrochemistrySample({...sample,ca:-1}),/non-negative/);assert.throws(()=>validateHydrochemistrySample({...sample,mg:'abc'}),/non-negative/);});
test('allows optional nitrate to remain missing',()=>{const r=calculateHydrochemistry(sample);assert.equal(r.meqL.no3,null);assert.ok(r.totalAnionsMeqL>0);});
test('Durov central square coordinates project the normalized cation and anion groups',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.durovs.central.x-.625)<1e-9);assert.ok(Math.abs(r.durovs.central.y-.5)<1e-9);});

test('Piper coordinates remain finite and chloride facies uses the chloride group',()=>{const r=calculateHydrochemistry(sample);assert.ok(Number.isFinite(r.piper.anion.x));assert.ok(Number.isFinite(r.piper.anion.y));assert.ok(Number.isFinite(r.piper.cation.x));assert.ok(Number.isFinite(r.piper.cation.y));assert.equal(r.classification.dominantAnion,'bicarbonate-carbonate');assert.ok(!r.classification.facies.includes('undefined'));});
test('Gibbs sodium ratio uses Na divided by Na plus Ca, excluding potassium',()=>{const r=calculateHydrochemistry(sample);assert.ok(Math.abs(r.gibbs.naCaRatio-(1/(1+2)))<1e-9);});
