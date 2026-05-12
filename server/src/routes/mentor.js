import express from "express";
import { fallbackMentor } from "../mentor/fallback.js";
import { askLlmMentor, isLlmConfigured } from "../mentor/llm.js";
import { historicalPrecedents } from "../mentor/historicalPrecedents.js";

export const mentorRouter = express.Router();

mentorRouter.get("/status", (_req, res) => {
  res.json({ llm: isLlmConfigured() });
});

mentorRouter.get("/precedents", (_req, res) => {
  res.json({
    precedents: historicalPrecedents.map(({ keywords, ...rest }) => rest),
  });
});

mentorRouter.post("/chat", async (req, res, next) => {
  const body = req.body || {};
  try {
    if (isLlmConfigured()) {
      try {
        const reply = await askLlmMentor(body);
        return res.json({ ...reply, mode: "llm" });
      } catch (error) {
        console.warn("LLM mentor failed, falling back:", error.message);
        const reply = fallbackMentor(body);
        return res.json({
          ...reply,
          mode: "fallback-after-error",
          confidenceNote: `${reply.confidenceNote} (LLM error: ${error.message})`,
        });
      }
    }
    const reply = fallbackMentor(body);
    res.json({ ...reply, mode: "fallback" });
  } catch (error) {
    next(error);
  }
});
