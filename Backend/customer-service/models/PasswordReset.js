const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index - tự động xóa khi hết hạn
    },
    attempts: {
      type: Number,
      default: 0,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      ip: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index để tìm OTP hợp lệ nhanh
passwordResetSchema.index({ email: 1, used: 1, expiresAt: 1 });

module.exports = mongoose.model("PasswordReset", passwordResetSchema);

