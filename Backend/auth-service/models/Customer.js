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
      unique: true,
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

    // Thông tin khách hàng
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      street: String,
      city: String,
      district: String,
      ward: String,
      zipCode: String,
    },

    // Preferences
    preferences: {
      favoriteFood: [String], // Món ăn yêu thích
      allergies: [String], // Dị ứng
      dietaryRestrictions: [String], // Chế độ ăn đặc biệt
      spiceLevel: {
        type: String,
        enum: ["mild", "medium", "hot", "extra-hot"],
        default: "medium",
      },
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
    totalSpent: {
      type: Number,
      default: 0,
    },

    // Account status
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
      default: null,
    },

    // Security
    refreshToken: {
      type: String,
      default: null,
    },
    refreshTokenExpiry: {
      type: Date,
      default: null,
    },
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
    notes: {
      type: String, // Ghi chú đặc biệt (VIP, sinh nhật, etc.)
    },

    // Social
    socialLogins: {
      google: {
        id: String,
        email: String,
      },
      facebook: {
        id: String,
        email: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ loyaltyPoints: -1 });
customerSchema.index({ membershipLevel: 1 });
customerSchema.index({ isActive: 1 });

// Virtual cho account lock
customerSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual cho full address
customerSchema.virtual("fullAddress").get(function () {
  if (!this.address) return "";
  const { street, ward, district, city } = this.address;
  return [street, ward, district, city].filter(Boolean).join(", ");
});

// Method để update loyalty points
customerSchema.methods.addLoyaltyPoints = function (amount) {
  this.loyaltyPoints += Math.floor(amount / 1000); // 1 point per 1000 VND
  this.totalSpent += amount;

  // Update membership level
  if (this.totalSpent >= 50000000) {
    // 50M VND
    this.membershipLevel = "platinum";
  } else if (this.totalSpent >= 20000000) {
    // 20M VND
    this.membershipLevel = "gold";
  } else if (this.totalSpent >= 5000000) {
    // 5M VND
    this.membershipLevel = "silver";
  }
};

module.exports = mongoose.model("Customer", customerSchema);
