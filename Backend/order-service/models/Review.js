const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "MenuItem",
      index: true,
    },
    menuItemName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^(https?:\/\/|\/|[a-zA-Z]:\\)/.test(v);
          },
          message: "Image must be a valid URL or file path",
        },
      },
    ],
    orderDate: {
      type: Date,
      required: true,
      index: true,
    },
    ratedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
reviewSchema.index({ menuItemId: 1, rating: -1 }); // For finding highly rated items
reviewSchema.index({ customerId: 1, createdAt: -1 }); // For customer review history
reviewSchema.index({ orderId: 1 }); // For checking if order is already rated
reviewSchema.index({ menuItemId: 1, createdAt: -1 }); // For menu item reviews with pagination

// Virtual for star rating display
reviewSchema.virtual("starRating").get(function () {
  return "★".repeat(this.rating) + "☆".repeat(5 - this.rating);
});

// Static methods
reviewSchema.statics.getAverageRating = function (menuItemId) {
  return this.aggregate([
    { $match: { menuItemId: mongoose.Types.ObjectId(menuItemId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);
};

reviewSchema.statics.getTopRatedItems = function (limit = 10, minReviews = 5) {
  return this.aggregate([
    {
      $group: {
        _id: "$menuItemId",
        menuItemName: { $first: "$menuItemName" },
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
    { $match: { totalReviews: { $gte: minReviews } } },
    { $sort: { averageRating: -1, totalReviews: -1 } },
    { $limit: limit },
  ]);
};

reviewSchema.statics.getCustomerFavoriteItems = function (customerId, limit = 5) {
  return this.aggregate([
    { $match: { customerId: mongoose.Types.ObjectId(customerId) } },
    {
      $group: {
        _id: "$menuItemId",
        menuItemName: { $first: "$menuItemName" },
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        lastRated: { $max: "$ratedAt" },
      },
    },
    { $sort: { averageRating: -1, totalReviews: -1 } },
    { $limit: limit },
  ]);
};

// Instance methods
reviewSchema.methods.canBeEdited = function () {
  // Allow editing within 24 hours
  const hoursSinceRating = (Date.now() - this.ratedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceRating < 24;
};

reviewSchema.methods.toDisplayFormat = function () {
  return {
    id: this._id,
    orderNumber: this.orderNumber,
    menuItemName: this.menuItemName,
    rating: this.rating,
    starRating: this.starRating,
    comment: this.comment,
    images: this.images,
    ratedAt: this.ratedAt,
    canEdit: this.canBeEdited(),
  };
};

// Pre-save middleware
reviewSchema.pre("save", function (next) {
  // Ensure ratedAt is set
  if (!this.ratedAt) {
    this.ratedAt = new Date();
  }
  next();
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
