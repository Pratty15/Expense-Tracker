import { useMemo, useState } from "react";
import "./Settlement.css";

function Settlement({ expenses }) {
  const [loadingId, setLoadingId] = useState("");

  const token = localStorage.getItem("token");

  const settlements = useMemo(() => {
    const result = [];

    expenses.forEach((expense) => {
      expense.participants.forEach((participant) => {
        if (participant.owes > 0) {
          result.push({
            expenseId: expense._id,
            expenseTitle: expense.title,
            name: participant.name,
            amount: participant.owes,
            paid: participant.paid,
          });
        }
      });
    });

    return result;
  }, [expenses]);

  const totalPending = settlements.reduce(
    (sum, item) => (item.paid ? sum : sum + item.amount),
    0
  );

  const markPaid = async (expenseId, participantName) => {
    try {
      setLoadingId(expenseId + participantName);

      const res = await fetch(
        `http://localhost:5000/api/shared-expenses/${expenseId}/pay/${participantName}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingId("");
    }
  };

  return (
    <div className="settlement-container">
      <div className="settlement-header">
        <h3>Pending Settlements</h3>

        <div className="total-pending">
          ₹{totalPending.toFixed(2)}
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="empty-settlement">
          No pending settlements.
        </div>
      ) : (
        settlements.map((item, index) => (
          <div
            className="settlement-card"
            key={index}
          >
            <div className="settlement-info">
              <h4>{item.name}</h4>

              <p>{item.expenseTitle}</p>

              <small>
                Owes ₹{item.amount.toFixed(2)}
              </small>
            </div>

            {item.paid ? (
              <span className="paid">
                Settled
              </span>
            ) : (
              <button
                className="pay-btn"
                disabled={
                  loadingId ===
                  item.expenseId + item.name
                }
                onClick={() =>
                  markPaid(
                    item.expenseId,
                    item.name
                  )
                }
              >
                {loadingId ===
                item.expenseId + item.name
                  ? "Updating..."
                  : "Mark Paid"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Settlement;