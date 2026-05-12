// Qualitative bands for every headline metric. A first-year student can't tell
// whether "debt/GDP 142%" is bad or fine — these helpers attach a one-word
// verdict and a one-line interpretation so the number becomes legible.

function band(value, bands) {
  for (const b of bands) if (value <= b.max) return b;
  return bands[bands.length - 1];
}

export function sustainabilityBand(score) {
  return band(score, [
    { max: 25, label: "Unsustainable", tone: "bad",     blurb: "This package can't bend the long-run debt curve." },
    { max: 45, label: "Strained",       tone: "warn",    blurb: "Some progress, but the fiscal hole keeps growing." },
    { max: 60, label: "Workable",       tone: "neutral", blurb: "Reform package roughly holds the line." },
    { max: 80, label: "Strong",         tone: "good",    blurb: "Long-run debt path actually improves." },
    { max: 100,label: "Excellent",      tone: "good",    blurb: "Best-in-class fiscal trajectory." },
  ]);
}

export function debtBand(debtPct) {
  return band(debtPct, [
    { max: 80,  label: "Comfortable", tone: "good",    blurb: "Below the 1990s low. Plenty of headroom." },
    { max: 100, label: "Normal",      tone: "neutral", blurb: "Roughly U.S. today. Manageable." },
    { max: 130, label: "Elevated",    tone: "warn",    blurb: "Higher than postwar averages. Interest costs bite." },
    { max: 175, label: "High",        tone: "warn",    blurb: "Above U.S. WWII peak. Compounding gets hard." },
    { max: 250, label: "Very high",   tone: "bad",     blurb: "Near eurozone-crisis territory. Markets watch." },
    { max: 999, label: "Extreme",     tone: "bad",     blurb: "Beyond Japan's level. Stress is structural." },
  ]);
}

export function viabilityBand(v) {
  return band(v, [
    { max: 25, label: "Dead on arrival", tone: "bad",     blurb: "Politically unpassable as written." },
    { max: 45, label: "Fragile",          tone: "warn",    blurb: "Likely to get gutted in negotiation." },
    { max: 60, label: "Possible",         tone: "neutral", blurb: "Could pass with deal-making." },
    { max: 80, label: "Realistic",        tone: "good",    blurb: "Solid coalition path." },
    { max: 100,label: "Easy pass",        tone: "good",    blurb: "Broadly supported. Low political cost." },
  ]);
}

export function fundingBand(f) {
  return band(f, [
    { max: 30, label: "Easy",     tone: "good",    blurb: "Treasury borrows cheaply. No stress." },
    { max: 55, label: "Normal",   tone: "neutral", blurb: "Standard refinancing pressure." },
    { max: 75, label: "Tight",    tone: "warn",    blurb: "Rising rates. Refinancing costs ticking up." },
    { max: 90, label: "Stressed", tone: "bad",     blurb: "Markets pricing real risk." },
    { max: 100,label: "Crisis",   tone: "bad",     blurb: "Bond-market revolt territory." },
  ]);
}

export function roleScoreBand(score) {
  return band(score, [
    { max: 30, label: "Failing your mandate", tone: "bad",     blurb: "This package doesn't serve your role's goal." },
    { max: 50, label: "Below par",            tone: "warn",    blurb: "Some progress, but you can do more." },
    { max: 70, label: "Solid",                tone: "neutral", blurb: "Reasonable fit for your mandate." },
    { max: 85, label: "Strong",               tone: "good",    blurb: "Defending this is easy." },
    { max: 100,label: "Exceptional",          tone: "good",    blurb: "Best-in-class for your role." },
  ]);
}
