import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import FinanceBot from "./FinanceBot";
import "./Dashboard.css";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://expense-tracker-backend-oy00.onrender.com/api/expenses", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch expenses");

        const data = await res.json();

        //  Convert transactions into chart data
        const chartData = data.map((item) => ({
          category: item.text, // or add a 'category' field later
          amount: Math.abs(item.amount),
        }));

        setExpenses(chartData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  if (loading) return <h3>Loading data...</h3>;
  if (expenses.length === 0) return <h3>No expenses found</h3>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2 className="dashboard-title">Dashboard</h2>
        <PieChart width={400} height={300}>
          <Pie
            data={expenses}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {expenses.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

       {/* 🤖 Chatbot */}
      <FinanceBot />
    </div>
  );
}

export default Dashboard;
