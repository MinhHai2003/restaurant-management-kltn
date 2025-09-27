const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminInventoryController");
const authenticateAdmin = require("../middleware/authenticateAdmin");
const {
  validateInventoryData,
  validateQuantityUpdate,
  handleValidationErrors,
} = require("../middleware/validation");

// 🔐 Tất cả routes admin đều yêu cầu authentication
// router.use(authenticateAdmin); // Tạm thời comment để test

// 📊 Dashboard & Statistics
router.get("/stats", adminController.getInventoryStats);
router.get("/report", adminController.getInventoryReport);

// 📋 CRUD Operations for Admin
router.get("/", adminController.getInventoriesAdmin);
router.post(
  "/",
  validateInventoryData,
  handleValidationErrors,
  adminController.createInventoryAdmin
);
router.put(
  "/:id",
  validateInventoryData,
  handleValidationErrors,
  adminController.updateInventoryAdmin
);
router.delete("/:id", adminController.deleteInventoryAdmin);

// 🔄 Inventory Management
router.patch(
  "/:id/quantity",
  validateQuantityUpdate,
  handleValidationErrors,
  adminController.updateInventoryQuantity
);

module.exports = router;
