import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
dotenv.config(); // ✅ Load environment variables

const app = express();
// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
const uri = process.env.MONGO_URI;
mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Base route
app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully!");
});

// ✅ API routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
