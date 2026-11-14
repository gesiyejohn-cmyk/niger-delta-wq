import test from'node:test';import assert from'node:assert/strict';import{schlumbergerGeometricFactor,calculateVES,validateVES,validateERT,descriptiveStats,pearsonCorrelation}from'../src/engine/geophysics.js';
test('Schlumberger geometric factor uses AB/2 and MN/2',()=>assert.ok(Math.abs(schlumbergerGeometricFactor(10,1)-Math.PI*99/2)<1e-10));
test('VES apparent resistivity is K times measured resistance',()=>{const r=calculateVES({ab2:10,mn2:1,resistance:5});assert.ok(Math.abs(r.apparentResistivity-r.geometricFactor*5)<1e-10);});
test('VES rejects invalid electrode geometry',()=>assert.throws(()=>calculateVES({ab2:1,mn2:1,resistance:5})));
test('VES requires two increasing spacings',()=>assert.throws(()=>validateVES([{ab2:1,mn2:.2,resistance:5}])));
test('ERT import rejects non-positive resistivity',()=>assert.throws(()=>validateERT([{x:0,depth:1,resistivity:0}])));
test('descriptive statistics use measured numeric values',()=>{const s=descriptiveStats([1,2,3]);assert.equal(s.mean,2);assert.equal(s.median,2);assert.equal(s.min,1);assert.equal(s.max,3);});
test('Pearson correlation detects perfect positive association',()=>assert.equal(pearsonCorrelation([1,2,3],[2,4,6]),1));
