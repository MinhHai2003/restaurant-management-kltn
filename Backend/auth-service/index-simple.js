const express = // Basic middleware
  app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Handle text/plain as JSON (for Postman issues)
app.use("/api", (req, res, next) => {
  if (req.get("Content-Type") === "text/plain" && req.method !== "GET") {
    req.headers["content-type"] = "application/json";

    // Parse body manually if it's JSON-like
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        req.body = JSON.parse(body);
        console.log("Parsed text/plain as JSON:", req.body);
        next();
      } catch (e) {
        console.log("Failed to parse as JSON:", body);
        req.body = {};
        next();
      }
    });
  } else {
    next();
  }
});
quire("express");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  console.log("Raw body type:", typeof req.body);
  next();
});

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// More debug
app.use((req, res, next) => {
  console.log("After parsing - Body:", req.body);
  next();
});

// Database connection
connectDB();

// Test route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Auth Service is running",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
});
