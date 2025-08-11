const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Customer = require("../models/Customer");

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
const ACCESS_TOKEN_EXPIRY = "24h"; // Longer for customers
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days for customers

// Helper functions
const generateTokens = (customerId) => {
  const accessToken = jwt.sign({ customerId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ customerId }, process.env.REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
};

const handleAccountLock = async (customer) => {
  customer.loginAttempts += 1;

  if (customer.loginAttempts >= MAX_LOGIN_ATTEMPTS && !customer.isLocked) {
    customer.lockUntil = Date.now() + LOCK_TIME;
  }

  await customer.save();
};

// 📝 Register Customer
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
      // Welcome bonus
      loyaltyPoints: 100,
      membershipLevel: "bronze",
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
      message: "Customer registered successfully! Welcome bonus: 100 points",
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

// 🔐 Login Customer
exports.login = async (req, res) => {
  try {
    console.log("🔍 Login Debug:", {
      body: req.body,
      contentType: req.get("Content-Type"),
      method: req.method,
    });

    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

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
      await handleAccountLock(customer);
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

// 👤 Get Profile
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Update membership level nếu cần
    const currentLevel = customer.membershipLevel;
    const calculatedLevel = customer.calculatedMembershipLevel;
    if (currentLevel !== calculatedLevel) {
      await customer.updateMembershipLevel();
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

// ✏️ Update Profile
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

    // Xử lý $inc từ order-service (tăng điểm, tổng chi tiêu, số đơn)
    if (req.body.$inc) {
      const customer = await Customer.findById(req.customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
      const {
        loyaltyPoints = 0,
        totalSpent = 0,
        totalOrders = 0,
      } = req.body.$inc;
      if (loyaltyPoints) customer.loyaltyPoints += loyaltyPoints;
      if (totalSpent) customer.totalSpent += totalSpent;
      if (totalOrders) customer.totalOrders += totalOrders;
      await customer.save();
      return res.json({
        success: true,
        message: "Profile updated successfully ($inc)",
        data: { customer },
      });
    }

    // Xử lý update thông tin thông thường
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      preferences,
      allowNotifications,
      allowPromotions,
    } = req.body;

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
    if (preferences)
      customer.preferences = { ...customer.preferences, ...preferences };
    if (allowNotifications !== undefined)
      customer.allowNotifications = allowNotifications;
    if (allowPromotions !== undefined)
      customer.allowPromotions = allowPromotions;

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

// 📍 Manage Addresses
// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId).select(
      "addresses"
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Addresses retrieved successfully",
      data: {
        addresses: customer.addresses || [],
      },
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add new address
exports.addAddress = async (req, res) => {
  try {
    const { label, address, district, city, phone, isDefault } = req.body;

    const customer = await Customer.findById(req.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // If this is default, make others non-default
    if (isDefault) {
      customer.addresses.forEach((addr) => (addr.isDefault = false));
    }

    customer.addresses.push({
      label,
      address,
      district,
      city,
      phone,
      isDefault: isDefault || customer.addresses.length === 0,
    });

    await customer.save();

    // Lấy địa chỉ vừa thêm (cuối mảng)
    const newAddress = customer.addresses[customer.addresses.length - 1];

    res.json({
      success: true,
      message: "Address added successfully",
      data: { address: newAddress },
    });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🏆 Get Loyalty Info
exports.getLoyaltyInfo = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Calculate points to next level
    const levelThresholds = {
      bronze: 5000000,
      silver: 20000000,
      gold: 50000000,
      platinum: Infinity,
    };

    const currentLevel = customer.membershipLevel;
    const nextLevel = {
      bronze: "silver",
      silver: "gold",
      gold: "platinum",
      platinum: "platinum",
    }[currentLevel];

    const pointsToNextLevel =
      currentLevel === "platinum"
        ? 0
        : levelThresholds[nextLevel] - customer.totalSpent;

    res.json({
      success: true,
      message: "Loyalty info retrieved successfully",
      data: {
        loyaltyPoints: customer.loyaltyPoints,
        membershipLevel: customer.membershipLevel,
        totalSpent: customer.totalSpent,
        totalOrders: customer.totalOrders,
        pointsToNextLevel,
        nextLevel: currentLevel === "platinum" ? null : nextLevel,
      },
    });
  } catch (error) {
    console.error("Get loyalty info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Refresh access token
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const customer = await Customer.findById(decoded.customerId);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { customerId: customer._id },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    res.json({
      success: true,
      message: "Access token refreshed successfully",
      data: { accessToken },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, address, district, city, phone, isDefault } = req.body;

    const customer = await Customer.findById(req.customerId);
    const addressIndex = customer.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Update address
    customer.addresses[addressIndex] = {
      ...customer.addresses[addressIndex],
      label,
      address,
      district,
      city,
      phone,
      isDefault,
    };

    // If setting as default, remove default from others
    if (isDefault) {
      customer.addresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    await customer.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      data: { address: customer.addresses[addressIndex] },
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findById(req.customerId);
    const addressIndex = customer.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    customer.addresses.splice(addressIndex, 1);
    await customer.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Set default address
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findById(req.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const addressIndex = customer.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default from all addresses
    customer.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Set new default
    customer.addresses[addressIndex].isDefault = true;
    await customer.save();

    res.json({
      success: true,
      message: "Default address updated successfully",
      data: { address: customer.addresses[addressIndex] },
    });
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔗 Get Customer Info for Other Services
exports.getCustomerInfo = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId).select(
      "name email phone"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Get customer info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer information",
      error: error.message,
    });
  }
};

module.exports = {
  register: exports.register,
  login: exports.login,
  refreshAccessToken: exports.refreshAccessToken,
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  getAddresses: exports.getAddresses,
  addAddress: exports.addAddress,
  updateAddress: exports.updateAddress,
  deleteAddress: exports.deleteAddress,
  setDefaultAddress: exports.setDefaultAddress,
  getLoyaltyInfo: exports.getLoyaltyInfo,
  getCustomerInfo: exports.getCustomerInfo,
};
