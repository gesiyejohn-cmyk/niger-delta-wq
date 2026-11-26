import { useEffect, useMemo, useState } from 'react';
import { listSamples } from '../storage/samples.js';
import { decimalToUTM, getStandardUTMZone } from '../engine/coordinates.js';
import { generateIDWGrid } from '../engine/idw.js';
import { downloadText } from '../storage/export.js';

const FIELDS = [['tds','Total dissolved solids','mg/L'],['ec','Electrical conductivity','µS/cm'],['no3','Nitrate','mg/L'],['fe','Iron','mg/L'],['cl','Chloride','mg/L']];
const cellCSV = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';

export default function IDWPage() {
  const [samples, setSamples] = useState([]);
  const [field, setField] = useState('tds');
  const [power, setPower] = useState('2');
  const [neighbours, setNeighbours] = useState('8');
  const [maxDistance, setMaxDistance] = useState('5000');
  const [rows, setRows] = useState('20');
  const [columns, setColumns] = useState('20');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { listSamples().then(setSamples).catch(e => setError(e.message)); }, []);
  const prepared = useMemo(() => {
    const candidates = samples.filter(s => Number.isFinite(s.latitude) && Number.isFinite(s.longitude)
      && s.coordinateDatum === 'WGS84' && s.coordinateStorageCRS === 'EPSG:4326'
      && s.parameters?.[field]?.canonical != null
      && Number.isFinite(Number(s.parameters[field].canonical)));
    if (!candidates.length) return { points: [], message: 'No samples have both WGS84 coordinates and a measured value for this parameter.' };
    const zones = new Set(candidates.map(s => getStandardUTMZone(s.latitude, s.longitude)));
    if (zones.size !== 1) return { points: [], message: 'The selected samples span multiple standard UTM zones. Filter the dataset to one UTM zone before interpolation; the app will not mix coordinate systems.' };
    const zone = [...zones][0];
    const points = candidates.map(s => {
      const utm = decimalToUTM(s.latitude, s.longitude, zone);
      return { x: utm.easting, y: utm.northing, value: Number(s.parameters[field].canonical), label: s.sampleCode || s.stationName || s.id };
    });
    return { points, zone, epsg: candidates[0].latitude < 0 ? 32700 + zone : 32600 + zone };
  }, [samples, field]);
  function calculate() {
    setError(''); setResult(null);
    try {
      if (prepared.points.length < 3) throw new Error(prepared.message || 'At least three spatially distributed measured samples are required.');
      const grid = generateIDWGrid(prepared.points, { valueKey: 'value', power, neighbours, maxDistance, rows, columns });
      setResult({ ...grid, zone: prepared.zone, epsg: prepared.epsg, parameter: field, sampleCount: prepared.points.length });
    } catch (e) { setError(e.message); }
  }
  function exportGrid() {
    if (!result) return;
    const csv = [
      ['parameter',result.parameter,'crs','EPSG:'+result.epsg,'method',result.method],
      ['row','column','easting_m','northing_m','interpolated_value','status','neighbours_used'],
      ...result.cells.map(c => [c.row,c.col,c.x,c.y,c.value ?? '',c.status,c.used])
    ].map(row => row.map(cellCSV).join(',')).join('\r\n');
    downloadText('ndwq-idw-' + result.parameter + '-EPSG' + result.epsg + '.csv', csv, 'text/csv;charset=utf-8');
  }
  const values = result?.cells.map(c => c.value).filter(v => Number.isFinite(v)) || [];
  const low = values.length ? Math.min(...values) : 0, high = values.length ? Math.max(...values) : 0;
  return <div className="page">
    <p className="eyebrow">EXPLORATORY SPATIAL ANALYSIS</p>
    <h1>Inverse distance weighting (IDW)</h1>
    <p className="muted">Exploratory interpolation of measured sample values. Coordinates are transformed from WGS84 into one common UTM zone in metres. The result is masked to the convex hull of the measured points and is not a groundwater-potential prediction.</p>
    <section className="panel">
      <div className="form-grid">
        <label>Parameter<select value={field} onChange={e=>{setField(e.target.value);setResult(null);}}>{FIELDS.map(([k,n,u])=><option key={k} value={k}>{n} ({u})</option>)}</select></label>
        <label>IDW power<input type="number" min="0.1" step="0.1" value={power} onChange={e=>setPower(e.target.value)}/></label>
        <label>Maximum neighbours<input type="number" min="1" step="1" value={neighbours} onChange={e=>setNeighbours(e.target.value)}/></label>
        <label>Maximum distance (m)<input type="number" min="1" step="any" value={maxDistance} onChange={e=>setMaxDistance(e.target.value)}/></label>
        <label>Grid rows<input type="number" min="2" step="1" value={rows} onChange={e=>setRows(e.target.value)}/></label>
        <label>Grid columns<input type="number" min="2" step="1" value={columns} onChange={e=>setColumns(e.target.value)}/></label>
      </div>
      <p className="muted">Eligible samples: {prepared.points.length}. {prepared.message || ('Common projection: WGS84 / UTM zone '+prepared.zone+' (EPSG:'+prepared.epsg+').')}</p>
      <button type="button" className="primary" disabled={prepared.points.length < 3} onClick={calculate}>Generate IDW grid</button>
      {error && <p className="notice error" role="alert">{error}</p>}
      {result && <>
        <h2>Interpolated grid</h2>
        <p className="muted">{result.sampleCount} measured samples · EPSG:{result.epsg} · {result.rows} × {result.columns} cells · range {low.toPrecision(4)} to {high.toPrecision(4)}</p>
        <div role="img" aria-label="IDW interpolated grid; blank cells are outside the sample convex hull" style={{display:'grid',gridTemplateColumns:'repeat('+result.columns+', minmax(8px,1fr))',gap:2,overflowX:'auto'}}>
          {result.cells.map((cell,i)=>{
            const t=cell.value==null||high===low?0.5:(cell.value-low)/(high-low);
            const color=cell.value==null?'#e5e7eb':'hsl('+(220-220*t)+' 70% 52%)';
            return <div key={i} title={cell.value==null?cell.status:cell.value.toPrecision(5)+' · '+cell.status} style={{background:color,minWidth:8,aspectRatio:'1',borderRadius:2}}/>;
          })}
        </div>
        <p className="muted">Colour ramp: lower values to higher values. Grey cells are outside the measured-sample convex hull or lack eligible neighbours. Hover/tap a cell for its value and status.</p>
        <button type="button" onClick={exportGrid}>Export IDW grid CSV</button>
      </>}
    </section>
    <p className="muted">Use projected coordinates in metres and check the UTM zone, sampling geometry, search radius and parameter units. IDW is sensitive to sample distribution and does not provide uncertainty estimates or a validated aquifer-potential model.</p>
  </div>;
}
