const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

// 🆕 Tạo bàn mới
exports.createTable = async (req, res) => {
  try {
    console.log("🔥 [CREATE TABLE] Request received:", req.body);

    const { tableNumber, capacity, location, features, pricing, description } =
      req.body;

    console.log("🔥 [CREATE TABLE] Extracted data:", {
      tableNumber,
      capacity,
      location,
      features,
      pricing,
      description,
    });

    // Validate required fields
    if (!tableNumber || !capacity) {
      console.log("❌ [CREATE TABLE] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Table number and capacity are required",
      });
    }

    // Kiểm tra số bàn đã tồn tại
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      console.log(
        "❌ [CREATE TABLE] Table number already exists:",
        tableNumber
      );
      return res.status(400).json({
        success: false,
        message: "Table number already exists",
      });
    }

    // Tạo bàn mới
    const newTableData = {
      tableNumber,
      capacity,
      location: location || "indoor",
      features: features || [],
      pricing: pricing || { basePrice: 0 },
      description: description || "",
    };

    console.log("🔥 [CREATE TABLE] Creating table with data:", newTableData);

    const newTable = new Table(newTableData);

    console.log("🔥 [CREATE TABLE] Table object created, saving to DB...");

    const savedTable = await newTable.save();

    console.log("✅ [CREATE TABLE] Table saved successfully:", savedTable);

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: savedTable,
    });
  } catch (error) {
    console.error("❌ [CREATE TABLE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create table",
      error: error.message,
    });
  }
};

// �️ Xóa bàn
exports.deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    // Kiểm tra bàn có tồn tại không
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // Kiểm tra bàn có đang được đặt không
    const activeReservations = await Reservation.find({
      tableId: tableId,
      status: { $in: ["confirmed", "checked_in"] },
    });

    if (activeReservations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete table with active reservations",
      });
    }

    // Xóa bàn
    await Table.findByIdAndDelete(tableId);

    res.json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    console.error("Delete table error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete table",
      error: error.message,
    });
  }
};

// �📝 Update table info
exports.updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const updateData = req.body;

    // Không cho phép update _id
    if (updateData._id) delete updateData._id;

    const updatedTable = await Table.findByIdAndUpdate(
      tableId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedTable) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }
    res.json({
      success: true,
      message: "Table updated successfully",
      data: { table: updatedTable },
    });
  } catch (error) {
    console.error("Update table error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update table",
      error: error.message,
    });
  }
};

// 📋 Get all tables
exports.getAllTables = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      location,
      capacity,
      status,
      zone,
      features,
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (location) query.location = location;
    if (status) query.status = status;
    if (zone) query.zone = zone;
    if (capacity) query.capacity = { $gte: parseInt(capacity) };
    if (features) {
      const featureArray = features.split(",");
      query.features = { $in: featureArray };
    }

    const tables = await Table.find(query)
      .sort({ tableNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Table.countDocuments(query);

    res.json({
      success: true,
      data: {
        tables,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get tables error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tables",
      error: error.message,
    });
  }
};

// 🔍 Get table by ID
exports.getTableById = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    res.json({
      success: true,
      data: { table },
    });
  } catch (error) {
    console.error("Get table error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch table",
      error: error.message,
    });
  }
};

// 🍽️ Get table by table number (for QR code scanning)
exports.getTableByNumber = async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const table = await Table.findOne({
      tableNumber: tableNumber,
      isActive: true,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bàn với số này",
      });
    }

    res.json({
      success: true,
      data: { table },
    });
  } catch (error) {
    console.error("Get table by number error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch table by number",
      error: error.message,
    });
  }
};

// 🔍 Search available tables
exports.searchAvailableTables = async (req, res) => {
  try {
    const { date, startTime, endTime, partySize, location, features } =
      req.query;

    if (!date || !startTime || !endTime || !partySize) {
      return res.status(400).json({
        success: false,
        message: "Date, time range, and party size are required",
      });
    }

    // Build base query - Don't filter by status here, check availability based on reservations
    let query = {
      capacity: { $gte: parseInt(partySize) },
      isActive: true,
    };

    if (location) query.location = location;
    if (features) {
      const featureArray = features.split(",");
      query.features = { $in: featureArray };
    }

    // Find tables matching criteria
    const tables = await Table.find(query).sort({
      capacity: 1,
      tableNumber: 1,
    });

    // Check availability for each table
    const availableTables = [];

    for (const table of tables) {
      // Parse date string (format: YYYY-MM-DD) and create date range for comparison
      // Use start of day and end of day in UTC to avoid timezone issues
      const dateParts = date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      
      const searchDateStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const searchDateEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      
      console.log(`[SEARCH] Checking table ${table.tableNumber} for date ${date}`);
      console.log(`[SEARCH] Date range: ${searchDateStart.toISOString()} to ${searchDateEnd.toISOString()}`);
      
      // Find conflicting reservations: same table, same date, overlapping time slots
      // Two time slots overlap if: start1 < end2 AND end1 > start2
      // Use $expr to compare dates by day only (ignoring time) to avoid timezone issues
      const conflictingReservation = await Reservation.findOne({
        tableId: table._id,
        $expr: {
          $eq: [
            { $dateToString: { format: "%Y-%m-%d", date: "$reservationDate", timezone: "UTC" } },
            date
          ]
        },
        status: { $in: ["confirmed", "pending", "seated"] },
        $and: [
          { "timeSlot.startTime": { $lt: endTime } },
          { "timeSlot.endTime": { $gt: startTime } },
        ],
      });

      if (conflictingReservation) {
        console.log(`[SEARCH] Table ${table.tableNumber} has conflicting reservation:`, {
          date: conflictingReservation.reservationDate,
          timeSlot: conflictingReservation.timeSlot,
          status: conflictingReservation.status
        });
      } else {
        console.log(`[SEARCH] Table ${table.tableNumber} is available for ${date} ${startTime}-${endTime}`);
      }

      if (!conflictingReservation) {
        // Calculate pricing for this time slot
        const price = table.calculatePrice(date, startTime);

        // Set status to "available" for search results since there's no conflict
        // This allows frontend to show the table as bookable
        const tableData = table.toObject();
        tableData.status = "available"; // Override status for search results

        availableTables.push({
          ...tableData,
          pricing: {
            ...table.pricing,
            calculatedPrice: price,
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        tables: availableTables,
        searchCriteria: {
          date,
          startTime,
          endTime,
          partySize: parseInt(partySize),
          location,
          features,
        },
        total: availableTables.length,
      },
    });
  } catch (error) {
    console.error("Search tables error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search available tables",
      error: error.message,
    });
  }
};

// 📊 Get table availability calendar
exports.getTableAvailability = async (req, res) => {
  try {
    const { tableId, startDate, endDate } = req.query;

    if (!tableId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Table ID, start date, and end date are required",
      });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // Get all reservations for this table in the date range
    const reservations = await Reservation.find({
      tableId,
      reservationDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: { $in: ["confirmed", "pending", "seated"] },
    }).select("reservationDate timeSlot status");

    // Group reservations by date
    const availability = {};
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const dayReservations = reservations.filter(
        (r) => r.reservationDate.toISOString().split("T")[0] === dateStr
      );

      availability[dateStr] = {
        date: dateStr,
        reservations: dayReservations.map((r) => ({
          startTime: r.timeSlot.startTime,
          endTime: r.timeSlot.endTime,
          status: r.status,
        })),
        isFullyBooked: dayReservations.length >= 8, // Assuming 8 time slots per day
      };

      current.setDate(current.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        table: {
          _id: table._id,
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          location: table.location,
        },
        availability,
        dateRange: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch table availability",
      error: error.message,
    });
  }
};

// 📈 Get table statistics
exports.getTableStats = async (req, res) => {
  try {
    const totalTables = await Table.countDocuments({ isActive: true });
    const availableTables = await Table.countDocuments({
      status: "available",
      isActive: true,
    });
    const occupiedTables = await Table.countDocuments({
      status: "occupied",
      isActive: true,
    });
    const reservedTables = await Table.countDocuments({
      status: "reserved",
      isActive: true,
    });

    // Get capacity distribution
    const capacityStats = await Table.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$capacity",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get location distribution
    const locationStats = await Table.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalTables,
          available: availableTables,
          occupied: occupiedTables,
          reserved: reservedTables,
          maintenance:
            totalTables - availableTables - occupiedTables - reservedTables,
        },
        capacityDistribution: capacityStats,
        locationDistribution: locationStats,
        utilizationRate:
          totalTables > 0
            ? (((occupiedTables + reservedTables) / totalTables) * 100).toFixed(
                2
              )
            : 0,
      },
    });
  } catch (error) {
    console.error("Get table stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch table statistics",
      error: error.message,
    });
  }
};

// 🔄 Update table status (for admin)
exports.updateTableStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "available",
      "occupied",
      "reserved",
      "maintenance",
      "cleaning",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái bàn không hợp lệ",
      });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bàn",
      });
    }

    // Update table status
    table.status = status;
    await table.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái bàn thành công",
      data: {
        table: {
          _id: table._id,
          tableNumber: table.tableNumber,
          status: table.status,
          capacity: table.capacity,
          location: table.location,
        },
      },
    });
  } catch (error) {
    console.error("Error updating table status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái bàn",
    });
  }
};

// 🔄 Reset all maintenance tables to available (for admin)
exports.resetMaintenanceTables = async (req, res) => {
  try {
    const result = await Table.updateMany(
      { status: "maintenance" },
      { $set: { status: "available" } }
    );

    res.json({
      success: true,
      message: `Đã chuyển ${result.modifiedCount} bàn từ bảo trì về trạng thái trống`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (error) {
    console.error("Error resetting maintenance tables:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi reset trạng thái bàn bảo trì",
    });
  }
};

// 🍽️ Table Session Management
const tableSessions = new Map(); // In-memory session storage

// Start table session
exports.startTableSession = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { sessionId, customerInfo } = req.body;

    // Check if table exists
    const table = await Table.findOne({
      tableNumber: tableNumber,
      isActive: true,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // End any existing session first (cleanup)
    const existingSession = tableSessions.get(tableNumber);
    if (existingSession) {
      console.log(
        `🧹 [SESSION] Ending existing session for table ${tableNumber}`
      );
      existingSession.status = "completed";
      existingSession.endTime = new Date().toISOString();
    }

    // Create new session
    const session = {
      sessionId: sessionId || `session_${Date.now()}`,
      tableNumber,
      tableId: table._id,
      startTime: new Date().toISOString(),
      orders: [],
      totalAmount: 0,
      status: "active",
      customerInfo: customerInfo || null,
    };

    tableSessions.set(tableNumber, session);

    // Update table status to occupied
    table.status = "occupied";
    await table.save();

    res.json({
      success: true,
      message: "Table session started",
      data: { session },
    });
  } catch (error) {
    console.error("Start table session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start table session",
      error: error.message,
    });
  }
};

// Get table session
exports.getTableSession = async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const session = tableSessions.get(tableNumber);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "No active session for this table",
      });
    }

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error("Get table session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get table session",
      error: error.message,
    });
  }
};

// End table session
exports.endTableSession = async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const session = tableSessions.get(tableNumber);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "No active session for this table",
      });
    }

    // Update session status
    session.status = "completed";
    session.endTime = new Date().toISOString();

    // Update table status back to available
    const table = await Table.findOne({ tableNumber });
    if (table) {
      table.status = "available";
      await table.save();
    }

    // Remove from active sessions
    tableSessions.delete(tableNumber);

    res.json({
      success: true,
      message: "Table session ended",
      data: { session },
    });
  } catch (error) {
    console.error("End table session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end table session",
      error: error.message,
    });
  }
};

module.exports = {
  createTable: exports.createTable,
  deleteTable: exports.deleteTable,
  getAllTables: exports.getAllTables,
  getTableById: exports.getTableById,
  getTableByNumber: exports.getTableByNumber,
  searchAvailableTables: exports.searchAvailableTables,
  getTableAvailability: exports.getTableAvailability,
  getTableStats: exports.getTableStats,
  updateTable: exports.updateTable,
  updateTableStatus: exports.updateTableStatus,
  resetMaintenanceTables: exports.resetMaintenanceTables,
  startTableSession: exports.startTableSession,
  getTableSession: exports.getTableSession,
  endTableSession: exports.endTableSession,
};
