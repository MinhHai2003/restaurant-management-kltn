// 🛡️ Role-based Authorization Middleware

const User = require("../models/User");

// Check specific roles
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions",
        });
      }

      req.userRole = user.role;
      req.user = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };
};

// Specific role checkers
const isAdmin = checkRole("admin");
const isManager = checkRole("admin", "manager");
const isWaiter = checkRole("admin", "manager", "waiter");
const isChef = checkRole("admin", "manager", "chef");
const isCashier = checkRole("admin", "manager", "cashier");
const isReceptionist = checkRole("admin", "manager", "receptionist");

// Check if user can manage employees
const canManageEmployees = checkRole("admin", "manager");

// Check if user can access financial data
const canAccessFinancial = checkRole("admin", "manager", "cashier");

// Check if user can manage menu
const canManageMenu = checkRole("admin", "manager", "chef");

// Check if user can handle orders
const canHandleOrders = checkRole(
  "admin",
  "manager",
  "waiter",
  "chef",
  "cashier"
);

// Check if user can manage tables
const canManageTables = checkRole("admin", "manager", "waiter", "receptionist");

// Check if user can view analytics
const canViewAnalytics = checkRole("admin", "manager");

module.exports = {
  checkRole,
  isAdmin,
  isManager,
  isWaiter,
  isChef,
  isCashier,
  isReceptionist,
  canManageEmployees,
  canAccessFinancial,
  canManageMenu,
  canHandleOrders,
  canManageTables,
  canViewAnalytics,
};
