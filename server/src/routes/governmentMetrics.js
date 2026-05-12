import express from "express";
import { prisma } from "../lib/prisma.js";
import { fetchGovernmentSource, governmentSources } from "../governmentSources.js";

export const governmentMetricsRouter = express.Router();

const CACHE_FRESH_MS = 10 * 60 * 1000; // serve from cache for 10 minutes before refetching

function serializeMetric(metric) {
  return {
    id: metric.sourceId,
    sourceId: metric.sourceId,
    label: metric.label,
    agency: metric.agency,
    metricKey: governmentSources[metric.sourceId]?.metricKey,
    status: metric.status,
    value: metric.value,
    display: metric.display,
    asOf: metric.asOf,
    fetchedAt: metric.fetchedAt,
  };
}

async function readCached(sourceId) {
  try {
    return await prisma.metricCache.findUnique({ where: { sourceId } });
  } catch {
    return null;
  }
}

async function writeCached(live) {
  try {
    return await prisma.metricCache.upsert({
      where: { sourceId: live.sourceId },
      update: {
        label: live.label,
        agency: live.agency,
        value: live.value,
        display: live.display,
        asOf: live.asOf,
        status: live.status,
        payloadJson: null, // skip storing the raw payload to keep the SQLite file small
        fetchedAt: new Date(),
      },
      create: {
        sourceId: live.sourceId,
        label: live.label,
        agency: live.agency,
        value: live.value,
        display: live.display,
        asOf: live.asOf,
        status: live.status,
        payloadJson: null,
      },
    });
  } catch (error) {
    console.warn(`Cache write failed for ${live.sourceId}: ${error.message}`);
    return null;
  }
}

async function getMetric(sourceId) {
  const source = governmentSources[sourceId];
  if (!source) {
    const error = new Error(`Unknown source: ${sourceId}`);
    error.status = 404;
    throw error;
  }

  const cached = await readCached(sourceId);
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_FRESH_MS) {
    return serializeMetric(cached);
  }

  try {
    const live = await fetchGovernmentSource(sourceId);
    const persisted = await writeCached(live);
    return serializeMetric(persisted || live);
  } catch (error) {
    if (cached) {
      return { ...serializeMetric(cached), status: "cached", error: error.message };
    }
    return {
      id: source.id,
      sourceId: source.id,
      label: source.label,
      agency: source.agency,
      metricKey: source.metricKey,
      status: "offline",
      value: null,
      display: "Offline",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

governmentMetricsRouter.get("/", async (_req, res, next) => {
  try {
    const metrics = await Promise.all(Object.keys(governmentSources).map(getMetric));
    const metricMap = metrics.reduce((acc, metric) => {
      if (metric.metricKey && metric.value !== null && metric.value !== undefined) {
        acc[metric.metricKey] = metric.value;
      }
      return acc;
    }, {});
    res.json({ metrics: metricMap, sources: metrics });
  } catch (error) {
    next(error);
  }
});

governmentMetricsRouter.get("/:sourceId", async (req, res, next) => {
  try {
    res.json(await getMetric(req.params.sourceId));
  } catch (error) {
    next(error);
  }
});
