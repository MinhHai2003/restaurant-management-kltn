const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },

    // Địa chỉ giao hàng
    addresses: [
      {
        label: {
          type: String, // "Nhà", "Công ty", "Khác"
          default: "Nhà",
        },
        address: {
          type: String,
          required: true,
        },
        district: String,
        city: String,
        phone: {
          type: String,
          required: true, // Số điện thoại để shipper liên lạc
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Thông tin khách hàng
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    // Loyalty program
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    membershipLevel: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
    },

    // Preferences
    preferences: {
      favoriteItems: [String], // Menu item IDs
      dietaryRestrictions: [String], // "vegetarian", "vegan", "halal", etc.
      spiceLevel: {
        type: String,
        enum: ["mild", "medium", "hot", "very_hot"],
        default: "medium",
      },
    },

    // Order history tracking
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },

    // Trạng thái tài khoản
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },

    // Authentication
    refreshToken: {
      type: String,
      default: null,
    },
    refreshTokenExpiry: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpiry: {
      type: Date,
    },

    // Security
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },

    // Profile
    avatar: {
      type: String,
      default: null,
    },

    // Marketing
    allowNotifications: {
      type: Boolean,
      default: true,
    },
    allowPromotions: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ membershipLevel: 1 });
customerSchema.index({ loyaltyPoints: -1 });

// Virtual để check account lock
customerSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual để tính membership level dựa trên total spent
customerSchema.virtual("calculatedMembershipLevel").get(function () {
  if (this.totalSpent >= 50000000) return "platinum"; // 50M VNĐ
  if (this.totalSpent >= 20000000) return "gold"; // 20M VNĐ
  if (this.totalSpent >= 5000000) return "silver"; // 5M VNĐ
  return "bronze";
});

// Method để update membership level
customerSchema.methods.updateMembershipLevel = function () {
  this.membershipLevel = this.calculatedMembershipLevel;
  return this.save();
};

// Method để add loyalty points
customerSchema.methods.addLoyaltyPoints = function (orderAmount) {
  // 1 point per 10,000 VNĐ
  const pointsToAdd = Math.floor(orderAmount / 10000);
  this.loyaltyPoints += pointsToAdd;
  return pointsToAdd;
};

module.exports = mongoose.model("Customer", customerSchema);
