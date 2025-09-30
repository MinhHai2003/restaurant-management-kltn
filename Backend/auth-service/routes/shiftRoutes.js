const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");
const authenticateToken = require("../middleware/authenticateToken");
const { checkRole } = require("../middleware/roleAuth");
const { shiftLimiter } = require("../middleware/rateLimiter");

// Middleware để xác thực token cho tất cả routes
router.use(authenticateToken);

// Thêm rate limiting cho shift routes
router.use(shiftLimiter);

// Routes cho quản lý ca làm việc

// GET /api/auth/shifts - Lấy danh sách ca làm việc
router.get("/", shiftController.getShifts);

// GET /api/auth/shifts/statistics - Lấy thống kê ca làm việc
router.get(
  "/statistics",
  checkRole("admin", "manager"),
  shiftController.getShiftStatistics
);

// GET /api/auth/shifts/:id - Lấy chi tiết ca làm việc
router.get("/:id", shiftController.getShiftById);

// POST /api/auth/shifts - Tạo ca làm việc mới (chỉ admin và manager)
router.post("/", checkRole("admin", "manager"), shiftController.createShift);

// PUT /api/auth/shifts/:id - Cập nhật ca làm việc
router.put("/:id", shiftController.updateShift);

// DELETE /api/auth/shifts/:id - Xóa ca làm việc
router.delete("/:id", shiftController.deleteShift);

// PATCH /api/auth/shifts/:id/status - Cập nhật trạng thái ca làm việc
router.patch(
  "/:id/status",
  checkRole("admin", "manager"),
  shiftController.updateShiftStatus
);

// POST /api/auth/shifts/:shiftId/assign - Phân công nhân viên vào ca
router.post(
  "/:shiftId/assign",
  checkRole("admin", "manager"),
  shiftController.assignEmployee
);

// POST /api/auth/shifts/:shiftId/unassign - Bỏ phân công nhân viên
router.post(
  "/:shiftId/unassign",
  checkRole("admin", "manager"),
  shiftController.unassignEmployee
);

// GET /api/auth/shifts/employee/:employeeId - Lấy ca làm việc của nhân viên cụ thể
router.get("/employee/:employeeId", shiftController.getEmployeeShifts);

module.exports = router;
