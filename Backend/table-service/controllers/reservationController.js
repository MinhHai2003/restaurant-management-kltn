const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const axios = require("axios");

// 🔗 Get customer info from Customer Service
const getCustomerInfo = async (customerId) => {
  try {
    const response = await axios.get(
      `${process.env.CUSTOMER_SERVICE_URL}/api/customers/${customerId}/info`
    );
    return response.data.data;
  } catch (error) {
    console.warn("Failed to fetch customer info:", error.message);
    return null;
  }
};

// 📝 Create new reservation
exports.createReservation = async (req, res) => {
  try {
    const {
      tableId,
      reservationDate,
      startTime,
      endTime,
      partySize,
      occasion,
      specialRequests,
      phoneNumber,
      guestInfo,
    } = req.body;

    // Validate table exists and is available
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    if (!table.canBeReserved()) {
      return res.status(400).json({
        success: false,
        message: "Table is not available for reservation",
      });
    }

    if (table.capacity < partySize) {
      return res.status(400).json({
        success: false,
        message: `Table capacity (${table.capacity}) is less than party size (${partySize})`,
      });
    }

    // Check for time conflicts
    const conflictingReservation = await Reservation.findOne({
      tableId,
      reservationDate: {
        $gte: new Date(reservationDate + "T00:00:00.000Z"),
        $lt: new Date(reservationDate + "T23:59:59.999Z"),
      },
      status: { $in: ["confirmed", "pending", "seated"] },
      $or: [
        {
          "timeSlot.startTime": { $lt: endTime },
          "timeSlot.endTime": { $gt: startTime },
        },
      ],
    });

    if (conflictingReservation) {
      return res.status(409).json({
        success: false,
        message: "Table is already reserved for this time slot",
        conflict: {
          reservationNumber: conflictingReservation.reservationNumber,
          timeSlot: conflictingReservation.timeSlot,
        },
      });
    }

    // Handle customer info based on authentication type
    let customerInfo;
    let reservationData;

    if (req.customerId && req.token) {
      // Authenticated user - get info from Customer Service
      customerInfo = await getCustomerInfo(req.customerId);
      console.log("Customer info received:", customerInfo); // Debug log
      if (!customerInfo) {
        return res.status(400).json({
          success: false,
          message: "Unable to fetch customer information",
        });
      }

      // Validate required customer fields
      if (!customerInfo.name || !customerInfo.email) {
        console.log("Missing required customer fields:", {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone, // Optional
        });
        return res.status(400).json({
          success: false,
          message:
            "Customer information is incomplete - missing required fields",
          missing: {
            name: !customerInfo.name,
            email: !customerInfo.email,
          },
        });
      }

      reservationData = {
        customerId: req.customerId,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: phoneNumber || customerInfo.phone || "", // Use provided phone or customer's phone
        },
      };
    } else if (req.sessionId) {
      // Guest user - use provided guest info
      if (
        !guestInfo ||
        !guestInfo.name ||
        !guestInfo.email ||
        !guestInfo.phone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Guest information (name, email, phone) is required for guest reservations",
        });
      }

      reservationData = {
        sessionId: req.sessionId,
        customerInfo: {
          name: guestInfo.name,
          email: guestInfo.email,
          phone: guestInfo.phone,
        },
      };
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Calculate duration
    const duration = calculateDuration(startTime, endTime);

    // Calculate pricing
    const tablePrice = table.calculatePrice(reservationDate, startTime);

    // Create reservation with combined data
    const reservation = new Reservation({
      ...reservationData, // Contains customerId/sessionId and customerInfo
      tableId,
      tableInfo: {
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
      },
      reservationDate: new Date(reservationDate),
      timeSlot: {
        startTime,
        endTime,
        duration,
      },
      partySize,
      occasion: occasion || "other",
      specialRequests,
    });

    // Calculate pricing
    reservation.calculatePricing(tablePrice);

    await reservation.save();

    // Update table status to reserved
    table.status = "reserved";
    await table.save();

    // 🔔 Emit real-time notifications via Socket.io
    if (req.io) {
      console.log(
        "🔔 [SOCKET DEBUG] Starting to emit Socket.io events for reservation:",
        reservation.reservationNumber
      );

      // Notify customer about reservation confirmation
      if (req.customerId) {
        req.io.to(`customer_${req.customerId}`).emit("reservation_created", {
          type: "reservation_confirmed",
          reservationId: reservation._id,
          reservationNumber: reservation.reservationNumber,
          tableNumber: table.tableNumber,
          status: reservation.status,
          reservationDate: reservation.reservationDate,
          timeSlot: reservation.timeSlot,
          message: `Đặt bàn ${reservation.reservationNumber} thành công!`,
        });
        console.log(
          "🔔 [SOCKET DEBUG] Sent reservation notification to customer:",
          req.customerId
        );
      } else if (req.sessionId) {
        req.io.to(`session_${req.sessionId}`).emit("reservation_created", {
          type: "reservation_confirmed",
          reservationId: reservation._id,
          reservationNumber: reservation.reservationNumber,
          tableNumber: table.tableNumber,
          status: reservation.status,
          reservationDate: reservation.reservationDate,
          timeSlot: reservation.timeSlot,
          message: `Đặt bàn ${reservation.reservationNumber} thành công!`,
        });
        console.log(
          "🔔 [SOCKET DEBUG] Sent reservation notification to session:",
          req.sessionId
        );
      }

      // Notify all clients about table status change
      req.io.emit("table_status_updated", {
        tableId: table._id,
        tableNumber: table.tableNumber,
        status: table.status,
        reservedBy: reservation.reservationNumber,
      });
      console.log(
        "🔔 [SOCKET DEBUG] Sent table status update for table:",
        table.tableNumber
      );

      // Notify admins about new reservation
      req.io.emit("new_reservation", {
        reservation: {
          reservationNumber: reservation.reservationNumber,
          customerName: reservation.customerInfo.name,
          tableNumber: table.tableNumber,
          reservationDate: reservation.reservationDate,
          timeSlot: reservation.timeSlot,
          partySize: reservation.partySize,
          status: reservation.status,
        },
      });
      console.log(
        "🔔 [SOCKET DEBUG] Sent new reservation notification to admins"
      );
    } else {
      console.log("🔔 [SOCKET DEBUG] Socket.io not available in request");
    }

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: {
        reservation: {
          reservationNumber: reservation.reservationNumber,
          tableNumber: table.tableNumber,
          reservationDate: reservation.reservationDate,
          timeSlot: reservation.timeSlot,
          partySize: reservation.partySize,
          status: reservation.status,
          pricing: reservation.pricing,
        },
      },
    });
  } catch (error) {
    console.error("Create reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create reservation",
      error: error.message,
    });
  }
};

// 📋 Get customer reservations
exports.getCustomerReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, upcoming = false } = req.query;

    let query = { customerId: req.customerId };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.reservationDate = { $gte: new Date() };
      query.status = { $in: ["confirmed", "pending"] };
    }

    const reservations = await Reservation.find(query)
      .populate("tableId", "tableNumber capacity location features images")
      .sort({ reservationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Reservation.countDocuments(query);

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
};

// 🔍 Get reservation by number
exports.getReservationByNumber = async (req, res) => {
  try {
    const { reservationNumber } = req.params;

    const reservation = await Reservation.findOne({
      reservationNumber,
    }).populate(
      "tableId",
      "tableNumber capacity location features images amenities"
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Check if reservation belongs to customer
    if (reservation.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { reservation },
    });
  } catch (error) {
    console.error("Get reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reservation",
      error: error.message,
    });
  }
};

// ✏️ Update reservation
exports.updateReservation = async (req, res) => {
  try {
    const { reservationNumber } = req.params;
    const updates = req.body;

    const reservation = await Reservation.findOne({ reservationNumber });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Check ownership
    if (reservation.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if reservation can be modified
    if (!reservation.canBeModified()) {
      return res.status(400).json({
        success: false,
        message:
          "Reservation cannot be modified (too close to reservation time or invalid status)",
      });
    }

    // If changing time or date, check for conflicts
    if (updates.reservationDate || updates.timeSlot) {
      const newDate = updates.reservationDate || reservation.reservationDate;
      const newStartTime =
        updates.timeSlot?.startTime || reservation.timeSlot.startTime;
      const newEndTime =
        updates.timeSlot?.endTime || reservation.timeSlot.endTime;

      const conflictingReservation = await Reservation.findOne({
        _id: { $ne: reservation._id },
        tableId: reservation.tableId,
        reservationDate: {
          $gte: new Date(newDate + "T00:00:00.000Z"),
          $lt: new Date(newDate + "T23:59:59.999Z"),
        },
        status: { $in: ["confirmed", "pending", "seated"] },
        $or: [
          {
            "timeSlot.startTime": { $lt: newEndTime },
            "timeSlot.endTime": { $gt: newStartTime },
          },
        ],
      });

      if (conflictingReservation) {
        return res.status(409).json({
          success: false,
          message: "Time slot conflict with existing reservation",
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      "reservationDate",
      "timeSlot",
      "partySize",
      "occasion",
      "specialRequests",
    ];

    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        reservation[key] = updates[key];
      }
    });

    reservation.modifiedBy = req.customerId;
    await reservation.save();

    res.json({
      success: true,
      message: "Reservation updated successfully",
      data: { reservation },
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update reservation",
      error: error.message,
    });
  }
};

// ❌ Cancel reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { reservationNumber } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findOne({ reservationNumber });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Check ownership
    if (reservation.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if reservation can be cancelled
    if (!reservation.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message:
          "Reservation cannot be cancelled (too close to reservation time or invalid status)",
      });
    }

    // Update reservation status
    reservation.status = "cancelled";
    reservation.modifiedBy = req.customerId;

    if (reason) {
      reservation.notes.customer = reason;
    }

    await reservation.save();

    // Update table status back to available
    const table = await Table.findById(reservation.tableId);
    if (table && table.status === "reserved") {
      table.status = "available";
      await table.save();
    }

    res.json({
      success: true,
      message: "Reservation cancelled successfully",
      data: { reservation },
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel reservation",
      error: error.message,
    });
  }
};

// ⭐ Rate reservation
exports.rateReservation = async (req, res) => {
  try {
    const { reservationNumber } = req.params;
    const { service, ambiance, overall, comment } = req.body;

    const reservation = await Reservation.findOne({ reservationNumber });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Check ownership
    if (reservation.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if reservation can be rated
    if (reservation.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed reservations can be rated",
      });
    }

    if (reservation.ratings.ratedAt) {
      return res.status(400).json({
        success: false,
        message: "Reservation has already been rated",
      });
    }

    // Update ratings
    reservation.ratings = {
      service,
      ambiance,
      overall,
      comment,
      ratedAt: new Date(),
    };

    await reservation.save();

    res.json({
      success: true,
      message: "Reservation rated successfully",
      data: {
        ratings: reservation.ratings,
      },
    });
  } catch (error) {
    console.error("Rate reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rate reservation",
      error: error.message,
    });
  }
};

// 📊 Get reservation statistics
exports.getReservationStats = async (req, res) => {
  try {
    const totalReservations = await Reservation.countDocuments({
      customerId: req.customerId,
    });

    const completedReservations = await Reservation.countDocuments({
      customerId: req.customerId,
      status: "completed",
    });

    const upcomingReservations = await Reservation.countDocuments({
      customerId: req.customerId,
      status: { $in: ["confirmed", "pending"] },
      reservationDate: { $gte: new Date() },
    });

    const cancelledReservations = await Reservation.countDocuments({
      customerId: req.customerId,
      status: "cancelled",
    });

    // Get favorite locations
    const locationStats = await Reservation.aggregate([
      { $match: { customerId: req.customerId, status: "completed" } },
      {
        $group: {
          _id: "$tableInfo.location",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalReservations,
          completed: completedReservations,
          upcoming: upcomingReservations,
          cancelled: cancelledReservations,
        },
        favoriteLocations: locationStats,
        completionRate:
          totalReservations > 0
            ? ((completedReservations / totalReservations) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error("Get reservation stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reservation statistics",
      error: error.message,
    });
  }
};

// 🚪 Check-in customer (when they arrive at restaurant)
exports.checkinReservation = async (req, res) => {
  try {
    const { reservationNumber } = req.params;

    const reservation = await Reservation.findOne({
      reservationNumber,
    }).populate("tableId");
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Verify ownership (or allow staff to checkin - can be enhanced later)
    if (reservation.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if reservation can be checked in
    if (!["confirmed", "pending"].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot check-in reservation with status: ${reservation.status}`,
      });
    }

    // Check if it's the right day/time (allow 30 minutes early)
    const now = new Date();
    const reservationDate = new Date(reservation.reservationDate);
    const [startHour, startMin] = reservation.timeSlot.startTime
      .split(":")
      .map(Number);

    reservationDate.setHours(startHour, startMin, 0, 0);
    const earliestCheckin = new Date(
      reservationDate.getTime() - 30 * 60 * 1000
    ); // 30 minutes early
    const latestCheckin = new Date(reservationDate.getTime() + 60 * 60 * 1000); // 1 hour late

    // Skip time check - allow checkin anytime
    // if (now < earliestCheckin || now > latestCheckin) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "Check-in time is outside allowed window (30 minutes early to 1 hour late)",
    //     allowedWindow: {
    //       earliest: earliestCheckin,
    //       latest: latestCheckin,
    //       current: now,
    //     },
    //   });
    // }

    // Update reservation status
    reservation.status = "seated";
    reservation.modifiedBy = req.customerId;
    await reservation.save();

    // Update table status
    const table = await Table.findById(reservation.tableId);
    if (table) {
      table.status = "occupied";
      await table.save();
    }

    res.json({
      success: true,
      message: "Check-in successful",
      data: {
        reservation: {
          reservationNumber: reservation.reservationNumber,
          status: reservation.status,
          tableNumber: reservation.tableInfo.tableNumber,
          checkedInAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Check-in reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check-in reservation",
      error: error.message,
    });
  }
};

// 🚪 Check-out customer (when they leave restaurant)
exports.checkoutReservation = async (req, res) => {
  try {
    const { reservationNumber } = req.params;

    const reservation = await Reservation.findOne({
      reservationNumber,
    }).populate("tableId");
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Verify ownership
    if (reservation.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Skip status check - allow checkout from any status
    // if (!["seated", "dining"].includes(reservation.status)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot check-out reservation with status: ${reservation.status}`,
    //   });
    // }

    // Update reservation status
    reservation.status = "completed";
    reservation.modifiedBy = req.customerId;
    await reservation.save();

    // Update table status back to available
    const table = await Table.findById(reservation.tableId);
    if (table) {
      table.status = "available";
      await table.save();
    }

    res.json({
      success: true,
      message: "Check-out successful",
      data: {
        reservation: {
          reservationNumber: reservation.reservationNumber,
          status: reservation.status,
          tableNumber: reservation.tableInfo.tableNumber,
          checkedOutAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Check-out reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check-out reservation",
      error: error.message,
    });
  }
};

// 🍽️ Get orders for a reservation (call Order Service)
exports.getReservationOrders = async (req, res) => {
  try {
    const { reservationNumber } = req.params;

    const reservation = await Reservation.findOne({ reservationNumber });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Verify ownership
    if (reservation.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Call Order Service to get orders for this reservation
    try {
      const response = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/api/orders/reservation/${reservation._id}`,
        {
          headers: {
            Authorization: req.header("Authorization"),
          },
        }
      );

      res.json({
        success: true,
        data: {
          reservation: {
            reservationNumber: reservation.reservationNumber,
            tableNumber: reservation.tableInfo.tableNumber,
            status: reservation.status,
          },
          orders: response.data.data.orders || [],
        },
      });
    } catch (orderError) {
      console.warn(
        "Failed to fetch orders from Order Service:",
        orderError.message
      );

      // Return reservation info even if orders can't be fetched
      res.json({
        success: true,
        data: {
          reservation: {
            reservationNumber: reservation.reservationNumber,
            tableNumber: reservation.tableInfo.tableNumber,
            status: reservation.status,
          },
          orders: [],
          note: "Orders could not be fetched from Order Service",
        },
      });
    }
  } catch (error) {
    console.error("Get reservation orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reservation orders",
      error: error.message,
    });
  }
};

// Helper function to calculate duration in minutes
const calculateDuration = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
};

// Get all reservations for admin
const getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    // Build filter query
    const filter = {};
    if (status) filter.status = status;

    // Get reservations with populated table info
    const reservations = await Reservation.find(filter)
      .populate({
        path: "tableId",
        select: "tableNumber capacity location description",
      })
      .sort({ reservationDate: -1, "timeSlot.startTime": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Format response
    const formattedReservations = reservations.map((reservation) => ({
      _id: reservation._id,
      reservationNumber: reservation.reservationNumber,
      customerName: reservation.customerInfo?.name || "N/A",
      table: reservation.tableId
        ? {
            tableNumber: reservation.tableId.tableNumber,
            capacity: reservation.tableId.capacity,
          }
        : null,
      reservationDate: reservation.reservationDate,
      timeSlot: reservation.timeSlot,
      partySize: reservation.partySize,
      status: reservation.status,
      occasion: reservation.occasion || "",
      specialRequests: reservation.specialRequests || "",
      createdAt: reservation.createdAt,
    }));

    // Get total count for pagination
    const total = await Reservation.countDocuments(filter);

    res.json({
      success: true,
      message: "Lấy danh sách đặt bàn thành công",
      data: {
        reservations: formattedReservations,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: formattedReservations.length,
          totalItems: total,
        },
      },
    });
  } catch (error) {
    console.error("Error getting all reservations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đặt bàn",
    });
  }
};

// Update reservation status (Admin only)
const updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body;

    // Valid status values
    const validStatuses = [
      "pending",
      "confirmed",
      "seated",
      "completed",
      "cancelled",
      "no-show",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    // Find reservation with table info
    const reservation = await Reservation.findById(reservationId).populate(
      "tableId"
    );
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    const oldStatus = reservation.status;
    reservation.status = status;

    // Update table status based on reservation status
    if (reservation.tableId) {
      const table = reservation.tableId;

      // Logic to update table status
      switch (status) {
        case "confirmed":
          if (table.status === "available") {
            table.status = "reserved";
          }
          break;
        case "seated":
          table.status = "occupied";
          break;
        case "completed":
        case "cancelled":
        case "no-show":
          // Free up the table
          if (table.status === "reserved" || table.status === "occupied") {
            table.status = "available";
          }
          break;
      }

      await table.save();
    }

    await reservation.save();

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái từ "${oldStatus}" sang "${status}"`,
      data: {
        reservationId: reservation._id,
        oldStatus,
        newStatus: status,
        tableStatus: reservation.tableId ? reservation.tableId.status : null,
      },
    });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái đặt bàn",
    });
  }
};

module.exports = {
  getAllReservations,
  updateReservationStatus,
  createReservation: exports.createReservation,
  getCustomerReservations: exports.getCustomerReservations,
  getReservationByNumber: exports.getReservationByNumber,
  updateReservation: exports.updateReservation,
  cancelReservation: exports.cancelReservation,
  rateReservation: exports.rateReservation,
  getReservationStats: exports.getReservationStats,
  checkinReservation: exports.checkinReservation,
  checkoutReservation: exports.checkoutReservation,
  getReservationOrders: exports.getReservationOrders,
};
