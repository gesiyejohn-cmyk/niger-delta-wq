const COLUMNS = [
  ['survey_id', record => record.surveyId, true],
  ['array', record => record.array, true],
  ['A_m', record => record.electrodes?.A],
  ['B_m', record => record.electrodes?.B],
  ['M_m', record => record.electrodes?.M],
  ['N_m', record => record.electrodes?.N],
  ['signed_resistance_ohm', record => record.signedResistanceOhm],
  ['polarity', record => record.polarity],
  ['geometric_factor_m', record => record.geometricFactor],
  ['apparent_resistivity_ohm_m', record => record.apparentResistivity],
  ['recorded_at', record => record.recordedAt, true]
];

function csvCell(value, textField = false) {
  let normalized = value == null ? '' : String(value);
  if (textField && /^[\t\r ]*[=+\-@]/.test(normalized)) normalized = "'" + normalized;
  return '"' + normalized.replaceAll('"', '""') + '"';
}

export function ertFieldReadingsToCSV(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('There are no saved ERT field readings to export.');
  }
  return [
    COLUMNS.map(([header]) => csvCell(header)).join(','),
    ...records.map(record => COLUMNS.map(([, getValue, textField]) => csvCell(getValue(record), textField)).join(','))
  ].join('\r\n');
}
