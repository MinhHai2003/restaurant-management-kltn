const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const authenticateCustomer = require("../middleware/authenticateCustomer");

// 🔐 Authentication Routes
router.post("/register", customerController.register);
router.post("/login", customerController.login);

// 👤 Profile Routes
router.get("/profile", authenticateCustomer, customerController.getProfile);
router.put("/profile", authenticateCustomer, customerController.updateProfile);

// 📍 Address Management
router.get("/addresses", authenticateCustomer, customerController.getAddresses);
router.post("/addresses", authenticateCustomer, customerController.addAddress);
router.put(
  "/addresses/:addressId",
  authenticateCustomer,
  customerController.updateAddress
);
router.delete(
  "/addresses/:addressId",
  authenticateCustomer,
  customerController.deleteAddress
);

// 🏆 Loyalty Program
router.get("/loyalty", authenticateCustomer, customerController.getLoyaltyInfo);

// 🔗 Inter-Service Communication (for other microservices)
router.get("/:customerId/info", customerController.getCustomerInfo);

module.exports = router;
