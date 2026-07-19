import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  owes: {
    type: Number,
    default: 0,
  },

  paid: {
    type: Boolean,
    default: false,
  },
});

const sharedExpenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    paidBy: {
      type: String,
      required: true,
    },

    splitAmount: {
      type: Number,
      default: 0,
    },

    participants: [participantSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SharedExpense", sharedExpenseSchema);