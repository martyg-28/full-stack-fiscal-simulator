# Studium · The Policy Simulation Studio

A classroom atlas for U.S. fiscal policy. Students build a policy package, expose it to global shocks pulled from live government data, and trace the result across a long-run debt path through 2056 — then debate the tradeoffs with the help of an LLM-backed Macro Mentor named Atlas.

> Submitted as a DALI Lab **Choose-Your-Own-Adventure** full-stack challenge.

**Deployed app:** _add deployment URL here_
**Demo video / GIF:** _add link here_
**Screenshots:** _add `docs/dashboard.png`, `docs/maps.png`, `docs/atlas.png` before submitting_

---

## What it does

- **Policy Builder.** Seven fiscal-policy sliders (revenue reform, healthcare efficiency, Social Security, defense posture, climate resilience, industrial policy, discretionary cuts) plus 30+ CBO-scored budget options from the Concord Coalition options book. Toggle proposals, watch the 10-year deficit impact recompute live.
- **Group roles with conflicting objectives.** Five role cards — Fiscal Hawk, Social Investment Advocate, Defense Strategist, Climate Resilience Planner, Political Whip. Same model output, different scoring function, so groups have to defend tradeoffs.
- **Tradeoff radar.** Five-axis radar (Sustainability, Political Viability, Growth, Social Resilience, Shock Readiness) so a package's shape is instantly readable.
- **Political-capital meter.** A 100-point budget that drains based on how aggressive each lever is. Overspend and your viability collapses.
- **Four cartographic plates.** Plate I — equirectangular transmission map. Plate II — rotating, drag-to-spin globe in parchment styling. Plate III — U.S. domestic-pressure map fed by live NWS / Treasury / BLS data. Plate IV — your projected debt path against five historical reference lines (Japan today, WWII U.S., Eurozone crisis, U.S. today, 1990s low).
- **Atlas Macro Mentor.** A floating chat widget that explains *why* the model moved, using the live scenario as context. Backed by Anthropic Claude (Haiku 4.5) with prompt caching; falls back to a deterministic rule-based mentor when no API key is set.
- **Scenario Story.** A live, plain-English narrative of the current run with one-click reshape buttons: Make it simpler / Explain like Econ 1 / Add historical precedent / Turn into a debate argument.
- **Why? buttons everywhere.** Every dossier figure, every government-data tile, every radar axis has a 1-click "ask Atlas" deep-link so students never get stuck staring at a number.
- **Historical Precedent Timeline.** Ten real macro episodes from WWII through the IRA, clickable into Atlas's historical-case mode.
- **Tutorial.** 6-step first-run modal walking new users from the dossier to Atlas. Re-openable from the masthead.
- **Scenario persistence.** Prisma + SQLite save scenario runs (policy, derived stress, summary, selected CBO options, role) and a separate `MetricCache` table holds the last good response from each government API so the app stays useful when an upstream API blips.

## Stack

**Frontend** React + Vite, Recharts, Framer Motion, hand-rolled SVG cartography (spherical projection for the globe, equirectangular for the flat maps, radar/timeline rendered as SVG primitives), Fraunces/Inter/JetBrains Mono editorial typography.

**Backend** Node.js + Express, Prisma ORM over SQLite, Zod input validation, `@anthropic-ai/sdk` for the live mentor with `cache_control: ephemeral` on the system prompt.

**External APIs (all called server-side, never from React):**
- U.S. Treasury Fiscal Data — Debt to the Penny + average Treasury interest rates
- Bureau of Labor Statistics — CPI-U inflation (POSTed with explicit `startyear`/`endyear` so YoY actually has 13 months of data) and the headline unemployment rate
- NOAA / National Weather Service — active U.S. alerts
- Anthropic Claude (optional, key-gated) — Atlas's real-time tutoring

## Project structure

```txt
studium/
├─ client/
│  ├─ index.html
│  ├─ vite.config.js
│  └─ src/
│     ├─ App.jsx
│     ├─ main.jsx
│     ├─ style.css
│     ├─ components/
│     │  ├─ EditorialMasthead.jsx     Studium wordmark + date + tour button
│     │  ├─ ClassMissionCard.jsx      "Advise Congress in 2028" prompt + roles
│     │  ├─ RoleHUD.jsx               Role selector + role score + capital meter
│     │  ├─ TradeoffRadar.jsx         5-axis SVG radar
│     │  ├─ ScenarioStory.jsx         Live narrative + reshape buttons
│     │  ├─ FlatTransmissionMap.jsx   Plate I — equirectangular world map
│     │  ├─ Globe.jsx                 Plate II — drag-to-rotate sphere
│     │  ├─ USPressureMap.jsx         Plate III — U.S. silhouette + live data
│     │  ├─ HistoricalDebtChart.jsx   Plate IV — your debt path vs. anchors
│     │  ├─ PrecedentTimeline.jsx     Horizontal precedent strip
│     │  ├─ GovernmentPanel.jsx       Treasury/BLS/NOAA tiles
│     │  ├─ PolicyOptionsPanel.jsx    CBO budget options with category tabs
│     │  ├─ Controls.jsx              Sliders for policy + stress
│     │  ├─ Charts.jsx                Debt path, regional impact, deficit
│     │  ├─ PersistencePanel.jsx      Saved scenarios list
│     │  ├─ AtlasMentor.jsx           Floating chat widget
│     │  └─ Tutorial.jsx              6-step onboarding overlay
│     ├─ hooks/
│     │  ├─ useGovernmentData.js
│     │  └─ useScenarioPersistence.js
│     └─ lib/
│        ├─ simulation.js             Projection model
│        ├─ globeProjection.js
│        ├─ regions.js
│        ├─ presets.js                Scenario presets
│        ├─ policyOptions.js          CBO/Concord catalog + deficit math
│        ├─ roles.js                  5 role scoring functions
│        ├─ scoreAxes.js              Radar axes + political-capital math
│        ├─ atlasPrompts.js
│        └─ api.js
├─ server/
│  ├─ prisma/schema.prisma            Scenario + MetricCache models
│  ├─ test/simulation.test.js
│  └─ src/
│     ├─ index.js                     Express bootstrap
│     ├─ simulation.js                Mirror of client simulation (testable)
│     ├─ governmentSources.js         Treasury / BLS / NOAA adapters
│     ├─ lib/prisma.js
│     ├─ mentor/
│     │  ├─ llm.js                    Anthropic Claude integration
│     │  ├─ fallback.js               Deterministic mentor (no-key fallback)
│     │  ├─ historicalPrecedents.js   Shared knowledge base
│     │  └─ leverExplanations.js
│     └─ routes/
│        ├─ governmentMetrics.js      GET / + GET /:sourceId
│        ├─ scenarios.js              GET, GET/:id, POST, DELETE
│        └─ mentor.js                 POST /chat, GET /status, GET /precedents
├─ scripts/setup-env.mjs
├─ package.json                       Root orchestrates client/server scripts
└─ README.md
```

## Setup

```bash
git clone https://github.com/martyg-28/full-stack-fiscal-simulator.git
cd full-stack-fiscal-simulator
npm run install:all   # installs both client/ and server/
npm run db:push       # creates server/prisma/dev.db via Prisma
npm run dev           # client on 5173, server on 4000 (Vite proxies /api → 4000)
```

The `setup` step auto-copies `server/.env.example` → `server/.env` on the first run. Adjust `DATABASE_URL` or `PORT` there.

**Turn on Atlas's real LLM tutoring** (optional — fallback works without it): get a key at [console.anthropic.com](https://console.anthropic.com/), then in `server/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
MENTOR_MODEL=claude-haiku-4-5-20251001
```

### Tests

```bash
npm test
```

Runs Node's built-in test runner against the fiscal model. Sanity tests confirm projection spans 2026 → 2056, shocks worsen the long-run debt, reforms improve it, government metrics push the expected stress dials, and the spherical projection returns finite coordinates everywhere.

## API endpoints

```http
GET    /api/health
GET    /api/government-metrics
GET    /api/government-metrics/:sourceId    # treasury-debt | treasury-rates | bls-cpi | bls-unemployment | nws-alerts
GET    /api/scenarios                       # newest first, max 25
GET    /api/scenarios/:id
POST   /api/scenarios
DELETE /api/scenarios/:id
GET    /api/mentor/status                   # { llm: true | false }
GET    /api/mentor/precedents               # historical knowledge base
POST   /api/mentor/chat                     # { question, mode, depth, context }
```

Each government metric is normalized to:

```json
{
  "sourceId": "treasury-debt",
  "label": "Debt to the Penny",
  "agency": "U.S. Treasury Fiscal Data",
  "metricKey": "debtTrillions",
  "status": "live | cached | offline | empty",
  "value": 38.94,
  "display": "$38.94T",
  "asOf": "2026-05-08",
  "fetchedAt": "2026-05-12T01:51:07.832Z"
}
```

If an upstream API fails, the route returns the last successful value cached in SQLite (`status: "cached"`). If no cache exists yet, it returns `status: "offline"` with `value: null`. The frontend never crashes on a dead upstream.

## Data model

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

I stored scenario snapshots as JSON-typed strings rather than normalizing them. Tradeoff: faster to iterate (the simulation is still changing) at the cost of harder cross-run analytics. The route handlers `JSON.parse` the fields back into objects before returning them, so consumers of the API never see raw JSON strings.

## Learning Journey

### What inspired this project
Most budget simulators look like a CBO spreadsheet — useful but dry. The problem isn't usually "what do the math problems do," it's "why does fiscal policy fail in practice." I wanted something that *feels* like the actual job: a control room where wars, disasters, inflation, lobbying, and political polarization all push and pull on a long-run debt path, and where students have to defend tradeoffs out loud.

The pivot to a classroom-focused, editorial-styled "Studium" came from realizing the dashboard-y first cut was hostile to first-year students. Pax Historia–style cartography and a TA-voiced AI mentor make the data feel approachable.

### Potential impact
For a first- or second-year college class — intro macro, public policy, political economy, American government — this turns a static lecture about debt sustainability into a 30-minute group activity. Students see that interest costs feed back once debt/GDP runs hot, that polarization haircuts even well-designed reforms, that a 2-point CPI surprise can outweigh a small reform package. They also see *historical analogs*, not just numbers in isolation.

It is not a replacement for CBO modeling. It is a teaching tool with a backbone of real, live government data.

### New technology I learned: Prisma
Headline new tech: **Prisma**. I had only used raw SQL and a query builder before. The schema → generated client → typed `findUnique`/`upsert` flow was new to me. The moment it clicked was when I switched the government-metric cache to a single `upsert` — one declarative call replacing a SELECT-then-INSERT race. I picked Prisma because it lets me iterate the data model fast (`prisma db push` in a single command, no migration file dance) without giving up the safety of generated types.

Other firsts on this project I lean less on but want to call out honestly: hand-writing an equirectangular and spherical projection in SVG (no D3, no Mapbox); designing an LLM integration with `cache_control: ephemeral` so the system prompt is paid for once per 5-minute window; building a deterministic-fallback layer around an LLM call so the product doesn't break when there's no API key.

## Technical Rationale

**Why an SVG globe and SVG flat maps instead of WebGL / Mapbox?** Debuggability and weight. The projection is one `Math.cos/Math.sin` block; I can inspect every point. WebGL would have looked flashier but pulled in a much heavier dependency stack, and Mapbox would have leaked the visual budget to vendor styling rather than the editorial direction I wanted (paper textures, hairline rules, Fraunces serif headlines).

**Why a JSON-blob schema for scenarios?** The simulation is still actively changing — I add new sliders, options, and role scores often. A fully normalized scenario schema would force a migration every time. JSON columns let me keep moving while still satisfying "data is persisted to a database."

**Why mirror the simulation in `client/src/lib/simulation.js` AND `server/src/simulation.js`?** The frontend needs the model to be synchronous so sliders feel instant. The backend keeps its own copy so the unit tests can run without a browser. They're intentionally kept in lock-step.

**Why an LLM with a deterministic fallback instead of "AI-only"?** Educational products can't break when a key isn't set or the network blips. The fallback `mentor/fallback.js` reads the same scenario context the LLM gets and returns the same JSON response shape, so the UI looks identical and the user never sees a degraded experience. The LLM mode is a quality upgrade, not a hard dependency.

**Biggest tradeoff:** scope vs. shippability. A truly rigorous fiscal model would need stochastic interest paths, CBO option scoring with distributional outputs, primary-balance accounting, automatic stabilizers, real Monte Carlo. I cut all of that to ship a working, interactive, full-stack app on time with real government data flowing end-to-end. The model is intentionally legible, not a forecast — and the disclaimer says so prominently.

**Hardest bug:** the BLS API. My first version did `GET /publicAPI/v2/timeseries/data/CUUR0000SA0`. That technically works, but for unregistered users it only returns the *current calendar year* of data — so the YoY calculation needed a value from the previous January that wasn't in the response, and silently fell through to displaying the raw index number ("280.something") instead of a YoY percent. The model still ran, the UI didn't error, the CPI tile just looked weird and the deficit projection drifted in a way I couldn't immediately explain. I traced it through `parseBlsYoY`, found `prior` was always `undefined`, then read the BLS API docs and switched to a `POST` with an explicit `startyear`/`endyear` window so we always pull 24+ months. Optional `BLS_API_KEY` env var unlocks more history. The fix lives in `server/src/governmentSources.js` → `fetchBlsSeries`. Second-hardest: the NWS endpoint also took me a minute — `area=US` is not a valid value, the API expects state codes. Dropped the filter, problem gone, 233 live alerts flowing.

## AI Usage

Honest answer: yes, I used Claude (the same model family that powers Atlas, by coincidence) and ChatGPT as collaborators throughout. Every architectural call, every formula coefficient, and every bug fix came out of my own debugging — but I pair-programmed with a model when scaffolding boilerplate, when writing CSS for the editorial typography, and when drafting the regression tests in `server/test/simulation.test.js`.

**Specific prompt I used early on:**

> "Help me turn this fiscal simulator frontend into a full-stack app that requires a backend, database persistence, and server-side external API calls. Use government APIs for Treasury debt, BLS inflation/unemployment, and NOAA weather alerts."

**How I adapted the output:** The first AI draft tried to call Treasury, BLS, and NOAA *directly from React*. That violated the challenge requirement and would have leaked any future API key. I rejected the structure, wrote the `/api/government-metrics` adapter layer myself in `server/src/routes/governmentMetrics.js`, and moved every external call server-side behind `server/src/governmentSources.js`. The AI also suggested Redux for state management and a fully normalized SQL schema; I cut both as overkill for a single-user prototype. Later, when wiring the Anthropic SDK, the model suggested I omit prompt caching to "keep things simple" — I overruled it because the Anthropic skill guidance and my own reading of the docs made it clear that a long, stable system prompt is exactly what `cache_control: ephemeral` is for.

The fiscal model itself — the projection function, the interest-feedback term that kicks in past 115% debt/GDP, the political-implementation haircut, the role-specific scoring, the political-capital cost function, every coefficient — is mine. I tuned the numbers by sketching what each lever should feel like and iterating against the 2026→2056 chart until the responses matched my mental model.

## How this meets the DALI CYOA requirements

| Requirement | Where it lives |
| --- | --- |
| Full-stack (frontend + backend) | `client/` (React+Vite, port 5173) and `server/` (Express, port 4000) |
| At least one new framework/language | **Prisma** as the headline; also first-time use of Anthropic SDK with prompt caching |
| Dynamic functionality, not static | Live sliders, drag-to-rotate globe, scenario presets, CBO option toggles, save/delete, Atlas chat, scenario story regenerator |
| Intuitive, responsive UI | Pastel-then-editorial design system, 6-step tutorial, Why? buttons everywhere, mobile breakpoints in `style.css` |
| At least one API endpoint | 11 endpoints (health, government-metrics ×2, scenarios ×4, mentor ×3) |
| Data persistence | Prisma + SQLite, two models (`Scenario`, `MetricCache`) |
| Server-side logic | Government adapter layer, BLS YoY computation, projection model (mirrored for tests), Atlas fallback mentor, scenario validation with Zod |
| External 3rd-party API, server-side only | Treasury Fiscal Data, BLS, NOAA/NWS, optional Anthropic — all in `server/src/`. The React app only calls `/api/*` |
| Documented learning journey, AI usage, technical rationale | This README |

## Before submitting

- [ ] `npm run install:all`
- [ ] `npm run db:push`
- [ ] `npm run dev`
- [ ] `npm test` is green
- [ ] Save at least one scenario through the UI
- [ ] Add `docs/dashboard.png`, `docs/maps.png`, `docs/atlas.png` screenshots
- [ ] Add a 30–60s demo video or GIF
- [ ] Test the README setup steps on a fresh clone
- [ ] Fill in the deployed app URL at the top of this file

## Deployment notes

- Frontend: Netlify, Vercel, or Render static site.
- Backend: Render or Railway web service.
- Database: SQLite is fine for the demo. For production, switch Prisma's `datasource db` provider to PostgreSQL and run `prisma migrate deploy`.

## Future improvements

- Classroom mode with join codes (multi-user `ClassSession`, group submissions, leaderboards).
- Class vote + comment threads per scenario.
- "Policy cards" UI — concrete CBO options as deck-building game pieces.
- CBO baseline ingestion and option scoring.
- FEC campaign finance data to make PAC pressure a real signal.
- Monte Carlo uncertainty intervals on the debt path.
- WebGL globe with drag-to-rotate and 3D arcs.
- Accounts and shareable scenario links.
