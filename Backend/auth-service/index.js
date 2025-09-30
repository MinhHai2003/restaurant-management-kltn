const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const http = require("http");
require("dotenv").config();

const connectDB = require("./config/db");
const { generalLimiter } = require("./middleware/rateLimiter");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);

// 🔒 Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// 📝 Logging
app.use(morgan("combined"));

// 🚦 Rate limiting
app.use(generalLimiter);

// 📦 Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🗄️ Database connection
connectDB();

// 🔌 Initialize Socket.io
const io = initSocket(server);

// 🛣️ Routes
const authRoutes = require("./routes/authRoutes");
const shiftRoutes = require("./routes/shiftRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/auth/shifts", shiftRoutes);

// 🏠 Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Auth Service is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 🚫 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// 🚨 Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🔌 Socket.io: http://localhost:${PORT}/socket.io`);
});
