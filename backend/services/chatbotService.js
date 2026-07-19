import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import SharedExpense from "../models/SharedExpense.js";

import { detectIntent } from "../utils/intentDetector.js";
import { getContextualTip } from "../utils/financeTips.js";
import { generatePrediction, inferCategory } from "../utils/prediction.js";

/* ─────────────────────────────────────────────
   Conversation Memory (with TTL)
   ───────────────────────────────────────────── */

const userMemory = new Map();
const MEMORY_TTL = 10 * 60 * 1000; // 10 minutes

function getMemory(userId) {
  const key = userId.toString();

  if (userMemory.has(key)) {
    const mem = userMemory.get(key);
    if (Date.now() - mem.updatedAt < MEMORY_TTL) {
      return mem;
    }
    userMemory.delete(key);
  }

  const fresh = {
    history: [], // last 3 intents
    lastGroup: null,
    updatedAt: Date.now(),
  };

  userMemory.set(key, fresh);
  return fresh;
}

function pushHistory(memory, intent) {
  memory.history.push(intent);
  if (memory.history.length > 3) memory.history.shift();
  memory.updatedAt = Date.now();
}

/* ─────────────────────────────────────────────
   Date Range Helpers
   ───────────────────────────────────────────── */

function getMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getWeekRange(offset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + (offset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
}

/* ─────────────────────────────────────────────
   Lazy Data Fetchers
   ───────────────────────────────────────────── */

async function fetchExpenses(userId, dateFilter = null) {
  const query = { userId };
  if (dateFilter) {
    query.createdAt = { $gte: dateFilter.start, $lte: dateFilter.end };
  }
  return Expense.find(query).sort({ createdAt: -1 });
}

async function fetchGroups(userId) {
  return Group.find({ createdBy: userId });
}

async function fetchSharedExpenses(groupIds) {
  if (!groupIds.length) return [];
  return SharedExpense.find({ groupId: { $in: groupIds } });
}

/* ─────────────────────────────────────────────
   Computation Helpers
   ───────────────────────────────────────────── */

function computeFinancials(expenses) {
  const income = expenses
    .filter((e) => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);

  const expenseTotal = Math.abs(
    expenses
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + e.amount, 0)
  );

  const balance = income - expenseTotal;

  const negatives = expenses.filter((e) => e.amount < 0);

  const highest = negatives.length
    ? negatives.reduce((a, b) => (Math.abs(a.amount) > Math.abs(b.amount) ? a : b))
    : null;

  const average = negatives.length
    ? Math.round(negatives.reduce((s, e) => s + Math.abs(e.amount), 0) / negatives.length)
    : 0;

  return { income, expense: expenseTotal, balance, highest, average };
}

function computeCategoryBreakdown(expenses) {
  const negatives = expenses.filter((e) => e.amount < 0);
  const categories = {};

  negatives.forEach((e) => {
    const cat = inferCategory(e.text);
    categories[cat] = (categories[cat] || 0) + Math.abs(e.amount);
  });

  return Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/* ─────────────────────────────────────────────
   Format Helpers
   ───────────────────────────────────────────── */

function rupees(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/* ─────────────────────────────────────────────
   AI Brain — Main Message Processor
   ───────────────────────────────────────────── */

export async function processMessage(userId, message) {
  const { intent, confidence } = detectIntent(message);
  const memory = getMemory(userId);

  pushHistory(memory, intent);

  /* ═══════════════════════════════════════════
     GREETING
     ═══════════════════════════════════════════ */

  if (intent === "greeting") {
    return {
      reply:
        "Hey there! 👋 I'm your AI Finance Assistant.\n\nHere's what I can help you with:\n\n💰 Expenses & Income\n📊 Monthly Summary\n💳 Balance\n👥 Groups & Settlements\n📈 Analytics & Predictions\n💡 Category Breakdown\n🎯 Finance Tips\n\nJust ask me anything!",
      type: "text",
    };
  }

  /* ═══════════════════════════════════════════
     THANK YOU
     ═══════════════════════════════════════════ */

  if (intent === "thank_you") {
    const replies = [
      "You're welcome! 😊 Happy to help with your finances anytime.",
      "Glad I could help! 💪 Let me know if you need anything else.",
      "Anytime! 🎉 Keep tracking your expenses — you're doing great.",
    ];
    return {
      reply: replies[Math.floor(Math.random() * replies.length)],
      type: "text",
    };
  }

  /* ═══════════════════════════════════════════
     GOODBYE
     ═══════════════════════════════════════════ */

  if (intent === "goodbye") {
    return {
      reply: "Bye! 👋 Remember to keep tracking your expenses. See you soon!",
      type: "text",
    };
  }

  /* ═══════════════════════════════════════════
     SUMMARY
     ═══════════════════════════════════════════ */

  if (intent === "summary") {
    const currentMonth = getMonthRange(0);
    const [expenses, groups] = await Promise.all([
      fetchExpenses(userId, currentMonth),
      fetchGroups(userId),
    ]);

    const sharedExpenses = await fetchSharedExpenses(groups.map((g) => g._id));
    const { income, expense, balance } = computeFinancials(expenses);
    const categories = computeCategoryBreakdown(expenses);

    return {
      reply: `📋 Monthly Summary\n\n💰 Income: ${rupees(income)}\n💸 Expense: ${rupees(expense)}\n🏦 Balance: ${rupees(balance)}\n👥 Groups: ${groups.length}\n🤝 Shared Expenses: ${sharedExpenses.length}`,
      type: "summary_card",
      data: {
        income,
        expense,
        balance,
        groups: groups.length,
        sharedExpenses: sharedExpenses.length,
        topCategories: categories.slice(0, 3),
      },
    };
  }

  /* ═══════════════════════════════════════════
     EXPENSE
     ═══════════════════════════════════════════ */

  if (intent === "expense") {
    const currentMonth = getMonthRange(0);
    const expenses = await fetchExpenses(userId, currentMonth);
    const { expense, highest, average } = computeFinancials(expenses);

    let reply = `💸 You've spent ${rupees(expense)} this month.\n\n📊 Avg per transaction: ${rupees(average)}`;

    if (highest) {
      reply += `\n🔝 Highest: ${highest.text} (${rupees(Math.abs(highest.amount))})`;
    }

    return {
      reply,
      type: "text",
      data: { expense, average, highest: highest ? { text: highest.text, amount: Math.abs(highest.amount) } : null },
    };
  }

  /* ═══════════════════════════════════════════
     INCOME
     ═══════════════════════════════════════════ */

  if (intent === "income") {
    const currentMonth = getMonthRange(0);
    const expenses = await fetchExpenses(userId, currentMonth);
    const { income } = computeFinancials(expenses);

    return {
      reply: `💰 Your total income this month is ${rupees(income)}.`,
      type: "text",
      data: { income },
    };
  }

  /* ═══════════════════════════════════════════
     BALANCE
     ═══════════════════════════════════════════ */

  if (intent === "balance") {
    const currentMonth = getMonthRange(0);
    const expenses = await fetchExpenses(userId, currentMonth);
    const { income, expense, balance } = computeFinancials(expenses);

    const emoji = balance >= 0 ? "✅" : "⚠️";

    return {
      reply: `${emoji} Current Balance: ${rupees(balance)}\n\n💰 Income: ${rupees(income)}\n💸 Spent: ${rupees(expense)}`,
      type: "text",
      data: { income, expense, balance },
    };
  }

  /* ═══════════════════════════════════════════
     GROUPS
     ═══════════════════════════════════════════ */

  if (intent === "groups") {
    const groups = await fetchGroups(userId);

    if (!groups.length) {
      return {
        reply: "You haven't created any groups yet. Head over to the Groups page to create one! 👥",
        type: "text",
      };
    }

    memory.lastGroup = groups[0]._id;

    let reply = `👥 You have ${groups.length} group${groups.length > 1 ? "s" : ""}:\n\n`;
    groups.forEach((group, i) => {
      reply += `${i + 1}. ${group.groupName} (${group.members.length + 1} members)\n`;
    });

    return {
      reply,
      type: "text",
      data: { groups: groups.map((g) => ({ name: g.groupName, members: g.members.length + 1 })) },
    };
  }

  /* ═══════════════════════════════════════════
     SETTLEMENTS
     ═══════════════════════════════════════════ */

  if (intent === "settlements") {
    const groups = await fetchGroups(userId);
    const sharedExpenses = await fetchSharedExpenses(groups.map((g) => g._id));

    const pending = [];
    sharedExpenses.forEach((exp) => {
      exp.participants.forEach((p) => {
        if (!p.paid && p.owes > 0) {
          pending.push({ name: p.name, owes: p.owes });
        }
      });
    });

    if (!pending.length) {
      return {
        reply: "✅ All settlements are completed! No pending payments.",
        type: "text",
      };
    }

    let reply = `⏳ Pending Settlements (${pending.length}):\n\n`;
    pending.forEach((p) => {
      reply += `• ${p.name} owes ${rupees(p.owes)}\n`;
    });

    return {
      reply,
      type: "text",
      data: { pending },
    };
  }

  /* ═══════════════════════════════════════════
     ANALYTICS
     ═══════════════════════════════════════════ */

  if (intent === "analytics") {
    const currentMonth = getMonthRange(0);
    const lastMonth = getMonthRange(-1);

    const [currentExpenses, prevExpenses, groups] = await Promise.all([
      fetchExpenses(userId, currentMonth),
      fetchExpenses(userId, lastMonth),
      fetchGroups(userId),
    ]);

    const sharedExpenses = await fetchSharedExpenses(groups.map((g) => g._id));

    const current = computeFinancials(currentExpenses);
    const prev = computeFinancials(prevExpenses);
    const categories = computeCategoryBreakdown(currentExpenses);

    const totalShared = sharedExpenses.reduce((s, e) => s + e.amount, 0);

    // Month-over-month change
    let momText = "";
    if (prev.expense > 0) {
      const change = ((current.expense - prev.expense) / prev.expense) * 100;
      const emoji = change > 0 ? "📈" : "📉";
      momText = `\n${emoji} vs Last Month: ${change > 0 ? "+" : ""}${Math.round(change)}%`;
    }

    let reply = `📊 Analytics\n\n💸 Total Spent: ${rupees(current.expense)}\n📊 Avg Expense: ${rupees(current.average)}\n🤝 Total Shared: ${rupees(totalShared)}${momText}`;

    if (categories.length > 0) {
      reply += "\n\n🏷️ Top Categories:";
      categories.slice(0, 3).forEach((c) => {
        reply += `\n• ${c.name}: ${rupees(c.amount)}`;
      });
    }

    return {
      reply,
      type: "chart_data",
      data: {
        expense: current.expense,
        average: current.average,
        totalShared,
        categories: categories.slice(0, 5),
        monthOverMonth: prev.expense > 0 ? Math.round(((current.expense - prev.expense) / prev.expense) * 100) : null,
      },
    };
  }

  /* ═══════════════════════════════════════════
     CATEGORY BREAKDOWN
     ═══════════════════════════════════════════ */

  if (intent === "category_breakdown") {
    const currentMonth = getMonthRange(0);
    const expenses = await fetchExpenses(userId, currentMonth);
    const categories = computeCategoryBreakdown(expenses);
    const { expense } = computeFinancials(expenses);

    if (!categories.length) {
      return {
        reply: "No expense data to break down yet. Start adding expenses!",
        type: "text",
      };
    }

    let reply = "🏷️ Spending by Category (This Month):\n";
    categories.forEach((c) => {
      const pct = expense > 0 ? Math.round((c.amount / expense) * 100) : 0;
      reply += `\n• ${c.name}: ${rupees(c.amount)} (${pct}%)`;
    });

    return {
      reply,
      type: "chart_data",
      data: { categories, total: expense },
    };
  }

  /* ═══════════════════════════════════════════
     PREDICTION
     ═══════════════════════════════════════════ */

  if (intent === "prediction") {
    const allExpenses = await fetchExpenses(userId);
    const { income, expense } = computeFinancials(allExpenses);

    const prediction = generatePrediction(income, expense, allExpenses);

    return {
      reply: `🔮 Prediction Report\n\n📅 Est. Month-end Expense: ${rupees(prediction.predictedExpense)}\n💰 Est. Savings: ${rupees(prediction.predictedSavings)}\n📊 Avg Daily Expense: ${rupees(prediction.averageDailyExpense)}\n📈 Budget Used: ${prediction.budgetUsed}%\n❤️ Financial Health: ${prediction.healthScore}/100\n📉 Trend: ${prediction.trend}\n\n💡 ${prediction.advice}`,
      type: "prediction_card",
      data: prediction,
    };
  }

  /* ═══════════════════════════════════════════
     TIPS
     ═══════════════════════════════════════════ */

  if (intent === "tips") {
    // Try to give contextual tip based on health score
    const allExpenses = await fetchExpenses(userId);
    const { income, expense } = computeFinancials(allExpenses);

    let healthScore = 100;
    if (income > 0) {
      healthScore -= Math.min(80, Math.round((expense / income) * 80));
    }
    healthScore = Math.max(0, healthScore);

    const tip = getContextualTip(healthScore);

    return {
      reply: `${tip.title}\n\n${tip.message}`,
      type: "tip_card",
      data: { title: tip.title, message: tip.message, category: tip.category },
    };
  }

  /* ═══════════════════════════════════════════
     COMPARE (Month vs Month)
     ═══════════════════════════════════════════ */

  if (intent === "compare") {
    const currentMonth = getMonthRange(0);
    const lastMonth = getMonthRange(-1);

    const [currentExpenses, prevExpenses] = await Promise.all([
      fetchExpenses(userId, currentMonth),
      fetchExpenses(userId, lastMonth),
    ]);

    const current = computeFinancials(currentExpenses);
    const prev = computeFinancials(prevExpenses);

    let reply = `📊 Month Comparison\n\n🗓️ This Month:\n  💸 Spent: ${rupees(current.expense)}\n  💰 Income: ${rupees(current.income)}\n\n🗓️ Last Month:\n  💸 Spent: ${rupees(prev.expense)}\n  💰 Income: ${rupees(prev.income)}`;

    if (prev.expense > 0) {
      const change = Math.round(((current.expense - prev.expense) / prev.expense) * 100);
      const emoji = change > 0 ? "📈" : "📉";
      reply += `\n\n${emoji} Expense Change: ${change > 0 ? "+" : ""}${change}%`;
    }

    return {
      reply,
      type: "text",
      data: {
        current: { expense: current.expense, income: current.income },
        previous: { expense: prev.expense, income: prev.income },
      },
    };
  }

  /* ═══════════════════════════════════════════
     TIME QUERY (contextual — combine with last intent)
     ═══════════════════════════════════════════ */

  if (intent === "time_query") {
    const msg = message.toLowerCase();
    let dateFilter;

    if (msg.includes("last month")) {
      dateFilter = getMonthRange(-1);
    } else if (msg.includes("last week")) {
      dateFilter = getWeekRange(-1);
    } else if (msg.includes("this week")) {
      dateFilter = getWeekRange(0);
    } else {
      dateFilter = getMonthRange(0);
    }

    const expenses = await fetchExpenses(userId, dateFilter);
    const { income, expense, balance } = computeFinancials(expenses);

    const label = msg.includes("last month")
      ? "Last Month"
      : msg.includes("last week")
        ? "Last Week"
        : msg.includes("this week")
          ? "This Week"
          : "This Month";

    return {
      reply: `📅 ${label} Summary:\n\n💰 Income: ${rupees(income)}\n💸 Expense: ${rupees(expense)}\n🏦 Balance: ${rupees(balance)}`,
      type: "text",
      data: { income, expense, balance, period: label },
    };
  }

  /* ═══════════════════════════════════════════
     FOLLOW-UP MEMORY
     ═══════════════════════════════════════════ */

  const msg = message.toLowerCase();

  // "how much" after expense context
  if (
    msg.includes("how much") &&
    memory.history.includes("expense")
  ) {
    const currentMonth = getMonthRange(0);
    const expenses = await fetchExpenses(userId, currentMonth);
    const { expense } = computeFinancials(expenses);

    return {
      reply: `💸 Your total expense this month is ${rupees(expense)}.`,
      type: "text",
    };
  }

  // "balance" after summary context
  if (
    msg.includes("balance") &&
    memory.history.includes("summary")
  ) {
    const currentMonth = getMonthRange(0);
    const expenses = await fetchExpenses(userId, currentMonth);
    const { balance } = computeFinancials(expenses);

    return {
      reply: `🏦 Current balance: ${rupees(balance)}.`,
      type: "text",
    };
  }

  // "first" group reference
  if (msg.includes("first") && memory.lastGroup) {
    const groups = await fetchGroups(userId);
    const group = groups.find(
      (g) => g._id.toString() === memory.lastGroup.toString()
    );

    if (group) {
      return {
        reply: `👥 ${group.groupName}\n\n👤 Members: ${group.members.length + 1}\n📝 Description: ${group.description || "No description"}`,
        type: "text",
      };
    }
  }

  /* ═══════════════════════════════════════════
     UNKNOWN INTENT
     ═══════════════════════════════════════════ */

  const suggestions = [
    `🤔 I didn't quite get that. Try asking:\n\n• "Show my balance"\n• "Monthly summary"\n• "Show my groups"\n• "Pending settlements"\n• "Analytics"\n• "Predict my expenses"\n• "Category breakdown"\n• "Give me a finance tip"`,

    `I can help with:\n\n💰 Expenses & Income\n📊 Summary & Analytics\n👥 Groups & Settlements\n🔮 Predictions\n🏷️ Category Breakdown\n💡 Finance Tips\n\nTry asking something specific!`,

    `Hmm, I'm not sure about that. Here are some things I'm great at:\n\n• "How much did I spend?"\n• "Compare this month"\n• "Who owes me money?"\n• "Where am I spending?"`,
  ];

  return {
    reply: suggestions[Math.floor(Math.random() * suggestions.length)],
    type: "text",
  };
}