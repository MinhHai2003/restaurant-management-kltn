const express = require("express");
const router = express.Router();
const authenticateCustomer = require("../middleware/authenticateCustomer");
const authenticateEmployee = require("../middleware/authenticateEmployee");
const {
  getMessages,
  sendMessage,
  markMessageAsRead,
  markAllAsRead,
} = require("../controllers/messageController");

// Customer routes
router.get(
  "/conversations/:conversationId/messages",
  authenticateCustomer,
  getMessages
);

router.post(
  "/conversations/:conversationId/messages",
  authenticateCustomer,
  sendMessage
);

router.patch(
  "/messages/:messageId/read",
  authenticateCustomer,
  markMessageAsRead
);

router.patch(
  "/conversations/:conversationId/messages/read-all",
  authenticateCustomer,
  markAllAsRead
);

// Admin/Employee routes
router.get(
  "/admin/conversations/:conversationId/messages",
  authenticateEmployee(["admin", "manager"]),
  getMessages
);

router.post(
  "/admin/conversations/:conversationId/messages",
  authenticateEmployee(["admin", "manager"]),
  sendMessage
);

router.patch(
  "/admin/messages/:messageId/read",
  authenticateEmployee(["admin", "manager"]),
  markMessageAsRead
);

router.patch(
  "/admin/conversations/:conversationId/messages/read-all",
  authenticateEmployee(["admin", "manager"]),
  markAllAsRead
);

module.exports = router;

