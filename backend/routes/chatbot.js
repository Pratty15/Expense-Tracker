import { Router } from "express";
import verifyToken from "../middleware/verifyToken.js";
import { processWithGemini, isGeminiAvailable } from "../services/geminiService.js";
import { processMessage } from "../services/chatbotService.js";

const router = Router();

/* ─────────────────────────────────────────────
   Simple In-Memory Rate Limiter
   Max 30 messages per minute per user
   ───────────────────────────────────────────── */

const rateLimitMap = new Map();
const MAX_REQUESTS = 30;
const WINDOW_MS = 60 * 1000;

function isRateLimited(userId) {
  const now = Date.now();
  const userKey = userId.toString();

  if (!rateLimitMap.has(userKey)) {
    rateLimitMap.set(userKey, []);
  }

  const timestamps = rateLimitMap
    .get(userKey)
    .filter((t) => now - t < WINDOW_MS);

  rateLimitMap.set(userKey, timestamps);

  if (timestamps.length >= MAX_REQUESTS) {
    return true;
  }

  timestamps.push(now);
  return false;
}

/* ─────────────────────────────────────────────
   POST /api/chatbot
   Gemini-first with rule-based fallback
   ───────────────────────────────────────────── */

router.post("/", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;

    // ── Input validation ───────────────────
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Please send a valid message.",
        type: "error",
        data: null,
      });
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
      return res.status(400).json({
        reply: "Message cannot be empty.",
        type: "error",
        data: null,
      });
    }

    if (trimmed.length > 500) {
      return res.status(400).json({
        reply: "Message is too long. Please keep it under 500 characters.",
        type: "error",
        data: null,
      });
    }

    // ── Rate limiting ──────────────────────
    if (isRateLimited(req.userId)) {
      return res.status(429).json({
        reply: "You're sending messages too quickly. Please wait a moment and try again.",
        type: "error",
        data: null,
      });
    }

    // ── Try Gemini first ───────────────────
    if (isGeminiAvailable()) {
      try {
        const result = await processWithGemini(req.userId, trimmed);

        return res.json({
          reply: result.reply,
          type: result.type || "ai",
          data: result.data || null,
        });
      } catch (geminiErr) {
        console.error("Gemini failed, falling back to rule-based:", geminiErr.message);
        // Fall through to rule-based below
      }
    }

    // ── Fallback: rule-based bot ───────────
    const result = await processMessage(req.userId, trimmed);

    res.json({
      reply: result.reply,
      type: result.type || "text",
      data: result.data || null,
    });
  } catch (err) {
    console.error("Chatbot Error:", err);

    res.status(500).json({
      reply: "Sorry, something went wrong on my end. Please try again in a moment.",
      type: "error",
      data: null,
    });
  }
});

export default router;