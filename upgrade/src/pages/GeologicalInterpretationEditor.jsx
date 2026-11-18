import { useEffect, useMemo, useState } from 'react';
import {
  createGeologicalInterpretation, validateGeologicalInterpretation,
  getGeologicalColumnAtDistance
} from '../engine/geologicalInterpretation.js';
import {
  getERTInterpretation, saveERTInterpretation, deleteERTInterpretation
} from '../storage/geophysics.js';

const palette = ['#d6b98c', '#b8a7d9', '#e8c65a', '#83b7a5', '#9bb7d8', '#b9b9b9'];
const field = { width: '100%', boxSizing: 'border-box', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 };
const btn = { padding: '7px 10px', border: '1px solid #94a3b8', borderRadius: 6, background: '#f8fafc', color: '#0f172a' };

function makeStation(x, boundaries) {
  return { x, boundaries: [...boundaries] };
}

function downloadText(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = String(value ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

export default function GeologicalInterpretationEditor({ model, selectedDistance = null, onDistanceChange = () => {} }) {
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    setDraft(null);
    (async () => {
      try {
        const saved = await getERTInterpretation(model.id);
        if (!active) return;
        setDraft(saved || createGeologicalInterpretation(model));
        setMessage(saved ? 'Saved geological interpretation loaded.' : 'No geological interpretation saved yet. Start by defining the section.');
      } catch (error) {
        if (active) {
          setLoadError(error?.message || String(error));
          setMessage('The geological editor could not load its saved draft. Your imported ERT measurements have not been changed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [model.id, loadAttempt]);

  const range = draft?.depthRange || [0, 1];
  const xRange = draft?.xRange || [0, 1];
  const stations = draft?.stations || [];
  const units = draft?.units || [];
  const column = useMemo(() => {
    if (!draft || !units.length || stations.length < 2) return null;
    const x = selectedDistance == null ? xRange[0] : Math.max(xRange[0], Math.min(xRange[1], selectedDistance));
    try { return getGeologicalColumnAtDistance(draft, x); } catch { return null; }
  }, [draft, selectedDistance]);

  function startSection() {
    setDraft(old => ({ ...old, stations: [
      makeStation(xRange[0], [range[0], range[1]]),
      makeStation(xRange[1], [range[0], range[1]])
    ] }));
    setMessage('Section stations created at both ends of the ERT line.');
  }

  function addUnit() {
    const id = globalThis.crypto?.randomUUID?.() || 'unit_' + Date.now();
    const nextUnit = { id, name: 'New geological unit', confidence: 'low', aquiferPotential: 'unknown', evidence: '' };
    setDraft(old => {
      const nextStations = old.stations.map(station => {
        const bounds = [...station.boundaries];
        const split = bounds.length - 2;
        bounds.splice(split + 1, 0, (bounds[split] + bounds[split + 1]) / 2);
        return { ...station, boundaries: bounds };
      });
      return { ...old, units: [...old.units, nextUnit], stations: nextStations };
    });
  }

  function addStation() {
    setDraft(old => {
      if (old.stations.length < 2) return old;
      let gapIndex = 0, largest = -1;
      for (let i = 0; i < old.stations.length - 1; i++) {
        const gap = old.stations[i + 1].x - old.stations[i].x;
        if (gap > largest) { largest = gap; gapIndex = i; }
      }
      const left = old.stations[gapIndex], right = old.stations[gapIndex + 1];
      const fraction = 0.5;
      const x = (left.x + right.x) / 2;
      const boundaries = left.boundaries.map((depth, i) => depth + (right.boundaries[i] - depth) * fraction);
      const next = [...old.stations, makeStation(x, boundaries)].sort((a, b) => a.x - b.x);
      return { ...old, stations: next };
    });
  }

  function removeUnit(index) {
    setDraft(old => {
      if (old.units.length === 1) {
        return {
          ...old,
          units: [],
          stations: old.stations.map(station => ({
            ...station,
            boundaries: [station.boundaries[0], station.boundaries[station.boundaries.length - 1]]
          }))
        };
      }
      const isLast = index === old.units.length - 1;
      return {
        ...old,
        units: old.units.filter((_, i) => i !== index),
        stations: old.stations.map(station => ({
          ...station,
          boundaries: station.boundaries.filter((_, boundaryIndex) =>
            boundaryIndex !== (isLast ? index : index + 1)
          )
        }))
      };
    });
  }

  function rebuildBoundariesFromUnits() {
    setDraft(old => {
      const [top, bottom] = old.depthRange;
      const boundaryCount = old.units.length + 1;
      const boundaries = Array.from({ length: boundaryCount }, (_, index) =>
        top + ((bottom - top) * index) / (boundaryCount - 1)
      );
      return {
        ...old,
        stations: old.stations.map(station => ({
          ...station,
          boundaries: [...boundaries]
        }))
      };
    });
    setMessage('Boundaries rebuilt to match the current geological units. The ERT depth limits and unit descriptions were preserved; internal boundary positions were reset to equal intervals. Review them before saving.');
  }

  function updateUnit(index, key, value) {
    setDraft(old => ({ ...old, units: old.units.map((unit, i) => i === index ? { ...unit, [key]: value } : unit) }));
  }
  function updateBoundary(stationIndex, boundaryIndex, value) {
    setDraft(old => ({ ...old, stations: old.stations.map((station, i) => i === stationIndex
      ? { ...station, boundaries: station.boundaries.map((depth, j) => j === boundaryIndex ? Number(value) : depth) }
      : station) }));
  }

  async function save() {
    setBusy(true);
    try {
      const clean = validateGeologicalInterpretation({ ...draft, interpretationStatus: 'provisional' }, model);
      await saveERTInterpretation(model.id, clean);
      setDraft(clean);
      setMessage('Geological interpretation saved. It will be available when this ERT line is reopened.');
    } catch (error) { setMessage('Not saved: ' + error.message); }
    finally { setBusy(false); }
  }
  function exportJSON() {
    try {
      const clean = validateGeologicalInterpretation({ ...draft, interpretationStatus: 'provisional' }, model);
      downloadText((model.lineId || 'ERT-line') + '-geological-interpretation.json', JSON.stringify({
        ...clean,
        exportedAt: new Date().toISOString(),
        units: clean.units,
        stations: clean.stations
      }, null, 2), 'application/json;charset=utf-8');
      setMessage('Interpretation JSON export prepared.');
    } catch (error) { setMessage('Export unavailable: ' + error.message); }
  }

  function exportCSV() {
    try {
      const clean = validateGeologicalInterpretation({ ...draft, interpretationStatus: 'provisional' }, model);
      const rows = [[
        'ERT model ID','ERT line ID','Latitude','Longitude','Coordinate datum','Coordinate CRS',
        'Station distance (m)','Unit ID','Unit order','Geological unit','Top depth (m)',
        'Bottom depth (m)','Thickness (m)','Confidence','Aquifer potential','Evidence','Interpretation notes'
      ]];
      clean.stations.forEach(station => clean.units.forEach((unit, index) => rows.push([
        clean.ertModelId, clean.lineId, model.latitude ?? '', model.longitude ?? '',
        model.coordinateDatum ?? '', model.coordinateCRS ?? '', station.x, unit.id, index + 1,
        unit.name, station.boundaries[index], station.boundaries[index + 1],
        station.boundaries[index + 1] - station.boundaries[index],
        unit.confidence, unit.aquiferPotential, unit.evidence, clean.notes
      ])));
      const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n');
      downloadText((model.lineId || 'ERT-line') + '-geological-interpretation.csv', csv, 'text/csv;charset=utf-8');
      setMessage('Interpretation CSV export prepared.');
    } catch (error) { setMessage('Export unavailable: ' + error.message); }
  }

  async function remove() {
    if (!globalThis.confirm?.('Delete the saved geological interpretation for this ERT line?')) return;
    await deleteERTInterpretation(model.id);
    setDraft(createGeologicalInterpretation(model));
    setMessage('Saved geological interpretation deleted. The imported ERT measurements remain unchanged.');
  }

  if (!draft) return <section style={{marginTop:24,padding:14,border:'2px solid #2563eb',borderRadius:10,background:'#eff6ff'}} aria-live="polite"><h2>2D Geological Subsurface Interpretation</h2>{loading ? <p role="status">Loading the interpretation workspace for {model.lineId || 'this ERT line'}…</p> : <><p role="alert">{loadError ? 'Could not open the interpretation workspace: ' + loadError : 'The interpretation workspace is not ready yet.'}</p><p>Your imported ERT model and measurements are kept separately and have not been deleted.</p><button type="button" style={btn} onClick={() => setLoadAttempt(value => value + 1)}>Retry loading editor</button></>}</section>;

  const plot = stations.length >= 2 && units.length
    ? units.map((unit, layerIndex) => {
      const points = stations.map((station, i) => {
        const x = 70 + (station.x - xRange[0]) / (xRange[1] - xRange[0]) * 650;
        const top = 30 + (station.boundaries[layerIndex] - range[0]) / (range[1] - range[0]) * 300;
        return [x, top];
      });
      const lower = stations.slice().reverse().map(station => {
        const x = 70 + (station.x - xRange[0]) / (xRange[1] - xRange[0]) * 650;
        const y = 30 + (station.boundaries[layerIndex + 1] - range[0]) / (range[1] - range[0]) * 300;
        return [x, y];
      });
      return { unit, points, lower, d: [...points, ...lower].map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ') + ' Z' };
    }) : [];

  return <section style={{marginTop:24, padding:14, border:'1px solid #cbd5e1', borderRadius:10, background:'#fff'}}>
    <h2>2D Geological Subsurface Interpretation</h2>
    <p className="muted">Manual geological interpretation linked to <strong>{model.lineId || 'Unlabelled ERT line'}</strong>. Distance and depth use the same coordinate ranges as the imported ERT model. Lithology is not automatically inferred from resistivity.</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
      <button type="button" style={btn} onClick={startSection} disabled={stations.length >= 2}>Create section stations</button>
      <button type="button" style={btn} onClick={addUnit} disabled={stations.length < 2}>Add geological layer</button>
      <button type="button" style={btn} onClick={addStation} disabled={stations.length < 2}>Add interpretation station</button>
      <button type="button" style={{...btn,background:'#eff6ff'}} onClick={save} disabled={busy || !units.length || stations.length < 2}>{busy ? 'Saving…' : 'Save interpretation'}</button>
      <button type="button" style={btn} onClick={remove}>Delete interpretation</button>
      <button type="button" style={btn} onClick={exportJSON} disabled={!units.length || stations.length < 2}>Export JSON</button>
      <button type="button" style={btn} onClick={exportCSV} disabled={!units.length || stations.length < 2}>Export CSV</button>
    </div>
    {message && <p className="notice" role="status">{message}</p>}
    <label style={{display:'block',margin:'12px 0'}}>Interpretation notes / limitations
      <textarea style={field} rows="2" value={draft.notes || ''} onChange={e => setDraft(old => ({ ...old, notes: e.target.value }))} placeholder="Record the basis of the section, borehole correlations, assumptions and unresolved uncertainty." />
    </label>
    {units.length > 0 && <div style={{display:'grid',gap:12}}>
      <h3 style={{marginBottom:0}}>Geological units (shallow to deep)</h3>
      {units.map((unit, index) => <div key={unit.id} style={{border:'1px solid #e2e8f0',borderLeft:'6px solid ' + palette[index % palette.length],borderRadius:7,padding:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
          <strong>Unit {index + 1}</strong>
          <button type="button" style={btn} onClick={() => removeUnit(index)}>Remove layer</button>
        </div>
        <label>Lithology / material
          <input style={field} value={unit.name} onChange={e => updateUnit(index,'name',e.target.value)} placeholder="e.g. topsoil, clay, fine sand, saturated sand" />
        </label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))',gap:8,marginTop:8}}>
          <label>Confidence<select style={field} value={unit.confidence} onChange={e => updateUnit(index,'confidence',e.target.value)}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select></label>
          <label>Aquifer potential<select style={field} value={unit.aquiferPotential} onChange={e => updateUnit(index,'aquiferPotential',e.target.value)}><option value="unknown">Unknown</option><option value="unlikely">Unlikely</option><option value="possible">Possible</option><option value="probable">Probable</option></select></label>
        </div>
        <label>Evidence / borehole or field control
          <textarea style={field} rows="2" value={unit.evidence} onChange={e => updateUnit(index,'evidence',e.target.value)} placeholder="Record borehole log, outcrop, sample, local geology, or why confidence is limited." />
        </label>
      </div>)}
    </div>}
    {stations.length >= 2 && <div style={{marginTop:16}}>
      <h3>Layer boundaries at each interpretation station (depth in metres)</h3>
      <p className="muted">Enter boundaries from shallow to deep. The first and last values must match the ERT model depth limits. Values between stations are interpolated linearly.</p>
      <button type="button" style={btn} onClick={rebuildBoundariesFromUnits} disabled={!units.length || !stations.length}>Rebuild boundaries from geological units</button>
      <p className="muted">Use this recovery action if the number of boundaries no longer matches the number of units. It preserves the top and bottom ERT depth limits and all unit descriptions, but resets internal boundaries to equal intervals. Review the resulting depths before saving.</p>
      {stations.map((station, stationIndex) => <div key={station.x} style={{border:'1px solid #e2e8f0',borderRadius:7,padding:10,marginBottom:8}}>
        <strong>Station {stationIndex + 1}</strong> · Distance {station.x.toFixed(2)} m
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(115px,1fr))',gap:8,marginTop:8}}>
          {station.boundaries.map((depth, boundaryIndex) => <label key={boundaryIndex}>{boundaryIndex === 0 ? 'Top boundary' : boundaryIndex === station.boundaries.length - 1 ? 'Bottom boundary' : 'Base of ' + units[boundaryIndex - 1]?.name}
            <input style={field} type="number" step="any" value={depth} onChange={e => updateBoundary(stationIndex,boundaryIndex,e.target.value)} />
          </label>)}
        </div>
      </div>)}
    </div>}
    {plot.length > 0 && <div style={{marginTop:16}}>
      <h3>Geological cross-section</h3>
      <p className="muted">Tap or click the section to select a profile distance. The nearest imported ERT measurement will be selected in the ERT plot above. Use the left/right arrow keys when the section is focused.</p>
      <div style={{overflowX:'auto',border:'1px solid #cbd5e1',borderRadius:7}}>
        <svg viewBox="0 0 760 390" role="img" aria-label="Manually interpreted geological cross-section with shared ERT distance and depth ranges" onClick={event => {
            if (!onDistanceChange) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const plotX = ((event.clientX - rect.left) / rect.width) * 760;
            const fraction = Math.max(0, Math.min(1, (plotX - 70) / 650));
            onDistanceChange(xRange[0] + fraction * (xRange[1] - xRange[0]));
          }}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              const current = selectedDistance == null ? xRange[0] : selectedDistance;
              const step = (xRange[1] - xRange[0]) / 20;
              onDistanceChange(Math.max(xRange[0], Math.min(xRange[1], current + (event.key === 'ArrowRight' ? step : -step))));
            }
          }}
          tabIndex={0}
          style={{width:'100%',minWidth:320,background:'#f8fafc',display:'block'}}>
          <path d="M70 30V330H720" fill="none" stroke="#334155" strokeWidth="1.5"/>
          {plot.map((item,i) => <path key={item.unit.id} d={item.d} fill={palette[i % palette.length]} fillOpacity=".78" stroke="#475569" strokeWidth="1.2"><title>{item.unit.name}</title></path>)}
          {stations.map((station,i) => <g key={station.x}><path d={'M'+(70+(station.x-xRange[0])/(xRange[1]-xRange[0])*650)+' 30v300'} stroke="#64748b" strokeDasharray="3 4" opacity=".5"/><text x={70+(station.x-xRange[0])/(xRange[1]-xRange[0])*650} y="348" textAnchor="middle" fontSize="10" fill="#334155">{station.x.toFixed(1)}</text></g>)}
          {[0,1,2,3,4].map(i => <text key={i} x="60" y={34+i*74} textAnchor="end" fontSize="10" fill="#334155">{(range[0]+(range[1]-range[0])*i/4).toFixed(1)}</text>)}
          <text x="390" y="378" textAnchor="middle" fontSize="12" fill="#0f172a">Profile distance (m)</text>
          <text x="15" y="180" transform="rotate(-90 15 180)" textAnchor="middle" fontSize="12" fill="#0f172a">Depth (m)</text>
          {selectedDistance != null && <path d={'M'+(70+(Math.max(xRange[0],Math.min(xRange[1],selectedDistance))-xRange[0])/(xRange[1]-xRange[0])*650)+' 30v300'} stroke="#111827" strokeWidth="2.5"/>}
        </svg>
      </div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:8}}>{units.map((unit,i)=><span key={unit.id} style={{fontSize:13}}><span style={{display:'inline-block',width:12,height:12,background:palette[i%palette.length],marginRight:5}}/>{unit.name}</span>)}</div>
      {column && <div className="notice" style={{marginTop:10}}>
        <strong>Interpreted column at {column.x.toFixed(2)} m</strong>
        {column.layers.map(layer=><div key={layer.id}>{layer.name}: {layer.topDepth.toFixed(2)}–{layer.bottomDepth.toFixed(2)} m · thickness {layer.thickness.toFixed(2)} m · {layer.confidence} confidence · aquifer potential: {layer.aquiferPotential}</div>)}
      </div>}
    </div>}
    <p className="muted" style={{marginTop:12}}>Scientific caution: resistivity is non-unique. Interpretations are provisional unless supported by borehole logs, lithological samples, groundwater data, or other independent evidence. “Possible/probable aquifer” is an interpretation, not confirmation of a productive aquifer.</p>
  </section>;
}
