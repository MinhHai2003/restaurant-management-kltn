const mongoose = require("mongoose");
const customerApiClient = require("../services/customerApiClient");

const CartItemSchema = new mongoose.Schema({
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
    max: 50,
  },
  image: {
    type: String,
    default: "",
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
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
});

const CartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
      index: true,
    },
    items: [CartItemSchema],
    summary: {
      totalItems: {
        type: Number,
        default: 0,
      },
      subtotal: {
        type: Number,
        default: 0,
      },
      deliveryFee: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      loyaltyDiscount: {
        type: Number,
        default: 0,
      },
      couponDiscount: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    appliedCoupon: {
      code: String,
      discountType: {
        type: String,
        enum: ["percentage", "fixed"],
      },
      discountValue: Number,
      appliedDiscount: Number,
    },
    delivery: {
      type: {
        type: String,
        enum: ["delivery", "pickup", "dine_in"],
        default: "delivery",
      },
      addressId: mongoose.Schema.Types.ObjectId,
      address: {
        full: String,
        district: String,
        city: String,
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
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      },
      index: { expireAfterSeconds: 0 },
    },
    sessionId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
CartSchema.virtual("isEmpty").get(function () {
  return this.items.length === 0;
});

CartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Instance methods
CartSchema.methods.addItem = async function (itemData) {
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.menuItemId.toString() === itemData.menuItemId.toString() &&
      item.customizations === (itemData.customizations || "")
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += itemData.quantity;
    this.items[existingItemIndex].subtotal =
      this.items[existingItemIndex].quantity *
      this.items[existingItemIndex].price;
  } else {
    // Add new item
    const newItem = {
      menuItemId: itemData.menuItemId,
      name: itemData.name,
      price: itemData.price,
      quantity: itemData.quantity,
      image: itemData.image || "",
      customizations: itemData.customizations || "",
      notes: itemData.notes || "",
      subtotal: itemData.price * itemData.quantity,
    };
    this.items.push(newItem);
  }

  await this.updateSummary();
  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.updateItem = async function (itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error("Item not found in cart");
  }

  if (quantity <= 0) {
    this.items.pull(itemId);
  } else {
    item.quantity = quantity;
    item.subtotal = item.price * quantity;
  }

  await this.updateSummary();
  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.removeItem = async function (itemId) {
  this.items.pull(itemId);
  await this.updateSummary();
  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.clearCart = async function () {
  this.items = [];
  this.appliedCoupon = undefined;
  await this.updateSummary();
  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.updateSummary = async function () {
  const subtotal = this.items.reduce(
    (total, item) => total + (item.subtotal || 0),
    0
  );
  const totalItems = this.items.reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

  // Calculate tax (8% VAT)
  const tax = Math.round(subtotal * 0.08) || 0;

  // 🔍 Get customer info để tính loyalty discount
  let customerInfo = {
    membershipLevel: "bronze",
    totalSpent: 0,
    loyaltyPoints: 0,
  };
  try {
    customerInfo = await customerApiClient.getCustomerInfo(
      this.customerId.toString()
    );
    console.log("💎 Customer membership level:", customerInfo.membershipLevel);
  } catch (error) {
    console.error("Error getting customer info:", error);
  }

  // 💰 Calculate loyalty discount based on membership level
  let loyaltyDiscount = 0;
  const membershipRates = {
    bronze: 0, // 0%
    silver: 0.05, // 5%
    gold: 0.1, // 10%
    platinum: 0.15, // 15%
  };

  loyaltyDiscount =
    Math.round(
      subtotal * (membershipRates[customerInfo.membershipLevel] || 0)
    ) || 0;

  console.log(
    `💰 Loyalty discount: ${loyaltyDiscount}đ (${customerInfo.membershipLevel} level)`
  );

  // 🚚 Calculate delivery fee based on delivery type and membership
  let deliveryFee = 0;
  if (this.delivery && this.delivery.type === "delivery") {
    // Gold và Platinum được miễn phí ship
    if (
      ["gold", "platinum"].includes(customerInfo.membershipLevel) ||
      subtotal > 500000
    ) {
      deliveryFee = 0;
      console.log(
        `🚚 Free delivery for ${customerInfo.membershipLevel} member`
      );
    } else {
      deliveryFee = 30000;
    }
  }

  // 🎫 Apply coupon discount
  let couponDiscount = 0;
  if (this.appliedCoupon && this.appliedCoupon.discountValue) {
    if (this.appliedCoupon.discountType === "percentage") {
      couponDiscount =
        Math.round(
          subtotal * ((this.appliedCoupon.discountValue || 0) / 100)
        ) || 0;
    } else {
      couponDiscount = this.appliedCoupon.discountValue || 0;
    }
    // Cap coupon discount at subtotal
    couponDiscount = Math.min(couponDiscount, subtotal) || 0;
    this.appliedCoupon.appliedDiscount = couponDiscount;
    console.log(
      `🎫 Coupon discount: ${couponDiscount}đ (${this.appliedCoupon.code})`
    );
  }

  // Total discount = loyalty + coupon
  const totalDiscount = loyaltyDiscount + couponDiscount;

  const total =
    (subtotal || 0) + (tax || 0) + (deliveryFee || 0) - (totalDiscount || 0);

  this.summary = {
    totalItems: totalItems || 0,
    subtotal: subtotal || 0,
    deliveryFee: deliveryFee || 0,
    discount: totalDiscount || 0,
    loyaltyDiscount: loyaltyDiscount || 0,
    couponDiscount: couponDiscount || 0,
    tax: tax || 0,
    total: Math.max(0, total) || 0,
  };

  // Store customer info for reference
  this.customerInfo = {
    membershipLevel: customerInfo.membershipLevel,
    totalSpent: customerInfo.totalSpent,
    loyaltyPoints: customerInfo.loyaltyPoints,
  };

  if (this.delivery) {
    this.delivery.fee = deliveryFee || 0;
  }

  console.log("📊 Cart summary updated:", {
    subtotal: this.summary.subtotal,
    loyaltyDiscount: this.summary.loyaltyDiscount,
    couponDiscount: this.summary.couponDiscount,
    total: this.summary.total,
  });
};

CartSchema.methods.applyCoupon = async function (couponData) {
  this.appliedCoupon = {
    code: couponData.code,
    discountType: couponData.discountType,
    discountValue: couponData.discountValue,
  };
  await this.updateSummary();
  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.removeCoupon = async function () {
  this.appliedCoupon = undefined;
  await this.updateSummary();
  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.updateDelivery = async function (deliveryData) {
  this.delivery = {
    ...this.delivery.toObject(),
    ...deliveryData,
  };
  await this.updateSummary();
  this.lastUpdated = new Date();
  return this.save();
};

// Static methods
CartSchema.statics.findOrCreateCart = async function (
  customerId,
  sessionId = null
) {
  let cart = await this.findOne({ customerId });

  if (!cart) {
    cart = new this({
      customerId,
      sessionId,
      items: [],
      delivery: {
        type: "delivery",
        estimatedTime: 30,
        fee: 0,
      },
      summary: {
        totalItems: 0,
        subtotal: 0,
        deliveryFee: 0,
        discount: 0,
        loyaltyDiscount: 0,
        couponDiscount: 0,
        tax: 0,
        total: 0,
      },
    });
    await cart.updateSummary();
    await cart.save();
  }

  return cart;
};

CartSchema.statics.getCartSummary = function (customerId) {
  return this.findOne({ customerId }).select("summary items.quantity");
};

// Pre-save middleware
CartSchema.pre("save", async function (next) {
  // Always update summary before saving
  if (
    this.isModified("items") ||
    this.isModified("appliedCoupon") ||
    this.isModified("delivery")
  ) {
    await this.updateSummary();
  }

  // Update lastUpdated
  this.lastUpdated = new Date();

  // Reset expiration time
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  next();
});

// Indexes
CartSchema.index({ customerId: 1 }, { unique: true });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ lastUpdated: -1 });

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
