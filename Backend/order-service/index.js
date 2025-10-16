require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const PORT = process.env.PORT || 5005;

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: "10mb" }));

// Socket.io Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  // Hỗ trợ kết nối guest (không token) cho các trang bàn tại chỗ
  if (!token) {
    socket.userId = `guest_${socket.id}`;
    socket.userRole = "guest";
    console.log(`🔓 [SOCKET] Allowing guest connection: ${socket.userId}`);
    return next();
  }

  try {
    let decoded;

    // Handle demo tokens for development
    if (token.startsWith("demo-admin-token-")) {
      const payload = JSON.parse(token.replace("demo-admin-token-", ""));
      decoded = payload;
      console.log("🔍 [JWT DEBUG] Using demo admin token:", decoded);
    } else {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🔍 [JWT DEBUG] Decoded JWT token:", decoded);
    }

    // Priority: userId first, then customerId for backward compatibility
    socket.userId = decoded.userId || decoded.customerId || `guest_${socket.id}`;
    socket.userRole = decoded.role || "customer";

    console.log("🔍 [JWT DEBUG] Token decode details:");
    console.log("   - decoded.userId:", decoded.userId);
    console.log("   - decoded.customerId:", decoded.customerId);
    console.log("   - socket.userId (final):", socket.userId);
    console.log("   - socket.userRole:", socket.userRole);

    console.log(
      `🔐 [JWT DEBUG] User ID: ${socket.userId}, Role: ${socket.userRole}`
    );

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Join role-specific rooms
    if (socket.userRole === "customer") {
      socket.join("customers");
      console.log(
        `🔐 [SOCKET DEBUG] Customer ${socket.userId} joined customers room`
      );
    } else {
      socket.join("staff");
      socket.join(`role_${socket.userRole}`);
      console.log(
        `🔐 [SOCKET DEBUG] Staff ${socket.userId} (${socket.userRole}) joined staff and role_${socket.userRole} rooms`
      );
    }

    console.log(
      `🔌 User ${socket.userId} (${socket.userRole}) connected to order socket`
    );
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.io Connection Handler
io.on("connection", (socket) => {
  console.log(
    `👤 Order Socket connected: ${socket.userId} (${socket.userRole})`
  );
  console.log(
    `🏠 User joined rooms: user_${socket.userId}, role_${socket.userRole}`
  );

  // Log all current rooms for debugging
  console.log("🔍 [SOCKET DEBUG] All socket rooms:", Array.from(socket.rooms));

  // Join/leave table rooms for dine-in real-time updates
  socket.on("join_table", (tableNumber) => {
    if (!tableNumber) return;
    const room = `table_${tableNumber}`;
    socket.join(room);
    console.log(`🪑 Socket ${socket.userId} joined room ${room}`);
  });

  socket.on("leave_table", (tableNumber) => {
    if (!tableNumber) return;
    const room = `table_${tableNumber}`;
    socket.leave(room);
    console.log(`🧹 Socket ${socket.userId} left room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`👋 Order Socket disconnected: ${socket.userId}`);
  });
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});
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
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders/dine-in", require("./routes/dineInRoutes"));
app.use("/api/orders/pickup", require("./routes/pickupRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/orders", orderRoutes);
app.use("/api/inventory-test", require("./routes/inventoryTestRoutes"));
app.use("/api/casso", require("./routes/cassoRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

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
server.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Cart API: http://localhost:${PORT}/api/cart`);
  console.log(`📦 Order API: http://localhost:${PORT}/api/orders`);
  console.log(`👨‍💼 Admin Orders: http://localhost:${PORT}/api/admin/orders`);
  console.log(`\n🎯 Available endpoints:`);
  console.log(`\n🛒 Cart endpoints:`);
  console.log(`   GET  /api/cart - Get cart`);
  console.log(`   POST /api/cart/add - Add item to cart`);
  console.log(`   PUT  /api/cart/items/:id - Update cart item`);
  console.log(`   DELETE /api/cart/items/:id - Remove cart item`);
  console.log(`   DELETE /api/cart/clear - Clear cart`);
  console.log(`   POST /api/cart/coupon - Apply coupon`);
  console.log(`   DELETE /api/cart/coupon - Remove coupon`);
  console.log(`   PUT  /api/cart/delivery - Update delivery info`);
  console.log(`   POST /api/cart/checkout - Checkout cart`);
  console.log(`\n📦 Order endpoints:`);
  console.log(`   POST /api/orders - Create new order`);
  console.log(`   GET  /api/orders - Get customer orders`);
  console.log(`   GET  /api/orders/stats - Get order statistics`);
  console.log(`   GET  /api/orders/:id - Get order by ID`);
  console.log(`   DELETE /api/orders/:id - Cancel order`);
  console.log(`   POST /api/orders/:id/rate - Rate order`);
  console.log(`   POST /api/orders/:id/reorder - Reorder`);
  console.log(`   GET  /api/orders/track/:orderNumber - Track order`);
  console.log(`\n⭐ Review endpoints:`);
  console.log(`   POST /api/reviews/order/:orderNumber - Create order review`);
  console.log(`   GET  /api/reviews/customer/my-reviews - Get my reviews`);
  console.log(`   GET  /api/reviews/menu-item/:menuItemId - Get menu item reviews`);
  console.log(`   GET  /api/reviews/top-rated - Get top rated items`);
  console.log(`   GET  /api/reviews/customer/recommendations - Get recommendations`);
  console.log(`\n👨‍💼 Admin Order endpoints:`);
  console.log(`   GET  /api/admin/orders/dashboard - Get dashboard stats`);
  console.log(`   POST /api/admin/orders - Create admin order`);
  console.log(`   GET  /api/admin/orders - Get all orders (admin)`);
  console.log(`   PATCH /api/admin/orders/:id/status - Update order status`);
  console.log(`\n🏦 Casso Payment endpoints:`);
  console.log(`   POST /api/casso/webhook - Casso webhook (no auth)`);
  console.log(`   GET  /api/casso/payment-instructions/:orderNumber - Get payment info`);
  console.log(`   GET  /api/casso/payment-status/:orderNumber - Check payment status`);
  console.log(`   GET  /api/casso/transactions - Get all transactions (admin)`);
  console.log(`   POST /api/casso/transactions/:id/match - Manual match (admin)`);
  console.log(`\n🚀 Order Service ready for requests!`);
  console.log(`📡 Socket.io ready for real-time notifications`);
});

module.exports = { app, io };
