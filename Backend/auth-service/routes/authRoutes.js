const express = require("express");
const router = express.Router();

// Controllers
const authController = require("../controllers/authController");
const employeeController = require("../controllers/employeeController");

// Middleware
const authenticateToken = require("../middleware/authenticateToken");
const {
  isAdmin,
  isManager,
  canManageEmployees,
} = require("../middleware/roleAuth");

// Validation middleware
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateUpdateEmployee,
  validateRefreshToken,
} = require("../middleware/validation");

// Rate limiting middleware
const {
  loginLimiter,
  registerLimiter,
  passwordChangeLimiter,
  refreshTokenLimiter,
  employeeLimiter,
} = require("../middleware/rateLimiter");

// 🔐 Authentication Routes
router.post(
  "/register",
  registerLimiter,
  validateRegister,
  authController.register
);
router.post("/login", loginLimiter, validateLogin, authController.login);
router.post(
  "/refresh-token",
  refreshTokenLimiter,
  validateRefreshToken,
  authController.refreshToken
);
router.post("/logout", authenticateToken, authController.logout);

// 👤 Profile Routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put(
  "/profile",
  authenticateToken,
  validateUpdateProfile,
  authController.updateProfile
);
router.put(
  "/change-password",
  authenticateToken,
  passwordChangeLimiter,
  validateChangePassword,
  authController.changePassword
);

// 👥 Employee Management Routes (Admin/Manager only)
router.get(
  "/employees",
  authenticateToken,
  canManageEmployees,
  employeeLimiter,
  employeeController.getAllEmployees
);
router.get(
  "/employees/stats",
  authenticateToken,
  canManageEmployees,
  employeeController.getEmployeeStats
);
router.get(
  "/employees/:id",
  authenticateToken,
  canManageEmployees,
  employeeController.getEmployeeById
);
router.put(
  "/employees/:id",
  authenticateToken,
  canManageEmployees,
  employeeLimiter,
  validateUpdateEmployee,
  employeeController.updateEmployee
);
router.delete(
  "/employees/:id",
  authenticateToken,
  isAdmin,
  employeeController.deleteEmployee
);
router.post(
  "/employees/:id/unlock",
  authenticateToken,
  canManageEmployees,
  employeeController.unlockEmployee
);

module.exports = router;
