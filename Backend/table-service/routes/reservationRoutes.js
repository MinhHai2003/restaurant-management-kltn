const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const authenticateCustomer = require("../middleware/authenticateCustomer");

// Validation rules
const createReservationValidation = [
  body("tableId").isMongoId().withMessage("Valid table ID is required"),
  body("reservationDate")
    .isISO8601()
    .withMessage("Valid reservation date is required"),
  body("startTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid start time is required (HH:MM)"),
  body("endTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid end time is required (HH:MM)"),
  body("partySize")
    .isInt({ min: 1, max: 20 })
    .withMessage("Party size must be between 1 and 20"),
  body("occasion")
    .optional()
    .isIn(["birthday", "anniversary", "business", "date", "family", "other"])
    .withMessage("Invalid occasion"),
  body("specialRequests")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Special requests must not exceed 1000 characters"),
];

const updateReservationValidation = [
  param("reservationNumber")
    .notEmpty()
    .withMessage("Reservation number is required"),
  body("reservationDate")
    .optional()
    .isISO8601()
    .withMessage("Valid reservation date is required"),
  body("timeSlot.startTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid start time is required (HH:MM)"),
  body("timeSlot.endTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid end time is required (HH:MM)"),
  body("partySize")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Party size must be between 1 and 20"),
  body("occasion")
    .optional()
    .isIn(["birthday", "anniversary", "business", "date", "family", "other"])
    .withMessage("Invalid occasion"),
  body("specialRequests")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Special requests must not exceed 1000 characters"),
];

const rateReservationValidation = [
  param("reservationNumber")
    .notEmpty()
    .withMessage("Reservation number is required"),
  body("service")
    .isInt({ min: 1, max: 5 })
    .withMessage("Service rating must be between 1 and 5"),
  body("ambiance")
    .isInt({ min: 1, max: 5 })
    .withMessage("Ambiance rating must be between 1 and 5"),
  body("overall")
    .isInt({ min: 1, max: 5 })
    .withMessage("Overall rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment must not exceed 500 characters"),
];

// 📝 Reservation Management Routes
router.post(
  "/",
  authenticateCustomer,
  createReservationValidation,
  reservationController.createReservation
);
router.get(
  "/",
  authenticateCustomer,
  reservationController.getCustomerReservations
);
router.get(
  "/stats",
  authenticateCustomer,
  reservationController.getReservationStats
);

// 🔍 Individual Reservation Routes
router.get(
  "/:reservationNumber",
  authenticateCustomer,
  reservationController.getReservationByNumber
);
router.put(
  "/:reservationNumber",
  authenticateCustomer,
  updateReservationValidation,
  reservationController.updateReservation
);
router.delete(
  "/:reservationNumber",
  authenticateCustomer,
  reservationController.cancelReservation
);
router.post(
  "/:reservationNumber/rate",
  authenticateCustomer,
  rateReservationValidation,
  reservationController.rateReservation
);

// 🚪 Dine-in Management Routes
router.put(
  "/:reservationNumber/checkin",
  authenticateCustomer,
  reservationController.checkinReservation
);
router.put(
  "/:reservationNumber/checkout",
  authenticateCustomer,
  reservationController.checkoutReservation
);
router.get(
  "/:reservationNumber/orders",
  authenticateCustomer,
  reservationController.getReservationOrders
);

// 📋 Admin Routes
router.get("/admin/all", reservationController.getAllReservations);

// Update reservation status (Admin)
router.put(
  "/admin/:reservationId/status",
  reservationController.updateReservationStatus
);

module.exports = router;
