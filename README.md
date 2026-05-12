# Global Budget Pressure Map

A full-stack geopolitical fiscal simulator that maps global shocks into U.S. budget pressure.

The app combines a React frontend, an Express backend, Prisma/SQLite persistence, and server-side government API adapters. Users can adjust fiscal policy levers, change global stress assumptions, pull live government metrics, save scenario runs, and view how those inputs compound into projected debt, deficit, funding pressure, and regional risk.

## Why this project?

Most budget simulators feel like spreadsheets. Useful, but dry. This project tries to make macroeconomic policy feel more like a live systems map: wars, trade shocks, disasters, inflation, Treasury funding pressure, political constraints, and PAC-style lobbying pressure all flow into one visual model of U.S. fiscal balance.

The goal is not to produce official forecasts. The goal is to help users reason about fiscal tradeoffs and second-order effects.

## Features

- Interactive 3D-style rotating globe built with SVG spherical projection
- Global risk nodes for North America, Europe, the Middle East, East Asia, Latin America, Africa, and the Arctic/climate belt
- Fiscal policy sliders for revenue reform, discretionary spending, healthcare efficiency, Social Security reform, defense posture, climate resilience, and industrial policy
- Global stress controls for conflict, disasters, trade disruption, funding pressure, political polarization, public support, congressional margins, and lobbying pressure
- Server-side government API adapters
- Scenario persistence through Prisma and SQLite
- Charts for debt-to-GDP, deficit-to-GDP, federal deficit dollars, and regional impact
- Backend API routes for metrics and saved scenarios

## Tech Stack

### Frontend

- React
- Vite
- Recharts
- Framer Motion
- SVG projection math for the globe

### Backend

- Express
- Prisma ORM
- SQLite
- Zod validation
- Server-side government API calls

### Government data sources

The backend currently connects to:

- U.S. Treasury Fiscal Data API
  - Debt to the Penny
  - Average Treasury interest rates
- Bureau of Labor Statistics public API
  - CPI-U inflation proxy
  - unemployment rate
- NOAA / National Weather Service API
  - active U.S. weather alerts

Future adapters could add:

- CBO baselines and budget options
- FEC campaign finance and PAC pressure
- USAspending award-level spending
- NOAA / NCEI billion-dollar disaster history

## Project Structure

```txt
global-budget-pressure-map/
  client/
    src/
      App.jsx
      main.jsx
      style.css
    package.json
    vite.config.js
  server/
    prisma/
      schema.prisma
    src/
      governmentSources.js
      index.js
      lib/prisma.js
      routes/governmentMetrics.js
      routes/scenarios.js
    .env.example
    package.json
  package.json
  README.md
```

## Setup Instructions

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd global-budget-pressure-map
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure the backend environment

```bash
cp server/.env.example server/.env
```

The default database is SQLite:

```env
DATABASE_URL="file:./dev.db"
PORT=4000
```

### 4. Create the database

```bash
npm run db:push
```

### 5. Run the full stack app

```bash
npm run dev
```

The frontend runs on:

```txt
http://localhost:5173
```

The backend runs on:

```txt
http://localhost:4000
```

## API Endpoints

### Health check

```http
GET /api/health
```

### Government metrics

```http
GET /api/government-metrics
GET /api/government-metrics/:sourceId
```

Supported `sourceId` values:

```txt
treasury-debt
treasury-rates
bls-cpi
bls-unemployment
nws-alerts
```

### Scenarios

```http
GET /api/scenarios
GET /api/scenarios/:id
POST /api/scenarios
DELETE /api/scenarios/:id
```

The `POST /api/scenarios` endpoint persists the current run, including:

- policy settings
- manual stress settings
- live-data adjusted stress settings
- government data snapshot
- regional impact results
- summary outputs

## Data Model

The app stores scenario JSON as text fields in SQLite through Prisma. That was a deliberate tradeoff: for a prototype, flexible JSON snapshots are easier to iterate on than a heavily normalized schema.

In a production version, I would split this into normalized tables:

- `Scenario`
- `PolicyInput`
- `StressInput`
- `MetricSnapshot`
- `ProjectionPoint`
- `RegionalImpact`

## Learning Journey

### What inspired this project?

I wanted to build a fiscal simulator that felt less like a spreadsheet and more like a geopolitical control room. Budget policy is usually presented as tax/spending math, but real-world fiscal pressure also comes from wars, inflation, disasters, trade shocks, supply chains, political incentives, and interest rates.

The idea was to make those pressures visible.

### Potential impact

This could help students, policy analysts, or civically curious users understand why fiscal policy is hard. A reform package can look good in isolation, but once you add interest costs, political resistance, emergency spending, and global shocks, the tradeoffs become much more realistic.

It is not a replacement for official CBO modeling. It is a teaching and exploration tool.

### New technology learned

I used Prisma as the new technology. I chose it because it gives a clean way to define a database schema, generate a client, and persist structured scenario data without writing raw SQL for every query.

I also learned more about building server-side adapters for public APIs. The important design point was that external API calls should happen on the backend, not in the React client.

## Technical Rationale

### Frontend structure

The frontend is built around one main simulation flow:

1. Load government metrics from the backend.
2. Blend those metrics into the user's manual stress assumptions.
3. Run the fiscal projection model.
4. Build regional impact scores.
5. Visualize the results through cards, charts, and the globe.
6. Save scenario snapshots through the backend.

The globe is SVG-based rather than WebGL. That was intentional. WebGL would look cooler, but SVG projection math is easier to debug, easier to deploy, and avoids a large dependency stack.

### Backend structure

The backend has two main route groups:

- `governmentMetrics`
- `scenarios`

Government API calls live on the server so the frontend stays clean and API keys can be protected if future sources require them.

Scenario persistence lives in the backend so saved runs can survive refreshes, be compared later, and eventually be shared between users.

### Tradeoffs

The biggest tradeoff was realism versus buildability.

A truly rigorous fiscal model would require much more serious baseline modeling, CBO option scoring, distributional effects, macro feedback, and uncertainty intervals. For this challenge, I prioritized a working full-stack app with visible interactivity and a clear data pipeline.

Another tradeoff was database design. I stored scenario snapshots as JSON strings because the project is exploratory. A normalized schema would be better for analytics, but slower to iterate on.

### Hardest bug

The hardest bug was moving API calls from the frontend to the backend. At first, it was tempting to fetch Treasury, BLS, and NOAA directly from the browser. That worked sometimes, but it violated the project requirement that external API calls happen from the server and it could fail because of CORS or API policy.

The fix was to build a backend adapter layer:

```txt
Frontend -> /api/government-metrics/:sourceId -> external government API
```

That made the architecture cleaner, safer, and easier to extend.

## AI Usage

I used ChatGPT as a coding collaborator.

One useful prompt was:

```txt
Help me turn this fiscal simulator frontend into a full-stack app that satisfies a challenge requiring a backend, database persistence, and server-side external API calls. Use government APIs for Treasury debt, BLS inflation/unemployment, and NOAA weather alerts. Keep the app beginner-deployable.
```

The first AI output leaned too heavily on client-side API calls. I had to refactor it so the React app only called my own backend endpoints. I also simplified the database design by storing scenario snapshots as JSON strings in SQLite, which made the project easier to finish and debug.

## Screenshots / Demo

Add screenshots here before submitting:

```md
![Dashboard screenshot](./docs/dashboard.png)
![3D globe screenshot](./docs/globe.png)
```

A short demo video or GIF would be even better. Show:

1. Loading government metrics
2. Changing global stress sliders
3. Watching the globe and charts update
4. Saving a scenario
5. Refreshing and seeing the saved scenario persist

## Deployment Notes

A simple deployment setup:

- Frontend: Netlify or Render static site
- Backend: Render web service
- Database: SQLite for demo, PostgreSQL for production

For production, switch Prisma from SQLite to PostgreSQL.

## Future Improvements

- Add real CBO baseline ingestion
- Add FEC campaign finance data for actual PAC pressure
- Add USAspending data for federal spending categories
- Add uncertainty intervals and Monte Carlo simulations
- Add user accounts and scenario sharing
- Add a true WebGL globe with drag rotation and 3D arcs
