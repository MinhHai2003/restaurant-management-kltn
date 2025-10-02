const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const cartController = require("../controllers/cartController");
const sessionAuth = require("../middleware/sessionAuth"); // Updated to use session auth

// Validation rules
const addToCartValidation = [
  body("menuItemId").isMongoId().withMessage("Valid menu item ID is required"),
  body("quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be between 1 and 50"),
  body("customizations")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Customizations must not exceed 500 characters"),
  body("notes")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Notes must not exceed 300 characters"),
];

const updateCartItemValidation = [
  param("itemId").isMongoId().withMessage("Valid item ID is required"),
  body("quantity")
    .isInt({ min: 0, max: 50 })
    .withMessage("Quantity must be between 0 and 50"),
];

const applyCouponValidation = [
  body("couponCode")
    .notEmpty()
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters"),
];

const updateDeliveryValidation = [
  body("type")
    .isIn(["delivery", "pickup", "dine_in"])
    .withMessage("Delivery type must be delivery, pickup, or dine_in"),
  body("addressId")
    .optional()
    .isMongoId()
    .withMessage("Valid address ID is required"),
  body("estimatedTime")
    .optional()
    .isInt({ min: 10, max: 180 })
    .withMessage("Estimated time must be between 10 and 180 minutes"),
];

const checkoutValidation = [
  body("payment.method")
    .isIn(["cash", "card", "momo", "banking", "zalopay"])
    .withMessage("Invalid payment method"),
  body("notes.customer")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Customer notes must not exceed 500 characters"),
];

// 🛒 Cart Management Routes
router.get("/", sessionAuth, cartController.getCart);
router.get("/summary", sessionAuth, cartController.getCartSummary);
router.post("/refresh", sessionAuth, cartController.refreshCart);
router.delete("/clear", sessionAuth, cartController.clearCart);

// 📦 Item Management Routes
router.post("/add", sessionAuth, addToCartValidation, cartController.addToCart);
router.put(
  "/items/:itemId",
  sessionAuth,
  updateCartItemValidation,
  cartController.updateCartItem
);
router.delete("/items/:itemId", sessionAuth, cartController.removeFromCart);

// 🎫 Coupon Routes
router.post(
  "/coupon",
  sessionAuth,
  applyCouponValidation,
  cartController.applyCoupon
);
router.delete("/coupon", sessionAuth, cartController.removeCoupon);

// 🚚 Delivery Routes
router.put(
  "/delivery",
  sessionAuth,
  updateDeliveryValidation,
  cartController.updateDelivery
);

// 💳 Checkout Route
router.post(
  "/checkout",
  sessionAuth,
  checkoutValidation,
  cartController.checkoutCart
);

module.exports = router;
