import { useEffect, useState } from "react";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("https://expense-tracker-backend-oy00.onrender.com/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(() => setMessage("Failed to load profile"));
  }, []);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    fetch("https://expense-tracker-backend-oy00.onrender.com/api/auth/update-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
      .then((res) => res.json())
      .then((data) => setMessage(data.message || "Error"))
      .catch(() => setMessage("Error updating password"));
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-page">
      <h2>👤 Profile</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <form onSubmit={handlePasswordChange}>
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit">Update Password</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Profile;
