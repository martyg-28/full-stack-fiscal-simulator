import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { governmentMetricsRouter } from "./routes/governmentMetrics.js";
import { scenariosRouter } from "./routes/scenarios.js";
import { mentorRouter } from "./routes/mentor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "global-budget-pressure-map-api" });
});

app.use("/api/government-metrics", governmentMetricsRouter);
app.use("/api/scenarios", scenariosRouter);
app.use("/api/mentor", mentorRouter);

// In production, serve the built React app from the same Express service so
// the whole thing lives under one URL. The client is built into client/dist.
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    error: error.message || "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
