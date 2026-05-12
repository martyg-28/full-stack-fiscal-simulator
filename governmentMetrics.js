import express from "express";
import { prisma } from "../lib/prisma.js";
import { fetchGovernmentSource, governmentSources } from "../governmentSources.js";

export const governmentMetricsRouter = express.Router();

function serializeMetric(metric) {
  return {
    id: metric.sourceId,
    sourceId: metric.sourceId,
    label: metric.label,
    agency: metric.agency,
    status: metric.status,
    value: metric.value,
    display: metric.display,
    asOf: metric.asOf,
    fetchedAt: metric.fetchedAt,
  };
}

async function getMetric(sourceId) {
  const source = governmentSources[sourceId];
  if (!source) {
    const error = new Error(`Unknown source: ${sourceId}`);
    error.status = 404;
    throw error;
  }

  try {
    const live = await fetchGovernmentSource(sourceId);

    const cached = await prisma.metricCache.upsert({
      where: { sourceId },
      update: {
        label: live.label,
        agency: live.agency,
        value: live.value,
        display: live.display,
        asOf: live.asOf,
        status: live.status,
        payloadJson: JSON.stringify(live.payload ?? {}),
        fetchedAt: new Date(),
      },
      create: {
        sourceId,
        label: live.label,
        agency: live.agency,
        value: live.value,
        display: live.display,
        asOf: live.asOf,
        status: live.status,
        payloadJson: JSON.stringify(live.payload ?? {}),
      },
    });

    return serializeMetric(cached);
  } catch (error) {
    const cached = await prisma.metricCache.findUnique({ where: { sourceId } });

    if (cached) {
      return {
        ...serializeMetric(cached),
        status: "cached",
        error: error.message,
      };
    }

    return {
      id: source.id,
      sourceId: source.id,
      label: source.label,
      agency: source.agency,
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
      const source = governmentSources[metric.sourceId];
      if (source && metric.value !== null && metric.value !== undefined) {
        acc[source.metricKey] = metric.value;
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
    const metric = await getMetric(req.params.sourceId);
    res.json(metric);
  } catch (error) {
    next(error);
  }
});
