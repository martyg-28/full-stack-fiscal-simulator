import express from "express";
import { fallbackMentor } from "../mentor/fallback.js";
import { askLlmMentor, isLlmConfigured } from "../mentor/llm.js";
import { historicalPrecedents } from "../mentor/historicalPrecedents.js";
import { generateLlmQuiz, generateFallbackQuiz } from "../mentor/quiz.js";

export const mentorRouter = express.Router();

mentorRouter.get("/status", (_req, res) => {
  res.json({ llm: isLlmConfigured() });
});

mentorRouter.get("/precedents", (_req, res) => {
  res.json({
    precedents: historicalPrecedents.map(({ keywords, ...rest }) => rest),
  });
});

mentorRouter.post("/quiz", async (req, res, next) => {
  const ctx = (req.body && req.body.context) || {};
  try {
    if (isLlmConfigured()) {
      try {
        const quiz = await generateLlmQuiz(ctx);
        return res.json(quiz);
      } catch (error) {
        console.warn("LLM quiz failed, falling back:", error.message);
        return res.json({ ...generateFallbackQuiz(ctx), note: `LLM error: ${error.message}` });
      }
    }
    res.json(generateFallbackQuiz(ctx));
  } catch (error) {
    next(error);
  }
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
