// Ordered student journey. Each step shows a focused slice of the app and
// changes the Atlas mentor's suggested prompts so the help fits what the
// student is actually doing.

export const STEPS = [
  {
    id: "role",
    label: "Choose your role",
    badge: "Step 1",
    headline: "Pick a role. The model judges your package through that lens.",
    blurb:
      "Five roles, five mandates. The same policy package can score 82 for the Fiscal Hawk and 41 for the Social Investment Advocate. Pick the one your group is defending.",
    prompts: [
      "Which role should I pick?",
      "How does my role change my score?",
      "What do the five roles each care about?",
    ],
    panels: ["hero", "role"],
  },
  {
    id: "brief",
    label: "Read the brief",
    badge: "Step 2",
    headline: "Read the classroom mission. See the live world you are responding to.",
    blurb:
      "These are real numbers from Treasury, BLS, and NOAA — flowing live into the model. They shift your stress dials before you've changed a single slider.",
    prompts: [
      "Why does the current Treasury rate matter?",
      "What do active weather alerts have to do with the budget?",
      "What is funding pressure?",
    ],
    panels: ["mission", "government"],
  },
  {
    id: "build",
    label: "Build your package",
    badge: "Step 3",
    headline: "Move the sliders. Toggle real CBO options. Watch the 10-year impact update.",
    blurb:
      "Each policy lever has tradeoffs. Each CBO option has a real 10-year deficit effect. Build a package that fits your role's mandate — and try not to overspend your political capital.",
    prompts: [
      "Explain revenue reform",
      "Which CBO options reduce debt the most?",
      "What is the political-capital meter telling me?",
    ],
    panels: ["controls", "options"],
  },
  {
    id: "world",
    label: "Stress-test the world",
    badge: "Step 4",
    headline: "Look at the four maps. Click regions. See where the pressure comes from.",
    blurb:
      "Global shocks transmit into the U.S. budget through defense, energy, trade, and disaster channels. Pick a region to see which channels dominate.",
    prompts: [
      "Why does the Middle East affect the budget?",
      "Explain disaster shock",
      "Where am I most exposed to trade disruption?",
    ],
    panels: ["maps"],
  },
  {
    id: "read",
    label: "Read your results",
    badge: "Step 5",
    headline: "What did your package actually do? The radar shows the shape of your tradeoffs.",
    blurb:
      "Numbers in the dossier, axes on the radar, and a plain-English story of how the projection played out. Use this view to spot which axis your plan is weak on.",
    prompts: [
      "Why did long-run debt land here?",
      "Explain my radar shape",
      "Make the story simpler",
    ],
    panels: ["dossier", "radar", "story", "charts"],
  },
  {
    id: "defend",
    label: "Defend and save",
    badge: "Step 6",
    headline: "Find historical analogs. Build a debate argument. Save your run.",
    blurb:
      "Pull a historical precedent for your scenario, ask Atlas for debate prep, and save the run so your class can compare packages.",
    prompts: [
      "Help me defend this package",
      "Find a historical precedent for my run",
      "What concession should we offer?",
    ],
    panels: ["history", "precedents", "save"],
  },
];

export const stepsById = Object.fromEntries(STEPS.map((s) => [s.id, s]));

// Helper: should this panel render given the current step + advanced view?
export function panelVisible(panelId, currentStepId, advancedView) {
  if (advancedView) return true;
  const step = stepsById[currentStepId];
  return Boolean(step?.panels?.includes(panelId));
}
