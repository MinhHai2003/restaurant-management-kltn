const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const cartController = require("../controllers/cartController");
const optionalAuth = require("../middleware/optionalAuth");

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

const guestCheckoutValidation = [
  body("guestInfo.name")
    .if(
      (value, { req }) =>
        req.isGuest && req.customerId === process.env.GUEST_CUSTOMER_ID
    )
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("guestInfo.email")
    .if(
      (value, { req }) =>
        req.isGuest && req.customerId === process.env.GUEST_CUSTOMER_ID
    )
    .isEmail()
    .withMessage("Valid email is required"),
  body("guestInfo.phone")
    .if(
      (value, { req }) =>
        req.isGuest && req.customerId === process.env.GUEST_CUSTOMER_ID
    )
    .isMobilePhone("vi-VN")
    .withMessage("Valid Vietnamese phone number is required"),
  body("payment.method")
    .isIn(["cash", "card", "momo", "banking", "zalopay"])
    .withMessage("Invalid payment method"),
  body("notes.customer")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Customer notes must not exceed 500 characters"),
];

// 🛒 Universal Cart Management Routes (works for both guest and authenticated users)
router.get("/", optionalAuth, cartController.getCart);
router.get("/summary", optionalAuth, cartController.getCartSummary);
router.post("/refresh", optionalAuth, cartController.refreshCart);
router.delete("/clear", optionalAuth, cartController.clearCart);

// 📦 Item Management Routes
router.post(
  "/add",
  optionalAuth,
  addToCartValidation,
  cartController.addToCart
);
router.put(
  "/items/:itemId",
  optionalAuth,
  updateCartItemValidation,
  cartController.updateCartItem
);
router.delete("/items/:itemId", optionalAuth, cartController.removeFromCart);

// 🎫 Coupon Routes
router.post("/coupon", optionalAuth, cartController.applyCoupon);
router.delete("/coupon", optionalAuth, cartController.removeCoupon);

// 🚚 Delivery Routes
router.put("/delivery", optionalAuth, cartController.updateDelivery);

// 💳 Universal Checkout Route (supports both guest and authenticated users)
router.post(
  "/checkout",
  optionalAuth,
  guestCheckoutValidation,
  cartController.checkoutCart
);

module.exports = router;
