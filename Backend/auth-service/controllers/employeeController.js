const { validationResult } = require("express-validator");
const User = require("../models/User");

// 👥 Get All Employees - Lấy danh sách nhân viên
exports.getAllEmployees = async (req, res) => {
  try {
    const { role, department, isActive, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Pagination
    const skip = (page - 1) * limit;

    const employees = await User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      message: "Employees retrieved successfully",
      data: {
        employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 👤 Get Employee by ID - Lấy thông tin nhân viên theo ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id).select("-password -refreshToken");
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Employee retrieved successfully",
      data: { employee },
    });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✏️ Update Employee - Cập nhật thông tin nhân viên (Admin/Manager only)
exports.updateEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const {
      name,
      email,
      role,
      phone,
      address,
      position,
      department,
      salary,
      isActive,
    } = req.body;

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if trying to update email and it already exists
    if (email && email !== employee.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Update fields
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (role) employee.role = role;
    if (phone) employee.phone = phone;
    if (address) employee.address = address;
    if (position) employee.position = position;
    if (department) employee.department = department;
    if (salary !== undefined) employee.salary = salary;
    if (isActive !== undefined) employee.isActive = isActive;

    await employee.save();

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: { employee },
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🗑️ Delete Employee - Xóa nhân viên (Soft delete)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Soft delete - deactivate account
    employee.isActive = false;
    employee.refreshToken = null;
    employee.refreshTokenExpiry = null;
    await employee.save();

    res.json({
      success: true,
      message: "Employee deactivated successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔓 Unlock Employee Account - Mở khóa tài khoản nhân viên
exports.unlockEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Reset lock fields
    employee.loginAttempts = 0;
    employee.lockUntil = undefined;
    await employee.save();

    res.json({
      success: true,
      message: "Employee account unlocked successfully",
    });
  } catch (error) {
    console.error("Unlock employee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 📊 Get Employee Statistics - Thống kê nhân viên
exports.getEmployeeStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          activeEmployees: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactiveEmployees: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
          lockedEmployees: {
            $sum: {
              $cond: [{ $gt: ["$lockUntil", new Date()] }, 1, 0],
            },
          },
        },
      },
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const departmentStats = await User.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          avgSalary: { $avg: "$salary" },
        },
      },
    ]);

    res.json({
      success: true,
      message: "Employee statistics retrieved successfully",
      data: {
        general: stats[0] || {
          totalEmployees: 0,
          activeEmployees: 0,
          inactiveEmployees: 0,
          lockedEmployees: 0,
        },
        roleStats,
        departmentStats,
      },
    });
  } catch (error) {
    console.error("Get employee stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
