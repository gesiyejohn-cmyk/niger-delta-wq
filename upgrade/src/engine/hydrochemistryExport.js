const csvCell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';

export function buildHydrochemistryCSV(sample, ions, balance, definitions) {
  if (!sample || !ions || !balance || !definitions) {
    throw new Error('A sample, measured ions, charge balance and ion definitions are required.');
  }
  const header = [
    'record_type', 'sample_code', 'station', 'date', 'ion', 'ion_type',
    'concentration_mg_L', 'concentration_meq_L', 'cation_total_meq_L',
    'anion_total_meq_L', 'charge_balance_error_percent', 'screening_status'
  ];
  const rows = [header];
  for (const [ion, definition] of Object.entries(definitions)) {
    rows.push([
      'measured_ion', sample.sampleCode, sample.stationName, sample.collectionDate,
      ion, definition.type, ions[ion] ?? '', balance.meq?.[ion] ?? '',
      '', '', '', ''
    ]);
  }
  rows.push([
    'charge_balance_totals', sample.sampleCode, sample.stationName,
    sample.collectionDate, '', '', '', '', balance.cationTotal,
    balance.anionTotal, balance.errorPercent ?? '', balance.status
  ]);
  return rows.map(row => row.map(csvCell).join(',')).join('\\r\\n');
}
