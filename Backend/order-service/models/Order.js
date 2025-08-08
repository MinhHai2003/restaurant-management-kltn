const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "MenuItem",
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  customizations: {
    type: String,
    trim: true,
    default: "",
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
      index: true,
    },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [OrderItemSchema],
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      tax: { type: Number, required: true, min: 0 },
      deliveryFee: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      loyaltyDiscount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    payment: {
      method: {
        type: String,
        required: true,
        enum: ["cash", "card", "momo", "banking", "zalopay"],
      },
      status: {
        type: String,
        required: true,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    delivery: {
      type: {
        type: String,
        required: true,
        enum: ["delivery", "pickup", "dine_in"],
        default: "delivery",
      },

      // For DELIVERY orders
      address: {
        full: String,
        district: String,
        city: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      estimatedTime: {
        type: Number, // in minutes
        default: 30,
      },
      actualTime: Number,
      fee: {
        type: Number,
        default: 0,
      },
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
      instructions: String,

      // 🆕 For PICKUP/TAKEAWAY orders
      pickupInfo: {
        customerName: String,
        phoneNumber: String,
        scheduledTime: Date, // When customer wants to pick up
        instructions: String, // "Call when arrive", "Wait at counter", etc.
        actualPickupTime: Date, // When actually picked up
      },
    },

    // 🆕 Dine-in information (only for type = "dine_in")
    diningInfo: {
      reservationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reservation", // Reference to Table Service
      },
      reservationNumber: String, // Copy for easier queries
      tableInfo: {
        tableId: mongoose.Schema.Types.ObjectId,
        tableNumber: String,
        location: String, // indoor, outdoor, etc.
      },
      serviceType: {
        type: String,
        enum: ["self_service", "table_service"],
        default: "table_service",
      },
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending", // Chờ xác nhận
        "confirmed", // Đã xác nhận
        "preparing", // Đang chuẩn bị
        "ready", // Sẵn sàng giao/lấy
        "picked_up", // Đã lấy hàng (driver)
        "out_for_delivery", // Đang giao
        "delivered", // Đã giao
        "completed", // Hoàn thành
        "cancelled", // Đã hủy
        "refunded", // Đã hoàn tiền

        // 🆕 Dine-in specific statuses
        "ordered", // Khách đã đặt món tại bàn
        "cooking", // Bếp đang nấu
        "served", // Đã phục vụ lên bàn
        "dining", // Khách đang ăn
      ],
      default: "pending",
      index: true,
    },
    timeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
        updatedBy: String,
      },
    ],
    loyalty: {
      pointsEarned: {
        type: Number,
        default: 0,
      },
      pointsUsed: {
        type: Number,
        default: 0,
      },
      membershipLevel: {
        type: String,
        enum: ["bronze", "silver", "gold", "platinum"],
      },
    },
    coupon: {
      code: String,
      discountType: {
        type: String,
        enum: ["percentage", "fixed"],
      },
      discountValue: Number,
      appliedDiscount: Number,
    },
    notes: {
      customer: String,
      kitchen: String,
      delivery: String,
      internal: String,
    },
    ratings: {
      food: {
        type: Number,
        min: 1,
        max: 5,
      },
      delivery: {
        type: Number,
        min: 1,
        max: 5,
      },
      overall: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      ratedAt: Date,
    },
    // Business metrics
    preparationTime: Number, // minutes
    deliveryTime: Number, // minutes
    totalTime: Number, // minutes

    // Timestamps
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    estimatedCompletionTime: Date,
    actualCompletionTime: Date,

    // Flags
    isUrgent: {
      type: Boolean,
      default: false,
    },
    isGift: {
      type: Boolean,
      default: false,
    },
    requiresAge18: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
OrderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

OrderSchema.virtual("isDelivered").get(function () {
  return this.status === "delivered" || this.status === "completed";
});

OrderSchema.virtual("canCancel").get(function () {
  return ["pending", "confirmed"].includes(this.status);
});

OrderSchema.virtual("duration").get(function () {
  if (!this.actualCompletionTime) return null;
  return Math.round((this.actualCompletionTime - this.orderDate) / (1000 * 60)); // minutes
});

// Indexes for performance
OrderSchema.index({ customerId: 1, orderDate: -1 });
OrderSchema.index({ status: 1, orderDate: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ "payment.status": 1 });
OrderSchema.index({ orderDate: -1 });

// Methods
OrderSchema.methods.updateStatus = function (
  newStatus,
  note = "",
  updatedBy = "system"
) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy,
  });

  // Auto-update completion time
  if (["delivered", "completed"].includes(newStatus)) {
    this.actualCompletionTime = new Date();
    this.totalTime = Math.round(
      (this.actualCompletionTime - this.orderDate) / (1000 * 60)
    );
  }

  return this.save();
};

OrderSchema.methods.calculateLoyaltyPoints = function () {
  // 1 point per 10,000 VND
  return Math.floor(this.pricing.total / 10000);
};

OrderSchema.methods.canRate = function () {
  return this.status === "completed" && !this.ratings.overall;
};

// Statics
OrderSchema.statics.generateOrderNumber = function () {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.getTime().toString().slice(-6);
  return `ORD-${dateStr}-${timeStr}`;
};

OrderSchema.statics.getOrderStats = function (customerId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        customerId: new mongoose.Types.ObjectId(customerId),
        orderDate: { $gte: startDate },
        status: { $nin: ["cancelled", "refunded"] },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$pricing.total" },
        totalItems: { $sum: { $sum: "$items.quantity" } },
        avgOrderValue: { $avg: "$pricing.total" },
        lastOrderDate: { $max: "$orderDate" },
      },
    },
  ]);
};

// Pre-save middleware
OrderSchema.pre("save", function (next) {
  if (this.isNew) {
    // Generate order number
    if (!this.orderNumber) {
      this.orderNumber = this.constructor.generateOrderNumber();
    }

    // Set initial timeline
    if (!this.timeline.length) {
      this.timeline.push({
        status: this.status,
        timestamp: new Date(),
        note: "Order created",
        updatedBy: "system",
      });
    }

    // Calculate estimated completion time
    if (!this.estimatedCompletionTime) {
      this.estimatedCompletionTime = new Date(
        Date.now() + this.delivery.estimatedTime * 60 * 1000
      );
    }
  }

  next();
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
