const mongoose = require("mongoose");

const SessionCartItemSchema = new mongoose.Schema({
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

const SessionCartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [SessionCartItemSchema],
    pricing: {
      subtotal: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    delivery: {
      type: {
        type: String,
        enum: ["delivery", "pickup", "dine_in"],
        default: "delivery",
      },
      estimatedTime: {
        type: Number,
        default: 30,
      },
      fee: {
        type: Number,
        default: 0,
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
    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours TTL
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
SessionCartSchema.index({ sessionId: 1 });
SessionCartSchema.index({ expiresAt: 1 });

const SessionCart = mongoose.model("SessionCart", SessionCartSchema);

module.exports = SessionCart;
