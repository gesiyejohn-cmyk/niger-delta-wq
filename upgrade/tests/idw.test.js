import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {interpolateIDW,convexHull,pointInPolygon} from '../src/engine/idw.js';
const triangle=[{id:'A',latitude:5,longitude:6,value:10},{id:'B',latitude:5,longitude:6.1,value:20},{id:'C',latitude:5.1,longitude:6,value:30}];
test('IDW generates cells only inside the sample convex hull',()=>{const r=interpolateIDW(triangle,{resolution:10,maxDistanceMeters:20000,neighbors:3});assert.ok(r.cells.length>3);assert.ok(r.cells.every(c=>pointInPolygon(c,r.hull)));assert.equal(r.sampleCount,3);});
test('IDW uses exact sample values at sample coordinates',()=>{const r=interpolateIDW(triangle,{resolution:10,maxDistanceMeters:20000,neighbors:3});const a=r.cells.find(c=>Math.abs(c.latitude-5)<1e-9&&Math.abs(c.longitude-6)<1e-9);assert.equal(a.value,10);});
test('IDW rejects collinear locations and fewer than three points',()=>{assert.throws(()=>interpolateIDW(triangle.slice(0,2)),/At least three/);assert.throws(()=>interpolateIDW([{latitude:1,longitude:1,value:1},{latitude:2,longitude:2,value:2},{latitude:3,longitude:3,value:3}]),/collinear/);});
test('IDW rejects unsupported power, neighbour count and distance',()=>{assert.throws(()=>interpolateIDW(triangle,{power:5}),/power/);assert.throws(()=>interpolateIDW(triangle,{neighbors:2}),/Neighbour count/);assert.throws(()=>interpolateIDW(triangle,{maxDistanceMeters:0}),/distance/);});
test('IDW does not extrapolate when maximum distance excludes too many neighbours',()=>{assert.throws(()=>interpolateIDW(triangle,{maxDistanceMeters:1,neighbors:3,resolution:10}),/Too few grid cells/);});

test('spatial analysis passes the UI neighbour setting into the IDW engine',()=>{const source=readFileSync(new URL('../src/pages/SpatialAnalysisPage.jsx',import.meta.url),'utf8');assert.match(source,/interpolateIDW\(points,\s*\{\s*power,\s*neighbors:\s*neighbours\b/);});

const eightSamples=[
 {id:'SYN-01',latitude:4.9700,longitude:6.1000,value:260},
 {id:'SYN-02',latitude:4.9720,longitude:6.1040,value:315},
 {id:'SYN-03',latitude:4.9750,longitude:6.0980,value:225},
 {id:'SYN-04',latitude:4.9780,longitude:6.1060,value:390},
 {id:'SYN-05',latitude:4.9660,longitude:6.1080,value:275},
 {id:'SYN-06',latitude:4.9800,longitude:6.0950,value:460},
 {id:'SYN-07',latitude:4.9630,longitude:6.0970,value:190},
 {id:'SYN-08',latitude:4.9740,longitude:6.1120,value:335}
];
test('eight-sample Niger Delta TDS dataset produces a bounded in-hull IDW test surface',()=>{
 const r=interpolateIDW(eightSamples,{power:2,neighbors:8,maxDistanceMeters:5000,resolution:20});
 assert.equal(r.sampleCount,8);
 assert.equal(r.gridResolution,20);
 assert.equal(r.power,2);
 assert.equal(r.neighbours,8);
 assert.ok(r.cells.length>0);
 assert.ok(r.coveragePercent>0 && r.coveragePercent<=100);
 assert.ok(r.cells.every(c=>pointInPolygon(c,r.hull)));
 assert.ok(r.cells.every(c=>c.value>=190-1e-9&&c.value<=460+1e-9));
 assert.equal(r.range.min,Math.min(...r.cells.map(c=>c.value)));
 assert.equal(r.range.max,Math.max(...r.cells.map(c=>c.value)));
});
test('spatial analysis exposes both water-quality and hydrochemistry records',()=>{
 const source=readFileSync(new URL('../src/pages/SpatialAnalysisPage.jsx',import.meta.url),'utf8');
 assert.match(source,/listHydrochemistrySamples/);
 assert.match(source,/s\?\.params\?\.\[k\]/);
 assert.match(source,/const chemistryPoints=/);
 assert.match(source,/value=\{sourceMode\}/);
 assert.match(source,/share the same coordinates/);
});
