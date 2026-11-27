import { useEffect, useState } from 'react';
import {
  createGeologicalInterpretation,
  validateGeologicalInterpretation
} from '../engine/geologicalInterpretation.js';
import {
  getERTInterpretation,
  saveERTInterpretation
} from '../storage/geophysics.js';

const field = { width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' };
const makeId = () => globalThis.crypto?.randomUUID?.() || 'unit-' + Date.now() + '-' + Math.random().toString(36).slice(2);

function freshDraft(model) {
  const base = createGeologicalInterpretation(model);
  const [zMin, zMax] = base.depthRange;
  return {
    ...base,
    units: [{
      id: makeId(),
      name: 'Unclassified geological unit',
      confidence: 'low',
      evidence: '',
      aquiferPotential: 'unknown'
    }],
    stations: [
      { x: base.xRange[0], boundaries: [zMin, zMax] },
      { x: base.xRange[1], boundaries: [zMin, zMax] }
    ]
  };
}

export default function ERTGeologicalInterpretation({ model, notify }) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setDraft(null);
    getERTInterpretation(model.id).then(saved => {
      if (active) setDraft(saved || freshDraft(model));
    }).catch(error => {
      if (active) notify('Could not load ERT geological interpretation: ' + error.message, 'error');
    });
    return () => { active = false; };
  }, [model.id]);

  if (!draft) return <p className="muted" role="status">Loading geological interpretation…</p>;

  function updateUnit(index, key, value) {
    setDraft(current => ({
      ...current,
      units: current.units.map((unit, i) => i === index ? { ...unit, [key]: value } : unit)
    }));
  }

  function addUnit() {
    setDraft(current => ({
      ...current,
      units: [...current.units, {
        id: makeId(), name: 'New geological unit', confidence: 'low',
        evidence: '', aquiferPotential: 'unknown'
      }],
      stations: current.stations.map(station => {
        const boundaries = [...station.boundaries];
        const lastTop = boundaries[boundaries.length - 2];
        const bottom = boundaries[boundaries.length - 1];
        boundaries.splice(boundaries.length - 1, 0, lastTop + (bottom - lastTop) / 2);
        return { ...station, boundaries };
      })
    }));
  }

  function removeUnit(index) {
    setDraft(current => ({
      ...current,
      units: current.units.filter((_, i) => i !== index),
      stations: current.stations.map(station => {
        const boundaries = [...station.boundaries];
        boundaries.splice(index === current.units.length - 1 ? index : index + 1, 1);
        return { ...station, boundaries };
      })
    }));
  }

  function updateBoundary(stationIndex, boundaryIndex, value) {
    setDraft(current => ({
      ...current,
      stations: current.stations.map((station, i) => i === stationIndex
        ? { ...station, boundaries: station.boundaries.map((depth, j) => j === boundaryIndex ? Number(value) : depth) }
        : station)
    }));
  }

  function addStation() {
    setDraft(current => {
      let pair = 0, widest = -Infinity;
      for (let i = 0; i < current.stations.length - 1; i += 1) {
        const width = current.stations[i + 1].x - current.stations[i].x;
        if (width > widest) { widest = width; pair = i; }
      }
      const left = current.stations[pair], right = current.stations[pair + 1];
      const fraction = 0.5;
      return {
        ...current,
        stations: [
          ...current.stations.slice(0, pair + 1),
          {
            x: left.x + (right.x - left.x) * fraction,
            boundaries: left.boundaries.map((depth, i) => depth + (right.boundaries[i] - depth) * fraction)
          },
          ...current.stations.slice(pair + 1)
        ]
      };
    });
  }

  async function save() {
    setBusy(true);
    try {
      const validated = validateGeologicalInterpretation(draft, model);
      await saveERTInterpretation(model.id, validated);
      setDraft(validated);
      notify('Provisional geological interpretation saved separately from the imported ERT model.', 'success');
    } catch (error) {
      notify('Interpretation not saved: ' + error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return <section style={{ border: '1px solid #dbe3ea', borderRadius: 10, padding: 14, marginTop: 18 }}>
    <h3>Manual geological interpretation — {model.lineId || 'Unlabelled ERT line'}</h3>
    <p className="muted">Draw layer boundaries at profile stations and document the evidence. Resistivity values do not automatically determine lithology. Treat this as provisional until correlated with borehole logs, samples and other geological control.</p>
    <p className="muted">Distance extent: {draft.xRange[0]}–{draft.xRange[1]} m · Depth extent: {draft.depthRange[0]}–{draft.depthRange[1]} m</p>
    <h4>Geological units (shallowest to deepest)</h4>
    {draft.units.map((unit, index) => <div key={unit.id} style={{ borderTop: '1px solid #e2e8f0', padding: '10px 0' }}>
      <strong>Unit {index + 1}</strong>
      <div className="form-grid">
        <label>Geological / lithology label
          <input style={field} value={unit.name} onChange={event => updateUnit(index, 'name', event.target.value)} />
        </label>
        <label>Interpretation confidence
          <select style={field} value={unit.confidence} onChange={event => updateUnit(index, 'confidence', event.target.value)}>
            <option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option>
          </select>
        </label>
        <label>Aquifer potential
          <select style={field} value={unit.aquiferPotential} onChange={event => updateUnit(index, 'aquiferPotential', event.target.value)}>
            <option value="unknown">Unknown</option><option value="unlikely">Unlikely</option>
            <option value="possible">Possible</option><option value="probable">Probable</option>
          </select>
        </label>
        <label className="span-two">Evidence / correlation notes
          <textarea style={field} value={unit.evidence} onChange={event => updateUnit(index, 'evidence', event.target.value)} />
        </label>
      </div>
      <button type="button" onClick={() => removeUnit(index)} disabled={draft.units.length <= 1}>Remove unit</button>
    </div>)}
    <button type="button" onClick={addUnit}>Add deeper geological unit</button>
    <h4>Layer boundaries by distance station (m)</h4>
    <p className="muted">Top and bottom boundaries are fixed to the imported model extent. Enter each internal interface depth; interfaces must increase downward without crossing.</p>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th align="left">Distance</th>{draft.units.slice(0, -1).map((unit, i) => <th key={unit.id}>Base of {unit.name || 'unit ' + (i + 1)} (m)</th>)}</tr></thead>
        <tbody>{draft.stations.map((station, stationIndex) => <tr key={station.x}>
          <td>{station.x}</td>
          {station.boundaries.slice(1, -1).map((depth, internalIndex) => <td key={internalIndex}>
            <input aria-label={'Station ' + station.x + ' boundary ' + (internalIndex + 1)} style={{ ...field, minWidth: 90 }} type="number" step="any" value={depth}
              onChange={event => updateBoundary(stationIndex, internalIndex + 1, event.target.value)} />
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <button type="button" onClick={addStation} disabled={draft.stations.length >= 50}>Add intermediate station</button>
    <p className="muted">Status: provisional · {draft.stations.length} stations · {draft.units.length} units</p>
    <button type="button" className="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Validate and save interpretation'}</button>
  </section>;
}
