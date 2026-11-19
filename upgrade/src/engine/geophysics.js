const finite=(v)=>v!=null&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
export function schlumbergerGeometricFactor(ab2,mn2){const a=Number(ab2),m=Number(mn2);if(!finite(a)||!finite(m)||a<=m||m<=0)throw new Error('Schlumberger geometry requires AB/2 > MN/2 > 0.');const factor=Math.PI*(a*a-m*m)/(2*m);if(!Number.isFinite(factor)||factor<=0)throw new Error('Schlumberger geometric factor is outside the supported numeric range.');return factor;}
export function calculateVES({ab2,mn2,resistance}){if(!finite(resistance)||Number(resistance)<=0)throw new Error('Measured resistance must be greater than zero.');const k=schlumbergerGeometricFactor(ab2,mn2);const apparentResistivity=k*Number(resistance);if(!Number.isFinite(apparentResistivity)||apparentResistivity<=0)throw new Error('Calculated apparent resistivity is outside the supported numeric range.');return{geometricFactor:k,apparentResistivity};}
// Non-destructive VES field-entry quality checks. These flags never edit readings.
export function assessVESQuality(rows) {
  const source = Array.isArray(rows) ? rows : [];
  const issues = [];
  const seen = new Map();
  let completeCount = 0;
  let incompleteCount = 0;
  let previousAB2 = null;
  let previousMN2 = null;
  source.forEach((row, index) => {
    const fields = ['ab2', 'mn2', 'resistance'];
    const populated = fields.filter(key => row?.[key] != null && String(row[key]).trim() !== '').length;
    if (populated === 0) return;
    if (populated < fields.length) {
      incompleteCount += 1;
      issues.push({ code: 'incomplete-row', severity: 'warning', row: index + 1,
        message: 'Row ' + (index + 1) + ' is incomplete; finish it or remove it before saving.' });
      return;
    }
    completeCount += 1;
    const ab2 = Number(row.ab2), mn2 = Number(row.mn2), resistance = Number(row.resistance);
    if (!finite(ab2) || !finite(mn2) || !finite(resistance) || ab2 <= 0 || mn2 <= 0 || resistance <= 0 || ab2 <= mn2) {
      issues.push({ code: 'invalid-reading', severity: 'error', row: index + 1,
        message: 'Row ' + (index + 1) + ' has invalid values or electrode geometry (AB/2 must exceed MN/2 > 0; resistance must be positive).' });
      return;
    }
    if (seen.has(ab2)) {
      issues.push({ code: 'duplicate-ab2', severity: 'error', row: index + 1,
        message: 'Row ' + (index + 1) + ' repeats AB/2 = ' + ab2 + ' m from row ' + seen.get(ab2) + '.' });
    } else seen.set(ab2, index + 1);
    if (previousAB2 !== null && ab2 < previousAB2) {
      issues.push({ code: 'descending-ab2', severity: 'warning', row: index + 1,
        message: 'AB/2 at row ' + (index + 1) + ' is smaller than the preceding valid spacing; arrange readings in increasing order.' });
    }
    if (previousMN2 !== null && mn2 !== previousMN2) {
      issues.push({ code: 'mn2-change', severity: 'info', row: index + 1,
        message: 'MN/2 changes at row ' + (index + 1) + '. This can be a legitimate field expansion; verify and document the change.' });
    }
    previousAB2 = ab2;
    previousMN2 = mn2;
  });
  return { completeCount, incompleteCount, issues,
    errorCount: issues.filter(issue => issue.severity === 'error').length,
    warningCount: issues.filter(issue => issue.severity === 'warning').length };
}

export function validateVES(rows){if(!Array.isArray(rows)||rows.length<1)throw new Error('Enter at least one complete VES reading.');const clean=rows.map((r,i)=>{const x=Number(r.ab2),m=Number(r.mn2),v=Number(r.resistance);if(!finite(x)||!finite(m)||!finite(v)||v<=0)throw new Error(`VES row ${i+1}: AB/2, MN/2 and positive resistance are required.`);return{...r,...calculateVES({ab2:x,mn2:m,resistance:v}),ab2:x,mn2:m,resistance:v};});if(clean.some((r,i)=>i&&r.ab2<=clean[i-1].ab2))throw new Error('VES AB/2 values must be entered in strictly increasing order.');return clean;}
export function validateERT(points){if(!Array.isArray(points)||!points.length)throw new Error('No ERT model cells were supplied.');const seen=new Set();return points.map((p,i)=>{const x=Number(p.x),depth=Number(p.depth),resistivity=Number(p.resistivity);if(!finite(x)||!finite(depth)||!finite(resistivity)||depth<0||resistivity<=0)throw new Error(`ERT cell ${i+1}: provide numeric x, non-negative depth and positive resistivity.`);const key=x+'|'+depth;if(seen.has(key))throw new Error('ERT import contains duplicate distance/depth cells; resolve duplicate coordinates before saving.');seen.add(key);return{x,depth,resistivity};});}
export function descriptiveStats(values){const a=values.filter(finite).map(Number);if(!a.length)return null;const sorted=[...a].sort((x,y)=>x-y),mean=a.reduce((s,v)=>s+v,0)/a.length,median=sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;return{n:a.length,mean,median,min:sorted[0],max:sorted.at(-1),sd:Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2,0)/a.length)};}
export function pearsonCorrelation(xs,ys){if(!Array.isArray(xs)||!Array.isArray(ys))return null;const pairs=xs.map((x,i)=>[x,ys[i]]).filter(([x,y])=>finite(x)&&finite(y)).map(([x,y])=>[Number(x),Number(y)]);if(pairs.length<3)return null;const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;const cov=pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0),vx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),vy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);return vx&&vy?cov/Math.sqrt(vx*vy):null;}


// Preliminary shape classification of apparent resistivity values. This is not
// a substitute for layered-earth inversion or geological interpretation.
export function classifyVESCurve(rows) {
  const valid = (rows || []).filter(r => Number.isFinite(Number(r.ab2)) &&
    Number(r.ab2) > 0 && Number.isFinite(Number(r.apparentResistivity)) &&
    Number(r.apparentResistivity) > 0).sort((a,b) => Number(a.ab2)-Number(b.ab2));
  if (valid.length < 3) return { code: null, label: 'Insufficient data', description: 'At least three valid readings are required.' };
  const first = Math.sign(Number(valid[1].apparentResistivity)-Number(valid[0].apparentResistivity));
  const second = Math.sign(Number(valid[2].apparentResistivity)-Number(valid[1].apparentResistivity));
  if (first > 0 && second > 0) return { code: 'A', label: 'A-type trend (increasing)', description: 'The first three valid readings increase; later readings are not included in this preliminary trend check.' };
  if (first < 0 && second < 0) return { code: 'Q', label: 'Q-type trend (decreasing)', description: 'The first three valid readings decrease; later readings are not included in this preliminary trend check.' };
  if (first > 0 && second < 0) return { code: 'K', label: 'K-type trend (rise then fall)', description: 'The first three valid readings rise and then fall; later readings are not included in this preliminary trend check.' };
  if (first < 0 && second > 0) return { code: 'H', label: 'H-type trend (fall then rise)', description: 'The first three valid readings fall and then rise; later readings are not included in this preliminary trend check.' };
  return { code: 'Mixed', label: 'Mixed / flat trend', description: 'The first three valid readings do not show a clear two-segment trend; a full sounding review is still required.' };
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


// Portable, spreadsheet-friendly VES report. Raw readings, QC findings and
// manually supplied interpretation are kept in separate labelled sections.
const csvField = value => {
  if (value == null) return '';
  let text = String(value);
  // Prevent spreadsheet formula execution when opening exported user-entered text.
  if (typeof value === 'string' && /^[\\s\\u0000-\\u001f]*[=+@-]/.test(text)) text = "'" + text;
  return /[",\\r\\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};
export function buildVESReportCSV(record) {
  if (!record || typeof record !== 'object') throw new Error('A saved VES sounding is required to build a report.');
  const rows = Array.isArray(record.readings) ? record.readings : [];
  const quality = assessVESQuality(rows);
  const curve = classifyVESCurve(rows);
  const output = [];
  const add = values => output.push(values.map(csvField).join(','));
  add(['Niger Delta Water Quality — VES sounding report']);
  add(['Report generated', new Date().toISOString()]);
  add(['SECTION', 'FIELD', 'VALUE', 'UNIT', 'STATUS / NOTES']);
  add(['Metadata', 'Station ID', record.stationId || '', '', '']);
  add(['Metadata', 'Survey date', record.surveyDate || record.date || '', '', 'Not available if blank']);
  add(['Metadata', 'Record created', record.createdAt || '', '', '']);
  add(['Metadata', 'Array configuration', record.array || record.method || 'Schlumberger', '', '']);
  add(['Metadata', 'Latitude', record.latitude ?? '', 'decimal degrees', '']);
  add(['Metadata', 'Longitude', record.longitude ?? '', 'decimal degrees', '']);
  add(['Metadata', 'Coordinate datum', record.coordinateDatum || '', '', '']);
  add(['Metadata', 'Coordinate CRS', record.coordinateCRS || '', '', '']);
  add(['Metadata', 'Field notes', record.notes || '', '', '']);
  add(['Summary', 'Stored readings', rows.length, 'count', '']);
  add(['Summary', 'Complete readings', quality.completeCount, 'count', '']);
  add(['Summary', 'Incomplete readings', quality.incompleteCount, 'count', '']);
  add(['Preliminary curve', 'First-three-valid-point trend', curve.label, '', 'Indicator only; not a full sounding classification or geological interpretation']);
  add(['Preliminary curve', 'Description', curve.description, '', '']);
  add([]);
  add(['RAW FIELD READINGS AND CALCULATED VALUES']);
  add(['Reading', 'AB/2 (m)', 'MN/2 (m)', 'Measured resistance (ohm)', 'Geometric factor (m)', 'Apparent resistivity (ohm m)', 'Calculation status']);
  rows.forEach((reading, index) => {
    let factor = '', rho = '', status = 'Raw row retained';
    try {
      const result = calculateVES(reading);
      factor = result.geometricFactor;
      rho = result.apparentResistivity;
      status = 'Calculated from recorded AB/2, MN/2 and resistance';
    } catch (error) { status = 'Not calculated: ' + error.message; }
    add([index + 1, reading.ab2 ?? '', reading.mn2 ?? '', reading.resistance ?? '', factor, rho, status]);
  });
  add([]);
  add(['FIELD QUALITY-CONTROL FINDINGS']);
  add(['Issue code', 'Severity', 'Row', 'Finding']);
  if (!quality.issues.length) add(['none', 'info', '', 'No issues detected by the current VES entry checks. This does not replace field or instrument QA/QC.']);
  quality.issues.forEach(issue => add([issue.code, issue.severity, issue.row, issue.message]));
  add([]);
  add(['MANUALLY RECORDED LAYER INTERPRETATION']);
  const interpretation = record.interpretation;
  if (!interpretation?.layers?.length) {
    add(['Interpretation status', 'No layer interpretation is saved for this sounding.']);
  } else {
    add(['Interpretation method', interpretation.method || 'User-entered layered-earth model']);
    add(['Inversion software/version', interpretation.inversionSoftware || 'Not recorded']);
    add(['Inversion RMS error (%)', interpretation.rmsErrorPercent ?? 'Not recorded']);
    add(['Interpretation date', interpretation.interpretedAt || interpretation.updatedAt || 'Not recorded']);
    add(['Interpretation status', interpretation.interpretationStatus || 'Status not recorded']);
    add(['Layer', 'Resistivity (ohm m)', 'Thickness (m)', 'Bottom/interface depth (m)', 'Notes']);
    interpretation.layers.forEach((layer, index) => add([
      layer.layer ?? index + 1, layer.resistivity ?? '', layer.thickness ?? 'Half-space',
      layer.bottomDepth ?? 'Not applicable (half-space)', ''
    ]));
    add(['Geological notes / borehole control', interpretation.notes || 'None recorded']);
  }
  add([]);
  add(['SCIENTIFIC LIMITATIONS']);
  add(['This report separates raw field observations from calculated apparent resistivity and manually entered layer interpretation.']);
  add(['VES resistivity does not uniquely identify lithology, prove an aquifer, or establish groundwater quality or contamination.']);
  add(['Geological assignments require independent local geological/hydrogeological evidence, such as borehole logs and hydrogeochemical results.']);
  add(['The app does not perform automatic 1D VES inversion. Any software/RMS details above are user-entered and should be checked against the original inversion report.']);
  return '\uFEFF' + output.map(row => row.join(',')).join('\r\n');
}
