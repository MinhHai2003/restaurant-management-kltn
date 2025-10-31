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

// 🔒 Trust proxy (required for Railway/reverse proxy)
app.set('trust proxy', true);

// CORS configuration - MUST be FIRST, before any other middleware
app.use(cors({
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
      return callback(null, origin);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    
    // Default: deny
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  exposedHeaders: [],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// 🔒 Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

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
