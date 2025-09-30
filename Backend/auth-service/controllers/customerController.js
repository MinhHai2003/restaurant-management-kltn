const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Customer = require("../models/Customer");

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || "7d"; // Khách hàng có thể login lâu hơn
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_EXPIRES_IN || "30d";

// Helper functions
const generateTokens = (customerId) => {
  const accessToken = jwt.sign(
    { customerId, type: "customer" },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { customerId, type: "customer" },
    process.env.REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
};

// 📝 Customer Register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password, phone, dateOfBirth, gender } = req.body;

    // Check if customer exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create customer
    const customer = new Customer({
      name,
      email,
      password: hashedPassword,
      phone,
      dateOfBirth,
      gender,
    });

    await customer.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(customer._id);

    // Save refresh token
    customer.refreshToken = refreshToken;
    customer.refreshTokenExpiry = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: {
        customer,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Customer register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔐 Customer Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find customer
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (customer.isLocked) {
      return res.status(423).json({
        success: false,
        message:
          "Account temporarily locked due to too many failed login attempts",
      });
    }

    // Check if account is active
    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      // Handle failed login
      customer.loginAttempts += 1;
      if (customer.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        customer.lockUntil = Date.now() + LOCK_TIME;
      }
      await customer.save();

      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    if (customer.loginAttempts > 0) {
      customer.loginAttempts = 0;
      customer.lockUntil = undefined;
    }

    // Update last login
    customer.lastLogin = new Date();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(customer._id);

    // Save refresh token
    customer.refreshToken = refreshToken;
    customer.refreshTokenExpiry = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    await customer.save();

    res.json({
      success: true,
      message: "Login successful",
      data: {
        customer,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 👤 Get Customer Profile
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: { customer },
    });
  } catch (error) {
    console.error("Get customer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✏️ Update Customer Profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, phone, dateOfBirth, gender, address, preferences } = req.body;

    const customer = await Customer.findById(req.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Update allowed fields
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (dateOfBirth) customer.dateOfBirth = dateOfBirth;
    if (gender) customer.gender = gender;
    if (address) customer.address = { ...customer.address, ...address };
    if (preferences)
      customer.preferences = { ...customer.preferences, ...preferences };

    await customer.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { customer },
    });
  } catch (error) {
    console.error("Update customer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🚪 Customer Logout
exports.logout = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId);
    if (customer) {
      customer.refreshToken = null;
      customer.refreshTokenExpiry = null;
      await customer.save();
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Customer logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
