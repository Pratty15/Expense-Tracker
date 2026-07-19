/* ─────────────────────────────────────────────
   Finance Tips — Categorised & Contextual
   ───────────────────────────────────────────── */

const financeTips = [
  // ── Budgeting ──────────────────────────────
  {
    title: "💰 50-30-20 Rule",
    message:
      "Try the 50-30-20 budgeting rule: 50% for needs, 30% for wants, and 20% for savings. It's one of the simplest frameworks to start with.",
    category: "budgeting",
    minHealth: 0,
    maxHealth: 100,
  },
  {
    title: "📋 Review Monthly Budget",
    message:
      "Review your budget every month and adjust spending categories whenever necessary. What worked last month may not work this month.",
    category: "budgeting",
    minHealth: 0,
    maxHealth: 100,
  },
  {
    title: "📊 Zero-Based Budgeting",
    message:
      "Assign every rupee a job. In zero-based budgeting, your income minus all planned expenses (including savings) equals zero. Nothing is left unaccounted for.",
    category: "budgeting",
    minHealth: 0,
    maxHealth: 100,
  },
  {
    title: "🏷️ Envelope Method",
    message:
      "Divide your spending money into 'envelopes' for each category (food, transport, fun). Once an envelope is empty, stop spending in that category until next month.",
    category: "budgeting",
    minHealth: 0,
    maxHealth: 70,
  },

  // ── Saving ─────────────────────────────────
  {
    title: "🏦 Emergency Fund",
    message:
      "Maintain an emergency fund covering at least 3–6 months of your living expenses. Start small — even ₹500/month adds up over time.",
    category: "saving",
    minHealth: 0,
    maxHealth: 100,
  },
  {
    title: "💸 Pay Yourself First",
    message:
      "Save a fixed amount immediately after receiving your income instead of saving what's left. Automate it with a standing instruction to your savings account.",
    category: "saving",
    minHealth: 40,
    maxHealth: 100,
  },
  {
    title: "🎯 The 24-Hour Rule",
    message:
      "Before buying something expensive, wait 24 hours. Many impulse purchases disappear after a day of reflection.",
    category: "saving",
    minHealth: 0,
    maxHealth: 60,
  },
  {
    title: "📝 Track Every Expense",
    message:
      "Recording every expense — even small chai or auto rides — helps identify unnecessary spending and improves financial discipline.",
    category: "saving",
    minHealth: 0,
    maxHealth: 100,
  },
  {
    title: "🔄 Automate Savings",
    message:
      "Set up auto-debit to your savings or investment account on salary day. You can't spend what you don't see in your spending account.",
    category: "saving",
    minHealth: 50,
    maxHealth: 100,
  },

  // ── Debt ────────────────────────────────────
  {
    title: "💳 Avoid High-Interest Debt",
    message:
      "Pay off credit card balances in full every month. Carrying a balance can cost you 30-40% annual interest — one of the most expensive forms of debt.",
    category: "debt",
    minHealth: 0,
    maxHealth: 50,
  },
  {
    title: "⚡ Debt Avalanche Method",
    message:
      "Pay minimum on all debts, then throw every extra rupee at the highest-interest debt first. You'll save the most on interest over time.",
    category: "debt",
    minHealth: 0,
    maxHealth: 40,
  },
  {
    title: "🏗️ Build Good Credit",
    message:
      "Pay bills on time and keep your credit utilization below 30% to maintain a healthy credit score. It helps you get better loan rates.",
    category: "debt",
    minHealth: 0,
    maxHealth: 100,
  },

  // ── Investing ──────────────────────────────
  {
    title: "📈 Invest Regularly",
    message:
      "Consistent monthly investing (SIP) generally performs better than trying to time the market. Start with as little as ₹500/month in an index fund.",
    category: "investing",
    minHealth: 60,
    maxHealth: 100,
  },
  {
    title: "🌐 Diversify Investments",
    message:
      "Don't put all your money in a single asset. Spread across equity, debt, and gold. Diversification helps reduce overall portfolio risk.",
    category: "investing",
    minHealth: 60,
    maxHealth: 100,
  },
  {
    title: "🧮 Rule of 72",
    message:
      "Divide 72 by your expected annual return rate to estimate how many years it will take your money to double. At 12% returns, your money doubles in ~6 years.",
    category: "investing",
    minHealth: 50,
    maxHealth: 100,
  },
  {
    title: "⏳ Start Early, Benefit from Compounding",
    message:
      "Even small amounts invested early grow significantly thanks to compound interest. ₹1,000/month from age 25 at 12% becomes ~₹1 Cr by 55.",
    category: "investing",
    minHealth: 50,
    maxHealth: 100,
  },

  // ── Lifestyle ──────────────────────────────
  {
    title: "🍳 Meal Prep to Save",
    message:
      "Cooking at home and meal prepping can cut food expenses by 40-60% compared to eating out regularly. Your wallet and health both benefit.",
    category: "lifestyle",
    minHealth: 0,
    maxHealth: 50,
  },
  {
    title: "📱 Audit Your Subscriptions",
    message:
      "Review all monthly subscriptions (streaming, apps, gym). Cancel any you haven't used in the last 30 days. Small leaks sink big ships.",
    category: "lifestyle",
    minHealth: 0,
    maxHealth: 60,
  },
  {
    title: "🚌 Optimise Transportation",
    message:
      "Consider carpooling, public transit, or cycling for short commutes. Transportation can silently eat up 15-20% of monthly income.",
    category: "lifestyle",
    minHealth: 0,
    maxHealth: 50,
  },
  {
    title: "🛒 Use a Shopping List",
    message:
      "Always shop with a list. People who shop without one spend 20-40% more due to impulse purchases.",
    category: "lifestyle",
    minHealth: 0,
    maxHealth: 60,
  },
];

/**
 * Returns a random finance tip from the full list.
 */
export function getRandomFinanceTip() {
  const index = Math.floor(Math.random() * financeTips.length);
  return financeTips[index];
}

/**
 * Returns a contextually relevant finance tip based on the user's
 * financial health score (0–100). Tips whose [minHealth, maxHealth]
 * range includes the score are eligible; a random one is picked.
 * Falls back to any random tip if no contextual match is found.
 */
export function getContextualTip(healthScore) {
  const relevant = financeTips.filter(
    (tip) => healthScore >= tip.minHealth && healthScore <= tip.maxHealth
  );

  if (!relevant.length) return getRandomFinanceTip();

  const index = Math.floor(Math.random() * relevant.length);
  return relevant[index];
}

export default financeTips;