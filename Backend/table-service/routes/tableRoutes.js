const express = require("express");
const { query, param } = require("express-validator");
const router = express.Router();
const tableController = require("../controllers/tableController");

// Validation rules
const searchTablesValidation = [
  query("date").isISO8601().withMessage("Valid date is required"),
  query("startTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid start time is required (HH:MM)"),
  query("endTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid end time is required (HH:MM)"),
  query("partySize")
    .isInt({ min: 1, max: 20 })
    .withMessage("Party size must be between 1 and 20"),
  query("location")
    .optional()
    .isIn(["indoor", "outdoor", "private", "vip", "terrace", "garden"])
    .withMessage("Invalid location"),
];

const tableAvailabilityValidation = [
  query("tableId").isMongoId().withMessage("Valid table ID is required"),
  query("startDate").isISO8601().withMessage("Valid start date is required"),
  query("endDate").isISO8601().withMessage("Valid end date is required"),
];

// 📋 Table Management Routes
router.post("/", tableController.createTable); // Tạo bàn mới
router.get("/", tableController.getAllTables);
router.get("/stats", tableController.getTableStats);
router.get(
  "/search",
  searchTablesValidation,
  tableController.searchAvailableTables
);
router.get(
  "/availability",
  tableAvailabilityValidation,
  tableController.getTableAvailability
);

// 🔍 Individual Table Routes
router.get(
  "/:tableId",
  param("tableId").isMongoId().withMessage("Valid table ID is required"),
  tableController.getTableById
);
router.delete(
  "/:tableId",
  param("tableId").isMongoId().withMessage("Valid table ID is required"),
  tableController.deleteTable
);

// 📝 Update Table (PUT)
router.put(
  "/:tableId",
  param("tableId").isMongoId().withMessage("Valid table ID is required"),
  tableController.updateTable
);

// 🆕 Create Table (POST) - Admin only
router.post("/admin/create", tableController.createTable);

// 🔄 Update Table Status (PATCH) - Admin only
router.patch(
  "/:tableId/status",
  param("tableId").isMongoId().withMessage("Valid table ID is required"),
  tableController.updateTableStatus
);

// 🔄 Reset all maintenance tables to available (POST) - Admin only
router.post("/admin/reset-maintenance", tableController.resetMaintenanceTables);

module.exports = router;
