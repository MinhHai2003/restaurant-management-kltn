const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const {
  handleCustomerMessage,
  handleAdminMessage,
  handleMarkAsRead,
} = require("../services/chatSocketService");

let io;
const connectedCustomers = new Map(); // customerId -> socketId
const connectedAdmins = new Map(); // adminId -> socketId

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const userType = socket.handshake.auth.type; // 'customer' or 'admin'

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (userType === "customer") {
      const customer = await Customer.findById(decoded.customerId);
      if (!customer || !customer.isActive) {
        return next(new Error("Customer not found or inactive"));
      }
      socket.userId = customer._id;
      socket.userType = "customer";
      socket.userData = {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        avatar: customer.avatar,
      };
    } else if (userType === "admin") {
      // For admin, we verify token but don't fetch from DB
      // Admin info is in the token itself
      if (!decoded.userId || !decoded.role) {
        return next(new Error("Invalid admin token"));
      }

      // Check if admin role is allowed
      if (!["admin", "manager"].includes(decoded.role)) {
        return next(new Error("Insufficient permissions"));
      }

      socket.userId = decoded.userId;
      socket.userType = "admin";
      socket.userRole = decoded.role;
      socket.userData = {
        id: decoded.userId,
        name: decoded.name || "Admin",
        email: decoded.email,
        role: decoded.role,
      };
    } else {
      return next(new Error("Invalid user type"));
    }

    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Authentication error"));
  }
};

// Initialize Socket.io
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        // Allow localhost for development
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          return callback(null, true);
        }

        // Allow all Vercel deployments
        if (origin.includes(".vercel.app")) {
          return callback(null, true);
        }

        // Allow all origins for production (Railway, etc.)
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    // Railway/production specific settings
    serveClient: false,
    allowUpgrades: true,
  });
  
  console.log("✅ Socket.io initialized with path: /socket.io/");

  // Authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      `🔌 ${socket.userType} connected:`,
      socket.userId.toString()
    );

    // Store connection
    if (socket.userType === "customer") {
      connectedCustomers.set(socket.userId.toString(), socket.id);
      socket.join(`customer_${socket.userId}`);
      socket.join("customers");
    } else if (socket.userType === "admin") {
      connectedAdmins.set(socket.userId.toString(), socket.id);
      socket.join(`admin_${socket.userId}`);
      socket.join("admins");
    }

    // Handle customer sending message
    socket.on("customer_send_message", async (data) => {
      if (socket.userType !== "customer") {
        return socket.emit("error", {
          message: "Only customers can send customer messages",
        });
      }
      await handleCustomerMessage(socket, data);
    });

    // Handle admin sending message
    socket.on("admin_send_message", async (data) => {
      if (socket.userType !== "admin") {
        return socket.emit("error", {
          message: "Only admins can send admin messages",
        });
      }
      await handleAdminMessage(socket, data);
    });

    // Handle join conversation
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(
        `${socket.userType} ${socket.userId} joined conversation ${conversationId}`
      );
    });

    // Handle leave conversation
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(
        `${socket.userType} ${socket.userId} left conversation ${conversationId}`
      );
    });

    // Handle typing indicator
    socket.on("typing_start", (data) => {
      socket
        .to(`conversation_${data.conversationId}`)
        .emit("typing_indicator", {
          userId: socket.userId,
          userName: socket.userData.name,
          userType: socket.userType,
          isTyping: true,
        });
    });

    socket.on("typing_stop", (data) => {
      socket
        .to(`conversation_${data.conversationId}`)
        .emit("typing_indicator", {
          userId: socket.userId,
          userName: socket.userData.name,
          userType: socket.userType,
          isTyping: false,
        });
    });

    // Handle mark as read
    socket.on("mark_read", async (data) => {
      await handleMarkAsRead(socket, data);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(
        `🔌 ${socket.userType} disconnected:`,
        socket.userId.toString()
      );

      if (socket.userType === "customer") {
        connectedCustomers.delete(socket.userId.toString());
      } else if (socket.userType === "admin") {
        connectedAdmins.delete(socket.userId.toString());
      }
    });

    // Send welcome message
    socket.emit("connected", {
      message: `Chào mừng ${socket.userData.name}!`,
      userId: socket.userId,
      userType: socket.userType,
      timestamp: new Date(),
    });
  });

  return io;
};

// Helper functions
const getIO = () => io;

const emitToCustomer = (customerId, event, data) => {
  const socketId = connectedCustomers.get(customerId.toString());
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

const emitToAdmin = (adminId, event, data) => {
  const socketId = connectedAdmins.get(adminId.toString());
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation_${conversationId}`).emit(event, data);
    return true;
  }
  return false;
};

const emitToAllAdmins = (event, data) => {
  if (io) {
    io.to("admins").emit(event, data);
    return true;
  }
  return false;
};

const getConnectedUsers = () => ({
  customers: Array.from(connectedCustomers.keys()),
  admins: Array.from(connectedAdmins.keys()),
  totalCustomers: connectedCustomers.size,
  totalAdmins: connectedAdmins.size,
});

module.exports = {
  initSocket,
  getIO,
  emitToCustomer,
  emitToAdmin,
  emitToConversation,
  emitToAllAdmins,
  getConnectedUsers,
};

