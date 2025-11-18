const express = require("express");
const router = express.Router();
const authenticateCustomer = require("../middleware/authenticateCustomer");
const authenticateEmployee = require("../middleware/authenticateEmployee");
const {
  getConversations,
  getConversationById,
  createConversation,
  assignConversation,
  closeConversation,
  reopenConversation,
  getUnreadCount,
} = require("../controllers/conversationController");

// Customer routes
router.get(
  "/",
  authenticateCustomer,
  getConversations
);

router.get(
  "/:id",
  authenticateCustomer,
  getConversationById
);

router.post(
  "/",
  authenticateCustomer,
  createConversation
);

router.get(
  "/:conversationId/unread-count",
  authenticateCustomer,
  getUnreadCount
);

// Admin/Employee routes
router.get(
  "/admin/all",
  authenticateEmployee(["admin", "manager"]),
  getConversations
);

router.get(
  "/admin/:id",
  authenticateEmployee(["admin", "manager"]),
  getConversationById
);

router.patch(
  "/admin/:id/assign",
  authenticateEmployee(["admin", "manager"]),
  assignConversation
);

router.patch(
  "/admin/:id/close",
  authenticateEmployee(["admin", "manager"]),
  closeConversation
);

router.patch(
  "/admin/:id/reopen",
  authenticateEmployee(["admin", "manager"]),
  reopenConversation
);

router.get(
  "/admin/:conversationId/unread-count",
  authenticateEmployee(["admin", "manager"]),
  getUnreadCount
);

module.exports = router;

