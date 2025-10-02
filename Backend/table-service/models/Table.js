const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    location: {
      type: String,
      required: true,
      enum: ["indoor", "outdoor", "private", "vip", "terrace", "garden"],
      default: "indoor",
    },
    zone: {
      type: String,
      required: false, // Không bắt buộc nữa
      default: "main",
    },
    features: [
      {
        type: String,
        enum: [
          "wifi",
          "outlet",
          "air_conditioned",
          "window_view",
          "private_room",
          "wheelchair_accessible",
          "near_entrance",
          "quiet_area",
          "smoking_allowed",
          "pet_friendly",
          "outdoor_seating",
          "romantic_lighting",
          "family_friendly",
        ],
      },
    ],
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance", "cleaning"],
      default: "available",
    },
    pricing: {
      basePrice: {
        type: Number,
        default: 0, // Giá cơ bản (có thể 0 nếu miễn phí)
      },
      peakHourMultiplier: {
        type: Number,
        default: 1, // Hệ số nhân cho giờ cao điểm
      },
      weekendMultiplier: {
        type: Number,
        default: 1, // Hệ số nhân cho cuối tuần
      },
    },
    description: {
      type: String,
      maxlength: 500,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    amenities: [
      {
        name: String,
        description: String,
        free: {
          type: Boolean,
          default: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMaintenance: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
tableSchema.index({ tableNumber: 1 });
tableSchema.index({ status: 1 });
tableSchema.index({ capacity: 1 });
tableSchema.index({ location: 1 });
tableSchema.index({ isActive: 1 });

// Methods
tableSchema.methods.canBeReserved = function () {
  return this.status === "available" && this.isActive;
};

tableSchema.methods.calculatePrice = function (date, timeSlot) {
  let price = this.pricing.basePrice;

  // Check if it's weekend
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Check if it's peak hour (6-9 PM)
  const hour = parseInt(timeSlot.split(":")[0]);
  const isPeakHour = hour >= 18 && hour <= 21;

  if (isWeekend) {
    price *= this.pricing.weekendMultiplier;
  }

  if (isPeakHour) {
    price *= this.pricing.peakHourMultiplier;
  }

  return Math.round(price);
};

// Statics
tableSchema.statics.findAvailableTables = function (capacity, date, timeSlot) {
  return this.find({
    capacity: { $gte: capacity },
    status: "available",
    isActive: true,
  });
};

module.exports = mongoose.model("Table", tableSchema);
