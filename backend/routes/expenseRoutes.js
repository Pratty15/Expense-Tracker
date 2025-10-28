import express from "express";
import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// 🔒 Verify Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ➕ Add Expense
router.post("/", verifyToken, async (req, res) => {
  try {
    const { text, amount } = req.body;

    if (!text || !amount) return res.status(400).json({ message: "Missing fields" });

    const newExpense = new Expense({
      userId: req.userId,
      text,
      amount,
      createdAt: new Date(), // ✅ ensures correct date for monthly summary
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("❌ Error saving expense:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 📜 Get all user expenses
router.get("/", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 📈 Monthly Summary
router.get("/summary/monthly", verifyToken, async (req, res) => {
  try {
    console.log("📅 Getting summary for user:", req.userId);

    const summary = await Expense.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(req.userId) },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $gt: ["$amount", 0] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $lt: ["$amount", 0] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    console.log("✅ Aggregated Summary:", summary);

    const formatted = summary.map((s) => ({
      month: `${s._id.month}-${s._id.year}`,
      income: s.totalIncome,
      expense: Math.abs(s.totalExpense),
      balance: s.totalIncome + s.totalExpense,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error generating summary:", err);
    res.status(500).json({ message: "Error generating summary" });
  }
});

export default router;
