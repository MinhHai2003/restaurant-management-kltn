const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const authenticateCustomer = require("../middleware/authenticateCustomer");
const authenticateEmployee = require("../middleware/authenticateEmployee");

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
router.put(
  "/addresses/:addressId/default",
  authenticateCustomer,
  customerController.setDefaultAddress
);
router.delete(
  "/addresses/:addressId",
  authenticateCustomer,
  customerController.deleteAddress
);

// 🏆 Loyalty Program
router.get("/loyalty", authenticateCustomer, customerController.getLoyaltyInfo);

// 📧 Admin Tools
router.post(
  "/:customerId/send-email",
  authenticateEmployee(["admin", "manager"]),
  customerController.sendPromotionalEmail
);
router.post(
  "/:customerId/promotion-code",
  authenticateEmployee(["admin", "manager"]),
  customerController.createPromotionCodeForCustomer
);

// 🔗 Inter-Service Communication (for other microservices)
router.get("/:customerId/info", customerController.getCustomerInfo);

// 📊 Admin Routes (for statistics)
router.get(
  "/admin/all",
  authenticateEmployee(["admin", "manager"]),
  customerController.getAllCustomersForAdmin
);

module.exports = router;
