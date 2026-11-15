export function calculateWeightedArithmeticWQI(measurements) {
  if (!Array.isArray(measurements)) throw new Error('Supply a list of measured water-quality parameters.');
  const usable = measurements.filter(item => item && item.value !== '' && item.value != null && item.standard !== '' && item.standard != null && item.ideal !== '' && item.ideal != null);
  if (usable.length < 2) throw new Error('At least two measured parameters with entered standards and ideal values are required.');
  const rows = usable.map(item => {
    const value = Number(item.value), standard = Number(item.standard), ideal = Number(item.ideal);
    if (![value, standard, ideal].every(Number.isFinite) || standard <= 0 || standard === ideal) {
      throw new Error((item.label || item.key || 'Parameter') + ': measured value must be numeric; standard must be positive and different from the ideal value.');
    }
    return { ...item, value, standard, ideal, qualityRating: 100 * Math.abs(value - ideal) / Math.abs(standard - ideal), rawWeight: 1 / standard };
  });
  const weightSum = rows.reduce((sum, row) => sum + row.rawWeight, 0);
  const details = rows.map(row => ({ ...row, unitWeight: row.rawWeight / weightSum, contribution: row.qualityRating * row.rawWeight / weightSum }));
  const wqi = details.reduce((sum, row) => sum + row.contribution, 0);
  return { wqi, parameterCount: details.length, details, method: 'Weighted arithmetic water quality index', missingExcluded: measurements.length - usable.length };
}
