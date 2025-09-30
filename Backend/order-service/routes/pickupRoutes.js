const express = require("express");
const router = express.Router();
const pickupController = require("../controllers/pickupController");
const authenticateCustomer = require("../middleware/authenticateCustomer");

// 🏃 Customer creates pickup order
router.post("/", authenticateCustomer, pickupController.createPickupOrder);

// 📋 Staff gets all pickup orders
router.get("/", pickupController.getPickupOrders);

// ✅ Staff confirms pickup order (pending → preparing)
router.put("/:orderNumber/confirm", pickupController.confirmPickupOrder);

// 📞 Staff marks order as ready for pickup
router.put("/:orderNumber/ready", pickupController.markPickupReady);

// 📦 Staff completes pickup (customer picked up)
router.put("/:orderNumber/complete", pickupController.completePickup);

module.exports = router;
