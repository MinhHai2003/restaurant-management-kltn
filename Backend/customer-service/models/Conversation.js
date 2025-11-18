const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    adminName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "closed", "waiting"],
      default: "waiting",
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCount: {
      customer: {
        type: Number,
        default: 0,
      },
      admin: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
conversationSchema.index({ customerId: 1, status: 1 });
conversationSchema.index({ adminId: 1, status: 1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

// Method to update last message timestamp
conversationSchema.methods.updateLastMessage = function () {
  this.lastMessageAt = new Date();
  return this.save();
};

// Method to increment unread count
conversationSchema.methods.incrementUnread = function (userType) {
  if (userType === "customer") {
    this.unreadCount.customer += 1;
  } else if (userType === "admin") {
    this.unreadCount.admin += 1;
  }
  return this.save();
};

// Method to reset unread count
conversationSchema.methods.resetUnread = function (userType) {
  if (userType === "customer") {
    this.unreadCount.customer = 0;
  } else if (userType === "admin") {
    this.unreadCount.admin = 0;
  }
  return this.save();
};

module.exports = mongoose.model("Conversation", conversationSchema);

