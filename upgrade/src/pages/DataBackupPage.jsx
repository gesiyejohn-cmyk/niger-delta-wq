import { useState } from 'react';
import { createDatabaseBackup, restoreDatabaseBackup, validateDatabaseBackup } from '../storage/backup.js';

const panel = { background: '#fff', border: '1px solid #dbe3ea', borderRadius: 12, padding: 16, marginBottom: 16 };
const button = { padding: '10px 14px', borderRadius: 7, border: '1px solid #cbd5e1', cursor: 'pointer' };

export default function DataBackupPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState('merge');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function downloadBackup() {
    setBusy(true); setError(''); setMessage('');
    try {
      const backup = await createDatabaseBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'niger-delta-wq-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      const count = Object.values(backup.stores).reduce((sum, records) => sum + records.length, 0);
      setMessage('Backup file created with ' + count + ' records across ' + Object.keys(backup.stores).length + ' data stores.');
    } catch (e) { setError('Backup failed: ' + e.message); }
    finally { setBusy(false); }
  }

  async function selectBackup(nextFile) {
    setFile(nextFile); setPreview(null); setError(''); setMessage('');
    if (!nextFile) return;
    try {
      const parsed = JSON.parse(await nextFile.text());
      validateDatabaseBackup(parsed);
      const counts = Object.fromEntries(Object.entries(parsed.stores).map(([name, records]) => [name, records.length]));
      setPreview({ exportedAt: parsed.exportedAt, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) });
    } catch (e) { setError('Cannot use this backup: ' + e.message); }
  }

  async function restore() {
    if (!file || !preview) return;
    if (mode === 'replace' && !window.confirm('Replace mode clears current records in the backup stores before restoring. This can overwrite your current app data. Continue only if you have downloaded a fresh backup of this device.')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const parsed = JSON.parse(await file.text());
      const result = await restoreDatabaseBackup(parsed, mode);
      setMessage('Restore completed: ' + result.restored + ' records restored; ' + result.skipped + ' existing records skipped (' + result.mode + ' mode).');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <div className="page">
    <p className="eyebrow">DATA SAFETY</p>
    <h1>Backup &amp; restore</h1>
    <p className="muted">Create a portable copy of water-quality samples, settings, sync queue, raw VES readings, separate VES interpretations, ERT models, original ERT CSV imports and vulnerability assessments. Keep a copy outside this device before updating or changing devices.</p>
    {message && <p className="notice" role="status">{message}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    <section style={panel}>
      <h2>Download a full backup</h2>
      <p>Exports all supported local data stores to a JSON file. The export does not send your records to a server.</p>
      <button style={button} type="button" disabled={busy} onClick={downloadBackup}>{busy ? 'Working…' : 'Download full backup'}</button>
    </section>
    <section style={panel}>
      <h2>Restore from backup</h2>
      <label>Select a Niger Delta WQ backup file
        <input type="file" accept=".json,application/json" onChange={event => selectBackup(event.target.files?.[0] || null)} />
      </label>
      {preview && <div className="notice">
        <strong>Backup verified</strong>
        <p>Exported: {preview.exportedAt || 'Date not recorded'} · {preview.total} records</p>
        {Object.entries(preview.counts).map(([name, count]) => <div key={name}>{name}: {count}</div>)}
      </div>}
      <label>Restore mode
        <select value={mode} onChange={event => setMode(event.target.value)}>
          <option value="merge">Merge (keep existing records; skip matching IDs)</option>
          <option value="replace">Replace current records (requires confirmation)</option>
        </select>
      </label>
      <p className="muted">Merge is the safer default. Replace clears the current contents of the backup stores before importing. Download a fresh backup first.</p>
      <button style={button} type="button" disabled={busy || !preview} onClick={restore}>{busy ? 'Working…' : 'Restore backup'}</button>
    </section>
  </div>;
}
