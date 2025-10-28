import { useState, useEffect } from "react";
import "./ExpenseTracker.css";

function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // ✅ Fetch existing expenses from backend
  useEffect(() => {
    console.log("✅ ExpenseTracker component loaded");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must log in first.");
      return;
    }

    fetch("http://localhost:5000/api/expenses", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("Unauthorized: Please log in again");
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched expenses:", data);
        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          setTransactions([]);
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching expenses:", err);
        setError(err.message);
      });
  }, []);

  // ✅ Add new expense (POST request)
  const addTransaction = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!text || !amount) return;
    if (!token) {
      setError("Unauthorized. Please log in again.");
      return;
    }

    const newTransaction = { text, amount: Number(amount) };

    fetch("http://localhost:5000/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(newTransaction),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add expense");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Added:", data);
        setTransactions((prev) => [data, ...prev]);
        setText("");
        setAmount("");
      })
      .catch((err) => {
        console.error("❌ Error adding expense:", err);
        setError(err.message);
      });
  };

  // ✅ Calculate income, expense, balance
  const amounts = transactions.map((t) => t.amount || 0);
  const income = amounts.filter((a) => a > 0).reduce((a, b) => a + b, 0).toFixed(2);
  const expense = (amounts.filter((a) => a < 0).reduce((a, b) => a + b, 0) * -1).toFixed(2);
  const balance = amounts.reduce((a, b) => a + b, 0).toFixed(2);

  return (
    <div className="page">
      <div className="card">
        <h1 className="card-title">Expense Tracker</h1>

        {error && <p className="error-message">{error}</p>}

        <div className="summary">
          <div className="summary-item">
            <h3>Income</h3>
            <p className="income">₹{income}</p>
          </div>
          <div className="summary-item">
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
            type="text"
            placeholder="Transaction Description"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount (use negative for expenses)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit">Add Transaction</button>
        </form>

        <div className="history">
          <h3>Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="no-transactions">No transactions yet.</p>
          ) : (
            <ul>
              {transactions.map((t) => (
                <li key={t._id || t.id} className={t.amount < 0 ? "expense-item" : "income-item"}>
                  <span>{t.text}</span>
                  <span>
                    {t.amount < 0 ? "-" : "+"}₹{Math.abs(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseTracker;
