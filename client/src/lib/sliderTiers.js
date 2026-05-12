// Each slider gets 5 named tiers with a one-line "in the real world this means"
// blurb. The student sees the tier name, not the number, so 35 reads as
// "Moderate — Modest rate hikes on top earners" instead of an arbitrary integer.

export const POLICY_TIERS = {
  revenueReform: [
    { max: 15,  label: "Light touch",   blurb: "Close a few loopholes. Minimal political fight." },
    { max: 35,  label: "Moderate",      blurb: "Modest rate hikes on top earners." },
    { max: 60,  label: "Substantial",   blurb: "Base broadening plus rate changes across brackets." },
    { max: 80,  label: "Aggressive",    blurb: "Major progressive overhaul. Political cost is real." },
    { max: 100, label: "Bold",          blurb: "Comprehensive reform with new revenue streams." },
  ],
  discretionaryCuts: [
    { max: 15,  label: "Trim",          blurb: "Small reductions, mostly accounting tweaks." },
    { max: 35,  label: "Squeeze",       blurb: "Real cuts to agency budgets. Some pain." },
    { max: 60,  label: "Hard caps",     blurb: "Across-the-board spending caps for years." },
    { max: 80,  label: "Aggressive",    blurb: "Major program shutdowns. Public services hit." },
    { max: 100, label: "Severe",        blurb: "Sequestration-style cuts. Political backlash certain." },
  ],
  healthcareEfficiency: [
    { max: 15,  label: "Status quo",    blurb: "Tweaks at the margin. Spending growth continues." },
    { max: 35,  label: "Modest reform", blurb: "Payment adjustments and admin streamlining." },
    { max: 60,  label: "Real reform",   blurb: "Care-delivery changes and bundled payments." },
    { max: 80,  label: "Major reform",  blurb: "Structural reorganization of Medicare and Medicaid." },
    { max: 100, label: "Overhaul",      blurb: "Top-to-bottom redesign of payment and care models." },
  ],
  socialSecurityReform: [
    { max: 15,  label: "Untouched",     blurb: "Current benefits intact. Trust fund still depletes." },
    { max: 35,  label: "Light tweaks",  blurb: "Minor formula or cap adjustments." },
    { max: 60,  label: "Real reform",   blurb: "Raise the cap, adjust the formula. Political battle." },
    { max: 80,  label: "Major reform",  blurb: "Retirement age changes plus revenue increases." },
    { max: 100, label: "Restructure",   blurb: "Fundamental redesign of how SS works." },
  ],
  defensePosture: [
    { max: 25,  label: "Restraint",     blurb: "Significant force reductions. Allies pick up more." },
    { max: 40,  label: "Lean",          blurb: "Smaller footprint. Selective commitments." },
    { max: 60,  label: "Neutral",       blurb: "Current force structure. Status quo." },
    { max: 80,  label: "Forward",       blurb: "Larger forward presence. Higher costs." },
    { max: 100, label: "Maximalist",    blurb: "Major buildup. Defense share of GDP rises sharply." },
  ],
  climateResilience: [
    { max: 15,  label: "Minimal",       blurb: "Disaster response only. No adaptation." },
    { max: 35,  label: "Limited",       blurb: "Some adaptation funding. Reactive posture." },
    { max: 60,  label: "Serious",       blurb: "Real infrastructure adaptation. Future disaster savings." },
    { max: 80,  label: "Aggressive",    blurb: "Large-scale resilience and energy transition spend." },
    { max: 100, label: "Wartime-scale", blurb: "Massive mobilization. Big upfront cost, big later savings." },
  ],
  industrialPolicy: [
    { max: 15,  label: "Hands off",     blurb: "Market-driven. No strategic subsidies." },
    { max: 35,  label: "Light",         blurb: "Targeted help for a few sectors." },
    { max: 60,  label: "Active",        blurb: "Serious support for chips, energy, manufacturing." },
    { max: 80,  label: "Aggressive",    blurb: "Large-scale subsidies and trade protections." },
    { max: 100, label: "Strategic",     blurb: "Coordinated national industrial strategy." },
  ],
};

export const STRESS_TIERS = {
  politicalPolarization: [
    { max: 20,  label: "Calm",          blurb: "Productive bipartisan environment." },
    { max: 40,  label: "Edgy",          blurb: "Tension but workable." },
    { max: 60,  label: "Heated",        blurb: "Major-issue gridlock. Cross-aisle deals rare." },
    { max: 80,  label: "Polarized",     blurb: "Reform packages get gutted before they reach the floor." },
    { max: 100, label: "Toxic",         blurb: "Functional stalemate. Even routine bills struggle." },
  ],
  pacPressure: [
    { max: 20,  label: "Quiet",         blurb: "Few organized opponents." },
    { max: 40,  label: "Active",        blurb: "Standard lobbying activity." },
    { max: 60,  label: "Heavy",         blurb: "Major industries push back hard." },
    { max: 80,  label: "Organized",     blurb: "Coalitions mobilize to block reform." },
    { max: 100, label: "All-out",       blurb: "Lobbying war on every major lever." },
  ],
  publicSupport: [
    { max: 20,  label: "Skeptical",     blurb: "Voters distrust most reform packages." },
    { max: 40,  label: "Cool",          blurb: "Some appetite, mostly cautious." },
    { max: 60,  label: "Open",          blurb: "Reasonable receptiveness to tradeoffs." },
    { max: 80,  label: "Supportive",    blurb: "Strong appetite for action." },
    { max: 100, label: "Mobilized",     blurb: "Voters demand reform. Politicians respond." },
  ],
  congressionalMargin: [
    { max: 20,  label: "Razor thin",    blurb: "Every defection kills the bill." },
    { max: 40,  label: "Narrow",        blurb: "Some room but careful arithmetic." },
    { max: 60,  label: "Workable",      blurb: "Modest cushion for negotiation." },
    { max: 80,  label: "Comfortable",   blurb: "Real legislative space." },
    { max: 100, label: "Sweeping",      blurb: "Supermajorities. Almost anything passes." },
  ],
  fundingPressure: [
    { max: 20,  label: "Easy",          blurb: "Treasury borrows cheaply. Markets unworried." },
    { max: 40,  label: "Normal",        blurb: "Standard refinancing conditions." },
    { max: 60,  label: "Tight",         blurb: "Rising rates. Refinancing costs ticking up." },
    { max: 80,  label: "Stressed",      blurb: "Markets pricing in real risk. Spreads widen." },
    { max: 100, label: "Crisis",        blurb: "Bond-market revolt. Refinancing is painful." },
  ],
  conflictShock: [
    { max: 20,  label: "Peace",         blurb: "No active major conflicts." },
    { max: 40,  label: "Tension",       blurb: "Regional flare-ups. Minor U.S. involvement." },
    { max: 60,  label: "Active",        blurb: "Sustained conflict requiring real U.S. resources." },
    { max: 80,  label: "Major",         blurb: "Large-scale war footing. Defense surge." },
    { max: 100, label: "Catastrophic",  blurb: "Multi-front commitment. Wartime fiscal posture." },
  ],
  disasterShock: [
    { max: 20,  label: "Calm",          blurb: "Normal disaster year." },
    { max: 40,  label: "Above average", blurb: "More billion-dollar events than typical." },
    { max: 60,  label: "Severe",        blurb: "Multiple major disasters straining FEMA." },
    { max: 80,  label: "Cascade",       blurb: "Back-to-back catastrophes. Insurance markets buckle." },
    { max: 100, label: "Crisis",        blurb: "Annual climate emergencies become baseline." },
  ],
  tradeDisruption: [
    { max: 20,  label: "Smooth",        blurb: "Trade flows normally." },
    { max: 40,  label: "Friction",      blurb: "Tariffs and frictions in some sectors." },
    { max: 60,  label: "Disruption",    blurb: "Supply chains stressed. Costs pass through to inflation." },
    { max: 80,  label: "Fracture",      blurb: "Major trade war. Shortages and price spikes." },
    { max: 100, label: "Decoupling",    blurb: "Global trade fragments. Inflation surges." },
  ],
};

export function getTier(key, value, table) {
  const tiers = table[key];
  if (!tiers) return { label: "—", blurb: "", index: 0, total: 5 };
  for (let i = 0; i < tiers.length; i += 1) {
    if (value <= tiers[i].max) {
      return { ...tiers[i], index: i, total: tiers.length };
    }
  }
  return { ...tiers[tiers.length - 1], index: tiers.length - 1, total: tiers.length };
}
