const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "startTime must be in HH:MM format",
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "endTime must be in HH:MM format",
      },
    },
    date: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
      enum: ["kitchen", "service", "cashier", "management", "reception"],
    },
    requiredStaff: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    assignedStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "completed"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    breakTimes: [
      {
        startTime: {
          type: String,
          validate: {
            validator: function (v) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "break startTime must be in HH:MM format",
          },
        },
        endTime: {
          type: String,
          validate: {
            validator: function (v) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "break endTime must be in HH:MM format",
          },
        },
        description: String,
      },
    ],
    hourlyRate: {
      type: Number,
      min: 0,
    },
    totalHours: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
shiftSchema.index({ date: 1, department: 1 });
shiftSchema.index({ assignedStaff: 1 });
shiftSchema.index({ status: 1, date: 1 });

// Virtual to calculate shift duration
shiftSchema.virtual("duration").get(function () {
  const [startHour, startMinute] = this.startTime.split(":").map(Number);
  const [endHour, endMinute] = this.endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  // Handle overnight shifts
  let durationMinutes = endTotalMinutes - startTotalMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60; // Add 24 hours if overnight
  }

  return Math.round((durationMinutes / 60) * 100) / 100; // Return hours with 2 decimal places
});

// Virtual to get formatted date
shiftSchema.virtual("formattedDate").get(function () {
  return this.date.toISOString().split("T")[0];
});

// Virtual to check if shift is fully staffed
shiftSchema.virtual("isFullyStaffed").get(function () {
  return this.assignedStaff.length >= this.requiredStaff;
});

// Virtual to get remaining slots
shiftSchema.virtual("remainingSlots").get(function () {
  return Math.max(0, this.requiredStaff - this.assignedStaff.length);
});

// Pre-save middleware to calculate total hours
shiftSchema.pre("save", function (next) {
  if (this.isModified("startTime") || this.isModified("endTime")) {
    this.totalHours = this.duration;
  }
  next();
});

// Static method to find shifts by date range
shiftSchema.statics.findByDateRange = function (
  startDate,
  endDate,
  options = {}
) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  if (options.department) {
    query.department = options.department;
  }

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate("assignedStaff", "fullName email role department")
    .populate("createdBy", "fullName role")
    .sort({ date: 1, startTime: 1 });
};

// Static method to find employee's shifts
shiftSchema.statics.findByEmployee = function (employeeId, startDate, endDate) {
  return this.find({
    assignedStaff: employeeId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  })
    .populate("createdBy", "fullName role")
    .sort({ date: 1, startTime: 1 });
};

// Static method to get shift statistics
shiftSchema.statics.getShiftStats = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: "$department",
        totalShifts: { $sum: 1 },
        totalRequiredStaff: { $sum: "$requiredStaff" },
        totalAssignedStaff: { $sum: { $size: "$assignedStaff" } },
        avgShiftDuration: { $avg: "$totalHours" },
        publishedShifts: {
          $sum: {
            $cond: [{ $eq: ["$status", "published"] }, 1, 0],
          },
        },
        completedShifts: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        department: "$_id",
        totalShifts: 1,
        totalRequiredStaff: 1,
        totalAssignedStaff: 1,
        staffingRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$totalAssignedStaff", "$totalRequiredStaff"] },
                100,
              ],
            },
            2,
          ],
        },
        avgShiftDuration: { $round: ["$avgShiftDuration", 2] },
        publishedShifts: 1,
        completedShifts: 1,
      },
    },
  ]);
};

// Method to check if employee can be assigned to this shift
shiftSchema.methods.canAssignEmployee = function (employeeId) {
  return (
    !this.assignedStaff.includes(employeeId) &&
    this.assignedStaff.length < this.requiredStaff
  );
};

// Method to assign employee to shift
shiftSchema.methods.assignEmployee = function (employeeId) {
  if (this.canAssignEmployee(employeeId)) {
    this.assignedStaff.push(employeeId);
    return true;
  }
  return false;
};

// Method to remove employee from shift
shiftSchema.methods.removeEmployee = function (employeeId) {
  const index = this.assignedStaff.indexOf(employeeId);
  if (index > -1) {
    this.assignedStaff.splice(index, 1);
    return true;
  }
  return false;
};

// Method to check for conflicts with other shifts
shiftSchema.methods.hasConflictsWith = function (otherShift) {
  // Check if shifts are on the same date
  if (this.date.toDateString() !== otherShift.date.toDateString()) {
    return false;
  }

  // Check for time overlap
  const thisStart = this.startTime;
  const thisEnd = this.endTime;
  const otherStart = otherShift.startTime;
  const otherEnd = otherShift.endTime;

  return thisStart < otherEnd && thisEnd > otherStart;
};

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = Shift;
