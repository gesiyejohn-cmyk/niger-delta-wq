const finite=(v)=>v!=null&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
export function schlumbergerGeometricFactor(ab2,mn2){const a=Number(ab2),m=Number(mn2);if(!finite(a)||!finite(m)||a<=m||m<=0)throw new Error('Schlumberger geometry requires AB/2 > MN/2 > 0.');const factor=Math.PI*(a*a-m*m)/(2*m);if(!Number.isFinite(factor)||factor<=0)throw new Error('Schlumberger geometric factor is outside the supported numeric range.');return factor;}
export function wennerGeometricFactor(spacing){const a=Number(spacing);if(!finite(a)||a<=0)throw new Error('Wenner alpha electrode spacing must be greater than zero.');const factor=2*Math.PI*a;if(!Number.isFinite(factor)||factor<=0)throw new Error('Wenner geometric factor is outside the supported numeric range.');return factor;}
export function calculateVES({array='Schlumberger',ab2,mn2,spacing,a,resistance}){if(!finite(resistance)||Number(resistance)<=0)throw new Error('Measured resistance must be greater than zero.');const configuration=String(array).toLowerCase();const k=configuration.startsWith('wenner')?wennerGeometricFactor(spacing??a):schlumbergerGeometricFactor(ab2,mn2);const apparentResistivity=k*Number(resistance);if(!Number.isFinite(apparentResistivity)||apparentResistivity<=0)throw new Error('Calculated apparent resistivity is outside the supported numeric range.');return{array:configuration.startsWith('wenner')?'Wenner alpha':'Schlumberger',geometricFactor:k,apparentResistivity};}
export function validateVES(rows,array='Schlumberger'){if(!Array.isArray(rows)||rows.length<1)throw new Error('Enter at least one complete VES reading.');const wenner=String(array).toLowerCase().startsWith('wenner');const clean=rows.map((r,i)=>{const resistance=Number(r.resistance);if(!finite(resistance)||resistance<=0)throw new Error(`VES row ${i+1}: positive resistance is required.`);if(wenner){const spacing=Number(r.spacing??r.a);if(!finite(spacing)||spacing<=0)throw new Error(`Wenner row ${i+1}: equal electrode spacing a must be greater than zero.`);const calc=calculateVES({array,spacing,resistance});return{...r,...calc,spacing,a:spacing,resistance};}const ab2=Number(r.ab2),mn2=Number(r.mn2);if(!finite(ab2)||!finite(mn2))throw new Error(`Schlumberger row ${i+1}: AB/2 and MN/2 are required.`);const calc=calculateVES({array,ab2,mn2,resistance});return{...r,...calc,ab2,mn2,resistance};});const x=clean.map(r=>wenner?r.spacing:r.ab2);if(clean.some((r,i)=>i&&x[i]<=x[i-1]))throw new Error(wenner?'Wenner electrode spacing values must be entered in strictly increasing order.':'VES AB/2 values must be entered in strictly increasing order.');return clean;}


// Preliminary shape classification of apparent resistivity values. This is not
// a substitute for layered-earth inversion or geological interpretation.
export function classifyVESCurve(rows) {
  const valid = (rows || []).filter(r => Number.isFinite(Number(r.ab2)) &&
    Number(r.ab2) > 0 && Number.isFinite(Number(r.apparentResistivity)) &&
    Number(r.apparentResistivity) > 0).sort((a,b) => Number(a.ab2)-Number(b.ab2));
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
