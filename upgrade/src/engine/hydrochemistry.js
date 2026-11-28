// Hydrochemistry calculations use measured concentrations only. Blank or null
// values are unmeasured and are never silently converted into zero observations.
export const ION_DEFINITIONS = Object.freeze({
  Ca: { name: 'Calcium', type: 'cation', molarMass: 40.078, charge: 2 },
  Mg: { name: 'Magnesium', type: 'cation', molarMass: 24.305, charge: 2 },
  Na: { name: 'Sodium', type: 'cation', molarMass: 22.989769, charge: 1 },
  K: { name: 'Potassium', type: 'cation', molarMass: 39.0983, charge: 1 },
  Cl: { name: 'Chloride', type: 'anion', molarMass: 35.45, charge: 1 },
  SO4: { name: 'Sulphate', type: 'anion', molarMass: 96.06, charge: 2 },
  HCO3: { name: 'Bicarbonate', type: 'anion', molarMass: 61.0168, charge: 1 },
  CO3: { name: 'Carbonate', type: 'anion', molarMass: 60.0089, charge: 2 },
  NO3: { name: 'Nitrate', type: 'anion', molarMass: 62.0049, charge: 1 },
  F: { name: 'Fluoride', type: 'anion', molarMass: 18.9984, charge: 1 }
});

const measured = value => (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)));

export function mgLToMeqL(ion, concentration) {
  const definition = ION_DEFINITIONS[ion];
  if (!definition) throw new Error('Unsupported ion: ' + ion);
  if (!measured(concentration) || Number(concentration) < 0) {
    throw new Error(ion + ' concentration must be a measured, non-negative mg/L value.');
  }
  const meqL = Number(concentration) * definition.charge / definition.molarMass;
  if (!Number.isFinite(meqL)) {
    throw new Error(ion + ' concentration is outside the supported numeric range for mg/L to meq/L conversion.');
  }
  return meqL;
}

export function convertIonConcentrations(sample) {
  const result = {};
  for (const ion of Object.keys(ION_DEFINITIONS)) {
    const value = sample?.[ion];
    result[ion] = measured(value) ? mgLToMeqL(ion, value) : null;
  }
  return result;
}

export function calculateChargeBalance(sample) {
  const meq = convertIonConcentrations(sample);
  const cations = Object.keys(ION_DEFINITIONS).filter(k => ION_DEFINITIONS[k].type === 'cation' && meq[k] !== null);
  const anions = Object.keys(ION_DEFINITIONS).filter(k => ION_DEFINITIONS[k].type === 'anion' && meq[k] !== null);
  const cationTotal = cations.reduce((sum, ion) => sum + meq[ion], 0);
  const anionTotal = anions.reduce((sum, ion) => sum + meq[ion], 0);
  if (!cations.length || !anions.length || cationTotal + anionTotal === 0) {
    return { cationTotal, anionTotal, errorPercent: null, status: 'Insufficient measured ions', meq };
  }
  const errorPercent = 100 * (cationTotal - anionTotal) / (cationTotal + anionTotal);
  return {
    cationTotal, anionTotal, errorPercent, meq,
    status: Math.abs(errorPercent) <= 5 ? 'Within ±5% screening tolerance' : 'Outside ±5% screening tolerance'
  };
}

export function calculatePiperPercentages(sample) {
  const meq = convertIonConcentrations(sample);
  // Each Piper vertex is a measured analytical group. Because this registry
  // stores Na/K and HCO3/CO3 separately, both components must be measured;
  // an unmeasured component must never be silently treated as zero.
  const groups = {
    cations: { Ca: meq.Ca, Mg: meq.Mg, NaK: meq.Na !== null && meq.K !== null ? meq.Na + meq.K : null },
    anions: { Cl: meq.Cl, SO4: meq.SO4, HCO3CO3: meq.HCO3 !== null && meq.CO3 !== null ? meq.HCO3 + meq.CO3 : null }
  };
  const normalize = (group, keys) => {
    if (keys.some(key => group[key] === null)) return null;
    const total = keys.reduce((sum, key) => sum + group[key], 0);
    if (total <= 0) return null;
    return Object.fromEntries(keys.map(key => [key, 100 * group[key] / total]));
  };
  return {
    cations: normalize(groups.cations, ['Ca', 'Mg', 'NaK']),
    anions: normalize(groups.anions, ['Cl', 'SO4', 'HCO3CO3']),
    meqL: meq
  };
}

const PIPER_HEIGHT = Math.sqrt(3) / 2;
const PIPER_ANION_OFFSET = 1.2;

function trianglePoint(percentages, vertices) {
  if (!percentages) return null;
  const entries = Object.entries(vertices);
  if (entries.some(([key]) => !Number.isFinite(percentages[key]))) return null;
  const total = entries.reduce((sum, [key]) => sum + percentages[key], 0);
  if (Math.abs(total - 100) > 1e-6) return null;
  const fractions = Object.fromEntries(entries.map(([key]) => [key, percentages[key] / 100]));
  return {
    x: entries.reduce((sum, [key]) => sum + fractions[key] * vertices[key][0], 0),
    y: entries.reduce((sum, [key]) => sum + fractions[key] * vertices[key][1], 0)
  };
}

function dominantGroup(percentages) {
  if (!percentages) return { key: null, status: 'insufficient-data' };
  const ranked = Object.entries(percentages).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return { key: null, status: 'insufficient-data' };
  if (ranked[0][1] < 50) return { key: null, status: 'mixed' };
  if (ranked[1] && 50 - ranked[1][1] <= 10) return { key: null, status: 'mixed-boundary' };
  return { key: ranked[0][0], status: 'dominant' };
}

// Coordinates use a unit equilateral triangle (height sqrt(3)/2), with
// Ca/Mg/Na+K and HCO3+CO3/SO4/Cl vertices in conventional Piper order.
// The central diamond is the intersection of the two triangle projection
// lines; the 0.1-unit side gap is represented by the 1.2-unit anion offset.
export function calculatePiperDiagram(sample) {
  const percentages = calculatePiperPercentages(sample);
  const cations = trianglePoint(percentages.cations, {
    Ca: [0, 0], Mg: [0.5, PIPER_HEIGHT], NaK: [1, 0]
  });
  const anions = trianglePoint(percentages.anions, {
    HCO3CO3: [PIPER_ANION_OFFSET, 0],
    SO4: [PIPER_ANION_OFFSET + 0.5, PIPER_HEIGHT],
    Cl: [PIPER_ANION_OFFSET + 1, 0]
  });
  let diamond = null;
  if (cations && anions) {
    diamond = {
      x: (anions.x + cations.x) / 2 + (anions.y - cations.y) / (4 * PIPER_HEIGHT),
      y: (anions.y + cations.y) / 2 + PIPER_HEIGHT * (anions.x - cations.x)
    };
  }
  const cationFacies = dominantGroup(percentages.cations);
  const anionFacies = dominantGroup(percentages.anions);
  const facies = cationFacies.status === 'insufficient-data' || anionFacies.status === 'insufficient-data'
    ? 'Insufficient measured ions'
    : cationFacies.key && anionFacies.key
      ? ({ Ca: 'Ca', Mg: 'Mg', NaK: 'Na+K' }[cationFacies.key] + '–' +
         ({ HCO3CO3: 'HCO3+CO3', SO4: 'SO4', Cl: 'Cl' }[anionFacies.key]))
      : 'Mixed water type';
  return {
    ...percentages,
    coordinates: { cations, anions, diamond },
    facies: { cation: cationFacies, anion: anionFacies, label: facies }
  };
}


// Durov uses the same equivalent-percentage groups as Piper, but projects
// the cation and anion triangles into a central square. The optional pH and
// TDS panels are auxiliary measured observations, not inferred values.
export function calculateDurovDiagram(sample, auxiliary = {}) {
  const percentages = calculatePiperPercentages(sample);
  const c = percentages.cations;
  const a = percentages.anions;
  const complete = Boolean(c && a);
  const pH = measured(auxiliary.pH) && Number(auxiliary.pH) >= 0 && Number(auxiliary.pH) <= 14
    ? Number(auxiliary.pH) : null;
  const tds = measured(auxiliary.tds) && Number(auxiliary.tds) >= 0
    ? Number(auxiliary.tds) : null;
  return {
    cations: c,
    anions: a,
    coordinates: {
      // The Durov layout contains both ternary fields and their central-square
      // projection. Keep the ternary points in local unit-triangle coordinates.
      cationTriangle: trianglePoint(c, {
        Ca: [0, 0], Mg: [0.5, PIPER_HEIGHT], NaK: [1, 0]
      }),
      anionTriangle: trianglePoint(a, {
        Cl: [0, 0], SO4: [0.5, PIPER_HEIGHT], HCO3CO3: [1, 0]
      }),
      // x projects HCO3+CO3 and SO4; y projects Ca and Mg.
      square: complete ? {
        x: (a.HCO3CO3 + a.SO4 / 2) / 100,
        y: (c.Ca + c.Mg / 2) / 100
      } : null
    },
    auxiliary: { pH, tds },
    extended: Boolean(pH !== null || tds !== null),
    status: complete ? 'complete-major-ion-projection' : 'insufficient-major-ion-data'
  };
}

// Schoeller-Berkaloff is semi-logarithmic: positive meq/L values can be
// plotted on log10 scale. A measured zero is retained as nonpositive (not
// replaced with an arbitrary epsilon); an unmeasured value remains missing.
export function calculateSchoellerSeries(sample) {
  const meq = convertIonConcentrations(sample);
  // Schoeller-Berkaloff plots individual dissolved-ion concentrations.
  // Do not aggregate Na/K or HCO3/CO3: separate series preserve analytical
  // distinctions and make the plotted species explicit.
  const groups = [
    ['Ca', 'Ca', meq.Ca],
    ['Mg', 'Mg', meq.Mg],
    ['Na', 'Na', meq.Na],
    ['K', 'K', meq.K],
    ['Cl', 'Cl', meq.Cl],
    ['SO4', 'SO4', meq.SO4],
    ['HCO3', 'HCO3', meq.HCO3],
    ['CO3', 'CO3', meq.CO3],
    ['NO3', 'NO3', meq.NO3],
    ['F', 'F', meq.F]
  ];
  return groups.map(([key, label, value], index) => ({
    key, label, index, meqL: value,
    status: value === null ? 'unmeasured' : value === 0 ? 'measured-zero-not-plottable-on-log-axis' : 'plottable',
    log10MeqL: value !== null && value > 0 ? Math.log10(value) : null
  }));
}

// Gibbs diagrams use measured TDS (mg/L) on the horizontal axis and the
// conventional Na/(Na+Ca) and Cl/(Cl+HCO3) ratios on the vertical axis.
// Ratios are calculated in meq/L; incomplete analytical groups stay unavailable.
export function calculateGibbsRatios(sample, tds) {
  const meq = convertIonConcentrations(sample);
  const ratio = (numerator, denominator) => denominator > 0 ? numerator / denominator : null;
  const cationDenominator = meq.Na !== null && meq.Ca !== null ? meq.Na + meq.Ca : null;
  const anionDenominator = meq.Cl !== null && meq.HCO3 !== null ? meq.Cl + meq.HCO3 : null;
  const validTds = measured(tds) && Number(tds) > 0 ? Number(tds) : null;
  const cationRatio = cationDenominator !== null ? ratio(meq.Na, cationDenominator) : null;
  const anionRatio = anionDenominator !== null ? ratio(meq.Cl, anionDenominator) : null;
  return {
    tds: validTds,
    cation: cationRatio,
    anion: anionRatio,
    cationStatus: cationDenominator === null ? 'incomplete-measured-ion-pair' : cationRatio === null ? 'zero-total-ion-pair' : 'plottable',
    anionStatus: anionDenominator === null ? 'incomplete-measured-ion-pair' : anionRatio === null ? 'zero-total-ion-pair' : 'plottable',
    status: validTds === null ? 'missing-or-nonpositive-tds' : cationRatio === null || anionRatio === null ? 'incomplete-gibbs-ratios' : 'complete'
  };
}

// Chadha coordinates are signed equivalent-percentage differences. The x
// coordinate contrasts alkaline-earth and alkali cations; y contrasts weak
// and strong-acid anions. Every species in each denominator must be measured.
export function calculateChadhaCoordinates(sample) {
  const meq = convertIonConcentrations(sample);
  const cationKeys = ['Ca', 'Mg', 'Na', 'K'];
  const anionKeys = ['HCO3', 'CO3', 'Cl', 'SO4'];
  if (cationKeys.some(key => meq[key] === null) || anionKeys.some(key => meq[key] === null)) {
    return { x: null, y: null, status: 'insufficient-measured-major-ions' };
  }
  const alkalineEarth = meq.Ca + meq.Mg;
  const alkali = meq.Na + meq.K;
  const weakAcid = meq.HCO3 + meq.CO3;
  const strongAcid = meq.Cl + meq.SO4;
  const cationTotal = alkalineEarth + alkali;
  const anionTotal = weakAcid + strongAcid;
  if (cationTotal <= 0 || anionTotal <= 0) {
    return { x: null, y: null, status: 'zero-total-major-ion-group' };
  }
  return {
    x: 100 * (alkalineEarth - alkali) / cationTotal,
    y: 100 * (weakAcid - strongAcid) / anionTotal,
    status: 'complete'
  };
}


// The Gibbs plot uses a fixed logarithmic display domain. Values outside
// this range remain valid measurements but must not be drawn beyond the axes.
export const GIBBS_TDS_DISPLAY_RANGE = Object.freeze({ min: 1, max: 10000 });
export function isGibbsTdsWithinDisplayRange(tds) {
  return measured(tds) && Number(tds) >= GIBBS_TDS_DISPLAY_RANGE.min && Number(tds) <= GIBBS_TDS_DISPLAY_RANGE.max;
}
