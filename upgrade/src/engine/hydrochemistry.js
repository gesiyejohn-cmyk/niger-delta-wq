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

const measured = value => value !== null && value !== undefined &&
  !(typeof value === 'string' && value.trim() === '') &&
  Number.isFinite(Number(value));

export function mgLToMeqL(ion, concentration) {
  const definition = ION_DEFINITIONS[ion];
  if (!definition) throw new Error('Unsupported ion: ' + ion);
  if (!measured(concentration) || Number(concentration) < 0) {
    throw new Error(ion + ' concentration must be a measured, non-negative mg/L value.');
  }
  return Number(concentration) * definition.charge / definition.molarMass;
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
  const groups = {
    cations: { Ca: meq.Ca, Mg: meq.Mg, NaK: (meq.Na ?? 0) + (meq.K ?? 0) },
    anions: { Cl: meq.Cl, SO4: meq.SO4, HCO3CO3: (meq.HCO3 ?? 0) + (meq.CO3 ?? 0) }
  };
  const normalize = (group, keys) => {
    const available = keys.filter(key => {
      if (key === 'NaK') return meq.Na !== null || meq.K !== null;
      if (key === 'HCO3CO3') return meq.HCO3 !== null || meq.CO3 !== null;
      return group[key] !== null;
    });
    const total = available.reduce((sum, key) => sum + group[key], 0);
    if (!available.length || total <= 0) return null;
    return Object.fromEntries(available.map(key => [key, 100 * group[key] / total]));
  };
  return {
    cations: normalize(groups.cations, ['Ca', 'Mg', 'NaK']),
    anions: normalize(groups.anions, ['Cl', 'SO4', 'HCO3CO3']),
    meqL: meq
  };
}
