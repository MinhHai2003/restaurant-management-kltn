const express = require("express");
const router = express.Router();
const dineInController = require("../controllers/dineInController");
const authenticateCustomer = require("../middleware/authenticateCustomer");

// 🍽️ Create dine-in order - Support both authenticated and guest users
router.post("/", dineInController.createDineInOrder);

// 📋 Get orders by reservation
router.get(
  "/reservation/:reservationId",
  authenticateCustomer,
  dineInController.getOrdersByReservation
);

// 📋 Get orders by table (for staff)
router.get("/table/:tableId", dineInController.getOrdersByTable);

// 📋 Get orders by table number (for customers)
router.get(
  "/table-number/:tableNumber",
  dineInController.getOrdersByTableNumber
);

// 🍳 Update order status
router.put("/:orderNumber/status", dineInController.updateOrderStatus);

// 🍽️ Mark order as served
router.put("/:orderNumber/serve", dineInController.serveOrder);

// Complete all orders for a table (session payment)
router.patch(
  "/table-number/:tableNumber/complete",
  dineInController.completeTableOrders
);

module.exports = router;
