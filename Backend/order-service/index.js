require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 5005;

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check Route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Order Service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "Connected",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/orders/dine-in", require("./routes/dineInRoutes"));
app.use("/api/orders/pickup", require("./routes/pickupRoutes"));
app.use("/api/orders", orderRoutes);

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Order API: http://localhost:${PORT}/api/orders`);
  console.log(`\n🎯 Available endpoints:`);
  console.log(`   POST /api/orders - Create new order`);
  console.log(`   GET  /api/orders - Get customer orders`);
  console.log(`   GET  /api/orders/stats - Get order statistics`);
  console.log(`   GET  /api/orders/:id - Get order by ID`);
  console.log(`   DELETE /api/orders/:id - Cancel order`);
  console.log(`   POST /api/orders/:id/rate - Rate order`);
  console.log(`   POST /api/orders/:id/reorder - Reorder`);
  console.log(`   GET  /api/orders/track/:orderNumber - Track order`);
  console.log(`\n🚀 Server ready for requests!`);
});

module.exports = app;
