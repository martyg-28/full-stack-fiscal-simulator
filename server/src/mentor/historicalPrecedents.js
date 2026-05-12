export const historicalPrecedents = [
  {
    id: "ww2-debt",
    title: "WWII debt buildup",
    period: "1941–1946",
    concept: "Wartime spending drives debt; growth and inflation help unwind it",
    summary:
      "U.S. debt-to-GDP rose to about 119% during WWII. Postwar growth, mild inflation, and sustained primary surpluses brought it down — not austerity alone.",
    simulationUse: "Useful when conflict shock + defense posture both spike but long-run growth is intact.",
    discussionQuestion: "Was high postwar debt a problem or an asset for U.S. global standing?",
    keywords: ["war", "defense", "conflict", "ww2", "debt buildup"],
  },
  {
    id: "oil-shocks-70s",
    title: "1970s oil shocks",
    period: "1973–1980",
    concept: "Supply shocks fuel stagflation",
    summary:
      "OPEC embargoes spiked oil prices, raised production costs, and produced stagflation. Fiscal planning suffered because nominal growth, inflation, and unemployment all rose together.",
    simulationUse: "Useful when explaining why energy/trade shocks indirectly worsen fiscal pressure.",
    discussionQuestion: "Should governments respond to supply shocks with stimulus, austerity, or monetary tightening?",
    keywords: ["oil", "supply", "energy", "inflation", "trade disruption", "1970s", "stagflation", "shock"],
  },
  {
    id: "volcker",
    title: "Volcker disinflation",
    period: "1979–1982",
    concept: "Aggressive monetary tightening to break inflation",
    summary:
      "Fed Chair Paul Volcker pushed the federal funds rate above 19%, triggering a deep recession but breaking expectations of permanent inflation.",
    simulationUse: "Useful when funding pressure or rates are doing the heavy lifting in the model.",
    discussionQuestion: "When does the cost of disinflation outweigh the cost of letting inflation persist?",
    keywords: ["inflation", "fed", "monetary", "rates", "interest", "volcker"],
  },
  {
    id: "deficit-90s",
    title: "1990s deficit reduction",
    period: "1990–2000",
    concept: "Reform + growth + restraint = surpluses",
    summary:
      "OBRA 1990 and 1993 raised revenue and capped spending. Combined with strong productivity growth, the U.S. reached budget surplus by 1998.",
    simulationUse: "Useful when revenue reform + discretionary cuts + low conflict produce a strong debt path.",
    discussionQuestion: "How much of the late-1990s surplus was policy and how much was the dot-com boom?",
    keywords: ["revenue", "deficit reduction", "1990s", "clinton", "obra", "surplus", "reform"],
  },
  {
    id: "gfc-2008",
    title: "2008 financial crisis stimulus",
    period: "2008–2010",
    concept: "Countercyclical fiscal response prevents a deeper slump",
    summary:
      "TARP and the Recovery Act added trillions to debt but likely averted a depression. Automatic stabilizers also kicked in: revenue fell, transfers rose.",
    simulationUse: "Useful when funding pressure rises but the model still requires shock-response spending.",
    discussionQuestion: "Did the 2008 stimulus do too much, too little, or roughly right?",
    keywords: ["financial crisis", "2008", "stimulus", "recession", "tarp", "shock"],
  },
  {
    id: "eurozone-debt",
    title: "Eurozone sovereign debt crisis",
    period: "2010–2015",
    concept: "Currency union + diverging fiscal positions = forced austerity",
    summary:
      "Greece, Italy, Spain, and Portugal faced rising spreads after the GFC. Bailouts came with austerity conditions that deepened recessions before recovery.",
    simulationUse: "Useful when borrowing pressure is high and the model penalizes high debt with growth drag.",
    discussionQuestion: "Was austerity the right call given the political constraints of the currency union?",
    keywords: ["eurozone", "greece", "austerity", "borrowing", "spread", "debt crisis"],
  },
  {
    id: "covid-relief",
    title: "COVID relief spending",
    period: "2020–2021",
    concept: "Large emergency transfers prevent collapse, fuel later inflation",
    summary:
      "The CARES Act and ARP added roughly $5T to debt. Output rebounded quickly, but combined with supply chain shocks, inflation followed.",
    simulationUse: "Useful when disaster shock + funding pressure both rise and trade disruption is also elevated.",
    discussionQuestion: "How should governments size emergency relief in the next major shock?",
    keywords: ["covid", "pandemic", "relief", "stimulus", "transfer", "inflation"],
  },
  {
    id: "japan-debt",
    title: "Japan's high-debt, low-rate world",
    period: "1995–present",
    concept: "Debt can be high if rates and growth allow it",
    summary:
      "Japan's debt-to-GDP is over 250%, but ultra-low rates and high domestic savings keep interest costs manageable. The dynamic is fragile if rates rise.",
    simulationUse: "Useful when explaining that high debt-to-GDP is not automatically a crisis.",
    discussionQuestion: "Can the U.S. follow Japan's model, or are the structural differences too large?",
    keywords: ["japan", "high debt", "low rates", "interest"],
  },
  {
    id: "ssa-1983",
    title: "1983 Social Security reforms",
    period: "1983",
    concept: "Bipartisan entitlement reform under a deadline",
    summary:
      "The Greenspan Commission combined a payroll-tax hike, gradual retirement-age increase, and benefit taxation — extending solvency for decades.",
    simulationUse: "Useful when Social Security reform lever and political viability interact.",
    discussionQuestion: "What political conditions made 1983 reform possible — and can they recur?",
    keywords: ["social security", "ssa", "retirement", "entitlement", "1983"],
  },
  {
    id: "chips-ira",
    title: "CHIPS Act / Inflation Reduction Act",
    period: "2022",
    concept: "Modern industrial policy",
    summary:
      "The CHIPS Act and IRA combined ~$1T+ in targeted spending and tax credits aimed at semiconductors, clean energy, and supply-chain resilience.",
    simulationUse: "Useful when industrial policy and climate resilience levers move together.",
    discussionQuestion: "Is industrial policy a fiscal cost, an investment, or both?",
    keywords: ["industrial policy", "chips", "ira", "subsidies", "climate"],
  },
  {
    id: "debt-ceiling-2011",
    title: "2011 U.S. debt-ceiling crisis",
    period: "2011",
    concept: "Self-imposed political risk affects funding pressure",
    summary:
      "The brinkmanship triggered a credit downgrade and brief market turbulence — not from fundamentals but from political risk.",
    simulationUse: "Useful when political polarization is high and borrowing pressure spikes.",
    discussionQuestion: "How should markets price political risk in a reserve-currency issuer?",
    keywords: ["debt ceiling", "polarization", "political risk", "downgrade"],
  },
];

export function findBestPrecedent(question, context = {}) {
  const q = (question || "").toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const p of historicalPrecedents) {
    let score = 0;
    for (const kw of p.keywords) if (q.includes(kw)) score += 2;
    if (context.scenarioPreset && p.keywords.some((kw) => context.scenarioPreset.toLowerCase().includes(kw))) score += 1;
    if (context.selectedRegion && p.keywords.some((kw) => context.selectedRegion.toLowerCase().includes(kw))) score += 1;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  if (best) return best;
  // Fall back based on dominant stress.
  const s = context.derivedStress || {};
  if (s.conflictShock > 60) return historicalPrecedents.find((p) => p.id === "ww2-debt");
  if (s.tradeDisruption > 55) return historicalPrecedents.find((p) => p.id === "oil-shocks-70s");
  if (s.disasterShock > 60) return historicalPrecedents.find((p) => p.id === "covid-relief");
  if ((context.summary?.fundingStress || 0) > 70) return historicalPrecedents.find((p) => p.id === "eurozone-debt");
  return historicalPrecedents.find((p) => p.id === "deficit-90s");
}
