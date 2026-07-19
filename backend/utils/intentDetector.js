/* ─────────────────────────────────────────────
   Intent Detector — Weighted Scoring System
   ───────────────────────────────────────────── */

const CONFIDENCE_THRESHOLD = 1.5;

/**
 * Each intent maps to an array of { phrase, weight } objects.
 * Multi-word phrases get higher weight because they carry more signal.
 * Single generic words get lower weight to avoid false positives.
 */
const intents = {
  greeting: [
    { phrase: "good morning", weight: 3 },
    { phrase: "good evening", weight: 3 },
    { phrase: "good afternoon", weight: 3 },
    { phrase: "who are you", weight: 3 },
    { phrase: "what can you do", weight: 3 },
    { phrase: "hello", weight: 2 },
    { phrase: "namaste", weight: 2 },
    { phrase: "hey", weight: 1.5 },
    { phrase: "hi", weight: 1.5 },
    { phrase: "help", weight: 1.5 },
    { phrase: "start", weight: 1 },
  ],

  summary: [
    { phrase: "monthly summary", weight: 4 },
    { phrase: "month summary", weight: 4 },
    { phrase: "monthly report", weight: 4 },
    { phrase: "finance report", weight: 4 },
    { phrase: "financial overview", weight: 4 },
    { phrase: "this month", weight: 3 },
    { phrase: "overview", weight: 2.5 },
    { phrase: "summary", weight: 2.5 },
    { phrase: "report", weight: 2 },
  ],

  expense: [
    { phrase: "total expense", weight: 4 },
    { phrase: "how much spent", weight: 4 },
    { phrase: "how much did i spend", weight: 4 },
    { phrase: "money spent", weight: 3.5 },
    { phrase: "my spending", weight: 3 },
    { phrase: "show expenses", weight: 3 },
    { phrase: "my expenses", weight: 3 },
    { phrase: "expenses", weight: 2.5 },
    { phrase: "expense", weight: 2 },
    { phrase: "spent", weight: 2 },
    { phrase: "spending", weight: 2 },
  ],

  income: [
    { phrase: "total income", weight: 4 },
    { phrase: "money earned", weight: 3.5 },
    { phrase: "how much earned", weight: 3.5 },
    { phrase: "my income", weight: 3 },
    { phrase: "show income", weight: 3 },
    { phrase: "income", weight: 2.5 },
    { phrase: "earning", weight: 2 },
    { phrase: "earnings", weight: 2 },
    { phrase: "salary", weight: 2 },
    { phrase: "received", weight: 1.5 },
  ],

  balance: [
    { phrase: "current balance", weight: 4 },
    { phrase: "money left", weight: 3.5 },
    { phrase: "cash left", weight: 3.5 },
    { phrase: "how much left", weight: 3.5 },
    { phrase: "show balance", weight: 3 },
    { phrase: "my balance", weight: 3 },
    { phrase: "remaining", weight: 2 },
    { phrase: "balance", weight: 2.5 },
    { phrase: "wallet", weight: 1.5 },
  ],

  groups: [
    { phrase: "show groups", weight: 4 },
    { phrase: "my groups", weight: 4 },
    { phrase: "show my groups", weight: 4 },
    { phrase: "list groups", weight: 3.5 },
    { phrase: "college trip", weight: 3 },
    { phrase: "group trip", weight: 3 },
    { phrase: "groups", weight: 2.5 },
    { phrase: "group", weight: 2 },
    { phrase: "flatmates", weight: 2 },
    { phrase: "team", weight: 1.5 },
  ],

  settlements: [
    { phrase: "pending settlements", weight: 4 },
    { phrase: "who owes me", weight: 4 },
    { phrase: "who owes", weight: 3.5 },
    { phrase: "owes me money", weight: 3.5 },
    { phrase: "show settlements", weight: 3 },
    { phrase: "settlements", weight: 2.5 },
    { phrase: "settlement", weight: 2.5 },
    { phrase: "unpaid", weight: 2 },
    { phrase: "pending", weight: 1.5 },
    { phrase: "owe", weight: 1.5 },
  ],

  analytics: [
    { phrase: "show analytics", weight: 4 },
    { phrase: "highest expense", weight: 4 },
    { phrase: "average expense", weight: 4 },
    { phrase: "top contributor", weight: 3.5 },
    { phrase: "spending breakdown", weight: 3.5 },
    { phrase: "analytics", weight: 3 },
    { phrase: "statistics", weight: 2.5 },
    { phrase: "stats", weight: 2 },
    { phrase: "charts", weight: 2 },
    { phrase: "graph", weight: 2 },
  ],

  prediction: [
    { phrase: "predict my expenses", weight: 4 },
    { phrase: "predict expenses", weight: 4 },
    { phrase: "month end prediction", weight: 4 },
    { phrase: "expense forecast", weight: 3.5 },
    { phrase: "financial forecast", weight: 3.5 },
    { phrase: "prediction", weight: 3 },
    { phrase: "predict", weight: 2.5 },
    { phrase: "forecast", weight: 2.5 },
    { phrase: "estimate", weight: 2 },
    { phrase: "expected", weight: 1.5 },
    { phrase: "month end", weight: 1.5 },
  ],

  tips: [
    { phrase: "finance tip", weight: 4 },
    { phrase: "financial tip", weight: 4 },
    { phrase: "give me a tip", weight: 4 },
    { phrase: "money tip", weight: 3.5 },
    { phrase: "budget tip", weight: 3.5 },
    { phrase: "saving tip", weight: 3.5 },
    { phrase: "investment tip", weight: 3.5 },
    { phrase: "50 30 20", weight: 3 },
    { phrase: "emergency fund", weight: 3 },
    { phrase: "mutual fund", weight: 3 },
    { phrase: "credit card", weight: 2.5 },
    { phrase: "advice", weight: 2 },
    { phrase: "tips", weight: 2 },
    { phrase: "tip", weight: 1.5 },
    { phrase: "budget", weight: 1.5 },
    { phrase: "investment", weight: 1.5 },
  ],

  category_breakdown: [
    { phrase: "category breakdown", weight: 4 },
    { phrase: "spending by category", weight: 4 },
    { phrase: "where am i spending", weight: 4 },
    { phrase: "expense categories", weight: 3.5 },
    { phrase: "top categories", weight: 3.5 },
    { phrase: "breakdown", weight: 2.5 },
    { phrase: "categories", weight: 2 },
    { phrase: "category", weight: 1.5 },
  ],

  compare: [
    { phrase: "compare this month", weight: 4 },
    { phrase: "compare months", weight: 4 },
    { phrase: "month over month", weight: 3.5 },
    { phrase: "vs last month", weight: 3.5 },
    { phrase: "last month comparison", weight: 3.5 },
    { phrase: "compare", weight: 2 },
  ],

  time_query: [
    { phrase: "last month", weight: 3 },
    { phrase: "this week", weight: 3 },
    { phrase: "last week", weight: 3 },
    { phrase: "today", weight: 2 },
    { phrase: "yesterday", weight: 2 },
  ],

  thank_you: [
    { phrase: "thank you so much", weight: 4 },
    { phrase: "thank you", weight: 3 },
    { phrase: "thanks a lot", weight: 3 },
    { phrase: "thanks", weight: 2.5 },
    { phrase: "appreciate it", weight: 2.5 },
    { phrase: "great job", weight: 2 },
    { phrase: "awesome", weight: 1.5 },
  ],

  goodbye: [
    { phrase: "goodbye", weight: 3 },
    { phrase: "good bye", weight: 3 },
    { phrase: "bye bye", weight: 3 },
    { phrase: "see you later", weight: 3 },
    { phrase: "see you", weight: 2.5 },
    { phrase: "bye", weight: 2 },
    { phrase: "later", weight: 1 },
  ],
};

/**
 * Detects the user's intent from a message using weighted keyword scoring.
 * Returns { intent, confidence } where confidence is the highest score.
 */
export function detectIntent(message) {
  const msg = message.toLowerCase().trim();
  let bestIntent = "unknown";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(intents)) {
    let score = 0;

    for (const { phrase, weight } of keywords) {
      if (msg.includes(phrase)) {
        score += weight;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestScore < CONFIDENCE_THRESHOLD) {
    return { intent: "unknown", confidence: bestScore };
  }

  return { intent: bestIntent, confidence: bestScore };
}