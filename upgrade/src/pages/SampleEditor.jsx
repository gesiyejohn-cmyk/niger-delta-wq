import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PARAMETER_REGISTRY } from '../engine/parameters.js';
import { availableUnits, toCanonical } from '../engine/units.js';
import { saveSample, getSample } from '../storage/samples.js';
import CoordinateFields from './CoordinateFields.jsx';
import {
  buildSampleCoordinateMetadata,
  sampleCoordinateInputFromRecord
} from '../engine/sampleCoordinates.js';

const groups = [
  ['physical', 'Physical / field parameters'],
  ['cation', 'Major cations'],
  ['anion', 'Major anions'],
  ['metal', 'Metals']
];

export default function SampleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState({
    sampleCode: '',
    stationName: '',
    waterSourceType: 'borehole',
    collectionDate: new Date().toISOString().slice(0, 10),
    collector: '',
    notes: ''
  });
  const [coordinateInput, setCoordinateInput] = useState(sampleCoordinateInputFromRecord());
  const [params, setParams] = useState({});
  const [factors, setFactors] = useState({});
  const [model, setModel] = useState('DRASTIC');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getSample(id).then(sample => {
      if (!sample) return;
      const {
        parameters,
        latitude,
        longitude,
        coordinateFormat,
        coordinateOriginal,
        coordinateDatum,
        coordinateCRS,
        coordinateStorageCRS,
        latitudeHemisphere,
        longitudeHemisphere,
        ...sampleMeta
      } = sample;
      setMeta(sampleMeta);
      setCoordinateInput(sampleCoordinateInputFromRecord(sample));
      setParams(parameters || {});
      if (sample.vulnerability?.inputs) {
        setFactors(sample.vulnerability.inputs);
        setModel(sample.vulnerability.model);
      }
    });
  }, [id]);

  function changeMeta(key, value) {
    setMeta(previous => ({ ...previous, [key]: value }));
  }

  function changeParam(key, field, value) {
    setParams(previous => ({
      ...previous,
      [key]: { ...(previous[key] || {}), [field]: value }
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!meta.sampleCode.trim()) {
      setError('Sample code is required.');
      return;
    }

    const built = {};
    try {
      const coordinates = buildSampleCoordinateMetadata(coordinateInput);
      for (const [key, value] of Object.entries(params)) {
        if (value.value == null || value.value === '') continue;
        const unit = value.unit ?? availableUnits(key)[0];
        const converted = toCanonical(key, value.value, unit);
        built[key] = {
          value: Number(value.value),
          unit,
          canonical: converted.canonical,
          canonicalUnit: converted.unit
        };
      }

      if (Object.keys(built).length === 0
        && Object.values(factors).every(value => value == null || value === '')) {
        setError('Enter at least one water-quality parameter or one vulnerability factor before saving.');
        return;
      }

      const cleanMeta = { ...meta, ...coordinates, drasticModel: model };
      setBusy(true);
      const record = await saveSample({
        meta: cleanMeta,
        params: built,
        drasticFactors: Object.keys(factors).length ? { ...factors, model } : null,
        existingId: id || null
      });
      navigate('/sample/' + record.id);
    } catch (err) {
      setError(err.message || 'Could not save sample.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="page">
    <div className="page-header">
      <div>
        <p className="eyebrow">FIELD DATA CAPTURE</p>
        <h1>{id ? 'Edit sample' : 'Register a sample'}</h1>
        <p className="muted">Enter laboratory results in their reported units. Values are converted to canonical units for calculations.</p>
      </div>
    </div>
    <form className="panel form-panel" onSubmit={submit}>
      <h2>Sample information</h2>
      <div className="form-grid">
        <label>Sample code *
          <input required value={meta.sampleCode} onChange={event => changeMeta('sampleCode', event.target.value)} />
        </label>
        <label>Station / location name
          <input value={meta.stationName || ''} onChange={event => changeMeta('stationName', event.target.value)} />
        </label>
        <CoordinateFields
          value={coordinateInput}
          onChange={setCoordinateInput}
          label="Sample location coordinates"
        />
        <label>Collection date
          <input type="date" value={meta.collectionDate || ''} onChange={event => changeMeta('collectionDate', event.target.value)} />
        </label>
        <label>Collected by
          <input value={meta.collector || ''} onChange={event => changeMeta('collector', event.target.value)} />
        </label>
        <label>Water source
          <select value={meta.waterSourceType || 'borehole'} onChange={event => changeMeta('waterSourceType', event.target.value)}>
            {['borehole', 'well', 'surface water', 'river', 'stream', 'spring', 'other'].map(value =>
              <option key={value}>{value}</option>
            )}
          </select>
        </label>
        <label className="span-two">Field notes
          <textarea value={meta.notes || ''} onChange={event => changeMeta('notes', event.target.value)} />
        </label>
      </div>

      <div className="section-title">
        <h2>Water quality parameters</h2>
        <span className="muted">Leave unmeasured values blank</span>
      </div>
      {groups.map(([group, title]) =>
        <section className="parameter-section" key={group}>
          <h3>{title}</h3>
          <div className="parameter-grid">
            {Object.entries(PARAMETER_REGISTRY)
              .filter(([, config]) => config.group === group)
              .map(([key, config]) =>
                <div className="parameter-input" key={key}>
                  <label>{config.name}</label>
                  <div className="input-unit">
                    <input
                      type="number"
                      step="any"
                      value={params[key]?.value ?? ''}
                      onChange={event => changeParam(key, 'value', event.target.value)}
                      placeholder="—"
                    />
                    <select
                      value={params[key]?.unit ?? availableUnits(key)[0]}
                      onChange={event => changeParam(key, 'unit', event.target.value)}
                    >
                      {availableUnits(key).map(unit =>
                        <option key={unit} value={unit}>{unit || '—'}</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
          </div>
        </section>
      )}

      <section className="parameter-section">
        <div className="section-title">
          <h2>Groundwater vulnerability (optional)</h2>
          <select value={model} onChange={event => setModel(event.target.value)}>
            <option>DRASTIC</option>
            <option>DRAPSTIC</option>
          </select>
        </div>
        <p className="muted">Enter ratings from 1–10 using your documented rating method. Incomplete factor sets are not classified.</p>
        <div className="factor-grid">
          {(model === 'DRASTIC' ? ['D', 'R', 'A', 'S', 'T', 'I', 'C'] : ['D', 'R', 'A', 'S', 'T', 'I', 'C', 'P']).map(key =>
            <label key={key}>{key} factor
              <input
                type="number"
                min="1"
                max="10"
                step="1"
                value={factors[key] ?? ''}
                onChange={event => setFactors(previous => ({
                  ...previous,
                  [key]: event.target.value === '' ? undefined : Number(event.target.value)
                }))}
              />
            </label>
          )}
        </div>
      </section>

      {error && <p className="warn" role="alert">{error}</p>}
      <div className="actions">
        <button className="primary" disabled={busy}>
          {busy ? 'Saving…' : id ? 'Save changes' : 'Save sample'}
        </button>
        <button type="button" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  </div>;
}
