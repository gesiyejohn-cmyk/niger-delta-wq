const finite=(v)=>v!=null&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
export function schlumbergerGeometricFactor(ab2,mn2){const a=Number(ab2),m=Number(mn2);if(!finite(a)||!finite(m)||a<=m||m<=0)throw new Error('Schlumberger geometry requires AB/2 > MN/2 > 0.');const factor=Math.PI*(a*a-m*m)/(2*m);if(!Number.isFinite(factor)||factor<=0)throw new Error('Schlumberger geometric factor is outside the supported numeric range.');return factor;}
export function wennerGeometricFactor(spacing){const a=Number(spacing);if(!finite(a)||a<=0)throw new Error('Wenner geometry requires electrode spacing a > 0.');const factor=2*Math.PI*a;if(!Number.isFinite(factor)||factor<=0)throw new Error('Wenner geometric factor is outside the supported numeric range.');return factor;}
export function calculateVES({array='Schlumberger',ab2,mn2,spacing,resistance}){if(!finite(resistance)||Number(resistance)<=0)throw new Error('Measured resistance must be greater than zero.');if(array!=='Schlumberger'&&array!=='Wenner')throw new Error('Unsupported VES array configuration.');const geometricFactor=array==='Wenner'?wennerGeometricFactor(spacing):schlumbergerGeometricFactor(ab2,mn2);const apparentResistivity=geometricFactor*Number(resistance);if(!Number.isFinite(apparentResistivity)||apparentResistivity<=0)throw new Error('Calculated apparent resistivity is outside the supported numeric range.');return{array,geometricFactor,apparentResistivity,spread:array==='Wenner'?Number(spacing):Number(ab2)};}
export function validateVES(rows,array='Schlumberger'){if(!Array.isArray(rows)||rows.length<1)throw new Error('Enter at least one complete VES reading.');const clean=rows.map((r,i)=>{const v=Number(r.resistance);if(!finite(v)||v<=0)throw new Error('VES row '+(i+1)+': positive resistance is required.');let calculated;if(array==='Wenner'){if(!finite(r.spacing)||Number(r.spacing)<=0)throw new Error('VES row '+(i+1)+': positive Wenner electrode spacing a is required.');calculated=calculateVES({array,spacing:r.spacing,resistance:v});}else{if(!finite(r.ab2)||!finite(r.mn2))throw new Error('VES row '+(i+1)+': AB/2 and MN/2 are required.');calculated=calculateVES({array,ab2:r.ab2,mn2:r.mn2,resistance:v});}return{...r,...calculated,resistance:v,...(array==='Wenner'?{spacing:Number(r.spacing)}:{ab2:Number(r.ab2),mn2:Number(r.mn2)})};});if(clean.some((r,i)=>i&&r.spread<=clean[i-1].spread))throw new Error(array==='Wenner'?'Wenner electrode spacing values must be entered in strictly increasing order.':'VES AB/2 values must be entered in strictly increasing order.');return clean;}
export function validateERT(points){if(!Array.isArray(points)||!points.length)throw new Error('No ERT model cells were supplied.');const seen=new Set();return points.map((p,i)=>{const x=Number(p.x),depth=Number(p.depth),resistivity=Number(p.resistivity);if(!finite(x)||!finite(depth)||!finite(resistivity)||depth<0||resistivity<=0)throw new Error(`ERT cell ${i+1}: provide numeric x, non-negative depth and positive resistivity.`);const key=x+'|'+depth;if(seen.has(key))throw new Error('ERT import contains duplicate distance/depth cells; resolve duplicate coordinates before saving.');seen.add(key);return{x,depth,resistivity};});}
export function descriptiveStats(values){const a=values.filter(finite).map(Number);if(!a.length)return null;const sorted=[...a].sort((x,y)=>x-y),mean=a.reduce((s,v)=>s+v,0)/a.length,median=sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;return{n:a.length,mean,median,min:sorted[0],max:sorted.at(-1),sd:Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2,0)/a.length)};}
export function pearsonCorrelation(xs,ys){if(!Array.isArray(xs)||!Array.isArray(ys))return null;const pairs=xs.map((x,i)=>[x,ys[i]]).filter(([x,y])=>finite(x)&&finite(y)).map(([x,y])=>[Number(x),Number(y)]);if(pairs.length<3)return null;const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;const cov=pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0),vx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),vy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);return vx&&vy?cov/Math.sqrt(vx*vy):null;}


// Preliminary shape classification of apparent resistivity values. This is not
// a substitute for layered-earth inversion or geological interpretation.
export function classifyVESCurve(rows) {
  const valid = (rows || []).filter(r => Number.isFinite(Number(r.spread ?? r.ab2)) &&
    Number(r.spread ?? r.ab2) > 0 && Number.isFinite(Number(r.apparentResistivity)) &&
    Number(r.apparentResistivity) > 0).sort((a,b) => Number(a.spread ?? a.ab2)-Number(b.spread ?? b.ab2));
  if (valid.length < 3) return { code: null, label: 'Insufficient data', description: 'At least three valid readings are required.' };
  const first = Math.sign(Number(valid[1].apparentResistivity)-Number(valid[0].apparentResistivity));
  const second = Math.sign(Number(valid[2].apparentResistivity)-Number(valid[1].apparentResistivity));
  if (first > 0 && second > 0) return { code: 'A', label: 'A-type trend (increasing)', description: 'Apparent resistivity increases across the first three points.' };
  if (first < 0 && second < 0) return { code: 'Q', label: 'Q-type trend (decreasing)', description: 'Apparent resistivity decreases across the first three points.' };
  if (first > 0 && second < 0) return { code: 'K', label: 'K-type trend (rise then fall)', description: 'Apparent resistivity rises and then falls across the first three points.' };
  if (first < 0 && second > 0) return { code: 'H', label: 'H-type trend (fall then rise)', description: 'Apparent resistivity falls and then rises across the first three points.' };
  return { code: 'Mixed', label: 'Mixed / flat trend', description: 'The first three points do not show a clear classical two-segment trend.' };
}

export function validateVESLayers(layers) {
  if (!Array.isArray(layers) || layers.length < 2) throw new Error('Enter at least two geoelectric layers.');
  let depth = 0;
  return layers.map((layer, index) => {
    const rho = Number(layer.resistivity);
    if (layer.resistivity === '' || !Number.isFinite(rho) || rho <= 0) {
      throw new Error('Layer ' + (index + 1) + ': resistivity must be greater than zero.');
    }
    const last = index === layers.length - 1;
    let thickness = null;
    let bottomDepth = null;
    if (!last) {
      thickness = Number(layer.thickness);
      if (layer.thickness === '' || !Number.isFinite(thickness) || thickness <= 0) {
        throw new Error('Layer ' + (index + 1) + ': thickness must be greater than zero.');
      }
      depth += thickness;
      bottomDepth = depth;
    } else if (layer.thickness !== '' && layer.thickness != null) {
      throw new Error('The last layer is a half-space; leave its thickness blank.');
    }
    return { layer: index + 1, resistivity: rho, thickness, bottomDepth };
  });
}
