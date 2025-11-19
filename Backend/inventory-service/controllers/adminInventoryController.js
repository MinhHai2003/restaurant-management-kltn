const Inventory = require("../models/Inventory");

// 📊 Dashboard thống kê cho admin
exports.getInventoryStats = async (req, res) => {
  try {
    const items = await Inventory.find({}, "quantity price minimumStock");

    const stats = items.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const minimumStock =
          typeof item.minimumStock === "number" ? item.minimumStock : 10;

        acc.totalItems += 1;
        acc.totalValue += quantity * price;

        if (quantity === 0) {
          acc.outOfStock += 1;
        } else if (quantity <= minimumStock) {
          acc.lowStock += 1;
        } else {
          acc.inStock += 1;
        }

        return acc;
      },
      { totalItems: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }
    );

    res.json({
      ...stats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 📋 Lấy danh sách inventory với phân trang và lọc
exports.getInventoriesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Tạo filter object
    let filter = {};

    // Lọc theo status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Lọc theo supplier
    if (req.query.supplier) {
      filter.supplier = new RegExp(req.query.supplier, "i");
    }

    // Tìm kiếm theo tên
    if (req.query.search) {
      filter.name = new RegExp(req.query.search, "i");
    }

    // Lọc theo khoảng giá
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice)
        filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice)
        filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Sort options
    let sortOption = {};
    if (req.query.sortBy) {
      const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
      sortOption[req.query.sortBy] = sortOrder;
    } else {
      sortOption.updated_at = -1; // Mặc định sort theo thời gian cập nhật
    }

    const items = await Inventory.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Inventory.countDocuments(filter);

    res.json({
      items,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: items.length,
        totalItems: total,
      },
      filter: req.query,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ➕ Tạo nguyên liệu mới (Admin only)
exports.createInventoryAdmin = async (req, res) => {
  try {
    // Kiểm tra trùng tên
    const existingItem = await Inventory.findOne({
      name: new RegExp(`^${req.body.name}$`, "i"),
    });

    if (existingItem) {
      return res.status(400).json({
        message: "Nguyên liệu với tên này đã tồn tại",
      });
    }

    const newItem = new Inventory({
      ...req.body,
      created_by_admin: "admin", // Fixed: không dùng req.user khi auth bị disabled
    });

    await newItem.save();

    res.status(201).json({
      message: "Tạo nguyên liệu thành công",
      item: newItem,
    });
  } catch (err) {
    res.status(400).json({ message: "Tạo thất bại", error: err.message });
  }
};

// ✏️ Cập nhật nguyên liệu (Admin only)
exports.updateInventoryAdmin = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy nguyên liệu" });
    }

    // Kiểm tra trùng tên nếu đổi tên
    if (req.body.name && req.body.name !== item.name) {
      const existingItem = await Inventory.findOne({
        name: new RegExp(`^${req.body.name}$`, "i"),
        _id: { $ne: req.params.id },
      });

      if (existingItem) {
        return res.status(400).json({
          message: "Nguyên liệu với tên này đã tồn tại",
        });
      }
    }

    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updated_by_admin: "admin", // Fixed: không dùng req.user khi auth bị disabled
      },
      { new: true }
    );

    res.json({
      message: "Cập nhật thành công",
      item: updated,
    });
  } catch (err) {
    res.status(400).json({ message: "Cập nhật thất bại", error: err.message });
  }
};

// 🗑️ Xóa nguyên liệu (Admin only)
exports.deleteInventoryAdmin = async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy nguyên liệu" });
    }

    res.json({
      message: "Xóa nguyên liệu thành công",
      deletedItem: {
        id: deleted._id,
        name: deleted.name,
      },
    });
  } catch (err) {
    res.status(400).json({ message: "Xóa thất bại", error: err.message });
  }
};

// 🔄 Cập nhật số lượng inventory
exports.updateInventoryQuantity = async (req, res) => {
  try {
    console.log("🔧 DEBUG updateInventoryQuantity:", {
      params: req.params,
      body: req.body,
      userExists: !!req.user,
    });

    const { quantity, operation, note } = req.body; // operation: 'add', 'subtract', 'set'

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy nguyên liệu" });
    }

    let newQuantity;
    switch (operation) {
      case "add":
        newQuantity = item.quantity + quantity;
        break;
      case "subtract":
        newQuantity = Math.max(0, item.quantity - quantity);
        break;
      case "set":
      default:
        newQuantity = quantity;
    }

    // Tự động cập nhật status dựa trên số lượng
    let newStatus = "in-stock";
    if (newQuantity === 0) {
      newStatus = "out-of-stock";
    } else if (newQuantity <= 10) {
      // Có thể config threshold này
      newStatus = "low-stock";
    }

    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        quantity: newQuantity,
        status: newStatus,
        note: note || item.note,
        updated_by_admin: "admin", // Fixed: không dùng req.user khi auth bị disabled
      },
      { new: true }
    );

    res.json({
      message: `${
        operation === "add"
          ? "Nhập"
          : operation === "subtract"
          ? "Xuất"
          : "Cập nhật"
      } kho thành công`,
      item: updated,
      operation: {
        type: operation,
        quantity: quantity,
        oldQuantity: item.quantity,
        newQuantity: newQuantity,
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Cập nhật số lượng thất bại", error: err.message });
  }
};

// 📊 Báo cáo inventory
exports.getInventoryReport = async (req, res) => {
  try {
    const reportType = req.query.type || "summary";

    switch (reportType) {
      case "low-stock": {
        const allItems = await Inventory.find().sort({ quantity: 1 });
        const lowStockItems = allItems.filter((item) => {
          const quantity = Number(item.quantity) || 0;
          const minimumStock =
            typeof item.minimumStock === "number" ? item.minimumStock : 10;

          if (quantity === 0) return true;
          if (quantity < 0) return true;

          return quantity > 0 && quantity <= minimumStock;
        });

        res.json({
          type: "low-stock",
          message: "Danh sách nguyên liệu sắp hết/đã hết",
          items: lowStockItems,
          count: lowStockItems.length,
        });
        break;
      }

      case "high-value":
        const highValueItems = await Inventory.find()
          .sort({ price: -1 })
          .limit(10);

        res.json({
          type: "high-value",
          message: "Top 10 nguyên liệu có giá cao nhất",
          items: highValueItems,
        });
        break;

      case "by-supplier":
        const supplierReport = await Inventory.aggregate([
          {
            $group: {
              _id: "$supplier",
              itemCount: { $sum: 1 },
              totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
              items: {
                $push: {
                  name: "$name",
                  quantity: "$quantity",
                  price: "$price",
                },
              },
            },
          },
          { $sort: { totalValue: -1 } },
        ]);

        res.json({
          type: "by-supplier",
          message: "Báo cáo theo nhà cung cấp",
          suppliers: supplierReport,
        });
        break;

      default:
        // Summary report
        const summary = await Inventory.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
            },
          },
        ]);

        res.json({
          type: "summary",
          message: "Báo cáo tổng quan inventory",
          summary: summary,
          generatedAt: new Date().toISOString(),
        });
    }
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo báo cáo", error: err.message });
  }
};
