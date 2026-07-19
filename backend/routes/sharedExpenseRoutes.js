import express from "express";
import SharedExpense from "../models/SharedExpense.js";
import Group from "../models/Group.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

/* ----------------------------------------
   Create Shared Expense
----------------------------------------- */

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      groupId,
      title,
      amount,
      paidBy,
      splitAmount,
      participants,
    } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const expense = new SharedExpense({
      groupId,
      title,
      amount,
      paidBy,
      splitAmount,
      participants,
    });

    await expense.save();

    res.status(201).json(expense);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Error creating shared expense",
    });
  }
});

/* ----------------------------------------
   Get All Expenses of One Group
----------------------------------------- */

router.get("/group/:groupId", verifyToken, async (req, res) => {
  try {

    const expenses = await SharedExpense.find({
      groupId: req.params.groupId,
    }).sort({
      createdAt: -1,
    });

    res.json(expenses);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error fetching expenses",
    });

  }
});

/* ----------------------------------------
   Delete Shared Expense
----------------------------------------- */

router.delete("/:id", verifyToken, async (req, res) => {
  try {

    const expense = await SharedExpense.findByIdAndDelete(
      req.params.id
    );

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json({
      message: "Expense deleted successfully",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error deleting expense",
    });

  }
});

/* ----------------------------------------
   Mark Participant as Paid
----------------------------------------- */

router.put(
  "/:expenseId/pay/:participantName",
  verifyToken,
  async (req, res) => {
    try {
      const expense = await SharedExpense.findById(
        req.params.expenseId
      );

      if (!expense) {
        return res.status(404).json({
          message: "Expense not found",
        });
      }

      const participant = expense.participants.find(
        (p) => p.name === req.params.participantName
      );

      if (!participant) {
        return res.status(404).json({
          message: "Participant not found",
        });
      }

      participant.paid = true;

      await expense.save();

      res.json({
        message: "Settlement updated",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: "Server Error",
      });

    }
  }
);

export default router;