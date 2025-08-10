const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authenticateCustomer = require("../middleware/authenticateCustomer");

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
router.get("/", authenticateCustomer, cartController.getCart);
router.get("/summary", authenticateCustomer, cartController.getCartSummary);
router.delete("/clear", authenticateCustomer, cartController.clearCart);

// 📦 Item Management Routes
router.post(
  "/add",
  authenticateCustomer,
  addToCartValidation,
  cartController.addToCart
);
router.put(
  "/items/:itemId",
  authenticateCustomer,
  updateCartItemValidation,
  cartController.updateCartItem
);
router.delete(
  "/items/:itemId",
  authenticateCustomer,
  cartController.removeFromCart
);

// 🎫 Coupon Routes
router.post(
  "/coupon",
  authenticateCustomer,
  applyCouponValidation,
  cartController.applyCoupon
);
router.delete("/coupon", authenticateCustomer, cartController.removeCoupon);

// 🚚 Delivery Routes
router.put(
  "/delivery",
  authenticateCustomer,
  updateDeliveryValidation,
  cartController.updateDelivery
);

// 💳 Checkout Route
router.post(
  "/checkout",
  authenticateCustomer,
  checkoutValidation,
  cartController.checkoutCart
);

module.exports = router;
