const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIO = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");
const tableRoutes = require("./routes/tableRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Trust proxy for Railway
app.set('trust proxy', true);

// CORS configuration - allow Vercel deployments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Vercel deployments (all *.vercel.app domains)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins for now (can restrict later)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
};

// Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow all origins for Socket.io (Vercel preview URLs are dynamic)
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available to routes
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔗 Client connected to Table Service:", socket.id);

  // Join customer room for personalized notifications
  socket.on("join_customer", (customerId) => {
    socket.join(`customer_${customerId}`);
    console.log(`👤 Customer ${customerId} joined room`);
  });

  // Join session room for guest users
  socket.on("join_session", (sessionId) => {
    socket.join(`session_${sessionId}`);
    console.log(`🔗 Session ${sessionId} joined room`);
  });

  // Handle table status changes
  socket.on("table_status_changed", (data) => {
    socket.broadcast.emit("table_status_updated", data);
    console.log("🪑 Table status updated:", data);
  });

  // Handle reservation events
  socket.on("reservation_created", (data) => {
    socket.broadcast.emit("new_reservation", data);
    console.log("📝 New reservation created:", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Middleware to attach io to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// CORS configuration - MUST be before helmet() and other middleware
app.use(cors(corsOptions));

// Security middleware - configure helmet to not conflict with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Disable CSP to allow CORS
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Trust proxy only from Render (1 level)
  validate: {
    trustProxy: false, // Disable validation warning when trust proxy is true
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(morgan("combined"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Table Service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5006;

server.listen(PORT, () => {
  console.log(`🚀 Table Service running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🍽️  Tables API: http://localhost:${PORT}/api/tables`);
  console.log(`📅 Reservations API: http://localhost:${PORT}/api/reservations`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Socket.IO enabled for real-time updates`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Process terminated");
  });
});

module.exports = app;
