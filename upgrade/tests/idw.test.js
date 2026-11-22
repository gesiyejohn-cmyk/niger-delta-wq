import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {interpolateIDW,convexHull,pointInPolygon,collectIDWSamples,assertUniqueIDWCoordinates,formatIDWGridCSV} from '../src/engine/idw.js';
const triangle=[{id:'A',latitude:5,longitude:6,value:10},{id:'B',latitude:5,longitude:6.1,value:20},{id:'C',latitude:5.1,longitude:6,value:30}];
test('IDW generates cells only inside the sample convex hull',()=>{const r=interpolateIDW(triangle,{resolution:10,maxDistanceMeters:20000,neighbors:3});assert.ok(r.cells.length>3);assert.ok(r.cells.every(c=>pointInPolygon(c,r.hull)));assert.equal(r.sampleCount,3);});
test('IDW uses exact sample values at sample coordinates',()=>{const r=interpolateIDW(triangle,{resolution:10,maxDistanceMeters:20000,neighbors:3});const a=r.cells.find(c=>Math.abs(c.latitude-5)<1e-9&&Math.abs(c.longitude-6)<1e-9);assert.equal(a.value,10);});
test('IDW rejects collinear locations and fewer than three points',()=>{assert.throws(()=>interpolateIDW(triangle.slice(0,2)),/At least three/);assert.throws(()=>interpolateIDW([{latitude:1,longitude:1,value:1},{latitude:2,longitude:2,value:2},{latitude:3,longitude:3,value:3}]),/collinear/);});
test('IDW engine excludes boolean and object values instead of coercing them to numbers',()=>{
 const contaminated=[...triangle,
  {id:'boolean-value',latitude:5.02,longitude:6.02,value:true},
  {id:'boolean-coordinate',latitude:false,longitude:6.03,value:999},
  {id:'object-value',latitude:5.03,longitude:6.03,value:{value:500}}
 ];
 const r=interpolateIDW(contaminated,{resolution:10,maxDistanceMeters:20000,neighbors:3});
 assert.equal(r.sampleCount,3);
 assert.ok(r.cells.every(cell=>cell.value>=10&&cell.value<=30));
});

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
test('spatial analysis wires the NDWQ record adapter and hydrochemistry source selector',()=>{
 const source=readFileSync(new URL('../src/pages/SpatialAnalysisPage.jsx',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../src/engine/idw.js',import.meta.url),'utf8');
 assert.match(source,/listHydrochemistrySamples/);
 assert.match(source,/collectIDWSamples/);
 assert.match(source,/assertUniqueIDWCoordinates/);
 assert.match(source,/CHEMISTRY_IDW_PARAMETERS/);
 assert.match(source,/value=\{sourceMode\}/);
 assert.match(engine,/sample\?\.params\?\.\[parameter\]/);
 assert.match(engine,/share the same coordinates/);
});


const integrationSamples = eightSamples.map(sample => ({
  id: sample.id,
  meta: { sampleCode: sample.id, latitude: String(sample.latitude), longitude: String(sample.longitude) },
  params: { tds: { value: sample.value, unit: 'mg/L', canonical: sample.value, canonicalUnit: 'mg/L' } }
}));

test('NDWQ water-quality record shape supplies all eight measured TDS samples to IDW', () => {
  const { waterQualityPoints, ready } = collectIDWSamples({ waterQualitySamples: integrationSamples, parameter: 'tds' });
  assert.equal(waterQualityPoints.length, 8);
  assert.equal(ready.length, 8);
  const r = interpolateIDW(ready, { power: 2, neighbors: 8, maxDistanceMeters: 5000, resolution: 20 });
  assert.equal(r.sampleCount, 8);
  assert.ok(r.cells.length > 0);
  assert.ok(r.cells.every(cell => cell.value >= 190 && cell.value <= 460));
});

test('IDW source adapter excludes blank and boolean coordinates or measurements', () => {
  const samples = [
    { id: 'blank', meta: { latitude: ' ', longitude: '6.1' }, params: { tds: { canonical: 200 } } },
    { id: 'bool', meta: { latitude: true, longitude: 6.1 }, params: { tds: { canonical: 200 } } },
    { id: 'missing', meta: { latitude: 5, longitude: 6.1 }, params: { tds: { canonical: ' ' } } }
  ];
  assert.equal(collectIDWSamples({ waterQualitySamples: samples, parameter: 'tds' }).ready.length, 0);
});

test('IDW hydrochemistry source supports measured ions but never invents TDS', () => {
  const chemistry = [{ id: 'C1', sampleId: 'C1', latitude: 5, longitude: 6, ca: 25, tds: 400 }];
  assert.equal(collectIDWSamples({ hydrochemistrySamples: chemistry, sourceMode: 'hydrochemistry', parameter: 'ca' }).ready[0].value, 25);
  assert.equal(collectIDWSamples({ hydrochemistrySamples: chemistry, sourceMode: 'hydrochemistry', parameter: 'tds' }).ready.length, 0);
});

test('IDW duplicate coordinate guard rejects repeated station locations', () => {
  assert.throws(() => assertUniqueIDWCoordinates([
    { latitude: 5, longitude: 6 }, { latitude: 5.000000001, longitude: 6 }
  ]), /share the same coordinates/);
});

test('IDW CSV export has aligned parameter, value, unit and neighbour columns', () => {
  const csv = formatIDWGridCSV({ cells: [{ latitude: 5, longitude: 6, value: 275, neighboursUsed: 8 }] }, 'tds', 'mg/L');
  const rows = csv.split(String.fromCharCode(13,10)).map(row => row.split(',').map(cell => cell.slice(1, -1)));
  assert.deepEqual(rows[0], ['latitude_dd', 'longitude_dd', 'parameter', 'value', 'unit', 'neighbours_used']);
  assert.deepEqual(rows[1], ['5', '6', 'tds', '275', 'mg/L', '8']);
});

import { SYNTHETIC_IDW_TEST_SAMPLES, formatSyntheticIDWTestCSV } from '../src/engine/idw.js';

test('synthetic IDW test CSV has eight clearly labelled records and stable coordinate/value columns', () => {
  const csv = formatSyntheticIDWTestCSV();
  const rows = csv.trim().split(String.fromCharCode(13,10));
  assert.equal(rows.length, 9);
  assert.equal(rows[0], '"sample_id","latitude_dd","longitude_dd","tds_mg_l"');
  assert.equal(SYNTHETIC_IDW_TEST_SAMPLES.length, 8);
  assert.deepEqual(SYNTHETIC_IDW_TEST_SAMPLES.map(row => row.tds_mg_l).sort((a,b)=>a-b), [190,225,260,275,315,335,390,460]);
  assert.ok(rows[1].includes('"SYN-01"'));
  assert.ok(rows.every((row,index)=>index===0||row.split(',').length===4));
});


test('synthetic IDW fixture has unique WGS84 decimal-degree locations and finite measured TDS values', () => {
  const ids = SYNTHETIC_IDW_TEST_SAMPLES.map(sample => sample.sample_id);
  const coordinates = SYNTHETIC_IDW_TEST_SAMPLES.map(sample => `${sample.latitude_dd},${sample.longitude_dd}`);
  assert.equal(new Set(ids).size, 8);
  assert.equal(new Set(coordinates).size, 8);
  assert.ok(SYNTHETIC_IDW_TEST_SAMPLES.every(sample =>
    Number.isFinite(sample.latitude_dd) && Math.abs(sample.latitude_dd) <= 90 &&
    Number.isFinite(sample.longitude_dd) && Math.abs(sample.longitude_dd) <= 180 &&
    Number.isFinite(sample.tds_mg_l) && sample.tds_mg_l >= 0
  ));
});

test('spatial analysis exposes the synthetic CSV download and honest manual-entry guidance', () => {
  const source = readFileSync(new URL('../src/pages/SpatialAnalysisPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /Download synthetic test CSV/);
  assert.ok(source.includes('ndwq-synthetic-idw-test-data.csv'));
  assert.match(source, /create eight separate water-quality records manually/);
});
