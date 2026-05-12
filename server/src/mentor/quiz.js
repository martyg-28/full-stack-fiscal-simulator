// Scenario quiz generator. Produces a short multiple-choice quiz tailored to
// the student's actual run. Uses Claude when configured, falls back to a
// deterministic question bank that reads the context.

import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const QUIZ_SYSTEM = `You are Atlas writing a short formative quiz for a college student who just finished a Studium fiscal-policy simulation run. The quiz tests whether the student can interpret what they just did.

You will get the run context as JSON. Generate exactly 5 multiple-choice questions:
- Question 1: a conceptual macro question (e.g., debt vs. deficit, what funding pressure means, what role-based scoring measures).
- Question 2: about their specific package — what lever did they push hardest, what tradeoff did they accept.
- Question 3: about the live data layer — Treasury, BLS, NOAA — and how it nudged their stress dials.
- Question 4: about a historical precedent that fits their scenario.
- Question 5: a forecasting question — what would happen if they changed one specific lever from their current package.

Each question has 4 choices, exactly one correct. Be specific and reference the student's actual numbers when relevant. Don't make trick questions; make ones that reward understanding.

Return strict JSON only — no markdown fences, no commentary. The schema is:

{
  "questions": [
    {
      "question": "string",
      "choices": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string — 1 to 2 sentences explaining why the correct answer is correct, referencing the run when relevant"
    }
  ]
}`;

let client = null;
function getClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function safeParseJson(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}

export async function generateLlmQuiz(context) {
  const c = getClient();
  if (!c) throw new Error("No ANTHROPIC_API_KEY configured");
  const model = process.env.MENTOR_MODEL || DEFAULT_MODEL;
  const response = await c.messages.create({
    model,
    max_tokens: 2200,
    temperature: 0.5,
    system: [
      { type: "text", text: QUIZ_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `Generate the quiz based on this run context. Return only the JSON.\n\n${JSON.stringify(context, null, 2)}`,
      },
    ],
  });
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = safeParseJson(text);
  if (!Array.isArray(parsed.questions)) throw new Error("Malformed quiz JSON");
  return { questions: parsed.questions, source: "llm" };
}

// Deterministic fallback — generates questions from the actual scenario state
// so it still feels personalized even without an API key.
export function generateFallbackQuiz(context = {}) {
  const s = context.summary || {};
  const policy = context.policy || {};
  const stress = context.derivedStress || {};
  const role = context.selectedRole || "Fiscal Hawk";

  const debt = Math.round(s.debtToGdp2056 || 0);
  const def = Number(s.deficitToGdp2056 || 0).toFixed(1);
  const sustain = Math.round(s.sustainabilityScore || 0);
  const viability = Math.round(s.politicalViability || 0);
  const funding = Math.round(s.fundingStress || 0);

  const topLever = Object.entries(policy)
    .filter(([k]) => k !== "defensePosture")
    .reduce((max, cur) => (cur[1] > max[1] ? cur : max), ["—", -1])[0];

  return {
    source: "fallback",
    questions: [
      {
        question: "What is the difference between debt and deficit?",
        choices: [
          "They mean the same thing.",
          "Deficit is the annual gap between spending and revenue; debt is the accumulated total of past deficits.",
          "Debt is the annual gap; deficit is the total stock.",
          "Both refer to interest payments on government bonds.",
        ],
        correctIndex: 1,
        explanation: "Deficit is the flow (one year); debt is the stock (cumulative). Your projection shows the deficit running near " + def + "% of GDP, which keeps adding to a debt stock of " + debt + "%.",
      },
      {
        question: `In your package, which lever did you push hardest?`,
        choices: [
          "Defense posture",
          topLever.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
          "PAC pressure",
          "Active weather alerts",
        ],
        correctIndex: 1,
        explanation: `Your highest non-defense slider was ${topLever}. That choice carries political capital costs and reshapes the long-run trajectory.`,
      },
      {
        question: "Which live government data source pushes 'borrowing pressure' upward in this model?",
        choices: [
          "NOAA active weather alerts",
          "BLS unemployment rate",
          "Treasury average interest rate",
          "BLS Consumer Price Index — but only when below 2%",
        ],
        correctIndex: 2,
        explanation: "Higher Treasury rates raise the cost of refinancing existing debt. Your run shows borrowing pressure at " + funding + "/100.",
      },
      {
        question: `Your political viability scored ${viability}. Which historical precedent best fits a scenario where reforms work on paper but stall politically?`,
        choices: [
          "1990s deficit reduction — bipartisan deal under deadline",
          "WWII debt buildup — war spending dominated",
          "2011 debt-ceiling crisis — political brinkmanship despite no fundamental shift",
          "Volcker disinflation — Fed action, not Congress",
        ],
        correctIndex: 2,
        explanation: "The 2011 debt-ceiling crisis is the clearest case where politics, not economics, drove fiscal risk. Your viability score of " + viability + " says your package has similar political fragility.",
      },
      {
        question: `If you raised Social Security reform by 20 points from your current setting, what is the most likely effect on the 2056 debt path?`,
        choices: [
          "Sharp drop within the first 5 years.",
          "Modest reduction, mostly visible after 2040 due to slow phase-in.",
          "No effect — SS reform doesn't enter this model.",
          "Sharp increase because retirement spending rises.",
        ],
        correctIndex: 1,
        explanation: "In this model, SS reform phases in slowly (16-year curve) but produces a durable long-run reduction. Most of the benefit shows up in the late cycle, not immediately.",
      },
    ],
  };
}
