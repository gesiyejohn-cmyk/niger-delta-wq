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
