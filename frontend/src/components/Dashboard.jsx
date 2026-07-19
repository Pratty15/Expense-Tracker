import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import FinanceBot from "./FinanceBot";
import "./Dashboard.css";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          "https://expense-tracker-backend-oy00.onrender.com/api/expenses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch expenses");

        const data = await res.json();

        const chartData = data.map((item) => ({
          category: item.text,
          amount: Math.abs(item.amount),
        }));

        setExpenses(chartData);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2 className="dashboard-title">
          Personal Finance Dashboard
        </h2>

        {expenses.length > 0 ? (
          <PieChart width={380} height={300}>
            <Pie
              data={expenses}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {expenses.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <p>No expense data found.</p>
        )}

        <div className="dashboard-buttons">

          <button onClick={() => navigate("/tracker")}>
            Expense Tracker
          </button>

          <button onClick={() => navigate("/summary")}>
            Monthly Summary
          </button>

          <button onClick={() => navigate("/groups")}>
            Groups
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>

        </div>
      </div>

      <FinanceBot />
    </div>
  );
}

export default Dashboard;