const express = require("express");
const router = express.Router();
const dineInController = require("../controllers/dineInController");
const authenticateCustomer = require("../middleware/authenticateCustomer");

// 🍽️ Create dine-in order
router.post("/", authenticateCustomer, dineInController.createDineInOrder);

// 📋 Get orders by reservation
router.get(
  "/reservation/:reservationId",
  authenticateCustomer,
  dineInController.getOrdersByReservation
);

// 📋 Get orders by table (for staff)
router.get("/table/:tableId", dineInController.getOrdersByTable);

// 🍳 Update order status
router.put("/:orderNumber/status", dineInController.updateOrderStatus);

// 🍽️ Mark order as served
router.put("/:orderNumber/serve", dineInController.serveOrder);

module.exports = router;
