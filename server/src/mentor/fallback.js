// Deterministic, no-LLM-required mentor. Builds an explanation from scenario
// context and the local knowledge base. Always returns the same response shape.

import { findBestPrecedent, historicalPrecedents } from "./historicalPrecedents.js";
import { leverExplanations, stressExplanations, findLeverKey, findStressKey } from "./leverExplanations.js";

const DEPTH = {
  simple: { prefix: "Plain-English: " },
  standard: { prefix: "" },
  advanced: { prefix: "Going a bit deeper: " },
};

function leverParagraph(leverKey, depth) {
  const exp = leverExplanations[leverKey];
  if (!exp) return null;
  if (depth === "simple") {
    return `${exp.direct} In this model that ${exp.model.toLowerCase()}`;
  }
  if (depth === "advanced") {
    return `${exp.direct} ${exp.model} The marginal effect on the long-run debt path depends on how much polarization and PAC pressure haircut the realized policy effect — see the implementation haircut in the model.`;
  }
  return `${exp.direct} ${exp.model}`;
}

function summarize(summary = {}) {
  const parts = [];
  if (Number.isFinite(summary.debtToGdp2056)) parts.push(`2056 debt/GDP at ${Math.round(summary.debtToGdp2056)}%`);
  if (Number.isFinite(summary.deficitToGdp2056)) parts.push(`2056 deficit/GDP at ${summary.deficitToGdp2056.toFixed(1)}%`);
  if (Number.isFinite(summary.fundingStress)) parts.push(`borrowing pressure ${Math.round(summary.fundingStress)}`);
  if (Number.isFinite(summary.politicalViability)) parts.push(`political viability ${Math.round(summary.politicalViability)}`);
  return parts.join(", ");
}

function debtParagraph(summary = {}, depth) {
  const debt = Math.round(summary.debtToGdp2056 || 0);
  const def = (summary.deficitToGdp2056 || 0).toFixed(1);
  const stress = Math.round(summary.fundingStress || 0);
  if (depth === "simple") {
    return `Think of the deficit as new borrowing each year (about ${def}% of GDP at the end of your projection) and debt as the pile that accumulates. The pile reaches roughly ${debt}% of GDP. When borrowing pressure is high (${stress}/100 in your run), the pile compounds faster.`;
  }
  if (depth === "advanced") {
    return `Debt/GDP is governed by the primary balance, the real interest rate, and nominal growth. In this run your end-state debt/GDP is ~${debt}% with deficit/GDP near ${def}%. The interest-feedback term kicks in once debt/GDP exceeds 115% — that is doing real work in your projection.`;
  }
  return `Debt rises when annual deficits keep adding to the stock faster than nominal GDP grows. Your projection ends at ~${debt}% debt/GDP and ~${def}% deficit/GDP, with borrowing pressure at ${stress}/100. Past 115% debt/GDP the model adds an interest-cost feedback that widens future deficits.`;
}

function politicalParagraph(summary = {}, manualStress = {}, depth) {
  const score = Math.round(summary.politicalViability || 0);
  const polar = Math.round(manualStress.politicalPolarization || 0);
  const pac = Math.round(manualStress.pacPressure || 0);
  const support = Math.round(manualStress.publicSupport || 0);
  if (depth === "simple") {
    return `Political viability is ${score}/100. Voter support helps (${support}), but polarization (${polar}) and PAC pressure (${pac}) push back. Reforms that look painful — large benefit changes, big tax shifts — bring viability down further.`;
  }
  return `In this model, political viability ≈ 55 + (support × 0.45 + congressional margin × 0.35) − (polarization × 0.35 + PAC × 0.32 + pain × 0.28). Your run scores ${score}. Easing PAC pressure (${pac}) or polarization (${polar}) lifts viability faster than adding voter support alone.`;
}

function regionParagraph(region) {
  const m = {
    "Middle East":   "Conflict and energy shocks transmit through oil prices and shipping chokepoints; that pushes funding pressure and trade disruption up.",
    "East Asia":     "Trade and chips are the dominant channels — tariff fights and supply-chain breakage hit trade disruption and industrial policy.",
    "Europe":        "Alliance commitments and financial contagion. Defense support spending and Treasury demand are the budget channels.",
    "Latin America": "Migration, food, and commodity prices flow into aid spending and inflation pressure.",
    "Africa":        "Humanitarian aid, food insecurity, and climate risk feed disaster shock and aid outlays.",
    "Arctic / Climate Belt": "Extreme weather and insurance losses — disaster shock is the main pathway.",
    "North America": "Domestic fiscal and political pressure shows up directly in funding stress and polarization.",
  };
  return m[region] || "Each region channels into the model through trade, conflict, disaster, or alliance spending — pick a region on the World Pressure Map to see its specific drivers.";
}

function buildDiscussionQuestion(mode, context) {
  if (mode === "professor-prompt") {
    return "Misconception to watch for: students often conflate debt and deficit. Ask them to define each in one sentence and identify which the model is showing.";
  }
  if (mode === "debate-prep") {
    return "What is the strongest argument your opposition will make, and how will you respond in 30 seconds?";
  }
  if (mode === "historical-case") {
    return "Which feature of the precedent matches your scenario most closely — and which does not?";
  }
  const debt = context?.summary?.debtToGdp2056 || 0;
  if (debt > 180) return "If debt keeps rising on this path, what is the first thing you would change in the package — and what would you protect?";
  return "Who benefits from this policy package, and which group is asked to accept the biggest tradeoff?";
}

function buildTradeoff(context) {
  const sustain = Math.round(context?.summary?.sustainabilityScore ?? context?.summary?.fiscalBalanceScore ?? 0);
  const viability = Math.round(context?.summary?.politicalViability ?? context?.summary?.passageProbability ?? 0);
  if (sustain >= 60 && viability < 50) {
    return "Your package improves the long-run fiscal picture but is hard to pass — the implementation haircut is doing visible damage.";
  }
  if (viability >= 60 && sustain < 50) {
    return "Your package is politically realistic but does not bend the debt curve much — the long-run debt path keeps rising.";
  }
  return "Every option here trades sustainability against political viability and resilience to shocks. Be explicit about which axis you are optimizing.";
}

export function fallbackMentor({ question = "", mode = "explain", depth = "standard", context = {} }) {
  const q = question.toLowerCase();
  const leverKey = findLeverKey(q);
  const stressKey = findStressKey(q);

  let keyConcept = "Why the model moved";
  let answer = "";

  if (mode === "socratic-seminar") {
    // Short, voice-friendly. Acknowledge briefly, then push back with a
    // single probing question routed by what the student just said.
    const sustain = Math.round(context?.summary?.sustainabilityScore ?? 0);
    const viability = Math.round(context?.summary?.politicalViability ?? 0);
    const debt = Math.round(context?.summary?.debtToGdp2056 ?? 0);
    const probe = leverKey
      ? `If you push ${leverKey.replace(/([A-Z])/g, " $1").toLowerCase().trim()} further, which constituency pays the cost first?`
      : stressKey
        ? `What policy in your current package would actually buffer that ${stressKey.replace(/([A-Z])/g, " $1").toLowerCase().trim()}?`
        : q.includes("political") || q.includes("pass")
          ? `Your viability is ${viability}. What concession would you trade to get five more points — and from whom?`
          : q.includes("debt") || q.includes("deficit")
            ? `Debt ends near ${debt}% of GDP. If you could only change one lever to bend that curve, which would it be and why?`
            : `What is your group optimizing for — sustainability, viability, resilience, or fairness? Pick one and defend it.`;
    const ack = leverKey || stressKey
      ? `Interesting. Your package scores ${sustain} on sustainability and ${viability} on viability right now.`
      : `Good. Let's push on that.`;
    return {
      answer: `${ack} ${probe}`,
      keyConcept: "Socratic seminar",
      historicalPrecedent: null,
      tradeoff: buildTradeoff(context),
      discussionQuestion: probe,
      confidenceNote: "Voice seminar mode. Studium is an exploratory classroom model, not an official fiscal forecast.",
    };
  }

  if (mode === "historical-case" || q.includes("precedent") || q.includes("history") || q.includes("histor")) {
    const p = findBestPrecedent(question, context) || historicalPrecedents[0];
    keyConcept = "Historical precedent";
    answer = `${p.title} (${p.period}). ${p.summary} ${p.simulationUse}`;
    return {
      answer: DEPTH[depth].prefix + answer,
      keyConcept,
      historicalPrecedent: { title: `${p.title} (${p.period})`, summary: p.summary },
      tradeoff: buildTradeoff(context),
      discussionQuestion: p.discussionQuestion,
      confidenceNote: "Deterministic mode — no LLM configured. Studium is an exploratory classroom model, not an official fiscal forecast.",
    };
  }

  if (leverKey) {
    keyConcept = `Lever: ${leverKey.replace(/([A-Z])/g, " $1").toLowerCase().trim()}`;
    answer = leverParagraph(leverKey, depth);
  } else if (q.includes("political") || q.includes("viability") || q.includes("pass")) {
    keyConcept = "Political viability";
    answer = politicalParagraph(context.summary, context.manualStress, depth);
  } else if (q.includes("region") || q.includes("globe") || (context.selectedRegion && q.includes("this"))) {
    keyConcept = "Regional transmission";
    answer = regionParagraph(context.selectedRegion);
  } else if (stressKey) {
    const e = stressExplanations[stressKey];
    keyConcept = stressKey.replace(/([A-Z])/g, " $1").toLowerCase().trim();
    answer = `${e.summary} ${e.effect}`;
  } else if (q.includes("debt") || q.includes("deficit") || q.includes("borrow")) {
    keyConcept = "Debt dynamics";
    answer = debtParagraph(context.summary, depth);
  } else if (mode === "debate-prep") {
    keyConcept = "Debate prep";
    const sustain = Math.round(context?.summary?.sustainabilityScore ?? 0);
    const viability = Math.round(context?.summary?.politicalViability ?? 0);
    answer = `Three opening arguments for your package: (1) it scores ${sustain}/100 on sustainability, with a clear path through reform; (2) it preserves room to respond to shocks; (3) it spreads cost across revenue and spending rather than concentrating it. Two objections to expect: the political-viability score is ${viability}/100, and your most-painful lever will be attacked first. Have a concrete concession ready.`;
  } else if (mode === "professor-prompt") {
    keyConcept = "Professor prompt";
    answer = `Run summary: ${summarize(context.summary)}. Suggested discussion: ask each group to defend the lever they pushed hardest and identify the constituency that pays the cost.`;
  } else {
    keyConcept = "Run summary";
    answer = `Here's where your run stands: ${summarize(context.summary) || "no scenario data yet"}. Ask me to explain a specific lever, region, or metric and I'll walk through it.`;
  }

  const precedent = findBestPrecedent(question, context);
  return {
    answer: DEPTH[depth].prefix + answer,
    keyConcept,
    historicalPrecedent: precedent
      ? { title: `${precedent.title} (${precedent.period})`, summary: precedent.summary }
      : null,
    tradeoff: buildTradeoff(context),
    discussionQuestion: buildDiscussionQuestion(mode, context),
    confidenceNote: "Deterministic mode — no LLM configured. Studium is an exploratory classroom model, not an official fiscal forecast.",
  };
}
