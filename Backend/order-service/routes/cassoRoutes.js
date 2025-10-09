const express = require("express");
const router = express.Router();
const cassoController = require("../controllers/cassoController");
const authenticateCustomer = require("../middleware/authenticateCustomer");
const optionalAuth = require("../middleware/optionalAuth");

// ====================================
// 🔔 WEBHOOK ENDPOINT (No Authentication)
// Casso will call this endpoint
// ====================================
router.post("/webhook", cassoController.handleWebhook);

// ====================================
// 📋 CUSTOMER ENDPOINTS
// ====================================

// Get payment instructions for an order
router.get(
  "/payment-instructions/:orderNumber",
  optionalAuth, // Allow both authenticated and guest users
  cassoController.getPaymentInstructions
);

// Check payment status for an order
router.get(
  "/payment-status/:orderNumber",
  optionalAuth, // Allow both authenticated and guest users
  cassoController.checkPaymentStatus
);

// ====================================
// 🔐 ADMIN ENDPOINTS
// ====================================

// Get all transactions (Admin only)
router.get(
  "/transactions",
  authenticateCustomer, // Should use authenticateAdmin in production
  cassoController.getAllTransactions
);

// Manually match transaction with order (Admin only)
router.post(
  "/transactions/:transactionId/match",
  authenticateCustomer, // Should use authenticateAdmin in production
  cassoController.manualMatch
);

module.exports = router;

