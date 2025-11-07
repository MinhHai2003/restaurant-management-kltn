const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const Customer = require("../models/Customer");

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
const ACCESS_TOKEN_EXPIRY = "24h"; // Longer for customers
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days for customers

// Email helpers
let emailTransporter;

const getEmailTransporter = () => {
  if (emailTransporter !== undefined) {
    return emailTransporter;
  }

  console.log("[EMAIL] Initializing email transporter...");
  console.log("[EMAIL] Environment variables:", {
    SMTP_HOST: process.env.SMTP_HOST ? "SET" : "NOT SET",
    SMTP_PORT: process.env.SMTP_PORT || "NOT SET",
    SMTP_SECURE: process.env.SMTP_SECURE || "NOT SET",
    SMTP_USER: process.env.SMTP_USER ? "SET" : "NOT SET",
    SMTP_PASS: process.env.SMTP_PASS ? "SET (hidden)" : "NOT SET",
    EMAIL_FROM: process.env.EMAIL_FROM || "NOT SET",
  });

  if (!process.env.SMTP_HOST) {
    console.warn(
      "[EMAIL] SMTP_HOST is not configured. Emails will be logged instead of sent."
    );
    emailTransporter = null;
    return emailTransporter;
  }

  try {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure:
        process.env.SMTP_SECURE === "true" ||
        parseInt(process.env.SMTP_PORT, 10) === 465,
      requireTLS: parseInt(process.env.SMTP_PORT, 10) === 587, // Gmail requires TLS for port 587
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    };

    console.log("[EMAIL] Creating transporter with config:", {
      host: config.host,
      port: config.port,
      secure: config.secure,
      hasAuth: !!config.auth,
    });

    emailTransporter = nodemailer.createTransport(config);
    
    console.log("[EMAIL] Transporter created successfully");
  } catch (error) {
    console.error("[EMAIL] Failed to initialize transporter:", error);
    emailTransporter = null;
  }

  return emailTransporter;
};

const nl2br = (value = "") => value.replace(/\n/g, "<br />");
const stripHtml = (value = "") => value.replace(/<[^>]*>?/gm, "");

const sendEmailWithFallback = async ({ to, subject, html, text }) => {
  const transporter = getEmailTransporter();

  if (!transporter) {
    console.log("[EMAIL DEBUG] Simulated email send:", {
      to,
      subject,
      preview: stripHtml(html || text || ""),
    });
    return { delivered: false, simulated: true };
  }

  try {
    const fromAddress =
      process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@restaurant.local";
    
    console.log("[EMAIL] Attempting to send email:", {
      from: fromAddress,
      to,
      subject,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });

    console.log("[EMAIL] Email sent successfully:", {
      messageId: info.messageId,
      to,
      subject,
    });

    return { delivered: true, info };
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      to,
      subject,
    });
    
    return { 
      delivered: false, 
      simulated: false,
      reason: error.message || "Unknown error",
      error: {
        code: error.code,
        command: error.command,
        response: error.response,
      }
    };
  }
};

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

// 📊 Get All Customers for Admin (for statistics)
exports.getAllCustomersForAdmin = async (req, res) => {
  try {
    const customers = await Customer.find({})
      .select(
        "_id name email phone loyaltyPoints membershipLevel totalOrders totalSpent isActive createdAt updatedAt lastLogin promotionCodes allowPromotions lastPromotionEmailAt"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        customers: customers,
        total: customers.length,
      },
    });
  } catch (error) {
    console.error("Get all customers for admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

// 📧 Send promotional email to a customer
exports.sendPromotionalEmail = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { subject, body } = req.body || {};

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Subject and body are required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.allowPromotions) {
      return res.status(403).json({
        success: false,
        message: "Customer has opted out of promotional emails",
      });
    }

    const sanitizedBody = stripHtml(body);

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <p>Xin chào ${customer.name || "bạn"},</p>
        <p>${nl2br(sanitizedBody)}</p>
        <p style="margin-top: 24px;">Trân trọng,<br/>Đội ngũ Nhà hàng</p>
      </div>
    `;

    const emailResult = await sendEmailWithFallback({
      to: customer.email,
      subject,
      html: htmlContent,
      text: sanitizedBody,
    });

    if (emailResult.delivered) {
      customer.lastPromotionEmailAt = new Date();
      await customer.save();
    }

    const responseEmailInfo = {
      delivered: emailResult.delivered,
      simulated: emailResult.simulated || false,
    };

    if (!emailResult.delivered) {
      if (emailResult.reason) {
        responseEmailInfo.reason = emailResult.reason;
      }
      if (emailResult.error) {
        responseEmailInfo.error = emailResult.error;
      }
    }

    // Return appropriate status code based on delivery status
    if (!emailResult.delivered && !emailResult.simulated) {
      // Real SMTP error occurred
      return res.status(500).json({
        success: false,
        message: "Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP.",
        data: responseEmailInfo,
      });
    }

    res.json({
      success: true,
      message: emailResult.delivered
        ? "Email đã được gửi thành công"
        : "SMTP chưa cấu hình. Email chỉ được ghi log (simulated)",
      data: responseEmailInfo,
    });
  } catch (error) {
    console.error("Send promotional email error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send promotional email",
      error: error.message,
    });
  }
};

// 🎁 Create promotion code for a customer
exports.createPromotionCodeForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      code,
      discount,
      discountType,
      minOrder,
      maxDiscount,
      description,
      validFrom,
      validTo,
      sendEmail = true,
      emailSubject,
      emailBody,
    } = req.body || {};

    if (!code || discount === undefined || discount === null) {
      return res.status(400).json({
        success: false,
        message: "Code và discount là bắt buộc",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const discountValue = Number(discount);

    if (Number.isNaN(discountValue) || discountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount phải là số không âm",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const existingCode = customer.promotionCodes.find(
      (promo) => promo.code === normalizedCode && promo.isActive
    );

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: "Mã khuyến mãi đã tồn tại cho khách hàng này",
      });
    }

    const discountTypeValue =
      discountType === "fixed" || discountType === "percentage"
        ? discountType
        : "percentage";

    const minOrderValue =
      minOrder !== undefined && minOrder !== null
        ? Number(minOrder)
        : 0;

    if (Number.isNaN(minOrderValue) || minOrderValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Giá trị đơn tối thiểu không hợp lệ",
      });
    }

    const maxDiscountValue =
      maxDiscount !== undefined && maxDiscount !== null
        ? Number(maxDiscount)
        : undefined;

    if (
      discountTypeValue === "percentage" &&
      maxDiscountValue !== undefined &&
      (Number.isNaN(maxDiscountValue) || maxDiscountValue < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Giảm tối đa không hợp lệ",
      });
    }

    const validFromDate = validFrom ? new Date(validFrom) : new Date();
    const validToDate = validTo ? new Date(validTo) : undefined;

    if (Number.isNaN(validFromDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu không hợp lệ",
      });
    }

    if (validToDate && Number.isNaN(validToDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc không hợp lệ",
      });
    }

    if (validToDate && validToDate < validFromDate) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    const promotionEntry = {
      code: normalizedCode,
      discount: discountValue,
      discountType: discountTypeValue,
      minOrder: minOrderValue,
      maxDiscount:
        discountTypeValue === "percentage" ? maxDiscountValue || 0 : undefined,
      description: description ? stripHtml(description) : undefined,
      validFrom: validFromDate,
      validTo: validToDate,
      createdBy: req.employeeId ? String(req.employeeId) : undefined,
      createdByRole: req.employeeRole,
      createdByEmail: req.employeeEmail,
      createdAt: new Date(),
      isActive: true,
      sentViaEmail: false,
    };

    let emailResult = null;

    if (sendEmail && customer.allowPromotions) {
      const promoSubject =
        emailSubject || `Mã khuyến mãi dành riêng cho bạn: ${normalizedCode}`;
      const sanitizedCustomEmailBody = emailBody
        ? stripHtml(emailBody)
        : null;
      const sanitizedDescription = description
        ? stripHtml(description)
        : "Chúc bạn có trải nghiệm tuyệt vời cùng chúng tôi!";

      const defaultEmailBody = `
        <p>Xin chào ${customer.name || "bạn"},</p>
        <p>Nhà hàng gửi tặng bạn mã khuyến mãi <strong>${normalizedCode}</strong> với ưu đãi ${
        discountTypeValue === "percentage"
          ? `${discountValue}%`
          : `${discountValue.toLocaleString("vi-VN")} VNĐ`
      }.</p>
        <p>Mã có hiệu lực từ ${validFromDate.toLocaleDateString(
          "vi-VN"
        )}${
        validToDate
          ? ` đến ${validToDate.toLocaleDateString("vi-VN")}`
          : ""
      }.</p>
        <p>${minOrderValue > 0
          ? `Áp dụng cho đơn hàng từ ${minOrderValue.toLocaleString("vi-VN")} VNĐ.`
          : ""}
        ${
          discountTypeValue === "percentage" && maxDiscountValue
            ? `Giảm tối đa ${maxDiscountValue.toLocaleString("vi-VN")} VNĐ.`
            : ""
        }</p>
        <p>${sanitizedDescription}</p>
        <p style="margin-top: 24px;">Trân trọng,<br/>Đội ngũ Nhà hàng</p>
      `;

      emailResult = await sendEmailWithFallback({
        to: customer.email,
        subject: promoSubject,
        html: sanitizedCustomEmailBody
          ? nl2br(sanitizedCustomEmailBody)
          : defaultEmailBody,
        text: sanitizedCustomEmailBody || stripHtml(defaultEmailBody),
      });

      if (emailResult.delivered) {
        promotionEntry.sentViaEmail = true;
        promotionEntry.emailSentAt = new Date();
        customer.lastPromotionEmailAt = new Date();
      }
    } else if (sendEmail && !customer.allowPromotions) {
      emailResult = {
        delivered: false,
        simulated: true,
        reason: "Customer has opted out of promotional emails",
      };
    } else {
      emailResult = {
        delivered: false,
        simulated: true,
        reason: "Email sending disabled for this request",
      };
    }

    customer.promotionCodes.push(promotionEntry);
    await customer.save();

    const createdPromotion =
      customer.promotionCodes[customer.promotionCodes.length - 1];
    const promotionPlain =
      typeof createdPromotion.toObject === "function"
        ? createdPromotion.toObject()
        : createdPromotion;

    res.status(201).json({
      success: true,
      message: "Đã tạo mã khuyến mãi cho khách hàng",
      data: {
        promotion: promotionPlain,
        email: emailResult
          ? {
              delivered: !!emailResult.delivered,
              simulated: emailResult.simulated || false,
              reason: emailResult.reason,
            }
          : {
              delivered: false,
              simulated: true,
              reason: "Email sending disabled",
            },
      },
    });
  } catch (error) {
    console.error("Create promotion code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create promotion code",
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
  getAllCustomersForAdmin: exports.getAllCustomersForAdmin,
  sendPromotionalEmail: exports.sendPromotionalEmail,
  createPromotionCodeForCustomer: exports.createPromotionCodeForCustomer,
};
