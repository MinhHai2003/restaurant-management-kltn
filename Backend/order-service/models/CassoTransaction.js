const mongoose = require("mongoose");

const CassoTransactionSchema = new mongoose.Schema(
  {
    // Casso transaction ID
    cassoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Transaction details from Casso
    tid: String, // Transaction ID from bank
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    when: {
      type: Date,
      required: true,
    },

    // Bank information
    bankAccountId: String,
    bankSubAccId: String,
    bankName: String,
    bankAccountNumber: String,

    // Order matching
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    orderNumber: String,
    matchedAt: Date,
    matchStatus: {
      type: String,
      enum: ["pending", "matched", "unmatched", "duplicate", "refunded"],
      default: "pending",
    },
    matchNote: String,

    // Processing status
    processed: {
      type: Boolean,
      default: false,
    },
    processedAt: Date,
    processedBy: String, // User ID or "system"

    // Additional data
    cusum_balance: Number, // Cumulative balance after transaction
    raw_data: mongoose.Schema.Types.Mixed, // Store full webhook payload
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
CassoTransactionSchema.index({ when: -1 });
CassoTransactionSchema.index({ matchStatus: 1, processed: 1 });
CassoTransactionSchema.index({ orderNumber: 1 });
CassoTransactionSchema.index({ createdAt: -1 });

// Static method to find unmatched transactions
CassoTransactionSchema.statics.findUnmatched = function () {
  return this.find({
    matchStatus: "pending",
    processed: false,
  }).sort({ when: -1 });
};

// Static method to find by order
CassoTransactionSchema.statics.findByOrder = function (orderId) {
  return this.find({ orderId }).sort({ when: -1 });
};

// Instance method to mark as matched
CassoTransactionSchema.methods.markAsMatched = async function (order, note) {
  this.orderId = order._id;
  this.orderNumber = order.orderNumber;
  this.matchedAt = new Date();
  this.matchStatus = "matched";
  this.processed = true;
  this.processedAt = new Date();
  this.processedBy = "system";
  this.matchNote = note || "Automatically matched via webhook";
  return this.save();
};

// Instance method to mark as unmatched
CassoTransactionSchema.methods.markAsUnmatched = async function (reason) {
  this.matchStatus = "unmatched";
  this.matchNote = reason;
  return this.save();
};

const CassoTransaction = mongoose.model("CassoTransaction", CassoTransactionSchema);

module.exports = CassoTransaction;

