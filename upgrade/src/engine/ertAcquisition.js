const isFiniteMeasurement = value => value != null
  && !(typeof value === 'string' && value.trim() === '')
  && typeof value !== 'boolean'
  && typeof value !== 'object'
  && Number.isFinite(Number(value));

const ELECTRODE_KEYS = ['A', 'B', 'M', 'N'];
const ARRAY_TYPES = ['Wenner', 'Schlumberger', 'Dipole-dipole', 'Custom'];

export function calculateERTGeometricFactor(electrodes) {
  if (!electrodes || typeof electrodes !== 'object') {
    throw new Error('Provide positions for current electrodes A/B and potential electrodes M/N.');
  }
  const positions = {};
  for (const key of ELECTRODE_KEYS) {
    if (!isFiniteMeasurement(electrodes[key])) {
      throw new Error('Electrode ' + key + ' must have a finite position in metres.');
    }
    positions[key] = Number(electrodes[key]);
  }
  if (new Set(Object.values(positions)).size !== ELECTRODE_KEYS.length) {
    throw new Error('ERT electrodes A, B, M and N must occupy distinct positions.');
  }

  const distance = (left, right) => Math.abs(positions[left] - positions[right]);
  const denominator = 1 / distance('A', 'M')
    - 1 / distance('A', 'N')
    - 1 / distance('B', 'M')
    + 1 / distance('B', 'N');
  if (!Number.isFinite(denominator) || Math.abs(denominator) < Number.EPSILON) {
    throw new Error('Electrode geometry produces an undefined geometric factor.');
  }
  const factor = 2 * Math.PI / Math.abs(denominator);
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new Error('ERT geometric factor is outside the supported numeric range.');
  }
  return factor;
}

export function calculateERTMeasurement(reading) {
  if (!reading || typeof reading !== 'object') {
    throw new Error('Provide an ERT field measurement.');
  }
  const array = reading.array || 'Custom';
  if (!ARRAY_TYPES.includes(array)) throw new Error('Unsupported ERT array configuration.');

  let signedResistance;
  if (isFiniteMeasurement(reading.resistanceOhm)) {
    signedResistance = Number(reading.resistanceOhm);
  } else {
    if (!isFiniteMeasurement(reading.voltageMv) || !isFiniteMeasurement(reading.currentMa)) {
      throw new Error('Enter resistance in ohms, or measured voltage in mV and current in mA.');
    }
    const voltage = Number(reading.voltageMv);
    const current = Number(reading.currentMa);
    if (current === 0) throw new Error('Measured current must not be zero.');
    signedResistance = voltage / current;
  }
  if (!Number.isFinite(signedResistance) || signedResistance === 0) {
    throw new Error('Measured transfer resistance must be finite and non-zero.');
  }

  const geometricFactor = calculateERTGeometricFactor(reading.electrodes);
  const apparentResistivity = geometricFactor * Math.abs(signedResistance);
  if (!Number.isFinite(apparentResistivity) || apparentResistivity <= 0) {
    throw new Error('Calculated apparent resistivity is outside the supported numeric range.');
  }

  return {
    ...reading,
    array,
    electrodes: Object.fromEntries(ELECTRODE_KEYS.map(key => [key, Number(reading.electrodes[key])])),
    signedResistanceOhm: signedResistance,
    geometricFactor,
    apparentResistivity,
    polarity: Math.sign(signedResistance),
    calculation: 'general-collinear-four-electrode-geometric-factor',
    inversionPerformed: false
  };
}

export function validateERTMeasurements(readings) {
  if (!Array.isArray(readings) || readings.length === 0) {
    throw new Error('Enter at least one complete ERT field measurement.');
  }
  return readings.map((reading, index) => {
    try {
      return calculateERTMeasurement(reading);
    } catch (error) {
      throw new Error('ERT reading ' + (index + 1) + ': ' + error.message);
    }
  });
}
