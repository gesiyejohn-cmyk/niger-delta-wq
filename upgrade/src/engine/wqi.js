import { PARAMETER_REGISTRY } from './parameters.js';

const round = (value, places = 2) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function classifyWQI(value) {
  if (value == null || !Number.isFinite(value)) return 'Not calculated';
  if (value >= 95) return 'Excellent';
  if (value >= 80) return 'Good';
  if (value >= 65) return 'Fair';
  if (value >= 45) return 'Marginal';
  return 'Poor';
}

/**
 * CCME WQI implementation. Inputs must be in the canonical units used by
 * PARAMETER_REGISTRY. Only parameters with configured objectives are included.
 * F1 = failed variables / variables tested; F2 = failed tests / tests;
 * F3 = normalized sum of excursions, scaled to 0..100.
 */
function calculateForStandard(sample, standard, overrides) {
  const usedParams = [];
  const failures = [];
  let failedTests = 0;
  let sumExcursions = 0;

  for (const [id, definition] of Object.entries(PARAMETER_REGISTRY)) {
    const rawValue = sample?.[id];
    if (rawValue == null || (typeof rawValue === 'string' && rawValue.trim() === '')) continue;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) continue;

    const base = definition[standard];
    const override = overrides?.[id]?.[standard];
    const objective = base || override ? { ...(base || {}) } : null;
    if (override && objective) {
      for (const bound of ['min', 'max']) {
        if (override[bound] != null) objective[bound] = Number(override[bound]);
      }
    }
    if (!objective || (objective.min == null && objective.max == null)) continue;

    usedParams.push(id);
    let excursion = 0;
    if (objective.min != null && value < objective.min) {
      excursion = value <= 0 ? Number.POSITIVE_INFINITY : objective.min / value - 1;
    }
    if (objective.max != null && value > objective.max) {
      excursion = Math.max(excursion, objective.max <= 0
        ? Number.POSITIVE_INFINITY
        : value / objective.max - 1);
    }

    if (excursion > 0) {
      failedTests += 1;
      sumExcursions += excursion;
      failures.push({ id, name: definition.name, value, objective, excursion });
    }
  }

  const tests = usedParams.length;
  if (!tests) {
    return { wqi: null, status: 'No data', F1: null, F2: null, F3: null,
      tests: 0, failedTests: 0, usedParams, failures };
  }

  const failedVariables = new Set(failures.map(item => item.id)).size;
  const F1 = failedVariables / tests * 100;
  const F2 = failedTests / tests * 100;
  const normalizedSum = sumExcursions / tests;
  const F3 = normalizedSum === 0
    ? 0
    : Number.isFinite(normalizedSum)
      ? normalizedSum / (0.01 * normalizedSum + 0.01)
      : 100;
  const rawWqi = 100 - Math.sqrt(F1 ** 2 + F2 ** 2 + F3 ** 2) / Math.sqrt(3);
  const wqi = round(Math.max(0, Math.min(100, rawWqi)), 1);

  return {
    wqi,
    status: classifyWQI(wqi),
    F1: round(F1, 1),
    F2: round(F2, 1),
    F3: round(F3, 1),
    tests,
    failedTests,
    usedParams,
    failures,
  };
}

export function computeDualWQI(sample, { overrides = {} } = {}) {
  const who = calculateForStandard(sample, 'who', overrides);
  const son = calculateForStandard(sample, 'son', overrides);
  return {
    method: 'CCME WQI (configured objectives)',
    who,
    son,
    comparison: {
      bothStandardsHaveData: who.wqi != null && son.wqi != null,
      whoScoreMinusSonScore: who.wqi != null && son.wqi != null
        ? round(who.wqi - son.wqi, 1)
        : null,
    },
    disclaimer: 'Screening index only. Results depend on the configured objectives and measured parameters. A WQI score does not establish potability or regulatory compliance. Verify each parameter against the applicable, current standard and review microbiological and other required tests.',
  };
}

/**
 * Configurable weighted-arithmetic WQI.
 *
 * minStandard and maxStandard define the acceptable interval. Qi is measured
 * against the applicable boundary in the direction of departure from the
 * ideal value. weightStandard is the single permissible-value reference used
 * for Wi = 1 / weightStandard; when omitted, the upper bound (or the only
 * supplied bound) is used. The legacy "standard" field remains supported as
 * an upper-bound/weight reference for existing callers.
 */
export function calculateWeightedArithmeticWQI(measurements) {
  if (!Array.isArray(measurements)) throw new Error('Supply a list of measured water-quality parameters.');
  const hasValue = value => value != null && !(typeof value === 'string' && value.trim() === '');
  const usable = measurements.filter(item => item && hasValue(item.value)
    && hasValue(item.ideal)
    && (hasValue(item.minStandard) || hasValue(item.maxStandard) || hasValue(item.standard)));
  if (usable.length < 2) throw new Error('At least two measured parameters with entered limits and ideal values are required.');

  const rows = usable.map(item => {
    const value = Number(item.value);
    const ideal = Number(item.ideal);
    const minRaw = hasValue(item.minStandard) ? item.minStandard : null;
    const maxRaw = hasValue(item.maxStandard) ? item.maxStandard : item.standard;
    const minStandard = minRaw == null ? null : Number(minRaw);
    const maxStandard = hasValue(maxRaw) ? Number(maxRaw) : null;
    const weightRaw = hasValue(item.weightStandard)
      ? item.weightStandard
      : (maxStandard ?? minStandard);
    const weightStandard = Number(weightRaw);

    if (![value, ideal, weightStandard].every(Number.isFinite)
      || weightStandard <= 0
      || (minStandard != null && (!Number.isFinite(minStandard) || minStandard < 0))
      || (maxStandard != null && (!Number.isFinite(maxStandard) || maxStandard < 0))
      || (minStandard == null && maxStandard == null)
      || (minStandard != null && maxStandard != null && minStandard >= maxStandard)
      || (minStandard != null && ideal < minStandard)
      || (maxStandard != null && ideal > maxStandard)) {
      throw new Error((item.label || item.key || 'Parameter') + ': enter valid lower/upper limits, an ideal value within those limits, and a positive weight reference.');
    }

    let applicableLimit;
    if (value > ideal) applicableLimit = maxStandard ?? minStandard;
    else if (value < ideal) applicableLimit = minStandard ?? maxStandard;
    else applicableLimit = ideal;

    const denominator = Math.abs(applicableLimit - ideal);
    const qualityRating = denominator === 0
      ? (value === ideal ? 0 : Number.POSITIVE_INFINITY)
      : 100 * Math.abs(value - ideal) / denominator;
    const rawWeight = 1 / weightStandard;
    if (!Number.isFinite(qualityRating) || !Number.isFinite(rawWeight) || rawWeight <= 0) {
      throw new Error((item.label || item.key || 'Parameter') + ': values are outside the numeric range supported by this calculation.');
    }
    return { ...item, value, ideal, minStandard, maxStandard, weightStandard,
      applicableLimit, qualityRating, rawWeight };
  });

  const weightSum = rows.reduce((sum, row) => sum + row.rawWeight, 0);
  if (!Number.isFinite(weightSum) || weightSum <= 0) {
    throw new Error('The entered standard limits cannot produce valid relative weights.');
  }
  const details = rows.map(row => ({
    ...row,
    unitWeight: row.rawWeight / weightSum,
    contribution: row.qualityRating * row.rawWeight / weightSum
  }));
  const wqi = details.reduce((sum, row) => sum + row.contribution, 0);
  if (!Number.isFinite(wqi)) throw new Error('The calculated WQI is outside the supported numeric range. Check the measurements and standard limits.');
  return {
    wqi,
    parameterCount: details.length,
    details,
    method: 'Weighted arithmetic water quality index',
    missingExcluded: measurements.length - usable.length
  };
}
