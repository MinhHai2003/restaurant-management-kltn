const { body } = require("express-validator");

// 📝 Register validation
const validateRegister = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("role")
    .optional()
    .isIn(["admin", "manager", "waiter", "chef", "cashier", "receptionist"])
    .withMessage("Invalid role"),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),

  body("department")
    .optional()
    .isIn(["kitchen", "service", "cashier", "management", "reception"])
    .withMessage("Invalid department"),

  body("salary")
    .optional()
    .isNumeric()
    .withMessage("Salary must be a number")
    .isFloat({ min: 0 })
    .withMessage("Salary must be positive"),
];

// 🔐 Login validation
const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

// 👤 Update profile validation
const validateUpdateProfile = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),

  body("address")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Address is too long"),
];

// 🔑 Change password validation
const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match");
    }
    return true;
  }),
];

// 👥 Update employee validation
const validateUpdateEmployee = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("role")
    .optional()
    .isIn(["admin", "manager", "waiter", "chef", "cashier", "receptionist"])
    .withMessage("Invalid role"),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),

  body("department")
    .optional()
    .isIn(["kitchen", "service", "cashier", "management", "reception"])
    .withMessage("Invalid department"),

  body("salary")
    .optional()
    .isNumeric()
    .withMessage("Salary must be a number")
    .isFloat({ min: 0 })
    .withMessage("Salary must be positive"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

// 🔄 Refresh token validation
const validateRefreshToken = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateUpdateEmployee,
  validateRefreshToken,
};
