const Shift = require("../models/Shift");
const User = require("../models/User");
const mongoose = require("mongoose");
const {
  emitToDepartment,
  emitToUser,
  emitToRole,
} = require("../config/socket");

// Tạo ca làm việc mới
const createShift = async (req, res) => {
  try {
    const {
      name,
      startTime,
      endTime,
      date,
      department,
      requiredStaff,
      notes,
      breakTimes,
      hourlyRate,
    } = req.body;
    const createdBy = req.userId;

    // Validation
    if (
      !name ||
      !startTime ||
      !endTime ||
      !date ||
      !department ||
      !requiredStaff
    ) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng thời gian không hợp lệ (HH:MM)",
      });
    }

    // Check for existing shift conflicts
    const shiftDate = new Date(date);
    const existingShifts = await Shift.find({
      date: shiftDate,
      department: department,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (existingShifts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Đã có ca làm việc trùng thời gian trong phòng ban này",
        conflicts: existingShifts,
      });
    }

    const shift = new Shift({
      name,
      startTime,
      endTime,
      date: shiftDate,
      department,
      requiredStaff,
      createdBy,
      notes: notes || "",
      breakTimes: breakTimes || [],
      hourlyRate: hourlyRate || 0,
    });

    const savedShift = await shift.save();
    const populatedShift = await Shift.findById(savedShift._id)
      .populate("assignedStaff", "name email role department")
      .populate("createdBy", "name role");

    // 🔌 Emit socket event for new shift
    emitToDepartment(department, "new_shift_created", {
      shift: populatedShift,
      message: `Có ca làm việc mới: ${name}`,
      timestamp: new Date(),
    });

    // Also notify admins
    emitToRole("admin", "new_shift_created", {
      shift: populatedShift,
      message: `Ca làm việc "${name}" đã được tạo cho phòng ban ${department}`,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Tạo ca làm việc thành công",
      data: populatedShift,
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo ca làm việc",
      error: error.message,
    });
  }
};

// Lấy danh sách ca làm việc
const getShifts = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      department,
      status,
      page = 1,
      limit = 20,
      sortBy = "date",
      sortOrder = "asc",
    } = req.query;

    const query = {};

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default to current week if no date range specified
      const today = new Date();
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      const endOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay() + 6)
      );
      query.date = {
        $gte: startOfWeek,
        $lte: endOfWeek,
      };
    }

    if (department) query.department = department;
    if (status) query.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Add secondary sort by startTime
    if (sortBy !== "startTime") {
      sortOptions.startTime = 1;
    }

    const skip = (page - 1) * limit;

    const shifts = await Shift.find(query)
      .populate("assignedStaff", "name email role department phone")
      .populate("createdBy", "name role")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Shift.countDocuments(query);

    res.status(200).json({
      success: true,
      data: shifts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + shifts.length < total,
        hasPrev: page > 1,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách ca làm việc",
      error: error.message,
    });
  }
};

// Lấy chi tiết ca làm việc
const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ca làm việc không hợp lệ",
      });
    }

    const shift = await Shift.findById(id)
      .populate("assignedStaff", "name email role department phone salary")
      .populate("createdBy", "name role department");

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc",
      });
    }

    res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    console.error("Error fetching shift:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết ca làm việc",
      error: error.message,
    });
  }
};

// Cập nhật ca làm việc
const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ca làm việc không hợp lệ",
      });
    }

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc",
      });
    }

    // Check permissions (only creator or admin/manager can update)
    const user = await User.findById(userId);
    if (
      shift.createdBy.toString() !== userId &&
      !["admin", "manager"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền cập nhật ca làm việc này",
      });
    }

    // Don't allow updating completed shifts
    if (
      shift.status === "completed" &&
      !["admin", "manager"].includes(user.role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Không thể cập nhật ca làm việc đã hoàn thành",
      });
    }

    // Validate time format if times are being updated
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (updates.startTime && !timeRegex.test(updates.startTime)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng giờ bắt đầu không hợp lệ (HH:MM)",
      });
    }
    if (updates.endTime && !timeRegex.test(updates.endTime)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng giờ kết thúc không hợp lệ (HH:MM)",
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.createdBy;
    delete updates.assignedStaff; // Use separate endpoint for staff assignment
    delete updates._id;
    delete updates.__v;

    const updatedShift = await Shift.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("assignedStaff", "name email role department")
      .populate("createdBy", "name role");

    res.status(200).json({
      success: true,
      message: "Cập nhật ca làm việc thành công",
      data: updatedShift,
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật ca làm việc",
      error: error.message,
    });
  }
};

// Xóa ca làm việc
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ca làm việc không hợp lệ",
      });
    }

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc",
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    if (
      shift.createdBy.toString() !== userId &&
      !["admin", "manager"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xóa ca làm việc này",
      });
    }

    // Don't allow deleting published or completed shifts
    if (
      ["published", "completed"].includes(shift.status) &&
      user.role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa ca làm việc đã xuất bản hoặc hoàn thành",
      });
    }

    await Shift.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Xóa ca làm việc thành công",
    });
  } catch (error) {
    console.error("Error deleting shift:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa ca làm việc",
      error: error.message,
    });
  }
};

// Phân công nhân viên vào ca
const assignEmployee = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { employeeId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(shiftId) ||
      !mongoose.Types.ObjectId.isValid(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const shift = await Shift.findById(shiftId);
    const employee = await User.findById(employeeId);

    if (!shift || !employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc hoặc nhân viên",
      });
    }

    // Check if employee is in the same department
    if (shift.department !== employee.department) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên không thuộc phòng ban của ca làm việc này",
      });
    }

    // Check if shift is already full
    if (shift.assignedStaff.length >= shift.requiredStaff) {
      return res.status(400).json({
        success: false,
        message: "Ca làm việc đã đủ nhân viên",
      });
    }

    // Check if employee is already assigned
    if (shift.assignedStaff.includes(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên đã được phân công vào ca này",
      });
    }

    // Check for conflicts with other shifts on the same date
    const conflictingShifts = await Shift.find({
      date: shift.date,
      assignedStaff: employeeId,
      _id: { $ne: shiftId },
    });

    for (const conflictShift of conflictingShifts) {
      if (shift.hasConflictsWith(conflictShift)) {
        return res.status(400).json({
          success: false,
          message: `Nhân viên đã có ca làm việc từ ${conflictShift.startTime} - ${conflictShift.endTime} trong ngày này`,
        });
      }
    }

    shift.assignedStaff.push(employeeId);
    await shift.save();

    const updatedShift = await Shift.findById(shiftId)
      .populate("assignedStaff", "name email role department")
      .populate("createdBy", "name role");

    // 🔌 Emit socket event for shift assignment
    emitToUser(employeeId, "shift_assignment", {
      shift: updatedShift,
      message: `Bạn đã được phân công ca: ${updatedShift.name}`,
      timestamp: new Date(),
    });

    // Notify department about assignment
    emitToDepartment(updatedShift.department, "shift_assignment_update", {
      shift: updatedShift,
      assignedEmployee: employee.name,
      message: `${employee.name} đã được phân công vào ca ${updatedShift.name}`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Phân công nhân viên thành công",
      data: updatedShift,
    });
  } catch (error) {
    console.error("Error assigning employee:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi phân công nhân viên",
      error: error.message,
    });
  }
};

// Bỏ phân công nhân viên
const unassignEmployee = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { employeeId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(shiftId) ||
      !mongoose.Types.ObjectId.isValid(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc",
      });
    }

    const employeeIndex = shift.assignedStaff.indexOf(employeeId);
    if (employeeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên chưa được phân công vào ca này",
      });
    }

    // Don't allow unassigning from completed shifts
    if (shift.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Không thể bỏ phân công từ ca làm việc đã hoàn thành",
      });
    }

    shift.assignedStaff.splice(employeeIndex, 1);
    await shift.save();

    const updatedShift = await Shift.findById(shiftId)
      .populate("assignedStaff", "name email role department")
      .populate("createdBy", "name role");

    const employee = await User.findById(employeeId);

    // 🔌 Emit socket event for shift unassignment
    emitToUser(employeeId, "shift_unassignment", {
      shift: updatedShift,
      message: `Bạn đã được bỏ phân công khỏi ca: ${updatedShift.name}`,
      timestamp: new Date(),
    });

    // Notify department about unassignment
    emitToDepartment(updatedShift.department, "shift_assignment_update", {
      shift: updatedShift,
      unassignedEmployee: employee.name,
      message: `${employee.name} đã được bỏ phân công khỏi ca ${updatedShift.name}`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Bỏ phân công nhân viên thành công",
      data: updatedShift,
    });
  } catch (error) {
    console.error("Error unassigning employee:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi bỏ phân công nhân viên",
      error: error.message,
    });
  }
};

// Cập nhật trạng thái ca làm việc
const updateShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ca làm việc không hợp lệ",
      });
    }

    if (!["draft", "published", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc",
      });
    }

    // Validate status transitions
    if (shift.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Không thể thay đổi trạng thái của ca làm việc đã hoàn thành",
      });
    }

    if (status === "published" && shift.assignedStaff.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xuất bản ca làm việc chưa có nhân viên",
      });
    }

    shift.status = status;
    await shift.save();

    const updatedShift = await Shift.findById(id)
      .populate("assignedStaff", "name email role department")
      .populate("createdBy", "name role");

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái ca làm việc thành ${status} thành công`,
      data: updatedShift,
    });
  } catch (error) {
    console.error("Error updating shift status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái ca làm việc",
      error: error.message,
    });
  }
};

// Lấy ca làm việc của nhân viên
const getEmployeeShifts = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ",
      });
    }

    // Check permissions (employee can only see their own shifts, admin/manager can see any)
    const user = await User.findById(userId);
    if (employeeId !== userId && !["admin", "manager"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xem ca làm việc của nhân viên này",
      });
    }

    const startDateFilter = startDate ? new Date(startDate) : new Date();
    const endDateFilter = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const shifts = await Shift.find({
      assignedStaff: employeeId,
      date: {
        $gte: startDateFilter,
        $lte: endDateFilter,
      },
    })
      .populate("createdBy", "name role")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    console.error("Error fetching employee shifts:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy ca làm việc của nhân viên",
      error: error.message,
    });
  }
};

// Lấy thống kê ca làm việc
const getShiftStatistics = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const startDateFilter = startDate ? new Date(startDate) : new Date();
    startDateFilter.setDate(startDateFilter.getDate() - 7); // Default to last 7 days

    const endDateFilter = endDate ? new Date(endDate) : new Date();

    const matchStage = {
      date: {
        $gte: startDateFilter,
        $lte: endDateFilter,
      },
    };

    if (department) {
      matchStage.department = department;
    }

    // General statistics
    const stats = await Shift.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalShifts: { $sum: 1 },
          totalRequiredStaff: { $sum: "$requiredStaff" },
          totalAssignedStaff: { $sum: { $size: "$assignedStaff" } },
          avgShiftDuration: { $avg: "$totalHours" },
          publishedShifts: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          completedShifts: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          draftShifts: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
        },
      },
    ]);

    // Department statistics
    const departmentStats = await Shift.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$department",
          totalShifts: { $sum: 1 },
          totalRequiredStaff: { $sum: "$requiredStaff" },
          totalAssignedStaff: { $sum: { $size: "$assignedStaff" } },
          avgShiftDuration: { $avg: "$totalHours" },
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
        },
      },
    ]);

    // Daily statistics
    const dailyStats = await Shift.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          totalShifts: { $sum: 1 },
          totalRequiredStaff: { $sum: "$requiredStaff" },
          totalAssignedStaff: { $sum: { $size: "$assignedStaff" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = {
      overview: stats[0] || {
        totalShifts: 0,
        totalRequiredStaff: 0,
        totalAssignedStaff: 0,
        avgShiftDuration: 0,
        publishedShifts: 0,
        completedShifts: 0,
        draftShifts: 0,
      },
      departmentStats,
      dailyStats,
      period: {
        startDate: startDateFilter,
        endDate: endDateFilter,
      },
    };

    // Calculate overall staffing rate
    if (result.overview.totalRequiredStaff > 0) {
      result.overview.staffingRate =
        Math.round(
          (result.overview.totalAssignedStaff /
            result.overview.totalRequiredStaff) *
            100 *
            100
        ) / 100;
    } else {
      result.overview.staffingRate = 0;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching shift statistics:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê ca làm việc",
      error: error.message,
    });
  }
};

module.exports = {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
  assignEmployee,
  unassignEmployee,
  updateShiftStatus,
  getEmployeeShifts,
  getShiftStatistics,
};
