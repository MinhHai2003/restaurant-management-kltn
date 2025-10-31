const express = require("express");
const mongoose = require("mongoose");
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

// 🔒 Security middleware (configured to not interfere with CORS)
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable to allow CORS override
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS configuration - MUST be after helmet to override any conflicting headers
// Use dynamic origin that always matches the request origin
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Debug logging
  if (origin) {
    console.log(`[CORS] Request origin: ${origin}`);
  }
  
  // Set CORS headers dynamically based on request origin
  if (origin) {
    // Allow localhost and Vercel domains
    if (
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.includes('.vercel.app')
    ) {
      // CRITICAL: Set the exact origin from the request (override any previous headers)
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      res.setHeader('Vary', 'Origin'); // Important for CORS caching
      
      console.log(`[CORS] Set Access-Control-Allow-Origin: ${origin}`);
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        console.log(`[CORS] Preflight OPTIONS request from ${origin}`);
        return res.status(204).end();
      }
    }
  } else {
    // No origin header (e.g., Postman, curl) - allow
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  next();
});

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

// 🔄 Final CORS override middleware - ensures CORS headers are always correct
// This runs on every request, even after routes, to ensure headers are set correctly
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && (origin.includes('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    // Override any CORS headers that might have been set incorrectly
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// 🛣️ Routes with CORS override wrapper
const authRoutes = require("./routes/authRoutes");
const shiftRoutes = require("./routes/shiftRoutes");

// Wrapper middleware to ensure CORS headers are set correctly for all API routes
const corsWrapper = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    const origin = req.headers.origin;
    if (origin && (origin.includes('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');
    }
    return originalJson.call(this, data);
  };
  next();
};

app.use("/api/auth", corsWrapper, authRoutes);
app.use("/api/auth/shifts", corsWrapper, shiftRoutes);

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
  // Override CORS headers before sending 404 response
  const origin = req.headers.origin;
  if (origin && (origin.includes('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
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
