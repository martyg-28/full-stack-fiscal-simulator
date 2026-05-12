import { clamp } from "./simulation.js";

// Each group role weights the same model output differently. The "role score"
// answers: how well does this package serve YOUR mandate, not the universal
// sustainability score. That's the pedagogical point — conflicting objectives.

export const ROLES = [
  {
    id: "fiscal-hawk",
    label: "Fiscal Hawk",
    goal: "Keep debt-to-GDP under control. You care most about long-run sustainability.",
    score(ctx) {
      const debt = ctx.summary.debtToGdp2056 ?? 200;
      const def = ctx.summary.deficitToGdp2056 ?? 8;
      const sustain = ctx.summary.sustainabilityScore ?? 0;
      // Reward low debt and low deficit; sustainability index supports.
      const debtScore = clamp(100 - (debt - 80) * 0.6, 0, 100);
      const defScore = clamp(100 - def * 8, 0, 100);
      return Math.round(debtScore * 0.55 + defScore * 0.30 + sustain * 0.15);
    },
  },
  {
    id: "social-investment",
    label: "Social Investment Advocate",
    goal: "Protect public services and long-term human capital. You care about equity and resilience.",
    score(ctx) {
      const support = ctx.derivedStress.publicSupport ?? 50;
      const health = ctx.policy.healthcareEfficiency ?? 0;
      const ss = ctx.policy.socialSecurityReform ?? 0;
      const discCuts = ctx.policy.discretionaryCuts ?? 0;
      // Reward public support and healthcare investment. Penalize aggressive
      // cuts and harsh SS reform (a proxy for benefit erosion).
      const cutsPenalty = Math.max(0, discCuts - 25) * 0.6;
      const ssPenalty = Math.max(0, ss - 40) * 0.4;
      return Math.round(clamp(support * 0.5 + health * 0.4 - cutsPenalty - ssPenalty + 20, 0, 100));
    },
  },
  {
    id: "defense-strategist",
    label: "Defense Strategist",
    goal: "Maintain global security commitments. You care about conflict readiness.",
    score(ctx) {
      const posture = ctx.policy.defensePosture ?? 50;
      const conflictReady = clamp(posture * 0.8 + ((ctx.derivedStress.conflictShock ?? 0) >= 50 ? 20 : 0), 0, 100);
      const fundingRoom = clamp(100 - (ctx.summary.fundingStress ?? 0) * 0.6, 0, 100);
      return Math.round(conflictReady * 0.6 + fundingRoom * 0.4);
    },
  },
  {
    id: "climate-planner",
    label: "Climate Resilience Planner",
    goal: "Reduce future disaster costs. You care about climate adaptation.",
    score(ctx) {
      const climate = ctx.policy.climateResilience ?? 0;
      const industrial = ctx.policy.industrialPolicy ?? 0;
      const disaster = ctx.derivedStress.disasterShock ?? 0;
      // Reward climate + industrial investment; penalize unmitigated disaster shock.
      const invest = climate * 0.7 + industrial * 0.3;
      const exposed = Math.max(0, disaster - 40) * 0.5;
      return Math.round(clamp(invest - exposed + 25, 0, 100));
    },
  },
  {
    id: "political-whip",
    label: "Political Whip",
    goal: "Get the package passed. You care about political viability.",
    score(ctx) {
      return Math.round(clamp(ctx.summary.politicalViability ?? 0, 0, 100));
    },
  },
];

export const rolesById = Object.fromEntries(ROLES.map((r) => [r.id, r]));
