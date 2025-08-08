const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    customerInfo: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: false, // Optional field
      },
      email: {
        type: String,
        required: true,
      },
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Table",
    },
    tableInfo: {
      tableNumber: String,
      capacity: Number,
      location: String,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      startTime: {
        type: String,
        required: true, // Format: "18:00"
      },
      endTime: {
        type: String,
        required: true, // Format: "20:00"
      },
      duration: {
        type: Number,
        required: true, // Tính bằng phút
        default: 120,
      },
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "seated",
        "dining", // 🆕 Khách đang ăn (có order active)
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "pending",
    },
    occasion: {
      type: String,
      enum: ["birthday", "anniversary", "business", "date", "family", "other"],
      default: "other",
    },
    specialRequests: {
      type: String,
      maxlength: 1000,
    },
    pricing: {
      tablePrice: {
        type: Number,
        default: 0,
      },
      serviceCharge: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    payment: {
      method: {
        type: String,
        enum: ["none", "deposit", "full_payment"],
        default: "none",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAmount: {
        type: Number,
        default: 0,
      },
    },
    deposit: {
      required: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        default: 0,
      },
      deadline: Date,
    },
    timeline: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
        updatedBy: String,
      },
    ],
    notifications: {
      reminderSent: {
        type: Boolean,
        default: false,
      },
      confirmationSent: {
        type: Boolean,
        default: false,
      },
    },
    notes: {
      customer: String,
      staff: String,
    },
    ratings: {
      service: {
        type: Number,
        min: 1,
        max: 5,
      },
      ambiance: {
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
    createdBy: {
      type: String,
      default: "customer",
      enum: ["customer", "staff", "admin"],
    },
    modifiedBy: String,
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reservationSchema.index({ reservationNumber: 1 });
reservationSchema.index({ customerId: 1 });
reservationSchema.index({ tableId: 1 });
reservationSchema.index({ reservationDate: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ "timeSlot.startTime": 1 });

// Generate reservation number
reservationSchema.pre("save", function (next) {
  console.log("Pre-save hook called for reservation");

  if (!this.reservationNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 900000) + 100000;
    this.reservationNumber = `RSV-${dateStr}-${random}`;
    console.log("Generated reservation number:", this.reservationNumber);
  }

  // Update timeline
  if (this.isModified("status")) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status changed to ${this.status}`,
    });
  }

  // Update last modified
  this.lastModified = new Date();

  console.log("Pre-save hook completed");
  next();
});

// Methods
reservationSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const reservationDateTime = new Date(this.reservationDate);
  const timeDiff = reservationDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);

  return (
    ["pending", "confirmed"].includes(this.status) && hoursDiff > 2 // Có thể hủy nếu còn hơn 2 tiếng
  );
};

reservationSchema.methods.canBeModified = function () {
  const now = new Date();
  const reservationDateTime = new Date(this.reservationDate);
  const timeDiff = reservationDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);

  return (
    ["pending", "confirmed"].includes(this.status) && hoursDiff > 4 // Có thể sửa nếu còn hơn 4 tiếng
  );
};

reservationSchema.methods.isUpcoming = function () {
  const now = new Date();
  const reservationDateTime = new Date(this.reservationDate);
  return (
    reservationDateTime > now && ["confirmed", "pending"].includes(this.status)
  );
};

reservationSchema.methods.calculatePricing = function (tablePrice) {
  this.pricing.tablePrice = tablePrice;
  this.pricing.serviceCharge = Math.round(tablePrice * 0.1); // 10% service charge
  this.pricing.total = this.pricing.tablePrice + this.pricing.serviceCharge;
  return this.pricing.total;
};

module.exports = mongoose.model("Reservation", reservationSchema);
