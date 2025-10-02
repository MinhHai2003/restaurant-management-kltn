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

// 📝 Update table info
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

    // Build base query
    let query = {
      capacity: { $gte: parseInt(partySize) },
      status: "available",
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
      const conflictingReservation = await Reservation.findOne({
        tableId: table._id,
        reservationDate: {
          $gte: new Date(date + "T00:00:00.000Z"),
          $lt: new Date(date + "T23:59:59.999Z"),
        },
        status: { $in: ["confirmed", "pending", "seated"] },
        $or: [
          {
            "timeSlot.startTime": { $lt: endTime },
            "timeSlot.endTime": { $gt: startTime },
          },
        ],
      });

      if (!conflictingReservation) {
        // Calculate pricing for this time slot
        const price = table.calculatePrice(date, startTime);

        availableTables.push({
          ...table.toObject(),
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

module.exports = {
  createTable: exports.createTable,
  getAllTables: exports.getAllTables,
  getTableById: exports.getTableById,
  searchAvailableTables: exports.searchAvailableTables,
  getTableAvailability: exports.getTableAvailability,
  getTableStats: exports.getTableStats,
  updateTable: exports.updateTable,
  updateTableStatus: exports.updateTableStatus,
  resetMaintenanceTables: exports.resetMaintenanceTables,
};
