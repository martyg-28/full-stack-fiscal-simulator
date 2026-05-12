import express from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const scenariosRouter = express.Router();

const scenarioSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  policy: z.record(z.any()),
  manualStress: z.record(z.any()),
  derivedStress: z.record(z.any()),
  liveData: z.record(z.any()).optional().default({}),
  regions: z.array(z.record(z.any())).optional().default([]),
  summary: z.record(z.any()),
});

function toApiScenario(row) {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    createdAt: row.createdAt,
    policy: JSON.parse(row.policyJson),
    manualStress: JSON.parse(row.manualStressJson),
    derivedStress: JSON.parse(row.derivedStressJson),
    liveData: JSON.parse(row.liveDataJson),
    regions: JSON.parse(row.regionsJson),
    summary: JSON.parse(row.summaryJson),
  };
}

scenariosRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await prisma.scenario.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    res.json({ scenarios: rows.map(toApiScenario) });
  } catch (error) {
    next(error);
  }
});

scenariosRouter.get("/:id", async (req, res, next) => {
  try {
    const row = await prisma.scenario.findUnique({ where: { id: req.params.id } });

    if (!row) {
      res.status(404).json({ error: "Scenario not found" });
      return;
    }

    res.json(toApiScenario(row));
  } catch (error) {
    next(error);
  }
});

scenariosRouter.post("/", async (req, res, next) => {
  try {
    const parsed = scenarioSchema.parse(req.body);

    const row = await prisma.scenario.create({
      data: {
        name: parsed.name || `Scenario ${new Date().toLocaleString()}`,
        notes: parsed.notes,
        policyJson: JSON.stringify(parsed.policy),
        manualStressJson: JSON.stringify(parsed.manualStress),
        derivedStressJson: JSON.stringify(parsed.derivedStress),
        liveDataJson: JSON.stringify(parsed.liveData),
        regionsJson: JSON.stringify(parsed.regions),
        summaryJson: JSON.stringify(parsed.summary),
      },
    });

    res.status(201).json(toApiScenario(row));
  } catch (error) {
    next(error);
  }
});

scenariosRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.scenario.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
