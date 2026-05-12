import "dotenv/config";
import cors from "cors";
import express from "express";
import { governmentMetricsRouter } from "./routes/governmentMetrics.js";
import { scenariosRouter } from "./routes/scenarios.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "global-budget-pressure-map-api" });
});

app.use("/api/government-metrics", governmentMetricsRouter);
app.use("/api/scenarios", scenariosRouter);

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
