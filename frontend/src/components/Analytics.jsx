import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./Analytics.css";

function Analytics({ expenses }) {

  const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  const expenseDistribution = expenses.map((expense) => ({
    name: expense.title,
    value: expense.amount,
  }));

  const memberTotals = {};

  expenses.forEach((expense) => {

    if (!memberTotals[expense.paidBy]) {
      memberTotals[expense.paidBy] = 0;
    }

    memberTotals[expense.paidBy] += expense.amount;

  });

  const memberData = Object.keys(memberTotals).map((member) => ({
    name: member,
    amount: memberTotals[member],
  }));

  const totalShared = expenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const highestExpense =
    expenses.length > 0
      ? expenses.reduce((a, b) =>
          a.amount > b.amount ? a : b
        )
      : null;

  const averageExpense =
    expenses.length > 0
      ? totalShared / expenses.length
      : 0;

  const topMember =
    memberData.length > 0
      ? memberData.reduce((a, b) =>
          a.amount > b.amount ? a : b
        )
      : null;
        return (
    <div className="analytics-container">

      <div className="stats-grid">

        <div className="stat-card">
          <h4>Total Shared</h4>
          <h2>₹{totalShared.toFixed(2)}</h2>
        </div>

        <div className="stat-card">
          <h4>Highest Expense</h4>

          {highestExpense ? (
            <>
              <h3>{highestExpense.title}</h3>
              <p>₹{highestExpense.amount}</p>
            </>
          ) : (
            <p>No Data</p>
          )}
        </div>

        <div className="stat-card">
          <h4>Average Expense</h4>
          <h2>₹{averageExpense.toFixed(2)}</h2>
        </div>

        <div className="stat-card">
          <h4>Top Contributor</h4>

          {topMember ? (
            <>
              <h3>{topMember.name}</h3>
              <p>₹{topMember.amount}</p>
            </>
          ) : (
            <p>No Data</p>
          )}
        </div>

      </div>

      <div className="charts-wrapper">

        <div className="chart-box">

          <h3>Expense Distribution</h3>

          <ResponsiveContainer width="100%" height={320}>

            <PieChart>

              <Pie
                data={expenseDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >

                {expenseDistribution.map((entry, index) => (

                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />

                ))}

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

        <div className="chart-box">

          <h3>Member Spending</h3>

          <ResponsiveContainer width="100%" height={320}>

            <BarChart data={memberData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="amount"
                fill="#10b981"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

export default Analytics;