import { useState } from "react";
import "./SharedExpense.css";

function SharedExpense({
  groupId,
  members,
  refreshExpenses,
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("You");

  const token = localStorage.getItem("token");

  const createExpense = async (e) => {
    e.preventDefault();

    if (!title || !amount) return;

    const participantList = [
      {
        name: "You",
        owes: paidBy === "You"
          ? 0
          : Number(amount) / (members.length + 1),
      },

      ...members.map((member) => ({
        name: member.name,
        owes:
          member.name === paidBy
            ? 0
            : Number(amount) / (members.length + 1),
      })),
    ];

    try {
      const res = await fetch(
        "http://localhost:5000/api/shared-expenses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            groupId,
            title,
            amount: Number(amount),
            paidBy,
            splitAmount:
              Number(amount) /
              (members.length + 1),
            participants: participantList,
          }),
        }
      );

      if (res.ok) {
        setTitle("");
        setAmount("");
        setPaidBy("You");

        refreshExpenses();
      }
    } catch (err) {
      console.log(err);
    }
  };
    return (
    <div className="shared-expense-container">

      <h3>Add Shared Expense</h3>

      <form
        className="shared-form"
        onSubmit={createExpense}
      >

        <input
          type="text"
          placeholder="Expense Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >

          <option value="You">
            You
          </option>

          {members.map((member, index) => (
            <option
              key={index}
              value={member.name}
            >
              {member.name}
            </option>
          ))}

        </select>

        <button
          type="submit"
          className="add-expense-btn"
        >
          Add Expense
        </button>

      </form>

      <div className="split-preview">

        <h4>Split Preview</h4>

        <p>
          Each Member Pays :
          <strong>
            {" "}
            ₹
            {amount
              ? (
                  Number(amount) /
                  (members.length + 1)
                ).toFixed(2)
              : "0.00"}
          </strong>
        </p>

      </div>

    </div>
  );
}

export default SharedExpense;