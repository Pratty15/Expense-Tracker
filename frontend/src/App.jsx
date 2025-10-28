import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ExpenseTracker from "./components/ExpenseTracker"; 
import MonthlySummary from "./components/MonthlySummary";
import Profile from "./components/Profile"; // ✅ Import Profile
import { useEffect, useState } from "react";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tracker" element={<ExpenseTracker />} /> {/* ✅ Add this */}
        <Route path="/summary" element={<MonthlySummary />} />
        <Route path="/profile" element={<Profile />} /> {/* ✅ Add this */}
      </Routes>
    </Router>
  );
}
export default App;
