import { useState, useEffect } from "react";
import "./ExpenseTracker.css";

function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // 🔄 Fetch expenses
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first");
      return;
    }

    fetch("https://expense-tracker-backend-oy00.onrender.com/api/expenses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load expenses"));
  }, []);

  // ➕ Add transaction
  const addTransaction = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!text || !amount) return;

    fetch("https://expense-tracker-backend-oy00.onrender.com/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, amount: Number(amount) }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTransactions((prev) => [data, ...prev]);
        setText("");
        setAmount("");
      })
      .catch(() => setError("Failed to add transaction"));
  };

  // ✏️ Start edit
  const startEdit = (t) => {
    setEditingId(t._id);
    setEditText(t.text);
    setEditAmount(t.amount);
  };

  // 💾 Save edit
  const saveEdit = (id) => {
    const token = localStorage.getItem("token");

    fetch(`https://expense-tracker-backend-oy00.onrender.com/api/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: editText,
        amount: Number(editAmount),
      }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setTransactions((prev) =>
          prev.map((t) => (t._id === id ? updated : t))
        );
        setEditingId(null);
      })
      .catch(() => setError("Failed to update"));
  };

  // 🗑️ Delete transaction
  const deleteTransaction = (id) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Delete this transaction?")) return;

    fetch(`https://expense-tracker-backend-oy00.onrender.com/api/expenses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() =>
        setTransactions((prev) => prev.filter((t) => t._id !== id))
      )
      .catch(() => setError("Failed to delete"));
  };

  // 📊 Calculations
  const amounts = transactions.map((t) => t.amount);
  const income = amounts.filter((a) => a > 0).reduce((a, b) => a + b, 0);
  const expense =
    amounts.filter((a) => a < 0).reduce((a, b) => a + b, 0) * -1;
  const balance = income - expense;

  return (
    <div className="page">
      <div className="card">
        <h1 className="card-title">Expense Tracker</h1>

        {error && <p className="error-message">{error}</p>}

        <div className="summary">
          <div>
            <h3>Income</h3>
            <p className="income">₹{income}</p>
          </div>
          <div>
            <h3>Expense</h3>
            <p className="expense">₹{expense}</p>
          </div>
        </div>

        <div className="balance">
          <h3>Balance</h3>
          <p className="balance-amount">₹{balance}</p>
        </div>

        <form onSubmit={addTransaction} className="form">
          <input
            placeholder="Description"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount (negative = expense)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button>Add</button>
        </form>

        <div className="history">
          <h3>Transactions</h3>
          <ul>
            {transactions.map((t) => (
              <li
                key={t._id}
                className={t.amount < 0 ? "expense-item" : "income-item"}
              >
                {editingId === t._id ? (
                  <>
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                    <button onClick={() => saveEdit(t._id)}>💾</button>
                    <button onClick={() => setEditingId(null)}>❌</button>
                  </>
                ) : (
                  <>
                    <span>{t.text}</span>
                    <span>₹{Math.abs(t.amount)}</span>
                    <div className="actions">
                      <button onClick={() => startEdit(t)}>✏️</button>
                      <button onClick={() => deleteTransaction(t._id)}>🗑️</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ExpenseTracker;
