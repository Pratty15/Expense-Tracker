import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE from "../config/api";
import SharedExpense from "./SharedExpense";
import Settlement from "./Settlement";
import Analytics from "./Analytics";
import "./GroupDetails.css";

function GroupDetails() {
  const { id } = useParams();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchGroup();
    fetchExpenses();
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/groups/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setGroup(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/shared-expenses/group/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setExpenses(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!group) {
    return <h2>Group not found.</h2>;
  }

  const totalSpent = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <div className="group-details-page">

      <div className="group-card">

        <h2>{group.groupName}</h2>

        <p className="group-description">
          {group.description || "No description"}
        </p>

        <div className="tabs">

          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>

          <button
            className={activeTab === "members" ? "active" : ""}
            onClick={() => setActiveTab("members")}
          >
            Members
          </button>

          <button
            className={activeTab === "expenses" ? "active" : ""}
            onClick={() => setActiveTab("expenses")}
          >
            Expenses
          </button>

          <button
            className={activeTab === "settlements" ? "active" : ""}
            onClick={() => setActiveTab("settlements")}
          >
            Settlements
          </button>
          
          <button
          className={activeTab === "analytics" ? "active" : ""}
          onClick={() => setActiveTab("analytics")}
          >
    Analytics
</button>

        </div>

        {activeTab === "overview" && (

          <div className="overview">

            <div className="overview-card">
              <h3>Total Members</h3>
              <p>{group.members.length + 1}</p>
            </div>

            <div className="overview-card">
              <h3>Total Expenses</h3>
              <p>{expenses.length}</p>
            </div>

            <div className="overview-card">
              <h3>Total Spend</h3>
              <p>₹{totalSpent}</p>
            </div>

          </div>

        )}

        {activeTab === "members" && (

          <div className="members-section">

            <div className="member-item">
              You
            </div>

            {group.members.map((member, index) => (

              <div
                key={index}
                className="member-item"
              >
                {member.name}
              </div>

            ))}

          </div>

        )}
                {activeTab === "expenses" && (
          <div className="expense-section">
            <SharedExpense
              groupId={id}
              members={group.members}
              refreshExpenses={fetchExpenses}
            />

            <div className="expense-history">
              <h3>Expense History</h3>

              {expenses.length === 0 ? (
                <p>No shared expenses yet.</p>
              ) : (
                expenses.map((expense) => (
                  <div
                    className="expense-card"
                    key={expense._id}
                  >
                    <div>
                      <h4>{expense.title}</h4>

                      <p>
                        Paid By :
                        <strong>
                          {" "}
                          {expense.paidBy}
                        </strong>
                      </p>

                      <small>
                        Split :
                        ₹
                        {expense.splitAmount.toFixed(2)}
                        {" "}per member
                      </small>
                    </div>

                    <h3>
                      ₹{expense.amount}
                    </h3>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "settlements" && (
          <Settlement
            expenses={expenses}
          />
        )}
        {activeTab === "analytics" && (
    <Analytics
        expenses={expenses}
    />
)}

      </div>
    </div>
  );
}

export default GroupDetails;