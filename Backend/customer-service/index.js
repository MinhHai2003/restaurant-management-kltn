const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

// Trust proxy (required for Railway/reverse proxy)
app.set('trust proxy', true);

// Middleware - CORS với support cho tất cả Vercel deployments
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        process.env.FRONTEND_URL,
        "https://my-restaurant-app-six.vercel.app",
        "https://my-restaurant-b93364dpn-vinh-lois-projects.vercel.app",
      ].filter(Boolean);
      
      // Allow all Vercel deployments (ends with .vercel.app)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Default: deny
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection
connectDB();

// Debug middleware
app.use("/api/customers", (req, res, next) => {
  console.log("🔍 Request Debug:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    contentType: req.get("Content-Type"),
  });
  next();
});

// Routes
app.use("/api/customers", customerRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Customer Service is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`🚀 Customer Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Customer API: http://localhost:${PORT}/api/customers`);

  console.log("\n🎯 Available endpoints:");
  console.log("   POST /api/customers/register");
  console.log("   POST /api/customers/login");
  console.log("   GET  /api/customers/profile");
  console.log("   PUT  /api/customers/profile");
  console.log("   POST /api/customers/addresses");
  console.log("   GET  /api/customers/loyalty");
  console.log("\n🚀 Server ready for requests!");
});
