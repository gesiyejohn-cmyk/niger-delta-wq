import { PARAMETER_REGISTRY } from './parameters.js';

function isNumericInput(value) {
  return (typeof value === 'number'
    || (typeof value === 'string' && value.trim() !== ''))
    && Number.isFinite(Number(value));
}

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
    if (!isNumericInput(rawValue)) {
      throw new Error(`${definition.name}: measurement must be a finite number. Correct the value or leave it blank only when it was not measured.`);
    }
    const value = Number(rawValue);

    const base = definition[standard];
    const override = overrides?.[id]?.[standard];
    const objective = base || override ? { ...(base || {}) } : null;
    if (override && objective) {
      if (typeof override !== 'object' || Array.isArray(override)) {
        throw new Error(`${definition.name}: custom standard limits must be an object.`);
      }
      for (const bound of ['min', 'max']) {
        const raw = override[bound];
        // Empty form fields mean "use the configured objective", not zero.
        if (raw == null || (typeof raw === 'string' && raw.trim() === '')) continue;
        const parsed = isNumericInput(raw) ? Number(raw) : Number.NaN;
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`${definition.name}: custom ${bound} objective must be a finite, non-negative number.`);
        }
        objective[bound] = parsed;
      }
    }
    if (!objective || (objective.min == null && objective.max == null)) continue;
    for (const bound of ['min', 'max']) {
      if (objective[bound] != null
        && (!isNumericInput(objective[bound]) || Number(objective[bound]) < 0)) {
        throw new Error(`${definition.name}: configured ${bound} objective is invalid.`);
      }
    }
    if (objective.min != null && objective.max != null
      && Number(objective.min) >= Number(objective.max)) {
      throw new Error(`${definition.name}: lower objective must be below the upper objective.`);
    }

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
    disclaimer: 'Screening index only. Results depend on the configured objectives and measured parameters. With one observation per parameter, F1 and F2 necessarily have the same tested-variable and failed-test counts; use a representative multi-sample dataset for temporal water-quality assessment. A WQI score does not establish potability or regulatory compliance. Verify each parameter against the applicable, current standard and review microbiological and other required tests.',
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
  // A nonblank malformed measurement is a data-quality error, even when its
  // limits have not yet been configured. Never silently count it as missing.
  for (const item of measurements) {
    if (!item || !hasValue(item.value)) continue;
    if (!isNumericInput(item.value)) {
      throw new Error((item.label || item.key || 'Parameter') + ': measurement must be a finite number or left blank only when it was not measured.');
    }
  }
  const usable = measurements.filter(item => item && hasValue(item.value)
    && hasValue(item.ideal)
    && (hasValue(item.minStandard) || hasValue(item.maxStandard) || hasValue(item.standard)));
  if (usable.length < 2) throw new Error('At least two measured parameters with entered limits and ideal values are required.');

  const rows = usable.map(item => {
    const value = isNumericInput(item.value) ? Number(item.value) : Number.NaN;
    const ideal = isNumericInput(item.ideal) ? Number(item.ideal) : Number.NaN;
    const minRaw = hasValue(item.minStandard) ? item.minStandard : null;
    const maxRaw = hasValue(item.maxStandard) ? item.maxStandard : item.standard;
    const minStandard = minRaw == null ? null : (isNumericInput(minRaw) ? Number(minRaw) : Number.NaN);
    const maxStandard = hasValue(maxRaw) ? (isNumericInput(maxRaw) ? Number(maxRaw) : Number.NaN) : null;
    const weightRaw = hasValue(item.weightStandard)
      ? item.weightStandard
      : (maxStandard ?? minStandard);
    const weightStandard = isNumericInput(weightRaw) ? Number(weightRaw) : Number.NaN;

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
    let qualityRating;
    if (minStandard != null && maxStandard == null) {
      // A lower-only objective penalizes values below the ideal; values at
      // or above the ideal are not failures of that one-sided objective.
      applicableLimit = minStandard;
      const denominator = Math.abs(ideal - minStandard);
      qualityRating = value >= ideal ? 0
        : denominator === 0 ? Number.POSITIVE_INFINITY
          : 100 * Math.abs(value - ideal) / denominator;
    } else if (maxStandard != null && minStandard == null) {
      // An upper-only objective penalizes values above the ideal; values at
      // or below the ideal are not failures of that one-sided objective.
      applicableLimit = maxStandard;
      const denominator = Math.abs(maxStandard - ideal);
      qualityRating = value <= ideal ? 0
        : denominator === 0 ? Number.POSITIVE_INFINITY
          : 100 * Math.abs(value - ideal) / denominator;
    } else {
      if (value > ideal) applicableLimit = maxStandard;
      else if (value < ideal) applicableLimit = minStandard;
      else applicableLimit = ideal;
      const denominator = Math.abs(applicableLimit - ideal);
      qualityRating = denominator === 0
        ? (value === ideal ? 0 : Number.POSITIVE_INFINITY)
        : 100 * Math.abs(value - ideal) / denominator;
    }
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

/**
 * Dataset-level CCME WQI for repeated samples from a monitoring programme.
 * F1 is based on variables failing at least once; F2 is based on all valid
 * parameter observations (tests). Missing observations are excluded.
 */
function calculateDatasetForStandard(samples, standard, overrides) {
  const usedParams = new Set();
  const failedVariables = new Set();
  const failures = [];
  let tests = 0;
  let failedTests = 0;
  let sumExcursions = 0;

  for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
    const sample = samples[sampleIndex];
    if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
      throw new Error(`Sample ${sampleIndex + 1} must be an object.`);
    }
    const sampleLabel = sample.sampleCode || sample.id || `sample ${sampleIndex + 1}`;

    for (const [id, definition] of Object.entries(PARAMETER_REGISTRY)) {
      const rawValue = sample?.[id];
      if (rawValue == null || (typeof rawValue === 'string' && rawValue.trim() === '')) continue;
      if (!isNumericInput(rawValue)) {
        throw new Error(`${sampleLabel} — ${definition.name}: measurement must be a finite number.`);
      }
      const value = Number(rawValue);

      const base = definition[standard];
      const override = overrides?.[id]?.[standard];
      const objective = base || override ? { ...(base || {}) } : null;
      if (override && objective) {
        if (typeof override !== 'object' || Array.isArray(override)) {
          throw new Error(`${definition.name}: custom standard limits must be an object.`);
        }
        for (const bound of ['min', 'max']) {
          const raw = override[bound];
          if (raw == null || (typeof raw === 'string' && raw.trim() === '')) continue;
          const parsed = isNumericInput(raw) ? Number(raw) : Number.NaN;
          if (!Number.isFinite(parsed) || parsed < 0) {
            throw new Error(`${definition.name}: custom ${bound} objective must be a finite, non-negative number.`);
          }
          objective[bound] = parsed;
        }
      }
      if (!objective || (objective.min == null && objective.max == null)) continue;
      for (const bound of ['min', 'max']) {
        if (objective[bound] != null
          && (!isNumericInput(objective[bound]) || Number(objective[bound]) < 0)) {
          throw new Error(`${definition.name}: configured ${bound} objective is invalid.`);
        }
      }
      if (objective.min != null && objective.max != null
        && Number(objective.min) >= Number(objective.max)) {
        throw new Error(`${definition.name}: lower objective must be below the upper objective.`);
      }

      tests += 1;
      usedParams.add(id);
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
        failedVariables.add(id);
        sumExcursions += excursion;
        failures.push({ id, name: definition.name, value, objective, excursion, sampleIndex, sampleLabel });
      }
    }
  }

  if (!tests) {
    return { wqi: null, status: 'No data', F1: null, F2: null, F3: null,
      samples: samples.length, tests: 0, testedVariables: 0, failedTests: 0,
      usedParams: [], failures };
  }

  const F1 = failedVariables.size / usedParams.size * 100;
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
    wqi, status: classifyWQI(wqi), F1: round(F1, 1), F2: round(F2, 1),
    F3: round(F3, 1), samples: samples.length, tests,
    testedVariables: usedParams.size, failedTests, usedParams: [...usedParams], failures
  };
}

/** Calculate CCME WQI over repeated samples rather than a single snapshot. */
export function computeDualWQIDataset(samples, { overrides = {} } = {}) {
  if (!Array.isArray(samples)) throw new Error('Supply a list of water-quality samples.');
  const who = calculateDatasetForStandard(samples, 'who', overrides);
  const son = calculateDatasetForStandard(samples, 'son', overrides);
  return {
    method: 'CCME WQI (multi-sample dataset)',
    who,
    son,
    comparison: {
      bothStandardsHaveData: who.wqi != null && son.wqi != null,
      whoScoreMinusSonScore: who.wqi != null && son.wqi != null
        ? round(who.wqi - son.wqi, 1)
        : null,
    },
    disclaimer: 'Dataset-level screening index. F1 measures the proportion of tested variables that failed at least once; F2 measures the proportion of individual tests that failed. Missing measurements are excluded. Use representative samples from the same monitoring objective, location or defined assessment area and period, with consistent methods and units. A WQI score does not establish potability or regulatory compliance; verify each parameter against the applicable current standard and review microbiological and other required tests.'
  };
}
