const valid=v=>v!=null&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
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
