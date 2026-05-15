import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

const app = express();
dotenv.config();

connectDB();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
