const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const {
  createAdminOrder,
  getAdminOrders,
  updateOrderStatus,
  getOrderDashboard,
} = require("../controllers/adminOrderController");

// Validation rules cho admin order
const createAdminOrderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Ít nhất một món ăn là bắt buộc"),
  body("items.*.name").notEmpty().withMessage("Tên món ăn là bắt buộc"),
  body("items.*.quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Số lượng phải từ 1-50"),
  body("items.*.price").isFloat({ min: 0 }).withMessage("Giá phải >= 0"),
  body("customerInfo.name")
    .notEmpty()
    .withMessage("Tên khách hàng là bắt buộc"),
  body("customerInfo.phone")
    .optional()
    .isMobilePhone("vi-VN")
    .withMessage("Số điện thoại không hợp lệ"),
  body("orderType")
    .isIn(["pickup", "dine-in", "delivery"])
    .withMessage("Loại đơn hàng không hợp lệ"),
  body("payment.method")
    .isIn(["cash", "card", "momo", "banking", "zalopay"])
    .withMessage("Phương thức thanh toán không hợp lệ"),
  body("tableNumber")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số bàn phải từ 1-100"),
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giảm giá phải >= 0"),
];

const updateOrderStatusValidation = [
  param("orderId").isMongoId().withMessage("ID đơn hàng không hợp lệ"),
  body("status")
    .isIn([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "picked_up",
      "delivered",
      "completed",
      "cancelled",
    ])
    .withMessage("Trạng thái không hợp lệ"),
  body("note")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Ghi chú không quá 500 ký tự"),
];

// 📊 Dashboard - Thống kê tổng quan
router.get("/dashboard", getOrderDashboard);

// 📝 Tạo đơn hàng mới
router.post("/", createAdminOrderValidation, createAdminOrder);

// 📋 Lấy danh sách đơn hàng với phân trang và filter
router.get("/", getAdminOrders);

// 🔄 Cập nhật trạng thái đơn hàng
router.patch(
  "/:orderId/status",
  updateOrderStatusValidation,
  updateOrderStatus
);

module.exports = router;
