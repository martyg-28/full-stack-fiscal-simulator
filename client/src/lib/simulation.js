// Mirror of server/src/simulation.js. The frontend runs the projection locally
// so charts respond instantly to slider changes; the backend keeps a copy so
// the model can be unit-tested independently of the React tree.

export const baseline = {
  startYear: 2026,
  endYear: 2056,
  gdp2026: 32.0,
  debtToGdp2026: 101,
  deficitToGdp2026: 5.8,
  deficitToGdp2036: 6.7,
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function fmtPct(value) {
  return `${Number(value).toFixed(1)}%`;
}

export function fmtMoney(value) {
  return `$${Number(value).toFixed(1)}T`;
}

export function riskLabel(value) {
  if (value >= 78) return "Severe";
  if (value >= 58) return "Elevated";
  if (value >= 38) return "Watch";
  return "Low";
}

function fiscalPolicyEffect(policy, stress, year) {
  const phaseIn = clamp((year - 2026) / 8, 0.1, 1);
  const revenueGain = (policy.revenueReform / 100) * 1.65 * phaseIn;
  const discretionarySavings = (policy.discretionaryCuts / 100) * 0.85 * phaseIn;
  const healthcareSavings = (policy.healthcareEfficiency / 100) * 1.15 * clamp((year - 2026) / 12, 0.05, 1);
  const socialSecuritySavings = (policy.socialSecurityReform / 100) * 1.05 * clamp((year - 2026) / 16, 0.02, 1);
  const defenseCost = ((policy.defensePosture - 50) / 50) * 0.45 * phaseIn;
  const industrialCost = (policy.industrialPolicy / 100) * 0.32 * phaseIn;
  const climateCostNow = (policy.climateResilience / 100) * 0.22 * phaseIn;
  const climateSavingsLater = (policy.climateResilience / 100) * 0.42 * clamp((year - 2034) / 12, 0, 1);
  const implementationHaircut = clamp(
    1 - (stress.politicalPolarization / 100) * 0.35 - (stress.pacPressure / 100) * 0.2,
    0.35,
    0.95
  );
  return (
    (revenueGain + discretionarySavings + healthcareSavings + socialSecuritySavings + climateSavingsLater) *
      implementationHaircut -
    defenseCost -
    industrialCost -
    climateCostNow
  );
}

function macroShockEffect(stress, year) {
  const conflict = (stress.conflictShock / 100) * 0.45;
  const disasters = (stress.disasterShock / 100) * 0.28;
  const trade = (stress.tradeDisruption / 100) * 0.38;
  const funding = (stress.fundingPressure / 100) * 0.52;
  const lateCycleAmplifier = 1 + Math.max(0, year - 2036) * 0.018;
  return (conflict + disasters + trade + funding) * lateCycleAmplifier;
}

function baselineDeficitToGdp(year) {
  if (year <= 2036) {
    return (
      baseline.deficitToGdp2026 +
      ((baseline.deficitToGdp2036 - baseline.deficitToGdp2026) * (year - 2026)) / 10
    );
  }
  return baseline.deficitToGdp2036 + (year - 2036) * 0.09;
}

export function runProjection(policy, stress, optionsDeltaPctGdp = 0) {
  const rows = [];
  let gdp = baseline.gdp2026;
  let debt = baseline.gdp2026 * (baseline.debtToGdp2026 / 100);

  for (let year = baseline.startYear; year <= baseline.endYear; year += 1) {
    const policyEffect = fiscalPolicyEffect(policy, stress, year);
    const shockEffect = macroShockEffect(stress, year);
    const debtRatioBefore = (debt / gdp) * 100;
    const interestFeedback = debtRatioBefore > 115 ? (debtRatioBefore - 115) * 0.018 : 0;
    // optionsDeltaPctGdp uses Concord sign convention: + adds to deficit.
    const deficitToGdp = clamp(
      baselineDeficitToGdp(year) - policyEffect + shockEffect + interestFeedback + optionsDeltaPctGdp,
      1.2,
      15
    );
    const deficit = gdp * (deficitToGdp / 100);
    debt += deficit;
    const debtToGdp = (debt / gdp) * 100;
    const nominalGrowth = clamp(
      0.042 - Math.max(0, debtToGdp - 105) * 0.0009 - (stress.tradeDisruption / 100) * 0.006,
      0.018,
      0.052
    );

    rows.push({
      year,
      gdp: Number(gdp.toFixed(2)),
      debt: Number(debt.toFixed(2)),
      deficit: Number(deficit.toFixed(2)),
      deficitToGdp: Number(deficitToGdp.toFixed(2)),
      debtToGdp: Number(debtToGdp.toFixed(2)),
      policyEffect: Number(policyEffect.toFixed(2)),
      shockEffect: Number(shockEffect.toFixed(2)),
    });
    gdp *= 1 + nominalGrowth;
  }
  return rows;
}

export function passageProbability(policy, stress) {
  const pain =
    policy.revenueReform * 0.22 +
    policy.discretionaryCuts * 0.2 +
    policy.healthcareEfficiency * 0.12 +
    policy.socialSecurityReform * 0.3 +
    Math.abs(policy.defensePosture - 50) * 0.12;
  const support = stress.publicSupport * 0.45 + stress.congressionalMargin * 0.35;
  const resistance = stress.politicalPolarization * 0.35 + stress.pacPressure * 0.32 + pain * 0.28;
  return clamp(55 + support - resistance, 3, 94);
}

export function fundingStressScore(rows, stress) {
  const last = rows[rows.length - 1];
  return clamp(stress.fundingPressure * 0.45 + (last.debtToGdp - 100) * 0.5 + last.deficitToGdp * 3.2, 0, 100);
}

export function balanceScore(rows, probability, fundingStress) {
  const last = rows[rows.length - 1];
  return clamp(
    100 - (last.debtToGdp - 80) * 0.38 - last.deficitToGdp * 4 + probability * 0.15 - fundingStress * 0.15,
    0,
    100
  );
}

export function applyRealDataToStress(manualStress, metrics = {}) {
  const next = { ...manualStress };
  if (Number.isFinite(metrics.debtTrillions)) {
    const debtToGdpProxy = (metrics.debtTrillions / baseline.gdp2026) * 100;
    next.fundingPressure = clamp(next.fundingPressure + Math.max(0, debtToGdpProxy - 105) * 0.32, 0, 100);
  }
  if (Number.isFinite(metrics.avgTreasuryRate)) {
    next.fundingPressure = clamp(next.fundingPressure + Math.max(0, metrics.avgTreasuryRate - 3.25) * 5.5, 0, 100);
  }
  if (Number.isFinite(metrics.cpiInflationYoY)) {
    next.tradeDisruption = clamp(next.tradeDisruption + Math.max(0, metrics.cpiInflationYoY - 2.2) * 3.5, 0, 100);
    next.fundingPressure = clamp(next.fundingPressure + Math.max(0, metrics.cpiInflationYoY - 2.5) * 2.5, 0, 100);
  }
  if (Number.isFinite(metrics.unemploymentRate)) {
    next.publicSupport = clamp(next.publicSupport - Math.max(0, metrics.unemploymentRate - 4.0) * 2.2, 0, 100);
    next.politicalPolarization = clamp(next.politicalPolarization + Math.max(0, metrics.unemploymentRate - 4.0) * 1.6, 0, 100);
  }
  if (Number.isFinite(metrics.activeWeatherAlerts)) {
    next.disasterShock = clamp(next.disasterShock + Math.min(22, metrics.activeWeatherAlerts / 18), 0, 100);
  }
  return next;
}
