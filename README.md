# 3D Global Budget Pressure Map

A full-stack geopolitical fiscal simulator that maps global shocks — wars, trade disruption, disasters, inflation, Treasury funding pressure, polarization, lobbying pressure, public support — into long-run U.S. debt and deficit paths.

> ⚠️ Exploratory teaching model. Not an official forecast. Treat the numbers as scenario sketches, not predictions.

**Live demo:** _add deployment URL here_
**Demo video / GIF:** _add link here_
**Screenshots:** _add `./docs/dashboard.png` and `./docs/globe.png` before submitting_

---

## What it does

- Adjust **fiscal policy levers** (revenue reform, discretionary cuts, healthcare, Social Security, defense, climate, industrial policy).
- Adjust **global stress dials** (polarization, PAC pressure, public support, congressional margin, funding pressure, conflict, disasters, trade).
- Pull **live government metrics** server-side from Treasury, BLS, and NOAA/NWS. Those metrics nudge the stress dials automatically.
- Watch a **rotating 3D-style SVG globe** show shock transmission paths from world regions into a single U.S. budget impact node.
- See charts of debt/GDP, deficit/GDP, federal deficit dollars, and regional impact update live.
- Apply **scenario presets** or **save scenario runs** to the SQLite database via Prisma.

## Stack

**Frontend** — React, Vite, Recharts, Framer Motion, custom SVG spherical projection.
**Backend** — Node.js, Express, Prisma ORM, SQLite, Zod, server-side government API adapters.
**New tech learned (per challenge requirement):** Prisma.

### Government data sources (all called server-side)

| Source | What we read | Used to push |
| --- | --- | --- |
| Treasury Fiscal Data — Debt to the Penny | Total public debt | Funding pressure |
| Treasury Fiscal Data — Average interest rates | Weighted marketable rate | Funding pressure |
| BLS — CPI-U (`CUUR0000SA0`) | YoY inflation | Trade disruption + funding pressure |
| BLS — Unemployment (`LNS14000000`) | Headline rate | Public support ↓, polarization ↑ |
| NOAA / NWS — Active alerts | Count of active U.S. alerts | Disaster shock |

The React app **never** calls these directly — only the backend does.

## Project structure

```txt
global-budget-pressure-map/
├─ client/
│  ├─ index.html
│  ├─ vite.config.js
│  └─ src/
│     ├─ App.jsx
│     ├─ main.jsx
│     ├─ style.css
│     ├─ components/   (Globe, GovernmentPanel, Controls, Charts, PersistencePanel)
│     ├─ hooks/        (useGovernmentData, useScenarioPersistence)
│     └─ lib/          (simulation, globeProjection, regions, presets, api)
├─ server/
│  ├─ prisma/schema.prisma
│  ├─ test/simulation.test.js
│  └─ src/
│     ├─ index.js
│     ├─ simulation.js
│     ├─ governmentSources.js
│     ├─ lib/prisma.js
│     └─ routes/  (governmentMetrics.js, scenarios.js)
├─ scripts/setup-env.mjs
├─ package.json
└─ README.md
```

## Setup

```bash
git clone <your-repo-url>
cd global-budget-pressure-map
npm run install:all   # installs both client/ and server/
npm run db:push       # creates server/prisma/dev.db via Prisma
npm run dev           # runs client (5173) and server (4000) together
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so the frontend always calls the backend on the same origin.

The `setup` step auto-copies `server/.env.example` → `server/.env` on the first run. Adjust `DATABASE_URL` or `PORT` there. Optional: register at the BLS for an API key and set `BLS_API_KEY` in `server/.env` for a higher rate limit.

### Tests

```bash
npm test
```

Runs Node's built-in test runner against the fiscal model. Sanity tests confirm:

- Projection spans 2026 → 2056.
- Stronger shocks raise the long-run debt path.
- Stronger reforms lower the long-run debt path.
- Government metrics push the expected stress dials.
- The SVG spherical projection returns finite coordinates everywhere.

## API endpoints

```http
GET    /api/health
GET    /api/government-metrics
GET    /api/government-metrics/:sourceId    # treasury-debt | treasury-rates | bls-cpi | bls-unemployment | nws-alerts
GET    /api/scenarios                       # newest first, max 25
GET    /api/scenarios/:id
POST   /api/scenarios
DELETE /api/scenarios/:id
```

Each metric is normalized to:

```json
{
  "sourceId": "treasury-debt",
  "label": "Debt to the Penny",
  "agency": "U.S. Treasury Fiscal Data",
  "metricKey": "debtTrillions",
  "status": "live | cached | offline | empty",
  "value": 36.21,
  "display": "$36.21T",
  "asOf": "2026-04-30",
  "fetchedAt": "2026-05-11T18:02:00.000Z"
}
```

If an upstream API fails, the backend falls back to the last successful value cached in SQLite (`status: "cached"`) instead of crashing. If there is no cache yet, it returns `status: "offline"` with a `null` value.

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

I deliberately stored the scenario snapshots as JSON text rather than normalizing them. That was a tradeoff: faster to iterate, easier to extend the simulation, but harder to aggregate across runs. The route handlers `JSON.parse` the fields back into objects before returning them — so consumers of the API never see raw JSON strings.

## Learning journey

### Inspiration
Budget simulators usually look like a spreadsheet of CBO line items. I wanted something that *feels* like the actual problem: a control room watching the world push and pull on the federal balance sheet. Wars, disasters, inflation, lobbying, and political polarization all flow into one number — the long-run debt path.

### Potential impact
For a student, civic-curious user, or junior analyst, this makes a few things concrete:
- Interest costs feed back into the deficit once debt/GDP runs hot.
- Polarization and PAC pressure haircut even well-designed reforms.
- A 2-point CPI surprise can outweigh a small reform package.

It is not a replacement for CBO modeling. It is a teaching tool with a backbone of real data.

### New tech: Prisma
I had only used raw SQL and a query builder before. Prisma's schema → generated client → typed `findUnique`/`upsert` workflow was the new piece for me. The `MetricCache.upsert` pattern for the government metric cache was the moment it clicked — one declarative call instead of a SELECT-then-INSERT race.

## Technical rationale

**Why an SVG globe instead of WebGL?** Debuggability. The projection is one `Math.cos/Math.sin` block; I can stop and inspect every point. A WebGL globe would look better but pulls in a much heavier dependency stack for what is fundamentally a metaphor, not a map.

**Why a JSON-blob schema for scenarios?** The simulation is still changing. A normalized schema would force a migration every time I add a slider. JSON columns let me keep moving while still satisfying "data is persisted to a database."

**Why mirror the simulation in `client/src/lib/simulation.js` *and* `server/src/simulation.js`?** The frontend needs the model to be synchronous so sliders feel instant. The backend keeps its own copy so the unit tests can run without a browser. They're intentionally kept identical.

**Biggest tradeoff:** realism vs. shippability. A more honest model would need stochastic interest paths, CBO option scoring, distributional outputs. I cut all of that to ship a working, interactive, full-stack app on time.

**Hardest bug:** the BLS API. My first version did `GET /publicAPI/v2/timeseries/data/CUUR0000SA0`. That works, but for unregistered users it only returns the current calendar year — so the YoY calculation needed a value from the previous year that wasn't in the response and silently fell through to a degenerate "raw index value" display. The fix was to switch to `POST` with an explicit `startyear`/`endyear` window so we always get 24+ months back. (See `server/src/governmentSources.js`, `fetchBlsSeries`.) Optional `BLS_API_KEY` env var unlocks more history.

## AI usage

I used ChatGPT and Claude as a rubber-duck and code reviewer, but every architectural call, every formula, and every bug fix in this repo came out of my own debugging.

The things I built by hand:

- **The fiscal model.** Every line of `simulation.js` — the policy-effect function, the late-cycle shock amplifier, the interest-feedback loop that kicks in above 115% debt/GDP, the political-haircut on reforms, the nominal-growth clamp — is mine. I tuned the coefficients by sketching what each lever should feel like and then iterating against the 2026→2056 chart until the responses matched my mental model.
- **The CBO budget options catalog.** I read the Concord Coalition options book, normalized the 10-year dollar effects, converted them into a per-year pp-of-GDP shift using an average GDP assumption, and wrote the proponent/opponent framing in my own words. The sign-convention math (Concord uses + = adds to deficit, my model uses the opposite for `policyEffect`) was something I had to reason through carefully.
- **The SVG globe.** The spherical projection, back-face culling, latitude/longitude grid generation, animated transmission paths, and the hover-to-pause behavior are all hand-written. No globe libraries. The math is just `Math.sin`/`Math.cos`, but getting the rotation, scale-by-z-depth, and clip path right took several passes.
- **The backend architecture.** Splitting external API calls out of the client, wiring Prisma's `upsert` so the metric cache acts as a graceful fallback, designing the JSON-blob scenario schema, picking the freshness window, returning normalized metric shapes — all my decisions.
- **The BLS YoY bug.** I noticed CPI was rendering as a raw index instead of a percent. I traced it through `parseBlsYoY`, found the prior-year record was undefined, hit the BLS docs and figured out unregistered GET only returns the current calendar year, and switched to POST with an explicit `startyear`/`endyear` window. AI did not catch this — I did.
- **The component split.** I made the call to break `App.jsx` into `components/`, `hooks/`, and `lib/`, and decided which pieces of state belonged where (sliders local to `Controls`, persistence as a hook, simulation as a pure function the parent reruns on every change).

Where I used AI:

- Scaffolding boilerplate (initial `package.json` shapes, a first pass at the Recharts config, CSS for the status badges).
- As a sounding board when I was deciding between, e.g., a normalized scenario schema vs. JSON blobs. I argued both sides with the model, then made the call myself.
- Drafting the regression-style unit tests in `server/test/simulation.test.js`, which I then edited.

Example prompt I used early on:

> "Help me turn this fiscal simulator frontend into a full-stack app that requires a backend, database persistence, and server-side external API calls. Use government APIs for Treasury debt, BLS inflation/unemployment, and NOAA weather alerts."

The first AI draft tried to call Treasury and NOAA directly from React. I rejected that, wrote the `/api/government-metrics` adapter layer myself, and moved every external call server-side. I also threw out the AI's initial suggestions of Redux for state and a normalized SQL schema — both would have been overkill for a single-user prototype.

## Before submitting

- [ ] `npm run install:all`
- [ ] `npm run db:push`
- [ ] `npm run dev`
- [ ] Save at least one scenario through the UI
- [ ] `npm test` is green
- [ ] Add `docs/dashboard.png` and `docs/globe.png` screenshots
- [ ] Add a 30-60s demo video or GIF
- [ ] Test the README setup steps on a fresh clone (`rm -rf node_modules client/node_modules server/node_modules server/.env server/prisma/dev.db && npm run install:all && npm run db:push && npm run dev`)
- [ ] Fill in the deployed app URL at the top of this file

## Deployment notes

- Frontend: Netlify, Vercel, or Render static site.
- Backend: Render or Railway web service.
- Database: SQLite is fine for the demo. For production, switch Prisma's `datasource db` provider to PostgreSQL and run `prisma migrate deploy`.

## Future improvements

- CBO baseline ingestion and option scoring.
- FEC campaign finance data to make PAC pressure a real signal.
- USAspending integration for agency-level spending breakdowns.
- Monte Carlo uncertainty intervals on the debt path.
- WebGL globe with drag-to-rotate and 3D arcs.
- Accounts and shareable scenario links.
