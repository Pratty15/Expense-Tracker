import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import "./MonthlySummary.css";

function MonthlySummary() {
  const [summary, setSummary] = useState([]);
  const [target, setTarget] = useState(5000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const token = localStorage.getItem("token");

  const fetchSummary = () => {
    fetch("http://localhost:5000/api/expenses/summary/monthly", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error:", err);
        setLoading(false);
      });
  };

  fetchSummary(); // fetch immediately when mounted

  // 🔁 Re-fetch every 10 seconds
  const interval = setInterval(fetchSummary, 10000);

  return () => clearInterval(interval); // cleanup
}, []);


  if (loading) return <p>Loading summary...</p>;

  const current = summary[0] || { income: 0, expense: 0, balance: 0 };
  const progress = Math.min((current.balance / target) * 100, 100);

  return (
    <div className="summary-container">
      <h2>📊 Monthly Summary</h2>

      <div className="summary-cards">
        <div className="card-item">
          <h3>Income</h3>
          <p className="income">₹{current.income.toFixed(2)}</p>
        </div>
        <div className="card-item">
          <h3>Expense</h3>
          <p className="expense">₹{current.expense.toFixed(2)}</p>
        </div>
        <div className="card-item">
          <h3>Balance</h3>
          <p className="balance">₹{current.balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="target">
        <h3>🎯 Savings Target: ₹{target}</h3>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
        <p>{progress.toFixed(1)}% achieved</p>
      </div>

      <h3>📈 Trend (Last Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={summary.reverse()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
          <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Expense" />
          <Line type="monotone" dataKey="balance" stroke="#facc15" name="Balance" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlySummary;
