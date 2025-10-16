const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const orderController = require("../controllers/orderController");
const reviewController = require("../controllers/reviewController");
const sessionAuth = require("../middleware/sessionAuth");
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
  sessionAuth,
  createOrderValidation,
  orderController.createOrder
);
router.get("/", sessionAuth, orderController.getCustomerOrders);
router.get("/stats", sessionAuth, orderController.getOrderStats);

// 🔍 Individual Order Routes
router.get("/:orderId", sessionAuth, orderController.getOrderById);
router.delete("/:orderId", sessionAuth, orderController.cancelOrder);
router.post(
  "/:orderNumber/rate",
  sessionAuth,
  rateOrderValidation,
  orderController.rateOrder
);
router.post("/:orderNumber/reorder", sessionAuth, orderController.reorder);

// 🔄 Tracking Routes
router.get("/track/:orderNumber", orderController.trackOrder);

// ⭐ Review Routes
const createReviewValidation = [
  param("orderNumber").notEmpty().withMessage("Order number is required"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item review is required"),
  body("items.*.menuItemId")
    .notEmpty()
    .withMessage("Menu item ID is required"),
  body("items.*.menuItemName")
    .optional()
    .isString()
    .withMessage("Menu item name must be a string"),
  body("items.*.rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("items.*.comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment must not exceed 500 characters"),
  body("items.*.images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),
];

const updateReviewValidation = [
  param("reviewId").isMongoId().withMessage("Valid review ID is required"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment must not exceed 500 characters"),
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),
];

// Review management routes
router.post(
  "/order/:orderNumber",
  authenticateCustomer,
  createReviewValidation,
  reviewController.createReview
);
router.get(
  "/customer/my-reviews",
  authenticateCustomer,
  reviewController.getMyReviews
);
router.get(
  "/menu-item/:menuItemId",
  reviewController.getMenuItemReviews
);
router.get("/top-rated", reviewController.getTopRated);
router.get(
  "/customer/recommendations",
  authenticateCustomer,
  reviewController.getRecommendations
);
router.put(
  "/:reviewId",
  authenticateCustomer,
  updateReviewValidation,
  reviewController.updateReview
);
router.delete(
  "/:reviewId",
  authenticateCustomer,
  reviewController.deleteReview
);

module.exports = router;
