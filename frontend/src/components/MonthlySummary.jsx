import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
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
        .catch(() => setLoading(false));
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="loading">Loading summary...</p>;

  const current = summary[0] || { income: 0, expense: 0, balance: 0 };
  const progress = Math.min((current.balance / target) * 100, 100);

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h2>Monthly Finance Overview</h2>
        <p>Track your spending & savings smartly</p>
      </div>

      <div className="summary-cards">
        <div className="stat-card income-card">
          <h4>Income</h4>
          <p>₹{current.income.toFixed(2)}</p>
        </div>

        <div className="stat-card expense-card">
          <h4>Expense</h4>
          <p>₹{current.expense.toFixed(2)}</p>
        </div>

        <div className="stat-card balance-card">
          <h4>Balance</h4>
          <p>₹{current.balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="target-section">
        <h3>🎯 Savings Target</h3>

        <div className="target-input">
          <span>₹</span>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </div>

        <div className="progress-wrapper">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>{progress.toFixed(1)}% achieved</p>
        </div>
      </div>

      <div className="chart-section">
        <h3>📈 Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={[...summary].reverse()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="income" stroke="#22c55e" />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" />
            <Line type="monotone" dataKey="balance" stroke="#facc15" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default MonthlySummary;
