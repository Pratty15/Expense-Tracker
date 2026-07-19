/* ─────────────────────────────────────────────
   Prediction Engine — Dynamic & Date-Aware
   ───────────────────────────────────────────── */

/**
 * Category keywords used to infer expense categories from the `text` field.
 * Each key is a display-friendly category name.
 */
const CATEGORY_KEYWORDS = {
  Food: ["food", "restaurant", "lunch", "dinner", "breakfast", "snack", "chai", "coffee", "grocery", "groceries", "zomato", "swiggy", "pizza", "burger", "meal", "eat", "biryani", "thali", "canteen", "mess"],
  Transport: ["uber", "ola", "auto", "rickshaw", "petrol", "diesel", "fuel", "bus", "train", "metro", "cab", "taxi", "parking", "toll", "transport", "travel", "flight", "ticket"],
  Shopping: ["shopping", "amazon", "flipkart", "myntra", "clothes", "shoes", "electronics", "gadget", "phone", "laptop", "watch", "bag", "gift"],
  Entertainment: ["movie", "netflix", "spotify", "prime", "gaming", "game", "concert", "party", "outing", "fun", "entertainment", "subscription", "hotstar", "youtube"],
  Bills: ["bill", "electricity", "water", "gas", "internet", "wifi", "broadband", "rent", "emi", "loan", "insurance", "recharge", "mobile", "phone bill", "maintenance"],
  Health: ["medical", "medicine", "doctor", "hospital", "gym", "pharmacy", "health", "checkup", "dental", "eye", "consultation", "test"],
  Education: ["book", "books", "course", "tuition", "fees", "college", "school", "exam", "study", "coaching", "udemy", "coursera"],
  Other: [],
};

/**
 * Infer a category from an expense's text field using keyword matching.
 */
export function inferCategory(text) {
  const lower = (text || "").toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "Other") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return "Other";
}

/**
 * Generate a prediction report from the user's actual expense data.
 *
 * @param {number}   income    — total positive-amount entries
 * @param {number}   expense   — total absolute negative-amount entries
 * @param {Array}    expenses  — raw expense documents (with createdAt)
 */
export function generatePrediction(income, expense, expenses = []) {
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  /* ── Date-aware daily average ─────────────── */
  // Use actual distinct expense-days count for a more accurate daily average
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.createdAt);
    return e.amount < 0 && d >= monthStart && d <= today;
  });

  const thisMonthTotal = thisMonthExpenses.reduce(
    (sum, e) => sum + Math.abs(e.amount),
    0
  );

  const avgDailyExpense =
    currentDay > 0 ? thisMonthTotal / currentDay : 0;

  const predictedExpense = Math.round(avgDailyExpense * daysInMonth);

  /* ── Dynamic budget from income ───────────── */
  // Use income as the budget reference instead of a hardcoded number
  const effectiveBudget = income > 0 ? income : thisMonthTotal > 0 ? thisMonthTotal * 1.5 : 10000;

  const predictedSavings = Math.max(
    Math.round(income - predictedExpense),
    0
  );

  const budgetUsed = Math.round(
    (thisMonthTotal / effectiveBudget) * 100
  );

  /* ── Week-over-week trend ─────────────────── */
  const trend = computeWeeklyTrend(expenses, today);

  /* ── Health score ─────────────────────────── */
  let healthScore = 100;

  if (income > 0) {
    const ratio = thisMonthTotal / income;
    healthScore -= Math.min(80, Math.round(ratio * 80));
  } else if (thisMonthTotal > 0) {
    healthScore = 20; // no income recorded but spending exists
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  /* ── Category-aware advice ────────────────── */
  const advice = generateAdvice(healthScore, expenses);

  return {
    averageDailyExpense: avgDailyExpense.toFixed(2),
    predictedExpense,
    predictedSavings,
    budgetUsed: Math.min(budgetUsed, 100),
    healthScore,
    trend,
    advice,
  };
}

/**
 * Compare spending in the last 7 days vs the 7 days before that.
 */
function computeWeeklyTrend(expenses, today) {
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  const thisWeek = expenses
    .filter((e) => {
      const d = new Date(e.createdAt);
      return e.amount < 0 && d >= weekAgo && d <= today;
    })
    .reduce((s, e) => s + Math.abs(e.amount), 0);

  const lastWeek = expenses
    .filter((e) => {
      const d = new Date(e.createdAt);
      return e.amount < 0 && d >= twoWeeksAgo && d < weekAgo;
    })
    .reduce((s, e) => s + Math.abs(e.amount), 0);

  if (lastWeek === 0 && thisWeek === 0) return "No data";
  if (lastWeek === 0) return "📈 New spending detected";

  const change = ((thisWeek - lastWeek) / lastWeek) * 100;

  if (change > 20) return `📈 Increasing (+${Math.round(change)}% vs last week)`;
  if (change < -20) return `📉 Decreasing (${Math.round(change)}% vs last week)`;
  return "➡️ Stable (similar to last week)";
}

/**
 * Generate advice tailored to the user's health score and top category.
 */
function generateAdvice(healthScore, expenses) {
  // Find top spending category
  const negatives = expenses.filter((e) => e.amount < 0);
  const categoryTotals = {};

  negatives.forEach((e) => {
    const cat = inferCategory(e.text);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(e.amount);
  });

  const topCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )[0];

  let advice = "";

  if (healthScore >= 80) {
    advice =
      "Your financial health looks excellent! Continue saving consistently and consider increasing your investments.";
  } else if (healthScore >= 60) {
    advice =
      "Your finances are stable. Try increasing your monthly savings by 10% this month.";
  } else if (healthScore >= 40) {
    advice =
      "Your spending is on the higher side. Review your monthly budget and cut back on non-essentials.";
  } else {
    advice =
      "⚠️ Your expenses are very high compared to your income. Focus on cutting non-essential spending immediately.";
  }

  if (topCategory && topCategory[0] !== "Other") {
    advice += ` Your highest spending category is ${topCategory[0]} — consider optimising there first.`;
  }

  return advice;
}