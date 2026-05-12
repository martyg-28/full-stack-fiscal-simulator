// Plain-English explanations of each policy lever and stress dial. The
// deterministic mentor uses these when no LLM is configured.

export const leverExplanations = {
  revenueReform: {
    direct: "Increases federal receipts by broadening the tax base and/or adjusting rates.",
    model: "Lowers the deficit in every projection year.",
    tradeoff: "Aggressive reform can lower political viability — visible simplification helps.",
    historicalId: "deficit-90s",
  },
  discretionaryCuts: {
    direct: "Reduces annual appropriations and agency budgets.",
    model: "Lowers the deficit, with a phase-in over several years.",
    tradeoff: "Can defer investment and erode public services. Politically uneven.",
    historicalId: "deficit-90s",
  },
  healthcareEfficiency: {
    direct: "Slows growth in Medicare/Medicaid through payment reforms and care models.",
    model: "Strong long-run effect because health spending compounds.",
    tradeoff: "Implementation is hard and provider groups push back.",
    historicalId: "ssa-1983",
  },
  socialSecurityReform: {
    direct: "Adjusts benefit formula, payroll cap, or retirement age.",
    model: "Slow but durable improvement in the long-run debt path.",
    tradeoff: "Politically sensitive and intergenerational.",
    historicalId: "ssa-1983",
  },
  defensePosture: {
    direct: "Higher posture raises defense outlays; lower posture trims them.",
    model: "Above 50 is a cost; below 50 is a saving. Interacts with conflict shock.",
    tradeoff: "Security commitments vs. fiscal restraint.",
    historicalId: "ww2-debt",
  },
  climateResilience: {
    direct: "Spending on adaptation, mitigation, and disaster preparedness.",
    model: "Costs in the near term, saves in the late cycle by reducing disaster shock.",
    tradeoff: "Upfront cost vs. avoided losses.",
    historicalId: "chips-ira",
  },
  industrialPolicy: {
    direct: "Targeted spending on chips, energy, and supply-chain resilience.",
    model: "Adds near-term cost. Indirectly lowers trade disruption later.",
    tradeoff: "Strategic capability vs. fiscal cost and market distortion.",
    historicalId: "chips-ira",
  },
};

export const stressExplanations = {
  fundingPressure: {
    summary: "How expensive and uncertain Treasury borrowing has become. Pushed up by high CPI, rising rates, and rising debt levels.",
    effect: "Acts like a drag multiplier — higher pressure widens future deficits.",
  },
  tradeDisruption: {
    summary: "Tariffs, sanctions, supply-chain breakage, and shipping risk.",
    effect: "Raises near-term inflation pressure and dampens nominal growth.",
  },
  conflictShock: {
    summary: "Active conflict that pulls defense spending and alliance support.",
    effect: "Amplifies in the late cycle when combined with high debt.",
  },
  disasterShock: {
    summary: "Frequency and severity of climate / natural disasters.",
    effect: "Raises emergency outlays and insurance pressure.",
  },
  politicalPolarization: {
    summary: "How hard it is to assemble a coalition for reform.",
    effect: "Haircuts the realized effect of policy levers.",
  },
  pacPressure: {
    summary: "Organized interest opposition to specific reforms.",
    effect: "Compounds with polarization to drag down implementation.",
  },
  publicSupport: {
    summary: "Voter tolerance for visible tradeoffs.",
    effect: "Lifts political viability; eroded by unemployment.",
  },
  congressionalMargin: {
    summary: "How much legislative slack is available.",
    effect: "Wider margins improve passage odds.",
  },
};

export function findLeverKey(question) {
  const q = (question || "").toLowerCase();
  if (q.includes("revenue") || q.includes("tax")) return "revenueReform";
  if (q.includes("discretion")) return "discretionaryCuts";
  if (q.includes("medicare") || q.includes("medicaid") || q.includes("health")) return "healthcareEfficiency";
  if (q.includes("social security") || q.includes("retirement")) return "socialSecurityReform";
  if (q.includes("defense") || q.includes("military")) return "defensePosture";
  if (q.includes("climate") || q.includes("disaster")) return "climateResilience";
  if (q.includes("industrial") || q.includes("chips")) return "industrialPolicy";
  return null;
}

export function findStressKey(question) {
  const q = (question || "").toLowerCase();
  if (q.includes("funding") || q.includes("borrowing") || q.includes("interest")) return "fundingPressure";
  if (q.includes("trade") || q.includes("tariff") || q.includes("supply")) return "tradeDisruption";
  if (q.includes("conflict") || q.includes("war")) return "conflictShock";
  if (q.includes("disaster") || q.includes("weather")) return "disasterShock";
  if (q.includes("polariz")) return "politicalPolarization";
  if (q.includes("pac") || q.includes("lobby")) return "pacPressure";
  if (q.includes("public support") || q.includes("voter")) return "publicSupport";
  return null;
}
