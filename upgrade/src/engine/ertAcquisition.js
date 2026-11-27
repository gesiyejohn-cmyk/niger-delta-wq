const isFiniteMeasurement = value => value != null
  && !(typeof value === 'string' && value.trim() === '')
  && typeof value !== 'boolean'
  && typeof value !== 'object'
  && Number.isFinite(Number(value));

const ELECTRODE_KEYS = ['A', 'B', 'M', 'N'];
const ARRAY_TYPES = ['Wenner', 'Schlumberger', 'Dipole-dipole', 'Custom'];

function approximatelyEqual(left, right, tolerance = 1e-6) {
  return Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right));
}

export function validateERTArrayGeometry(array, electrodes) {
  if (!ARRAY_TYPES.includes(array)) throw new Error('Unsupported ERT array configuration.');
  const positions = {};
  for (const key of ELECTRODE_KEYS) {
    if (!isFiniteMeasurement(electrodes?.[key])) throw new Error('Electrode ' + key + ' must have a finite position in metres.');
    positions[key] = Number(electrodes[key]);
  }
  if (new Set(Object.values(positions)).size !== ELECTRODE_KEYS.length) throw new Error('ERT electrodes A, B, M and N must occupy distinct positions.');
  const ordered = Object.entries(positions).sort((left, right) => left[1] - right[1]).map(([key]) => key);
  const standard = ['A', 'M', 'N', 'B'];
  const reverse = [...standard].reverse();
  if (array === 'Wenner') {
    if (ordered.join(',') !== standard.join(',') && ordered.join(',') !== reverse.join(',')) throw new Error('Wenner geometry requires the electrode order A-M-N-B (or its reverse).');
    const spacings = ordered.slice(1).map((key, index) => Math.abs(positions[key] - positions[ordered[index]]));
    if (!approximatelyEqual(spacings[0], spacings[1]) || !approximatelyEqual(spacings[1], spacings[2])) throw new Error('Wenner geometry requires three equal adjacent-electrode spacings.');
  }
  if (array === 'Schlumberger') {
    if (ordered.join(',') !== standard.join(',') && ordered.join(',') !== reverse.join(',')) throw new Error('Schlumberger geometry requires current electrodes outside potential electrodes (A-M-N-B or reverse).');
    if (!approximatelyEqual((positions.A + positions.B) / 2, (positions.M + positions.N) / 2)) throw new Error('Schlumberger geometry requires symmetric current and potential electrode pairs.');
    if (Math.abs(positions.B - positions.A) <= Math.abs(positions.N - positions.M)) throw new Error('Schlumberger current-electrode spacing AB must exceed potential-electrode spacing MN.');
  }
  if (array === 'Dipole-dipole') {
    if (!approximatelyEqual(Math.abs(positions.B - positions.A), Math.abs(positions.N - positions.M))) throw new Error('Dipole-dipole geometry requires equal current- and potential-dipole lengths.');
    const currentMin = Math.min(positions.A, positions.B), currentMax = Math.max(positions.A, positions.B);
    const potentialMin = Math.min(positions.M, positions.N), potentialMax = Math.max(positions.M, positions.N);
    if (!(currentMax < potentialMin || potentialMax < currentMin)) throw new Error('Dipole-dipole current and potential dipoles must not overlap.');
  }
  return positions;
}

export function calculateERTGeometricFactor(electrodes) {
  if (!electrodes || typeof electrodes !== 'object') throw new Error('Provide positions for current electrodes A/B and potential electrodes M/N.');
  const positions = {};
  for (const key of ELECTRODE_KEYS) {
    if (!isFiniteMeasurement(electrodes[key])) throw new Error('Electrode ' + key + ' must have a finite position in metres.');
    positions[key] = Number(electrodes[key]);
  }
  if (new Set(Object.values(positions)).size !== ELECTRODE_KEYS.length) throw new Error('ERT electrodes A, B, M and N must occupy distinct positions.');
  const distance = (left, right) => Math.abs(positions[left] - positions[right]);
  const denominator = 1 / distance('A', 'M') - 1 / distance('A', 'N') - 1 / distance('B', 'M') + 1 / distance('B', 'N');
  if (!Number.isFinite(denominator) || Math.abs(denominator) < Number.EPSILON) throw new Error('Electrode geometry produces an undefined geometric factor.');
  const factor = 2 * Math.PI / Math.abs(denominator);
  if (!Number.isFinite(factor) || factor <= 0) throw new Error('ERT geometric factor is outside the supported numeric range.');
  return factor;
}

export function calculateERTMeasurement(reading) {
  if (!reading || typeof reading !== 'object') throw new Error('Provide an ERT field measurement.');
  const array = reading.array || 'Custom';
  if (!ARRAY_TYPES.includes(array)) throw new Error('Unsupported ERT array configuration.');
  let signedResistance;
  if (isFiniteMeasurement(reading.resistanceOhm)) signedResistance = Number(reading.resistanceOhm);
  else {
    if (!isFiniteMeasurement(reading.voltageMv) || !isFiniteMeasurement(reading.currentMa)) throw new Error('Enter resistance in ohms, or measured voltage in mV and current in mA.');
    const voltage = Number(reading.voltageMv), current = Number(reading.currentMa);
    if (current === 0) throw new Error('Measured current must not be zero.');
    signedResistance = voltage / current;
  }
  if (!Number.isFinite(signedResistance) || signedResistance === 0) throw new Error('Measured transfer resistance must be finite and non-zero.');
  const electrodes = validateERTArrayGeometry(array, reading.electrodes);
  const geometricFactor = calculateERTGeometricFactor(electrodes);
  const apparentResistivity = geometricFactor * Math.abs(signedResistance);
  if (!Number.isFinite(apparentResistivity) || apparentResistivity <= 0) throw new Error('Calculated apparent resistivity is outside the supported numeric range.');
  return { ...reading, array, electrodes, signedResistanceOhm: signedResistance, geometricFactor, apparentResistivity, polarity: Math.sign(signedResistance), calculation: 'general-collinear-four-electrode-geometric-factor', inversionPerformed: false };
}

export function validateERTMeasurements(readings) {
  if (!Array.isArray(readings) || readings.length === 0) throw new Error('Enter at least one complete ERT field measurement.');
  return readings.map((reading, index) => {
    try { return calculateERTMeasurement(reading); }
    catch (error) { throw new Error('ERT reading ' + (index + 1) + ': ' + error.message); }
  });
}

export function prepareERTFieldDrafts(drafts) {
  if (!Array.isArray(drafts)) throw new Error('ERT field readings must be provided as a list.');
  const prepared = [];
  drafts.forEach((row, index) => {
    const values = [...ELECTRODE_KEYS.map(key => row?.electrodes?.[key]), row?.resistanceOhm];
    const isBlank = values.every(value => value == null || (typeof value === 'string' && value.trim() === ''));
    if (isBlank) return;
    const isComplete = values.every(isFiniteMeasurement);
    if (!isComplete) throw new Error('ERT reading ' + (index + 1) + ' is incomplete. Complete all four electrode positions and measured resistance, or clear the row.');
    prepared.push(row);
  });
  if (!prepared.length) throw new Error('Enter at least one complete ERT field measurement.');
  return validateERTMeasurements(prepared);
}
