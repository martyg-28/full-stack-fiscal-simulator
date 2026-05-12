import { clamp } from "./simulation.js";

// Compute the 5 axes for the tradeoff radar.
//   sustainability    — long-run fiscal health
//   politicalViability — how passable
//   growth            — investment + low trade disruption
//   socialResilience  — public services + support intact
//   shockReadiness    — capacity to absorb conflict / disaster / trade shocks
export function computeAxes(ctx) {
  const s = ctx.derivedStress || {};
  const p = ctx.policy || {};
  const summary = ctx.summary || {};

  const sustainability = clamp(summary.sustainabilityScore ?? 0, 0, 100);
  const politicalViability = clamp(summary.politicalViability ?? 0, 0, 100);

  const growth = clamp(
    50 + (p.industrialPolicy ?? 0) * 0.3 + (p.climateResilience ?? 0) * 0.1 - (s.tradeDisruption ?? 0) * 0.4,
    0, 100
  );

  const socialResilience = clamp(
    (s.publicSupport ?? 50) * 0.5 + (p.healthcareEfficiency ?? 0) * 0.3 - Math.max(0, (p.discretionaryCuts ?? 0) - 30) * 0.3 + 25,
    0, 100
  );

  const shockReadiness = clamp(
    100 - ((s.conflictShock ?? 0) + (s.disasterShock ?? 0) + (s.tradeDisruption ?? 0)) / 3 + (p.climateResilience ?? 0) * 0.15,
    0, 100
  );

  return {
    sustainability: Math.round(sustainability),
    politicalViability: Math.round(politicalViability),
    growth: Math.round(growth),
    socialResilience: Math.round(socialResilience),
    shockReadiness: Math.round(shockReadiness),
  };
}

export const AXIS_LABELS = {
  sustainability:     "Sustainability",
  politicalViability: "Political viability",
  growth:             "Growth support",
  socialResilience:   "Social resilience",
  shockReadiness:     "Shock readiness",
};

// Political capital costs per lever. Larger moves from neutral cost more.
// Returns a number 0..100+ representing total spend.
export function computePoliticalCapital(policy = {}) {
  const costs = {
    revenueReform:        v => v * 0.35,                        // any increase costs
    discretionaryCuts:    v => v * 0.30,                        // cuts are unpopular
    healthcareEfficiency: v => v * 0.18,                        // moderate
    socialSecurityReform: v => v * 0.45,                        // most politically expensive
    defensePosture:       v => Math.abs(v - 50) * 0.30,         // moving in either direction costs
    climateResilience:    v => v * 0.12,                        // relatively cheap
    industrialPolicy:     v => v * 0.18,
  };
  let total = 0;
  for (const [key, fn] of Object.entries(costs)) {
    if (Number.isFinite(policy[key])) total += fn(policy[key]);
  }
  return Math.round(total);
}

export const POLITICAL_CAPITAL_BUDGET = 100;
