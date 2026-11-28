import { useEffect, useMemo, useState } from 'react';
import { saveVESInterpretation } from '../storage/geophysics.js';
import { classifyVESCurve, validateVESLayers } from '../engine/geophysics.js';

const field = { width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 7, boxSizing: 'border-box' };
const box = { border: '1px solid #dbe3ea', borderRadius: 10, padding: 14, margin: '14px 0', background: '#fff' };

export default function VESInterpretation({ records, onSaved, notify }) {
  const [selectedId, setSelectedId] = useState('');
  const [layers, setLayers] = useState([
    { resistivity: '', thickness: '' },
    { resistivity: '', thickness: '' },
    { resistivity: '', thickness: '' }
  ]);
  const [software, setSoftware] = useState('');
  const [rms, setRms] = useState('');
  const [notes, setNotes] = useState('');
  const selected = records.find(record => record.id === selectedId) || records[0] || null;

  useEffect(() => {
    if (!selectedId && records.length) setSelectedId(records[0].id);
    if (selectedId && !records.some(record => record.id === selectedId)) setSelectedId(records[0]?.id || '');
  }, [records, selectedId]);

  useEffect(() => {
    const record = records.find(item => item.id === selectedId) || (!selectedId ? records[0] : null);
    const saved = record?.interpretation;
    if (saved?.layers?.length >= 2) {
      setLayers(saved.layers.map((layer, index) => ({
        resistivity: String(layer.resistivity),
        thickness: index === saved.layers.length - 1 ? '' : String(layer.thickness)
      })));
      setSoftware(saved.inversionSoftware || '');
      setRms(saved.rmsErrorPercent == null ? '' : String(saved.rmsErrorPercent));
      setNotes(saved.notes || '');
    } else {
      setLayers([{ resistivity: '', thickness: '' }, { resistivity: '', thickness: '' }, { resistivity: '', thickness: '' }]);
      setSoftware('');
      setRms('');
      setNotes('');
    }
  }, [records, selectedId]);

  const curve = useMemo(() => selected ? classifyVESCurve(selected.readings || []) : null, [selected]);
  const preview = useMemo(() => {
    try { return validateVESLayers(layers); } catch { return null; }
  }, [layers]);

  function updateLayer(index, key, value) {
    setLayers(old => old.map((layer, i) => i === index ? { ...layer, [key]: value } : layer));
  }

  async function saveInterpretation() {
    if (!selected) return notify('Select a saved VES sounding first.', 'error');
    try {
      const clean = validateVESLayers(layers);
      const rmsValue = rms.trim() === '' ? null : Number(rms);
      if (rmsValue !== null && (!Number.isFinite(rmsValue) || rmsValue < 0)) {
        throw new Error('RMS error must be a non-negative percentage, or left blank.');
      }
      await saveVESInterpretation(selected.id, {
        method: 'User-entered layered-earth model',
        layers: clean,
        inversionSoftware: software.trim() || null,
        rmsErrorPercent: rmsValue,
        notes: notes.trim(),
        interpretedAt: new Date().toISOString(),
        automaticInversionPerformedInApp: false,
        interpretationStatus: 'Layer model recorded; independently review against field data and borehole control'
      });
      notify('Layer interpretation saved against ' + (selected.stationId || 'the selected sounding') + '.', 'success');
      await onSaved();
    } catch (error) {
      notify('Interpretation not saved: ' + error.message, 'error');
    }
  }

  return <section style={box}>
    <h2>VES layer interpretation</h2>
    <p className="muted">Record a layered-earth model interpreted from a recognised VES inversion/interpretation workflow. The app calculates cumulative interface depths and checks the entered values; it does not yet run an automatic 1D inversion.</p>
    {!records.length ? <p className="notice">Save a VES sounding with at least two readings before starting an interpretation.</p> : <>
      <label>VES sounding
        <select style={field} value={selected?.id || ''} onChange={event => setSelectedId(event.target.value)}>
          {records.map(record => <option key={record.id} value={record.id}>{record.stationId || 'Unlabelled sounding'} — {(record.readings || []).length} readings</option>)}
        </select>
      </label>
      {selected && <>
        <p className="notice">Preliminary apparent-curve trend: <strong>{curve?.label || 'Insufficient data'}</strong>. {curve?.description || 'At least three valid readings are required.'} This is a curve-shape description, not a unique geological interpretation.</p>
        <h3>Layer model</h3>
        <p className="muted">Enter one row per layer. Enter thickness for every layer except the last (assumed to extend downward as a half-space). Resistivity is in Ωm; thickness and interface depth are in metres.</p>
        {layers.map((layer, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end', borderTop: '1px solid #e2e8f0', padding: '10px 0' }}>
          <label>Layer {index + 1} resistivity (Ωm)
            <input style={field} type="number" min="0" step="any" value={layer.resistivity} onChange={event => updateLayer(index, 'resistivity', event.target.value)} />
          </label>
          <label>{index === layers.length - 1 ? 'Last layer thickness' : 'Thickness (m)'}
            <input style={field} type="number" min="0" step="any" placeholder={index === layers.length - 1 ? 'Half-space' : 'Required'} disabled={index === layers.length - 1} value={index === layers.length - 1 ? '' : layer.thickness} onChange={event => updateLayer(index, 'thickness', event.target.value)} />
          </label>
          <button type="button" disabled={layers.length <= 2} onClick={() => setLayers(old => old.filter((_, i) => i !== index))}>Remove</button>
          {preview?.[index] && <p className="muted" style={{ gridColumn: '1 / -1', margin: 0 }}>Interface depth: {preview[index].bottomDepth === null ? 'Half-space' : preview[index].bottomDepth.toFixed(2) + ' m'}</p>}
        </div>)}
        <button type="button" onClick={() => setLayers(old => [...old.slice(0, -1), { resistivity: '', thickness: '' }, { resistivity: '', thickness: '' }])}>Add layer</button>
        <h3>Interpretation / inversion provenance</h3>
        <div className="form-grid">
          <label>Inversion software and version (if used)
            <input style={field} value={software} onChange={event => setSoftware(event.target.value)} placeholder="e.g. IPI2Win / version" />
          </label>
          <label>Inversion RMS error (%)
            <input style={field} type="number" min="0" step="any" value={rms} onChange={event => setRms(event.target.value)} placeholder="Leave blank if unavailable" />
          </label>
          <label className="span-two">Geological notes / borehole control
            <textarea style={field} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Record the basis for lithology or aquifer assignment; avoid inferring lithology from resistivity alone." />
          </label>
        </div>
        {preview && <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <h3>Calculated layer summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th align="left">Layer</th><th align="right">Resistivity (Ωm)</th><th align="right">Thickness (m)</th><th align="right">Bottom depth (m)</th></tr></thead>
            <tbody>{preview.map(layer => <tr key={layer.layer}><td>{layer.layer}</td><td align="right">{layer.resistivity.toFixed(2)}</td><td align="right">{layer.thickness === null ? 'Half-space' : layer.thickness.toFixed(2)}</td><td align="right">{layer.bottomDepth === null ? '—' : layer.bottomDepth.toFixed(2)}</td></tr>)}</tbody>
          </table>
        </div>}
        <p className="muted">Lithology and aquifer status should only be assigned using local geological knowledge, borehole logs, hydrogeochemistry and other supporting evidence. Low resistivity alone does not prove contamination.</p>
        <button type="button" className="primary" onClick={saveInterpretation}>Save layer interpretation</button>
        {selected.interpretation && <p className="notice">A layer model is already saved for this sounding. Saving again will replace that interpretation with the entries above.</p>}
      </>}
    </>}
  </section>;
}
