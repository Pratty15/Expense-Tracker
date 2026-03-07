import { Router } from "express";
import Expense from "../models/Expense.js";
import verifyToken from "../middleware/verifyToken.js";

const router = Router();

/*  In-memory context (per user) */
const userContext = {};

router.post("/", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;

    if (!userContext[userId]) {
      userContext[userId] = {
        lastIntent: null,
      };
    }

    const msg = message.toLowerCase();

    const expenses = await Expense.find({ userId });

    const income = expenses
      .filter(e => e.amount > 0)
      .reduce((a, b) => a + b.amount, 0);

    const expense = Math.abs(
      expenses.filter(e => e.amount < 0).reduce((a, b) => a + b.amount, 0)
    );

    const balance = income - expense;

    const daysPassed = new Date().getDate();
    const avgPerDay = expense / (daysPassed || 1);
    const predicted = Math.round(avgPerDay * 30);

    let reply = "";
    let intent = null;

    /* GREETINGS */
    if (/(hi|hello|hey|namaste)/.test(msg)) {
      reply = "👋 Hey! Ask me about your expenses, balance, or savings.";
      intent = "greeting";
    }

    /*  SUMMARY */
    else if (
      msg.includes("summary") ||
      msg.includes("overview") ||
      msg.includes("iss month") ||
      msg.includes("haal")
    ) {
      reply = ` This month:\nIncome: ₹${income}\nExpense: ₹${expense}\nBalance: ₹${balance}`;
      intent = "summary";
    }

    /*  EXPENSE */
    else if (
      msg.includes("expense") ||
      msg.includes("spent") ||
      msg.includes("kharcha")
    ) {
      reply = ` You’ve spent ₹${expense} so far this month.`;
      intent = "expense";
    }

    /*  BALANCE */
    else if (
      msg.includes("balance") ||
      msg.includes("bacha") ||
      msg.includes("left")
    ) {
      reply = ` Your current balance is ₹${balance}.`;
      intent = "balance";
    }

    /*  PREDICTION */
    else if (
      msg.includes("future") ||
      msg.includes("end of month") ||
      msg.includes("predict")
    ) {
      reply = ` At this pace, your month-end expense may reach around ₹${predicted}.`;
      intent = "prediction";
    }

    /*  BUDGET WARNING */
    else if (
      msg.includes("budget") ||
      msg.includes("limit") ||
      msg.includes("control")
    ) {
      const BUDGET = 10000;
      if (expense > BUDGET * 0.8) 
        {
        reply = ` Alert! You’ve used ${Math.round(
          (expense / BUDGET) * 100
        )}% of your budget.`;
      } 
      else {
        reply = ` You’re within budget. Keep it up!`;
      }
      intent = "budget";
    }

    /*  FOLLOW-UP UNDERSTANDING */
    else if (
      msg.includes("how much") &&
      userContext[userId].lastIntent === "summary"
    ) {
      reply = ` From your summary, expense is ₹${expense} and balance ₹${balance}.`;
      intent = "followup";
    }

    /* ADVICE */
    else if (
      msg.includes("save") ||
      msg.includes("tip") ||
      msg.includes("advice")
    ) {
      reply =
        expense > income
          ? " You’re spending more than you earn. Try cutting non-essential expenses."
          : " Save at least 20% of your income & track daily spending.";
      intent = "advice";
    }

    /*  SMART FALLBACK */
    else {
      const fallbacks = [
        " I didn’t get that. Try asking about expenses, balance, or prediction.",
        " Ask me things like: *How much did I spend?*",
        " I can show summaries, trends, and budget alerts.",
      ];
      reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      intent = "unknown";
    }

    userContext[userId].lastIntent = intent;

    res.json({ reply });
  } catch (err) {
    console.error(" Chatbot Error:", err);
    res.status(500).json({ message: "Chatbot server error" });
  }
});

export default router;
