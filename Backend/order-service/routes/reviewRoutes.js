const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authenticateCustomer = require("../middleware/authenticateCustomer");
const { body, param, query } = require("express-validator");

// Validation rules
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
    .isString()
    .withMessage("Comment must be a string"),
  body("items.*.images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),
];

const updateReviewValidation = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isString()
    .withMessage("Comment must be a string"),
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
