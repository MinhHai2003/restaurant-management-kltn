const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authenticateCustomer = require("../middleware/authenticateCustomer");

// Validation rules
const createOrderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.menuItemId")
    .isMongoId()
    .withMessage("Valid menu item ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be between 1 and 50"),
  body("delivery.type")
    .isIn(["delivery", "pickup"])
    .withMessage("Delivery type must be either 'delivery' or 'pickup'"),
  body("payment.method")
    .isIn(["cash", "card", "momo", "banking", "zalopay"])
    .withMessage("Invalid payment method"),
];

const rateOrderValidation = [
  param("orderNumber").notEmpty().withMessage("Order number is required"),
  body("food")
    .isInt({ min: 1, max: 5 })
    .withMessage("Food rating must be between 1 and 5"),
  body("delivery")
    .isInt({ min: 1, max: 5 })
    .withMessage("Delivery rating must be between 1 and 5"),
  body("overall")
    .isInt({ min: 1, max: 5 })
    .withMessage("Overall rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment must not exceed 500 characters"),
];

// 📝 Order Management Routes
router.post(
  "/",
  authenticateCustomer,
  createOrderValidation,
  orderController.createOrder
);
router.get("/", authenticateCustomer, orderController.getCustomerOrders);
router.get("/stats", authenticateCustomer, orderController.getOrderStats);

// 🔍 Individual Order Routes
router.get("/:orderId", authenticateCustomer, orderController.getOrderById);
router.delete("/:orderId", authenticateCustomer, orderController.cancelOrder);
router.post(
  "/:orderNumber/rate",
  authenticateCustomer,
  rateOrderValidation,
  orderController.rateOrder
);
router.post(
  "/:orderNumber/reorder",
  authenticateCustomer,
  orderController.reorder
);

// 🔄 Tracking Routes
router.get("/track/:orderNumber", orderController.trackOrder);

module.exports = router;
