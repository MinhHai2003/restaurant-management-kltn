const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    available: { type: Boolean, default: true },
    ingredients: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    image: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          // Kiểm tra URL hợp lệ hoặc path file hợp lệ
          return !v || /^(https?:\/\/|\/|[a-zA-Z]:\\)/.test(v);
        },
        message: "Image must be a valid URL or file path",
      },
    },
    imageAlt: {
      type: String,
      default: function () {
        return this.name || "Menu item image";
      },
    },
    // Rating statistics
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      distribution: {
        star5: { type: Number, default: 0, min: 0 },
        star4: { type: Number, default: 0, min: 0 },
        star3: { type: Number, default: 0, min: 0 },
        star2: { type: Number, default: 0, min: 0 },
        star1: { type: Number, default: 0, min: 0 },
      },
    },
    // Order statistics
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Popularity metrics
    popularityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Indexes for performance
menuItemSchema.index({ "ratings.average": -1, "ratings.count": -1 });
menuItemSchema.index({ orderCount: -1 });
menuItemSchema.index({ popularityScore: -1 });
menuItemSchema.index({ category: 1, "ratings.average": -1 });

// Virtual for star rating display
menuItemSchema.virtual("starRating").get(function () {
  if (this.ratings.count === 0) return "Chưa có đánh giá";
  const stars = Math.round(this.ratings.average);
  return "★".repeat(stars) + "☆".repeat(5 - stars);
});

// Virtual for rating percentage
menuItemSchema.virtual("ratingPercentage").get(function () {
  if (this.ratings.count === 0) return 0;
  return Math.round((this.ratings.average / 5) * 100);
});

// Instance methods
menuItemSchema.methods.updateRatingStats = function (newRating) {
  // This method should be called when a new review is added
  // The actual calculation will be done in the analytics service
  return this.save();
};

menuItemSchema.methods.incrementOrderCount = function () {
  this.orderCount += 1;
  this.popularityScore = this.calculatePopularityScore();
  return this.save();
};

menuItemSchema.methods.calculatePopularityScore = function () {
  // Combine rating and order frequency for popularity
  const ratingWeight = this.ratings.average * 0.7;
  const orderWeight = Math.log(this.orderCount + 1) * 0.3;
  return Math.round((ratingWeight + orderWeight) * 100) / 100;
};

// Static methods
menuItemSchema.statics.getTopRated = function (limit = 10, minReviews = 5) {
  return this.find({
    "ratings.count": { $gte: minReviews },
    available: true,
  })
    .sort({ "ratings.average": -1, "ratings.count": -1 })
    .limit(limit)
    .select("name description price image ratings orderCount popularityScore");
};

menuItemSchema.statics.getMostPopular = function (limit = 10) {
  return this.find({ available: true })
    .sort({ popularityScore: -1, orderCount: -1 })
    .limit(limit)
    .select("name description price image ratings orderCount popularityScore");
};

menuItemSchema.statics.getByCategory = function (category, limit = 20) {
  return this.find({ category, available: true })
    .sort({ "ratings.average": -1, orderCount: -1 })
    .limit(limit)
    .select("name description price image ratings orderCount popularityScore");
};

menuItemSchema.statics.getNewItems = function (limit = 10, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    createdAt: { $gte: cutoffDate },
    available: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("name description price image ratings orderCount popularityScore");
};

module.exports = mongoose.model("MenuItem", menuItemSchema);
