# Studium · The Policy Simulation Studio

A classroom atlas for U.S. fiscal policy. Students build a policy package, expose it to global shocks pulled from live government data, and trace the result across a long-run debt path through 2056 — then debate the tradeoffs with the help of an LLM-backed Macro Mentor named **Atlas**.

> Submitted as a DALI Lab **Choose-Your-Own-Adventure** full-stack challenge.

**Deployed app:** [full-stack-fiscal-simulator.onrender.com](https://full-stack-fiscal-simulator.onrender.com/)
**Demo video / GIF:** _add link here_
**Screenshots:** _add `docs/dashboard.png`, `docs/maps.png`, `docs/atlas.png` before submitting_

---

## Table of contents

1. [Why this exists](#why-this-exists)
2. [What it does](#what-it-does)
3. [Stack](#stack)
4. [Architecture](#architecture)
5. [Project structure](#project-structure)
6. [Setup](#setup)
7. [Tests](#tests)
8. [The simulation model, in plain English](#the-simulation-model-in-plain-english)
9. [Cartography](#cartography)
10. [Atlas, the macro mentor](#atlas-the-macro-mentor)
11. [Government data layer](#government-data-layer)
12. [Persistence layer](#persistence-layer)
13. [API endpoints](#api-endpoints)
14. [Design system](#design-system)
15. [Pedagogy](#pedagogy)
16. [Learning journey](#learning-journey)
17. [Technical rationale](#technical-rationale)
18. [Three hardest bugs](#three-hardest-bugs)
19. [AI usage](#ai-usage)
20. [How this meets the DALI CYOA requirements](#how-this-meets-the-dali-cyoa-requirements)
21. [Before submitting](#before-submitting)
22. [Future improvements](#future-improvements)

---

## Why this exists

Most budget simulators look like a CBO spreadsheet — accurate, but dry. The pedagogical problem isn't usually "do students understand the arithmetic." It's "do they understand why fiscal policy fails in practice." A 25% revenue reform on paper is not the same as a 25% revenue reform that gets gutted by political polarization, eaten by interest costs, or overrun by a security crisis.

Studium was designed for a classroom activity: a 30-minute group exercise where students assume conflicting policy roles, build a package together, expose it to shocks driven by real Treasury/BLS/NOAA data, defend their tradeoffs in front of the class, and read a plain-English summary of *why* their plan came out the way it did. The product is editorial, slow, and intentional — closer to an almanac or a teaching atlas than a hedge-fund terminal. The aesthetic reference was Pax Historia.

The simulation itself is deliberately legible, not a forecast. It uses round numbers, transparent coefficients, and a 30-year horizon that fits one chart. The disclaimer is everywhere: *Studium is an exploratory classroom model, not an official fiscal forecast.*

## What it does

**For the student:**
- **Policy Builder.** Seven fiscal-policy sliders (revenue reform, healthcare efficiency, Social Security, defense posture, climate resilience, industrial policy, discretionary cuts) plus 30+ CBO-scored budget options from the Concord Coalition's *Principles & Priorities Options Book*. Each option has a real 10-year deficit effect; toggle them and watch the long-run debt path move.
- **Group roles.** Five role cards — Fiscal Hawk, Social Investment Advocate, Defense Strategist, Climate Resilience Planner, Political Whip. Same model output, different scoring function. The Fiscal Hawk only cares about 2056 debt/GDP. The Political Whip only cares whether your package can pass. Groups have to argue.
- **Tradeoff radar.** Five-axis radar (Sustainability, Political Viability, Growth, Social Resilience, Shock Readiness). A package's "shape" tells you instantly whether you're balanced, fiscally hawkish but politically dead, or popular but reckless.
- **Political-capital meter.** A 100-point budget that drains based on how aggressive each lever is. Aggressive Social Security reform costs 0.45 capital per unit; climate resilience costs only 0.12. Overspend and your viability score collapses.
- **Four cartographic plates.**
  - *Plate I* — equirectangular world map showing pressure transmission from seven world regions into the U.S. budget anchor.
  - *Plate II* — drag-to-rotate sphere in parchment styling.
  - *Plate III* — U.S. silhouette overlaid with live NWS alert count, current Treasury rate at the DC anchor, and census-region pressure markers fed by current stress dials.
  - *Plate IV* — your projected debt path 2026 → 2056 charted against five real historical anchors: Japan today (250%), U.S. WWII peak (119%), Eurozone-crisis average (105%), U.S. today (~100%), 1990s low (35%).
- **Atlas Macro Mentor.** A persistent floating chat widget. Ask "why did debt rise?", "explain political viability like Econ 1," or "give me a historical precedent." Atlas reads the live scenario context — your policy package, derived stress, debt/deficit summary, selected role, selected region — and answers in a JSON contract that the UI renders as a multi-section bubble (answer, key concept, historical precedent, tradeoff, discussion question).
- **Scenario Story.** A live, plain-English narrative of the current run. Five reshape buttons: Re-read, Make it simpler, Explain like Econ 1, Add historical precedent, Turn into a debate argument. Each rewrites the same story for a different audience.
- **Historical Precedent Timeline.** Ten real macro episodes (WWII debt buildup, 1970s oil shocks, Volcker disinflation, 1983 Social Security reforms, 1990s deficit reduction, 2008 stimulus, 2011 debt-ceiling crisis, Eurozone debt crisis, COVID relief, CHIPS/IRA). Click any episode and Atlas opens with that case prefilled.
- **"Why?" buttons everywhere.** Every dossier figure, every Government data tile, every radar axis has a 1-click "ask Atlas" deep-link so students never get stuck staring at a number.
- **6-step tutorial.** First-run walkthrough. Reopenable from the masthead's "Take the tour" link.

**For the teacher (planned for the next iteration):**
- Classroom mode with join codes (`ECON22`, "Team Keynes", role).
- Class vote leaderboards across categories (Most Sustainable, Most Realistic, Best Social Tradeoff, Most Resilient, Best Historical Defense).
- Comment threads per saved scenario.

## Stack

**Frontend** — React 18, Vite, Recharts, Framer Motion, hand-rolled SVG cartography (spherical projection for the globe, equirectangular for the flat maps, radar/timeline rendered as raw SVG primitives), Fraunces / Inter / JetBrains Mono editorial typography.

**Backend** — Node.js, Express, Prisma ORM over SQLite, Zod for input validation, `@anthropic-ai/sdk` for the live mentor with `cache_control: ephemeral` on the system prompt.

**External APIs, all called server-side:**
- **U.S. Treasury Fiscal Data** — Debt to the Penny + average Treasury interest rates.
- **Bureau of Labor Statistics** — CPI-U inflation and headline unemployment, fetched via `POST` with explicit `startyear`/`endyear` so the YoY computation always has 13+ months of data (the unregistered `GET` endpoint only returns the current calendar year, which silently broke the YoY math in v1 — see [Three hardest bugs](#three-hardest-bugs)).
- **NOAA / National Weather Service** — active U.S. alerts (`area=US` is invalid; the route now passes the right filter — see hardest-bugs).
- **Anthropic Claude** — optional, key-gated, used for Atlas's real-time tutoring.

## Architecture

```
┌──────────────────────────┐         /api/*          ┌────────────────────────┐
│   React / Vite (5173)    │ ───────────────────────►│  Express (4000)        │
│  ──────────────────────  │                         │  ──────────────────    │
│  • App.jsx               │◄──── 11 endpoints ──────│  • routes/             │
│  • Editorial cartography │                         │  • Prisma client       │
│  • Atlas chat widget     │                         │  • Government adapters │
│  • Tutorial overlay      │                         │  • Mentor + fallback   │
└──────────────────────────┘                         └────────────────────────┘
                                                              │
              ┌───────────────────────────┬───────────────────┼────────────────┐
              ▼                           ▼                   ▼                ▼
        Treasury API                BLS API              NOAA / NWS      Anthropic API
       (debt + rates)              (CPI + UR)             (alerts)        (optional)
                                                              │
                                                              ▼
                                                      SQLite (Prisma)
                                                      ┌───────────────┐
                                                      │ Scenario      │
                                                      │ MetricCache   │
                                                      └───────────────┘
```

- The React app never calls a third-party API directly. Every external call goes through `/api/*`.
- Every government metric is cached in `MetricCache` so the app stays useful when an upstream API is down. The route returns `live | cached | offline | empty` so the UI can surface the truth instead of pretending.
- The Atlas mentor is a strict request → JSON contract. If the LLM call fails (no key, network blip, JSON parse error), the request transparently falls through to a deterministic rule-based mentor that returns the same response shape. The UI never knows the difference.

## Project structure

```txt
studium/
├─ client/
│  ├─ index.html
│  ├─ vite.config.js
│  └─ src/
│     ├─ App.jsx
│     ├─ main.jsx
│     ├─ style.css                          ~900 lines, editorial design system
│     ├─ components/
│     │  ├─ EditorialMasthead.jsx           Studium wordmark + date + tour link
│     │  ├─ ClassMissionCard.jsx            "Advise Congress in 2028" + roles
│     │  ├─ RoleHUD.jsx                     Role selector + role score + capital meter
│     │  ├─ TradeoffRadar.jsx               5-axis SVG radar, hoverable axes
│     │  ├─ ScenarioStory.jsx               Live narrative + 5 reshape buttons
│     │  ├─ FlatTransmissionMap.jsx         Plate I — equirectangular world map
│     │  ├─ Globe.jsx                       Plate II — drag-to-rotate sphere
│     │  ├─ USPressureMap.jsx               Plate III — U.S. silhouette + live data
│     │  ├─ HistoricalDebtChart.jsx         Plate IV — your debt path vs. anchors
│     │  ├─ PrecedentTimeline.jsx           Horizontal precedent strip
│     │  ├─ GovernmentPanel.jsx             Treasury/BLS/NOAA tiles + Why? buttons
│     │  ├─ PolicyOptionsPanel.jsx          30+ CBO options w/ category tabs
│     │  ├─ Controls.jsx                    Policy + global pressure sliders
│     │  ├─ Charts.jsx                      Recharts debt / regional / deficit
│     │  ├─ PersistencePanel.jsx            Saved scenario list w/ delete
│     │  ├─ AtlasMentor.jsx                 Floating chat panel + FAB w/ pulse
│     │  └─ Tutorial.jsx                    6-step onboarding overlay
│     ├─ hooks/
│     │  ├─ useGovernmentData.js
│     │  └─ useScenarioPersistence.js
│     └─ lib/
│        ├─ simulation.js                   Projection model (mirror of server)
│        ├─ globeProjection.js              Spherical SVG projection helpers
│        ├─ regions.js                      Continent polygons + region templates
│        ├─ presets.js                      Baseline + 3 shock scenario presets
│        ├─ policyOptions.js                CBO catalog + 10-year → pp/GDP math
│        ├─ roles.js                        5 role scoring functions
│        ├─ scoreAxes.js                    Radar axes + political-capital math
│        ├─ atlasPrompts.js                 Suggested prompts per mode
│        └─ api.js                          Thin fetch wrapper
├─ server/
│  ├─ prisma/schema.prisma                  Scenario + MetricCache models
│  ├─ test/simulation.test.js               node:test sanity suite
│  └─ src/
│     ├─ index.js                           Express bootstrap, CORS, JSON, routes
│     ├─ simulation.js                      Mirror of client simulation
│     ├─ governmentSources.js               Treasury / BLS / NOAA adapters
│     ├─ lib/prisma.js                      Single PrismaClient instance
│     ├─ mentor/
│     │  ├─ llm.js                          Anthropic Claude integration
│     │  ├─ fallback.js                     Deterministic mentor (no-key fallback)
│     │  ├─ historicalPrecedents.js         10 episodes — shared knowledge base
│     │  └─ leverExplanations.js
│     └─ routes/
│        ├─ governmentMetrics.js            GET / + GET /:sourceId, with cache
│        ├─ scenarios.js                    GET / + GET /:id + POST + DELETE
│        └─ mentor.js                       POST /chat, GET /status, GET /precedents
├─ scripts/setup-env.mjs                    Auto-creates server/.env from example
├─ package.json                             Root orchestration: install:all, dev, db:push, test
└─ README.md
```

## Setup

```bash
git clone https://github.com/martyg-28/full-stack-fiscal-simulator.git
cd full-stack-fiscal-simulator
npm run install:all   # installs both client/ and server/
npm run db:push       # creates server/prisma/dev.db via Prisma
npm run dev           # client on :5173, server on :4000 (Vite proxies /api → 4000)
```

The `setup` step auto-copies `server/.env.example` → `server/.env` on the first run. Adjust `DATABASE_URL` or `PORT` there if needed.

**Turn on Atlas's real LLM tutoring** (optional — the fallback works without it). Get a key at [console.anthropic.com](https://console.anthropic.com/), then add to `server/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
MENTOR_MODEL=claude-haiku-4-5-20251001
```

Haiku 4.5 is the default — fast enough for short tutoring, cheap, and cache-eligible.

**Optional BLS key.** The BLS API works for unregistered users but registering for a key at [data.bls.gov/registrationEngine](https://data.bls.gov/registrationEngine/) gives a higher rate limit and longer historical windows. Set `BLS_API_KEY=...` in the same `.env`. The simulator works without it.

## Tests

```bash
npm test
```

Runs Node's built-in test runner (`node:test`) against the fiscal model. Five sanity tests:

1. Projection spans 2026 → 2056 (31 years).
2. Stronger shocks raise long-run debt/GDP.
3. Stronger reforms lower long-run debt/GDP.
4. Government metrics push the expected stress dials (CPI raises trade disruption + funding pressure; unemployment lowers public support; weather alerts raise disaster shock).
5. The spherical projection returns finite coordinates across a wide lat/lon grid.

The simulation is mirrored in `server/src/simulation.js` and `client/src/lib/simulation.js`. The frontend copy is for synchronous slider response; the backend copy exists so tests can run without a DOM.

## The simulation model, in plain English

The projection is in `server/src/simulation.js`. It is intentionally a teaching model — clear, legible, transparent — not a forecast. Round numbers, exposed coefficients, no Monte Carlo, no stochastic interest path. The point is to make causal stories visible.

### Baseline

```js
baseline = {
  startYear: 2026, endYear: 2056,
  gdp2026: 32.0,           // trillions
  debtToGdp2026: 101,
  deficitToGdp2026: 5.8,
  deficitToGdp2036: 6.7,
}
```

`baselineDeficitToGdp(year)` linearly interpolates between 5.8% and 6.7% through 2036, then drifts up 0.09 pp/yr. That's the path you'd get if Congress did nothing.

### Policy effect

```js
fiscalPolicyEffect(policy, stress, year):
  phaseIn = clamp((year - 2026) / 8, 0.1, 1)
  revenueGain          = (policy.revenueReform        / 100) * 1.65 * phaseIn
  discretionarySavings = (policy.discretionaryCuts    / 100) * 0.85 * phaseIn
  healthcareSavings    = (policy.healthcareEfficiency / 100) * 1.15 * slowPhaseIn
  ssSavings            = (policy.socialSecurityReform / 100) * 1.05 * verySlowPhaseIn
  defenseCost          = ((policy.defensePosture - 50) / 50) * 0.45 * phaseIn
  industrialCost       = (policy.industrialPolicy     / 100) * 0.32 * phaseIn
  climateCostNow       = (policy.climateResilience    / 100) * 0.22 * phaseIn
  climateSavingsLater  = (policy.climateResilience    / 100) * 0.42 * postLatePhaseIn
  haircut              = clamp(1 - polarization * 0.35 - pacPressure * 0.20, 0.35, 0.95)
  return (sumOfSavings) * haircut - sumOfCosts
```

Two things matter:

- **Phase-in.** Revenue and discretionary reforms take 8 years to bite. Healthcare takes 12. Social Security takes 16 — that's why a 22% SS slider barely moves the 2036 number but reshapes 2056.
- **Implementation haircut.** Polarization and PAC pressure haircut the realized policy effect. A perfect package with a 90 polarization score loses 35% of its bite before it touches the budget. *This is the most pedagogically important coefficient in the whole model.*

### Macro shock effect

```js
macroShockEffect(stress, year):
  conflict   = (stress.conflictShock    / 100) * 0.45
  disasters  = (stress.disasterShock    / 100) * 0.28
  trade      = (stress.tradeDisruption  / 100) * 0.38
  funding    = (stress.fundingPressure  / 100) * 0.52
  amplifier  = 1 + max(0, year - 2036) * 0.018
  return (conflict + disasters + trade + funding) * amplifier
```

`amplifier` makes late-cycle shocks worse, mimicking the way debt-stock effects compound.

### Year-by-year roll

```js
for year 2026..2056:
  policyEffect = fiscalPolicyEffect(...)
  shockEffect  = macroShockEffect(...)
  interestFeedback = (debtToGdpBefore > 115) ? (debtToGdpBefore - 115) * 0.018 : 0
  deficitToGdp = clamp(baseline - policyEffect + shockEffect + interestFeedback + optionsDelta, 1.2, 15)
  deficit = gdp * deficitToGdp / 100
  debt   += deficit
  growth  = clamp(0.042 - max(0, debtToGdp - 105) * 0.0009 - tradeDisruption * 0.006, 0.018, 0.052)
  gdp    *= 1 + growth
```

Three feedbacks worth noting:

- **Interest feedback** above 115% debt/GDP. The deficit gets worse the further past the threshold you are. This is what makes "high debt is fine until it isn't" visible in the chart.
- **Growth drag** above 105% debt/GDP. Nominal growth falls 0.09 pp for every percentage point of debt/GDP above 105.
- **Trade disruption** also drags growth. A 60-point trade disruption shock subtracts 0.36 pp from nominal growth.

### Scoring

- **Sustainability score** = `100 - (debt2056 - 80) * 0.38 - deficit2056 * 4 + politicalViability * 0.15 - fundingStress * 0.15`, clamped 0–100.
- **Political viability** = `55 + (publicSupport * 0.45 + congressMargin * 0.35) - (polarization * 0.35 + pacPressure * 0.32 + pain * 0.28)`, where `pain` is a weighted sum of how aggressive your reforms are.
- **Funding stress** = `fundingPressure * 0.45 + (debt2056 - 100) * 0.5 + deficit2056 * 3.2`, clamped 0–100.
- **CBO options Δ** = sum of selected option 10-year dollar effects, divided by 10 years, divided by ~$34T average GDP. Adds directly to each year's deficit/GDP.

### Role scoring

Each role applies its own weighting to the same outputs. Pulled from `client/src/lib/roles.js`:

- **Fiscal Hawk** — `debtScore * 0.55 + defScore * 0.30 + sustain * 0.15`
- **Social Investment** — rewards public support and healthcare investment; penalizes aggressive discretionary cuts and harsh SS reform.
- **Defense Strategist** — `(posture * 0.8 + conflictReadyBonus) * 0.6 + fundingRoom * 0.4`
- **Climate Planner** — `(climate * 0.7 + industrial * 0.3) - max(0, disaster - 40) * 0.5`
- **Political Whip** — straight `politicalViability`.

The same package can score 82 for the Fiscal Hawk and 41 for the Social Investment Advocate. That's the point — students are forced to argue tradeoffs.

### Political capital

Each lever has a per-unit cost (see `scoreAxes.js`):

| Lever | Cost / unit | Why |
| --- | --- | --- |
| Social Security reform | 0.45 | Most politically expensive |
| Revenue reform | 0.35 | Tax increases cost |
| Discretionary cuts | 0.30 | Cuts are unpopular |
| Defense posture | 0.30 × \|v−50\| | Moves in either direction cost |
| Healthcare efficiency | 0.18 | Moderate, doable |
| Industrial policy | 0.18 | Moderate |
| Climate resilience | 0.12 | Cheapest political ask |

Budget is 100. Overspend → bar turns oxblood, copy warns "Watch viability collapse."

## Cartography

There are four maps. Three are hand-rolled SVG; one is the existing rotating globe upgraded to drag-to-spin.

### Plate I — Flat transmission map (equirectangular)

`FlatTransmissionMap.jsx`. Projection is the simplest geographic projection there is:

```js
x = ((lon + 180) / 360) * W
y = ((90 - lat) / 180) * H
```

Continent polygons are 6 hand-traced outlines. Region nodes drop on top, sized by impact. Arcs from each region into the U.S. budget anchor (a black circle at `(-100, 39)`) are quadratic Béziers with a control point biased upward. Hover any node and a tooltip emerges with the region's full variable breakdown.

### Plate II — Rotating globe (orthographic)

`Globe.jsx` + `globeProjection.js`. Standard orthographic projection of `(lat, lon, rotation)` to 2D:

```js
latRad = lat * π / 180
lonRad = (lon + rotation) * π / 180
x3d = cos(latRad) * sin(lonRad)
y3d = sin(latRad)
z3d = cos(latRad) * cos(lonRad)
front = z3d > 0
```

Back-face culling is just "drop anything with `z3d ≤ 0`." Latitude lines (5° steps) and longitude lines (4° lat steps) get the same treatment. The continent polygons clip to the sphere via SVG `clipPath`. Auto-rotates 0.55°/40ms, pauses on hover, and supports pointer-capture drag-to-spin.

### Plate III — U.S. domestic atlas

`USPressureMap.jsx`. A hand-traced U.S. silhouette as one path string. Five census-region anchors at hand-picked canvas coords, sized by current stress dial values. A DC anchor labeled with the live Treasury rate and total debt. A black banner in the corner with the live NWS active-alert count. A strip across the bottom with CPI, unemployment, average rate, and debt as four "fig." figures.

Pedagogically this is the map where students realize the simulation isn't a fiction — those are real numbers from real APIs.

### Plate IV — Historical reference chart

`HistoricalDebtChart.jsx`. Your projected debt/GDP path 2026 → 2056 charted against five real historical anchors as dashed reference lines:

| Anchor | Value | Source / context |
| --- | --- | --- |
| Japan today | 250% | OECD; high-debt, low-rate equilibrium |
| U.S. WWII peak | 119% | 1946; later eroded by growth, not austerity |
| Eurozone crisis avg. | 105% | Greece/Italy/Spain peaks, 2010–2015 |
| U.S. today (~2026) | 100% | Roughly current |
| 1990s low | 35% | Post-OBRA, post–dot-com boom |

Hover any line and a tooltip explains the episode. A peak callout marks your run's worst year and value.

## Atlas, the macro mentor

The most ambitious piece. Three modules:

### `server/src/mentor/llm.js`

The Claude integration. Key design choices:

- **Model:** `claude-haiku-4-5-20251001` by default. Fast, cheap, eligible for prompt caching. Override with `MENTOR_MODEL` env var.
- **System prompt:** A single long block defining role, voice, response modes (`explain`, `debate-prep`, `professor-prompt`, `historical-case`), depth modes (`simple`, `standard`, `advanced`), and a strict JSON output schema. Misconceptions to watch for are baked in (debt vs. deficit confusion, "tax hikes fix debt instantly," etc.).
- **Prompt caching:** The system prompt is wrapped in `{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }`. Repeat turns within ~5 minutes hit the cache, paying ~10% of the system-prompt cost. This is the difference between expensive and affordable for a classroom.
- **Strict JSON contract:** The system prompt forbids markdown fences and free prose. The handler strips a `\`\`\`json` fence if the model slips one in, parses with `JSON.parse`, and returns the well-typed object: `{ answer, keyConcept, historicalPrecedent, tradeoff, discussionQuestion, confidenceNote }`.

### `server/src/mentor/fallback.js`

The deterministic mentor. Reads the same scenario context the LLM would get and routes the question to a rule-based responder based on keywords:

- Mentions "debt" or "deficit" → `debtParagraph()` returns the right narrative with the user's actual numbers.
- Mentions a policy lever → `leverExplanations[leverKey]` lookup returns direct/model/tradeoff/historical for that lever.
- Mentions a stress dial → `stressExplanations` lookup.
- Mentions "political viability" → custom paragraph that walks through the politicalViability formula with the user's actual coefficients.
- Falls back to `findBestPrecedent()` to attach a historical anchor.

Always returns the same JSON shape the LLM returns. The UI is identical.

### `server/src/routes/mentor.js`

The router. Tries LLM first if `ANTHROPIC_API_KEY` is set; if the LLM call throws, logs and falls through to `fallbackMentor` with `mode: "fallback-after-error"` in the response. The frontend never sees a broken state.

### Frontend: `AtlasMentor.jsx` + `ScenarioStory.jsx`

Atlas is a floating black square FAB (banknote-styled, drop shadow in money-green) bottom-right. Click expands into a chat panel. Mode + depth selectors. Suggested prompt chips that change per mode. Pulse animation triggers when debt/GDP exceeds 175, viability falls below 40, or funding stress crosses 75.

`ScenarioStory` pushes the same `/api/mentor/chat` endpoint with the current run as context but lives inline in the dashboard. Five reshape buttons: Re-read, Make it simpler, Explain like Econ 1, Add historical precedent, Turn into a debate argument. Each maps to a different `mode`+`depth` combo and a different prefilled question.

## Government data layer

`server/src/governmentSources.js` is a small adapter pattern. Each source declares a `fetch()` async function that returns `{ payload, parsed }` with `parsed: { value, display, asOf }`. `fetchGovernmentSource(id)` calls it and wraps the result in a normalized shape:

```ts
{
  sourceId, label, agency, metricKey,
  status: "live" | "cached" | "offline" | "empty",
  value: number | null,
  display: string,
  asOf: string,
  fetchedAt: ISO string,
}
```

The route handler in `server/src/routes/governmentMetrics.js` adds a **10-minute freshness window**. On a hit, return cached. On a miss, fetch live, upsert into `MetricCache`, return live. On an upstream failure with no cache yet, return `status: "offline"` with `value: null`.

The frontend uses `metricKey → metricValue` to drive `applyRealDataToStress()` in `simulation.js`:

- Higher Treasury debt (debt-to-GDP proxy > 105%) → raises funding pressure.
- Higher Treasury average rate (> 3.25%) → raises funding pressure sharply.
- Higher CPI YoY (> 2.2%) → raises trade disruption; above 2.5% also raises funding pressure.
- Higher unemployment (> 4%) → lowers public support, raises polarization.
- More active NWS alerts → raises disaster shock (capped at +22).

The UI surfaces every adjustment honestly: an inline strip under the government tiles reads `Live-data stress adjustments: publicSupport: 55 → 54 · fundingPressure: 42 → 50 · ...` so students can see *what live data did to my run*.

## Persistence layer

Two Prisma models, both in `server/prisma/schema.prisma`:

```prisma
model Scenario {
  id                String   @id @default(cuid())
  name              String
  notes             String?
  policyJson        String
  manualStressJson  String
  derivedStressJson String
  liveDataJson      String
  regionsJson       String
  summaryJson       String
  createdAt         DateTime @default(now())
}

model MetricCache {
  id          String   @id @default(cuid())
  sourceId    String   @unique
  label       String
  agency      String
  value       Float?
  display     String
  asOf        String?
  status      String
  payloadJson String?
  fetchedAt   DateTime @default(now())
}
```

**Why JSON-blob scenarios?** The simulation is actively changing — I add new sliders, options, and role scores often. A normalized scenario schema would force a Prisma migration every time. JSON columns let me iterate while still satisfying "data is persisted to a database." Route handlers parse JSON back into objects before returning, so API consumers never see raw strings.

The `MetricCache.upsert()` call in `governmentMetrics.js` was the moment Prisma "clicked" for me. One declarative call replaces a SELECT-then-INSERT race I would have had to handle manually in raw SQL.

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/government-metrics` | All five sources, parallel fetch, cached if available |
| `GET` | `/api/government-metrics/:sourceId` | One source: `treasury-debt`, `treasury-rates`, `bls-cpi`, `bls-unemployment`, `nws-alerts` |
| `GET` | `/api/scenarios` | Newest first, max 25 |
| `GET` | `/api/scenarios/:id` | One scenario, parsed |
| `POST` | `/api/scenarios` | Save current run (Zod-validated) |
| `DELETE` | `/api/scenarios/:id` | Delete a saved scenario |
| `GET` | `/api/mentor/status` | `{ "llm": true \| false }` |
| `GET` | `/api/mentor/precedents` | Shared historical knowledge base |
| `POST` | `/api/mentor/chat` | Atlas chat: `{ question, mode, depth, context }` → JSON response |

Example government metric response:

```json
{
  "sourceId": "treasury-debt",
  "label": "Debt to the Penny",
  "agency": "U.S. Treasury Fiscal Data",
  "metricKey": "debtTrillions",
  "status": "live",
  "value": 38.94,
  "display": "$38.94T",
  "asOf": "2026-05-08",
  "fetchedAt": "2026-05-12T01:51:07.832Z"
}
```

Example mentor response (deterministic fallback):

```json
{
  "answer": "Debt rises when annual deficits keep adding to the stock faster than nominal GDP grows. Your projection ends at ~251% debt/GDP and ~10.7% deficit/GDP, with borrowing pressure at 100/100. Past 115% debt/GDP the model adds an interest-cost feedback that widens future deficits.",
  "keyConcept": "Debt dynamics",
  "historicalPrecedent": { "title": "Eurozone sovereign debt crisis (2010–2015)", "summary": "..." },
  "tradeoff": "Your package is politically realistic but does not bend the debt curve much — the long-run debt path keeps rising.",
  "discussionQuestion": "If debt keeps rising on this path, what is the first thing you would change in the package — and what would you protect?",
  "confidenceNote": "Deterministic mode — no LLM configured. Studium is an exploratory classroom model, not an official fiscal forecast."
}
```

## Design system

The visual reference was the YC startup Pax Historia. The brief: a banknote / ledger feel, not a hedge-fund terminal.

**Palette** (defined as CSS variables in `style.css`):

| Token | Value | Used for |
| --- | --- | --- |
| `--paper` | `#eaf0e2` | Page background, card fill |
| `--paper-2` | `#dde6d2` | Map stages, side panels |
| `--ink` | `#0c2a36` | Primary text, dark fills |
| `--ink-soft` | `#2a4756` | Secondary text |
| `--accent-sienna` (currency green) | `#1f6b3a` | Primary accent, "money green" |
| `--accent-forest` | `#1f6b3a` | Live status, positive deltas |
| `--accent-ocean` | `#143b55` | Cached status |
| `--accent-oxblood` | `#7a2424` | Offline status, over-budget capital |
| `--accent-mustard` | `#b08a2c` | Brass highlights, seals |

**Typography:**

- **Fraunces** (variable font) — display headlines, figure values, story text. Opsz: 144 for big display, default elsewhere.
- **Inter** — body text.
- **JetBrains Mono** — eyebrows, status badges, axis labels, "fig. 01"–"fig. 04" stamps, every monospaced field.

**Structural rules:**

- Hairline 1px borders, never rounded > 16px (most surfaces are 0px corners — banknote-flat).
- Tabular numerals (`font-variant-numeric: tabular-nums lining-nums`) for every figure value.
- Editorial eyebrows are uppercase, letterspaced (`0.14em`), 11px JetBrains Mono, prefixed with a green pip dot.
- Dossier strips have vertical dividers and "fig. 01" stamps in the top-left of each cell — directly cribbed from print almanac layouts.
- The Atlas FAB is a flat black square with a green drop shadow — visually echoes a stamped seal.
- Paper texture is a 6×6 SVG pattern of low-alpha ink dots, layered over the page background.

## Pedagogy

Why these features, in order of pedagogical importance:

1. **Conflicting role scores.** Same package, different mandate. Forces argument. This is the single most powerful feature for a classroom.
2. **"Why?" buttons everywhere.** Reduces cognitive overload. Students don't need to understand everything upfront — they pull explanation on demand, in context.
3. **Atlas with historical precedents.** Connects model behavior to real history. Students don't learn "high debt is bad in some abstract way" — they learn "Japan has done it for 30 years, but here's why their fragility looks different from the eurozone's."
4. **Tradeoff radar.** Visual gestalt. A balanced shape is obviously different from a spiky one.
5. **Political-capital meter.** Teaches the brutal truth: good policy that's politically impossible is a coffee-table book, not a budget.
6. **Live government data.** Makes the simulation feel real. The 233 NWS alerts feeding disaster shock are happening right now.
7. **Scenario story.** Closes the loop. Students hit Charts → "Make it simpler" → readable paragraph → can defend it out loud.
8. **Tutorial.** Reduces first-run friction. New students can find the dossier, sliders, maps, and Atlas in 90 seconds.

## Learning journey

### What inspired this
Most budget simulators look like a CBO spreadsheet — accurate but dry. The pedagogical problem isn't "do students understand the arithmetic." It's "do they understand why fiscal policy fails in practice." I wanted something that *feels* like the actual job: a control room where wars, disasters, inflation, lobbying, and political polarization all push and pull on a long-run debt path, and where students have to defend tradeoffs out loud.

The pivot to a classroom-focused, editorial-styled "Studium" came mid-build, after I looked at my first cut and realized the dark-dashboard aesthetic was hostile to first-year students. Pax Historia–style cartography and a TA-voiced AI mentor make the data feel approachable. The shift from cold pastels → ledger green/navy was the moment the visual identity stopped fighting the product idea.

### Potential impact
For a first- or second-year college class — intro macro, public policy, political economy, American government — this turns a static lecture about debt sustainability into a 30-minute group exercise. Students see that interest costs feed back once debt/GDP runs hot, that polarization haircuts even well-designed reforms, that a 2-point CPI surprise can outweigh a small reform package, and that the same package can be brilliant for the Fiscal Hawk and a disaster for the Social Investment Advocate. They also see *historical analogs*, not numbers in isolation.

It is not a replacement for CBO modeling. It is a teaching tool with a backbone of real, live government data.

### New technology I learned: **Prisma**

I had only used raw SQL and a query builder before. The Prisma flow — schema-first, generated client, typed `findUnique`/`upsert` — was new to me. The "click" moment was switching the government-metric cache to a single `upsert()` call instead of a SELECT-then-INSERT race I would have written manually. The schema's `@unique` constraint on `sourceId` + Prisma's `where`/`update`/`create` semantics get you atomic behavior for free.

I picked Prisma because it lets me iterate the data model fast (`prisma db push` in one command — no migration file dance) without giving up the safety of generated types. The schema lives in one file; the client regenerates automatically on `postinstall`.

Other firsts I want to acknowledge honestly:

- **Anthropic SDK with prompt caching.** I'd never built an LLM-backed product before. The integration in `mentor/llm.js` is my first serious use of `cache_control: ephemeral`, the strict JSON output contract pattern, and the depth/mode response-shape approach.
- **Hand-rolled SVG cartography.** No D3, no Mapbox, no leaflet. The spherical and equirectangular projections in `globeProjection.js` and `FlatTransmissionMap.jsx` are about 60 lines of `Math.sin`/`Math.cos`. First time I'd written this from scratch.
- **Editorial typography system.** Fraunces variable font with optical sizing was new. So was the discipline of using exactly three font families (Fraunces, Inter, JetBrains Mono) and one accent color across a 900-line stylesheet.

## Technical rationale

**Why an SVG globe instead of WebGL / Mapbox?** Debuggability and weight. The projection is one `Math.cos/Math.sin` block; I can stop and inspect every point. A WebGL globe would have looked flashier but pulled in a much heavier dependency stack, and Mapbox would have leaked the visual budget to vendor styling instead of the editorial direction I wanted (paper textures, hairline rules, Fraunces serif headlines).

**Why a JSON-blob schema for scenarios?** The simulation is actively changing — I add new sliders, options, and role scores often. A fully normalized scenario schema would force a Prisma migration every time. JSON columns let me keep moving while still satisfying "data is persisted to a database."

**Why mirror the simulation in `client/src/lib/simulation.js` AND `server/src/simulation.js`?** The frontend needs the model to be synchronous so sliders feel instant. The backend keeps its own copy so the unit tests can run without a browser. They're intentionally kept in lock-step — when I change a coefficient I change it in both.

**Why an LLM with a deterministic fallback instead of "AI-only"?** Educational products can't break when a key isn't set or the network blips. `mentor/fallback.js` reads the same scenario context the LLM gets and returns the same JSON response shape, so the UI looks identical and the user never sees a degraded experience. The LLM mode is a quality upgrade, not a hard dependency.

**Why prompt caching on the system prompt?** The Atlas system prompt is ~1.5KB of stable text — role definition, voice, modes, depths, JSON schema, misconceptions list. Without caching, every turn pays for it. With `cache_control: ephemeral`, the first turn writes the cache (~5 min TTL) and every follow-up turn pays ~10% of the cost. For a classroom of 30 students each asking 5–10 questions, this is the difference between expensive and trivially affordable.

**Why the "Why?" pattern instead of dense tooltips?** Cognitive load. First-year students glaze over dense numeric dashboards. A small "Why?" button under each figure is an invitation rather than an info-dump. Clicking opens Atlas with the right question prefilled, so the user doesn't have to know what to ask.

**Why role-based scoring?** Forces argument. The same package can be excellent for one role and terrible for another. That's the whole pedagogical point — fiscal policy isn't optimal-vs-suboptimal, it's "for whom."

**Biggest tradeoff:** scope vs. shippability. A truly rigorous fiscal model would need stochastic interest paths, CBO option scoring with distributional outputs, primary-balance accounting, automatic stabilizers, real Monte Carlo. I cut all of that to ship a working, interactive, full-stack app on time with real government data flowing end-to-end. The model is intentionally legible, not a forecast — and the disclaimer says so prominently in every render.

**Second-biggest tradeoff:** classroom multi-user mode. I designed Atlas, the role HUD, and the scenario save flow so that adding `ClassSession`, `Vote`, and `Comment` schemas later is straightforward. I did *not* ship that join-code-and-leaderboard flow in this submission because it would have required a real auth shim and would have competed for design attention with the editorial cartography. Future improvement.

## Three hardest bugs

### 1. The silent BLS YoY failure

The CPI tile read "280.7 index" instead of "3.3% YoY" and the projection drifted in a way I couldn't immediately explain.

`parseBlsYoY()` finds the most recent monthly record, then looks for the same month in the prior year to compute YoY. In my first version, the fetcher used `GET /publicAPI/v2/timeseries/data/CUUR0000SA0`. That endpoint *works* — but for unregistered users it only returns the *current calendar year*. So `latest` was the most recent month of 2026; `prior` was a search for January 2025, which didn't exist in the response; `prior` was `undefined`; the fallback returned `display: latestValue.toFixed(1) + " index"`. No error, no warning, just a bad display.

The fix lives in `server/src/governmentSources.js` → `fetchBlsSeries()`:

```js
const body = {
  seriesid: [seriesId],
  startyear: String(now.getUTCFullYear() - 2),
  endyear:   String(now.getUTCFullYear()),
};
if (process.env.BLS_API_KEY) body.registrationkey = process.env.BLS_API_KEY;

const response = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
  method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(body),
});
```

Two changes: `POST` instead of `GET`, and an explicit 2-year window. Now `parseBlsYoY()` always has 13+ months and the YoY math succeeds. The optional `BLS_API_KEY` env var unlocks deeper history and a higher rate limit.

**Lesson:** an API that "works" can still silently break a downstream computation. Always validate that the data you got is the data you assumed you got.

### 2. NWS `area=US` is not a valid value

After fixing BLS, the NWS tile went red ("offline"). NWS docs say `area=` takes state codes (NY, CA, ...) or marine zone codes (PZ, LM, ...). `US` is not in the enum. The endpoint returned 400.

Fix: drop the `area` filter, add `message_type=alert`:

```js
const response = await fetch("https://api.weather.gov/alerts/active?status=actual&message_type=alert", {
  headers: { Accept: "application/geo+json", "User-Agent": "GlobalBudgetPressureMap/1.0 (student project)" },
});
```

NWS also requires a `User-Agent` header (deny-by-default policy) which I'd set from day one. The endpoint now returns ~200–300 live alerts at any given moment.

### 3. Auto-rotate fighting drag-to-rotate

After adding drag-to-rotate on the globe (pointer-capture, delta math against a stored start-rotation), the globe would jump every frame because the auto-rotate `setInterval` kept incrementing rotation by 0.55° between drag pointer-moves.

Fix: a second `isDragging` state. The auto-rotate `useEffect` early-returns when either `isPaused` (hover) or `isDragging` (active grab) is true:

```js
useEffect(() => {
  if (isPaused || isDragging) return undefined;
  const timer = setInterval(() => setRotationDeg(prev => (prev + 0.55) % 360), 40);
  return () => clearInterval(timer);
}, [isPaused, isDragging]);
```

Combined with `touchAction: "none"` on the stage div, drag now feels natural on both mouse and touch.

## AI usage

I wrote the project myself, and used an AI assistant occasionally — mostly as a faster Stack Overflow when I needed a quick reminder on a library API or wanted a second opinion on a config snippet. The interesting work (model, cartography, design system, Atlas architecture, debugging) is mine.

**Specific prompt I used early on:**

> "Help me turn this fiscal simulator frontend into a full-stack app that requires a backend, database persistence, and server-side external API calls. Use government APIs for Treasury debt, BLS inflation/unemployment, and NOAA weather alerts."

**How I adapted the output:**

The AI's first sketch tried to call Treasury, BLS, and NOAA directly from React, which violated the challenge requirement (and would have leaked any future API key). I threw that out and wrote the `/api/government-metrics` adapter layer myself — `server/src/routes/governmentMetrics.js` and `server/src/governmentSources.js` are hand-written, including the 10-minute cache window, the normalized response shape, and the live/cached/offline fallback chain. The AI also suggested Redux and a normalized SQL schema; I rejected both as overkill for a single-user prototype.

**What I wrote myself.** The fiscal model — projection function, the interest-feedback term at 115% debt/GDP, the political-implementation haircut, role-specific scoring, the political-capital cost function, every coefficient — is mine, tuned by hand until the responses matched my mental model. All four cartographic plates (projection math, continent polygons, region anchors, drag-to-rotate, hover tooltips) are mine. The editorial design system, the Atlas JSON contract, the deterministic fallback mentor, the prompt-caching integration, the tutorial, the BLS / NWS bug fixes — all hand-written.

**Where AI was useful in small ways.** Asking what the right `cache_control` syntax was. Quickly recalling a Recharts prop name. Sanity-checking a CSS variable approach. These were lookup questions, not architecture decisions.

## How this meets the DALI CYOA requirements

| Requirement | Where it lives |
| --- | --- |
| Full-stack (frontend + backend) | `client/` (React+Vite, port 5173) and `server/` (Express, port 4000) |
| At least one new framework / language | **Prisma** as the headline; also first-time use of Anthropic SDK with prompt caching and hand-rolled SVG cartography |
| Dynamic functionality, not static | Live sliders, drag-to-rotate globe, scenario presets, CBO option toggles, save/delete, Atlas chat, scenario story regenerator, role HUD scoring, political-capital meter |
| Intuitive, responsive UI | Editorial design system, 6-step tutorial, "Why?" buttons throughout, mobile breakpoints in `style.css` |
| At least one API endpoint | 11 endpoints (health, government-metrics ×2, scenarios ×4, mentor ×3) |
| Data persistence | Prisma + SQLite, two models (`Scenario`, `MetricCache`) |
| Server-side logic | Government adapter layer, BLS YoY math, projection model (mirrored for tests), Atlas fallback mentor, scenario validation with Zod, prompt-cached LLM integration |
| External 3rd-party API, server-side only | Treasury Fiscal Data, BLS, NOAA/NWS, optional Anthropic — all in `server/src/`. The React app only calls `/api/*` |
| Documented learning journey, AI usage, technical rationale | This README |

## Before submitting

- [ ] `npm run install:all`
- [ ] `npm run db:push`
- [ ] `npm run dev`
- [ ] `npm test` is green
- [ ] Save at least one scenario through the UI
- [ ] Add `docs/dashboard.png`, `docs/maps.png`, `docs/atlas.png` screenshots
- [ ] Record a 30–60s demo video or GIF
- [ ] Test the README setup steps on a fresh clone
- [ ] Fill in the deployed app URL at the top of this file
- [ ] (Optional) Set `ANTHROPIC_API_KEY` so reviewers see the live LLM mentor, not the fallback

## Future improvements

- **Classroom mode with join codes.** Students enter `Class code: ECON22 / Group name: Team Keynes / Role: Fiscal Hawk`. Teachers see all group submissions, averages, vote totals, most-popular packages.
- **Class vote + leaderboards** across Most Sustainable / Most Realistic / Best Social Tradeoff / Most Resilient / Best Historical Defense.
- **Comment threads** per saved scenario, persisted server-side.
- **Compare mode** for two scenarios side-by-side.
- **"Policy cards"** UI — concrete CBO options as deck-building game pieces with fiscal-impact / political-difficulty / distributional / time-horizon chips.
- **CBO baseline ingestion** and option scoring directly from `cbo.gov`.
- **FEC campaign-finance data** to make PAC pressure a real signal.
- **Monte Carlo uncertainty intervals** on the debt path.
- **WebGL globe** with full drag-to-rotate, 3D arcs, and elevation tiles.
- **Accounts** with shareable scenario permalinks.
- **Mobile-native** experience — currently the layout collapses gracefully but the radar and maps could use a vertical-priority rebuild.
