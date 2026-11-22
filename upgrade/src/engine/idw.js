const valid=v=>v!=null&&(typeof v==='number'||typeof v==='string')&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
export function haversineMeters(a,b){const r=6371008.8,rad=x=>x*Math.PI/180,dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude),lat1=rad(a.latitude),lat2=rad(b.latitude);const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.min(1,Math.sqrt(h)));}
function cross(o,a,b){return(a.longitude-o.longitude)*(b.latitude-o.latitude)-(a.latitude-o.latitude)*(b.longitude-o.longitude);}
export function convexHull(points){const pts=[...new Map(points.map(p=>[p.longitude+','+p.latitude,p])).values()].sort((a,b)=>a.longitude-b.longitude||a.latitude-b.latitude);if(pts.length<3)return[];const lower=[];for(const p of pts){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}const upper=[];for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}lower.pop();upper.pop();return lower.concat(upper);}
export function pointInPolygon(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];const crossValue=(point.longitude-a.longitude)*(b.latitude-a.latitude)-(point.latitude-a.latitude)*(b.longitude-a.longitude);const dot=(point.longitude-a.longitude)*(b.longitude-a.longitude)+(point.latitude-a.latitude)*(b.latitude-a.latitude);const length=(b.longitude-a.longitude)**2+(b.latitude-a.latitude)**2;if(Math.abs(crossValue)<1e-12&&dot>=-1e-12&&dot<=length+1e-12)return true;const intersects=((a.latitude>point.latitude)!==(b.latitude>point.latitude))&&(point.longitude<(b.longitude-a.longitude)*(point.latitude-a.latitude)/(b.latitude-a.latitude)+a.longitude);if(intersects)inside=!inside;}return inside;}
export function interpolateIDW(points,{power=2,neighbors=8,maxDistanceMeters=5000,resolution=20}={}){
 if(!Array.isArray(points))throw new Error('Supply a list of georeferenced sample values.');
 const validPoints=points.filter(p=>valid(p.latitude)&&valid(p.longitude)&&valid(p.value)).map(p=>({latitude:Number(p.latitude),longitude:Number(p.longitude),value:Number(p.value),id:p.id||p.sampleCode||''}));
 if(validPoints.length<3)throw new Error('At least three samples with valid coordinates and measured values are required.');
 if(validPoints.some(p=>Math.abs(p.latitude)>90||Math.abs(p.longitude)>180))throw new Error('Sample coordinates must be valid decimal-degree latitude and longitude.');
 if(!Number.isFinite(power)||power<1||power>4)throw new Error('IDW power must be between 1 and 4.');
 if(!Number.isInteger(neighbors)||neighbors<3||neighbors>20)throw new Error('Neighbour count must be an integer from 3 to 20.');
 if(!Number.isFinite(maxDistanceMeters)||maxDistanceMeters<=0)throw new Error('Maximum interpolation distance must be greater than zero metres.');
 if(!Number.isInteger(resolution)||resolution<5||resolution>60)throw new Error('Grid resolution must be an integer from 5 to 60.');
 const hull=convexHull(validPoints);if(hull.length<3)throw new Error('Sample locations are collinear or duplicated; a two-dimensional interpolation area cannot be formed.');
 const minLat=Math.min(...hull.map(p=>p.latitude)),maxLat=Math.max(...hull.map(p=>p.latitude)),minLon=Math.min(...hull.map(p=>p.longitude)),maxLon=Math.max(...hull.map(p=>p.longitude));
 if(maxLat-minLat<1e-7||maxLon-minLon<1e-7)throw new Error('Sample locations do not span a two-dimensional area.');
 const dLat=(maxLat-minLat)/resolution,dLon=(maxLon-minLon)/resolution,cells=[];let inside=0,skipped=0;
 for(let row=0;row<=resolution;row++)for(let col=0;col<=resolution;col++){
  const target={latitude:minLat+row*dLat,longitude:minLon+col*dLon};
  if(!pointInPolygon(target,hull)){skipped++;continue;}inside++;
  const nearest=validPoints.map(p=>({p,d:haversineMeters(target,p)})).filter(x=>x.d<=maxDistanceMeters).sort((a,b)=>a.d-b.d).slice(0,neighbors);
  if(nearest.length<3){skipped++;continue;}
  const exact=nearest.find(x=>x.d<0.001);const value=exact?exact.p.value:nearest.reduce((s,x)=>s+x.p.value/(x.d**power),0)/nearest.reduce((s,x)=>s+1/(x.d**power),0);
  if(Number.isFinite(value))cells.push({latitude:target.latitude,longitude:target.longitude,value,dLatitude:dLat,dLongitude:dLon,neighboursUsed:nearest.length});else skipped++;
 }
 if(cells.length<3)throw new Error('Too few grid cells meet the convex-hull, neighbour-count and maximum-distance rules. Increase maximum distance or add samples; do not extrapolate beyond the sampled area.');
 return{cells,hull,sampleCount:validPoints.length,gridResolution:resolution,insideHullCells:inside,skippedCells:skipped,coveragePercent:inside?cells.length/inside*100:0,power,neighbours:neighbors,maxDistanceMeters,range:{min:Math.min(...cells.map(c=>c.value)),max:Math.max(...cells.map(c=>c.value))},method:'Inverse distance weighting (IDW), within sample convex hull'};
}


export const CHEMISTRY_IDW_PARAMETERS = new Set(['ca','mg','na','k','hco3','co3','cl','so4','no3']);
const isMeasuredNumber = value => value != null &&
  !(typeof value === 'string' && value.trim() === '') &&
  typeof value !== 'boolean' &&
  (typeof value === 'number' || typeof value === 'string') &&
  Number.isFinite(Number(value));

function waterQualityMeasurement(sample, parameter) {
  const measurement = sample?.parameters?.[parameter] ?? sample?.params?.[parameter];
  if (measurement && typeof measurement === 'object') {
    if (Object.prototype.hasOwnProperty.call(measurement, 'canonical')) return measurement.canonical;
    if (Object.prototype.hasOwnProperty.call(measurement, 'value')) return measurement.value;
  }
  return measurement;
}

/** Convert NDWQ water-quality and hydrochemistry records into measured IDW points. */
export function collectIDWSamples({
  waterQualitySamples = [], hydrochemistrySamples = [],
  sourceMode = 'combined', parameter = 'tds'
} = {}) {
  const waterQualityPoints = waterQualitySamples
    .filter(sample => isMeasuredNumber(sample?.meta?.latitude ?? sample?.latitude) &&
      isMeasuredNumber(sample?.meta?.longitude ?? sample?.longitude) &&
      isMeasuredNumber(waterQualityMeasurement(sample, parameter)))
    .map(sample => ({
      id: sample.id,
      sampleCode: sample.meta?.sampleCode ?? sample.sampleCode ?? sample.id,
      latitude: Number(sample.meta?.latitude ?? sample.latitude),
      longitude: Number(sample.meta?.longitude ?? sample.longitude),
      value: Number(waterQualityMeasurement(sample, parameter)),
      source: 'Water-quality'
    }));
  const chemistryPoints = CHEMISTRY_IDW_PARAMETERS.has(parameter)
    ? hydrochemistrySamples
      .filter(sample => isMeasuredNumber(sample?.latitude) &&
        isMeasuredNumber(sample?.longitude) && isMeasuredNumber(sample?.[parameter]))
      .map(sample => ({
        id: sample.id, sampleCode: sample.sampleId || sample.id,
        latitude: Number(sample.latitude), longitude: Number(sample.longitude),
        value: Number(sample[parameter]), source: 'Hydrochemistry'
      }))
    : [];
  const ready = sourceMode === 'water-quality' ? waterQualityPoints
    : sourceMode === 'hydrochemistry' ? chemistryPoints
      : [...waterQualityPoints, ...chemistryPoints];
  return { waterQualityPoints, chemistryPoints, ready };
}

export function assertUniqueIDWCoordinates(points) {
  const seen = new Set();
  for (const point of points || []) {
    const key = Number(point.latitude).toFixed(8) + ',' + Number(point.longitude).toFixed(8);
    if (seen.has(key)) throw new Error('Two or more selected records share the same coordinates. Choose one data source or resolve duplicate/repeated station locations before interpolation.');
    seen.add(key);
  }
  return points;
}

export function formatIDWGridCSV(result, parameter, unit = '') {
  if (!result || !Array.isArray(result.cells) || !result.cells.length) throw new Error('Generate a valid IDW grid before exporting CSV.');
  const quote = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  const rows = [
    ['latitude_dd','longitude_dd','parameter','value','unit','neighbours_used'],
    ...result.cells.map(cell => [cell.latitude,cell.longitude,parameter,cell.value,unit,cell.neighboursUsed])
  ];
  return rows.map(row => row.map(quote).join(',')).join(String.fromCharCode(13,10));
}

/** Clearly synthetic fixture for users to validate the IDW workflow; never field data. */
export const SYNTHETIC_IDW_TEST_SAMPLES = [
  { sample_id: 'SYN-01', latitude_dd: 4.9700, longitude_dd: 6.1000, tds_mg_l: 260 },
  { sample_id: 'SYN-02', latitude_dd: 4.9720, longitude_dd: 6.1040, tds_mg_l: 315 },
  { sample_id: 'SYN-03', latitude_dd: 4.9750, longitude_dd: 6.0980, tds_mg_l: 225 },
  { sample_id: 'SYN-04', latitude_dd: 4.9780, longitude_dd: 6.1060, tds_mg_l: 390 },
  { sample_id: 'SYN-05', latitude_dd: 4.9660, longitude_dd: 6.1080, tds_mg_l: 275 },
  { sample_id: 'SYN-06', latitude_dd: 4.9800, longitude_dd: 6.0950, tds_mg_l: 460 },
  { sample_id: 'SYN-07', latitude_dd: 4.9630, longitude_dd: 6.0970, tds_mg_l: 190 },
  { sample_id: 'SYN-08', latitude_dd: 4.9740, longitude_dd: 6.1120, tds_mg_l: 335 }
];

export function formatSyntheticIDWTestCSV() {
  const headers = ['sample_id', 'latitude_dd', 'longitude_dd', 'tds_mg_l'];
  const quote = value => '"' + String(value).replace(/"/g, '""') + '"';
  return [
    headers.map(quote).join(','),
    ...SYNTHETIC_IDW_TEST_SAMPLES.map(sample =>
      headers.map(key => quote(sample[key])).join(',')
    )
  ].join(String.fromCharCode(13, 10)) + String.fromCharCode(13, 10);
}
