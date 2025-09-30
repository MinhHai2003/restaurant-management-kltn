const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Customer = require("../models/Customer");

let io;
const connectedUsers = new Map(); // userId -> socketId
const connectedCustomers = new Map(); // customerId -> socketId

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const userType = socket.handshake.auth.type; // 'employee' or 'customer'

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (userType === "customer") {
      const customer = await Customer.findById(decoded.customerId);
      if (!customer || !customer.isActive) {
        return next(new Error("Customer not found or inactive"));
      }
      socket.userId = customer._id;
      socket.userType = "customer";
      socket.userData = customer;
    } else {
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive"));
      }
      socket.userId = user._id;
      socket.userType = "employee";
      socket.userData = user;
      socket.userRole = user.role;
      socket.userDepartment = user.department;
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
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
  });

  // Authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`🔌 ${socket.userType} connected:`, socket.userId.toString());

    // Store connection
    if (socket.userType === "customer") {
      connectedCustomers.set(socket.userId.toString(), socket.id);
      socket.join("customers");
    } else {
      connectedUsers.set(socket.userId.toString(), socket.id);
      socket.join("employees");
      socket.join(`role_${socket.userRole}`);
      socket.join(`department_${socket.userDepartment}`);
    }

    // Employee-specific rooms
    if (socket.userType === "employee") {
      // Admin and managers can join admin room
      if (["admin", "manager"].includes(socket.userRole)) {
        socket.join("admins");
      }

      // Kitchen staff
      if (socket.userDepartment === "kitchen" || socket.userRole === "chef") {
        socket.join("kitchen");
      }

      // Service staff
      if (socket.userDepartment === "service" || socket.userRole === "waiter") {
        socket.join("service");
      }
    }

    // Handle employee status update
    socket.on("update_employee_status", (data) => {
      if (
        socket.userType === "employee" &&
        ["admin", "manager"].includes(socket.userRole)
      ) {
        socket.to("employees").emit("employee_status_updated", data);
      }
    });

    // Handle shift notifications
    socket.on("shift_created", (shiftData) => {
      if (
        socket.userType === "employee" &&
        ["admin", "manager"].includes(socket.userRole)
      ) {
        // Notify all employees in the department
        socket
          .to(`department_${shiftData.department}`)
          .emit("new_shift_created", {
            shift: shiftData,
            message: `Có ca làm việc mới: ${shiftData.name}`,
            timestamp: new Date(),
          });
      }
    });

    socket.on("shift_assigned", (data) => {
      if (
        socket.userType === "employee" &&
        ["admin", "manager"].includes(socket.userRole)
      ) {
        // Notify specific employee
        const targetSocketId = connectedUsers.get(data.employeeId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("shift_assignment", {
            shift: data.shift,
            message: `Bạn đã được phân công ca: ${data.shift.name}`,
            timestamp: new Date(),
          });
        }
      }
    });

    // Handle order notifications
    socket.on("order_status_changed", (orderData) => {
      if (socket.userType === "employee") {
        // Notify kitchen if order is confirmed
        if (orderData.status === "confirmed") {
          socket.to("kitchen").emit("new_order_for_kitchen", {
            order: orderData,
            message: `Đơn hàng mới cần chuẩn bị: ${orderData.orderNumber}`,
            timestamp: new Date(),
          });
        }

        // Notify service staff if order is ready
        if (orderData.status === "ready") {
          socket.to("service").emit("order_ready_for_delivery", {
            order: orderData,
            message: `Đơn hàng sẵn sàng giao: ${orderData.orderNumber}`,
            timestamp: new Date(),
          });
        }

        // Notify customer about order status
        if (orderData.customerId) {
          const customerSocketId = connectedCustomers.get(
            orderData.customerId.toString()
          );
          if (customerSocketId) {
            io.to(customerSocketId).emit("order_status_update", {
              order: orderData,
              message: `Đơn hàng ${orderData.orderNumber} đã ${getStatusMessage(
                orderData.status
              )}`,
              timestamp: new Date(),
            });
          }
        }
      }
    });

    // Handle table status updates
    socket.on("table_status_changed", (tableData) => {
      if (socket.userType === "employee") {
        socket.to("employees").emit("table_status_updated", {
          table: tableData,
          message: `Bàn ${tableData.tableNumber} đã ${getTableStatusMessage(
            tableData.status
          )}`,
          timestamp: new Date(),
        });
      }
    });

    // Handle reservation notifications
    socket.on("reservation_created", (reservationData) => {
      socket.to("admins").emit("new_reservation", {
        reservation: reservationData,
        message: `Có đặt bàn mới từ ${reservationData.customerName}`,
        timestamp: new Date(),
      });

      socket.to("service").emit("new_reservation", {
        reservation: reservationData,
        message: `Có đặt bàn mới cần xử lý`,
        timestamp: new Date(),
      });
    });

    // Handle inventory alerts
    socket.on("inventory_low", (inventoryData) => {
      if (
        socket.userType === "employee" &&
        ["admin", "manager"].includes(socket.userRole)
      ) {
        socket.to("admins").emit("inventory_alert", {
          item: inventoryData,
          message: `Cảnh báo: ${inventoryData.name} sắp hết (còn ${inventoryData.quantity} ${inventoryData.unit})`,
          timestamp: new Date(),
          level: "warning",
        });

        socket.to("kitchen").emit("inventory_alert", {
          item: inventoryData,
          message: `Nguyên liệu ${inventoryData.name} sắp hết`,
          timestamp: new Date(),
          level: "warning",
        });
      }
    });

    // Handle chat messages between staff
    socket.on("staff_message", (messageData) => {
      if (socket.userType === "employee") {
        const message = {
          id: Date.now().toString(),
          senderId: socket.userId,
          senderName: socket.userData.name,
          senderRole: socket.userRole,
          message: messageData.message,
          channel: messageData.channel || "general",
          timestamp: new Date(),
        };

        // Broadcast to appropriate channel
        if (messageData.channel === "kitchen") {
          socket.to("kitchen").emit("staff_message_received", message);
        } else if (messageData.channel === "service") {
          socket.to("service").emit("staff_message_received", message);
        } else if (messageData.channel === "admins") {
          if (["admin", "manager"].includes(socket.userRole)) {
            socket.to("admins").emit("staff_message_received", message);
          }
        } else {
          socket.to("employees").emit("staff_message_received", message);
        }
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(
        `🔌 ${socket.userType} disconnected:`,
        socket.userId.toString()
      );

      if (socket.userType === "customer") {
        connectedCustomers.delete(socket.userId.toString());
      } else {
        connectedUsers.delete(socket.userId.toString());
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
const getStatusMessage = (status) => {
  const statusMap = {
    pending: "đang chờ xác nhận",
    confirmed: "được xác nhận",
    preparing: "đang chuẩn bị",
    ready: "sẵn sàng",
    delivered: "được giao",
    completed: "hoàn thành",
    cancelled: "bị hủy",
  };
  return statusMap[status] || status;
};

const getTableStatusMessage = (status) => {
  const statusMap = {
    available: "trở thành trống",
    occupied: "được sử dụng",
    reserved: "được đặt trước",
    maintenance: "bảo trì",
    cleaning: "đang dọn dẹp",
  };
  return statusMap[status] || status;
};

// Utility functions for other modules
const getIO = () => io;

const emitToUser = (userId, event, data) => {
  const socketId = connectedUsers.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

const emitToCustomer = (customerId, event, data) => {
  const socketId = connectedCustomers.get(customerId.toString());
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role_${role}`).emit(event, data);
    return true;
  }
  return false;
};

const emitToDepartment = (department, event, data) => {
  if (io) {
    io.to(`department_${department}`).emit(event, data);
    return true;
  }
  return false;
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    return true;
  }
  return false;
};

const getConnectedUsers = () => ({
  employees: Array.from(connectedUsers.keys()),
  customers: Array.from(connectedCustomers.keys()),
  totalEmployees: connectedUsers.size,
  totalCustomers: connectedCustomers.size,
});

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToCustomer,
  emitToRole,
  emitToDepartment,
  emitToAll,
  getConnectedUsers,
};
