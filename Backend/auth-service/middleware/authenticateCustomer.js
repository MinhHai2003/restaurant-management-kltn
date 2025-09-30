const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

const authenticateCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a customer token
    if (decoded.type !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // Get customer and check if active
    const customer = await Customer.findById(decoded.customerId);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid token - customer not found",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    if (customer.isLocked) {
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked",
      });
    }

    // Add customer info to request
    req.customerId = customer._id;
    req.customer = customer;

    next();
  } catch (error) {
    console.error("Customer auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = authenticateCustomer;
