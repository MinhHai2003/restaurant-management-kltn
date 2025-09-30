const { validationResult } = require("express-validator");
const Order = require("../models/Order");
const menuApiClient = require("../services/menuApiClient");
const inventoryApiClient = require("../services/inventoryApiClient");
const paymentService = require("../services/paymentService");

// 📝 Admin tạo đơn hàng (không cần customer authentication)
exports.createAdminOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      items,
      customerInfo, // Admin nhập thông tin customer
      orderType = "dine-in", // pickup, dine-in, delivery
      tableNumber, // Nếu dine-in
      payment = { method: "cash" },
      notes = "",
      discount = 0,
    } = req.body;

    console.log("🔧 [ADMIN ORDER] Creating order:", {
      items: items.map((i) => `${i.name} x${i.quantity}`),
      customerInfo: customerInfo.name,
      orderType,
      tableNumber,
    });

    // 1. Validate menu items và tính giá
    const validatedItems = await menuApiClient.validateOrderItems(items);

    // 2. Check inventory stock theo recipe
    const stockCheck = await inventoryApiClient.checkMenuItemsStock(
      validatedItems.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      }))
    );

    if (!stockCheck.allAvailable) {
      console.log(
        "[ADMIN ORDER] Inventory check failed:",
        stockCheck.unavailableItems
      );

      const unavailableItems = stockCheck.unavailableItems.map((item) => ({
        name: item.menuItem,
        requestedQuantity: item.orderQuantity,
        reason: `Thiếu nguyên liệu: ${item.ingredients
          .filter((ing) => !ing.available)
          .map((ing) => ing.ingredientName)
          .join(", ")}`,
      }));

      return res.status(400).json({
        success: false,
        message: "Một số món không đủ nguyên liệu",
        unavailableItems: unavailableItems,
      });
    }

    // 3. Tính pricing (admin có thể apply discount)
    const pricing = paymentService.calculateOrderPricing(
      validatedItems.items,
      orderType === "delivery" ? "delivery" : "pickup",
      "bronze", // Default membership level
      null // No coupon for admin orders
    );

    // Apply admin discount
    if (discount > 0) {
      pricing.discount = discount;
      pricing.total = Math.max(0, pricing.total - discount);
    }

    // 4. Tạo order data
    const orderData = {
      orderNumber: Order.generateOrderNumber(),
      customerId: "000000000000000000000000", // Dummy ObjectId cho admin orders
      customerInfo: {
        name: customerInfo.name || "Khách lẻ",
        email: customerInfo.email || "admin@restaurant.com",
        phone: customerInfo.phone || "N/A",
      },
      items: validatedItems.items,
      pricing,
      payment: {
        method: payment.method,
        status: payment.method === "cash" ? "paid" : "pending", // Admin orders thường paid luôn
      },
      delivery: {
        type: orderType,
        ...(orderType === "dine-in" &&
          tableNumber && { tableNumber: parseInt(tableNumber) }),
        status: orderType === "dine-in" ? "completed" : "pending",
      },
      status: orderType === "dine-in" ? "ordered" : "confirmed", // Dine-in orders ready to cook
      notes: notes,
      createdBy: "admin", // Mark as admin-created order
      loyaltyPointsEarned: 0, // Admin orders don't earn points
      timeline: [
        {
          status: orderType === "dine-in" ? "ordered" : "confirmed",
          timestamp: new Date(),
          note: `Đơn hàng được tạo bởi admin${
            tableNumber ? ` - Bàn ${tableNumber}` : ""
          }`,
          updatedBy: "admin",
        },
      ],
    };

    // 5. Tạo order
    const order = new Order(orderData);
    await order.save();

    console.log(`✅ [ADMIN ORDER] Order created: ${order.orderNumber}`);

    // 🔔 Emit real-time notifications via Socket.io
    if (req.io) {
      // Notify all admins about new admin order
      req.io
        .to("role_admin")
        .to("role_manager")
        .emit("admin_order_created", {
          type: "admin_order_created",
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerInfo.name,
          total: order.pricing.total,
          orderType: order.delivery.type,
          message: `Admin tạo đơn hàng mới ${order.orderNumber}`,
        });

      // Notify kitchen staff about new order
      req.io.to("role_chef").emit("new_order_kitchen", {
        type: "new_order",
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        specialInstructions: order.notes,
        priority: "high", // Admin orders have higher priority
        message: `Đơn hàng mới từ Admin ${order.orderNumber} - Ưu tiên cao`,
      });
    }

    // 6. Trừ inventory
    try {
      const inventoryReduction =
        await inventoryApiClient.reduceInventoryByMenuItems(
          validatedItems.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
          }))
        );
      console.log(
        "[ADMIN ORDER] Inventory reduced successfully:",
        inventoryReduction.results.length
      );
    } catch (stockError) {
      // Nếu trừ inventory lỗi, xóa order
      await Order.findByIdAndDelete(order._id);
      console.error(
        "[ADMIN ORDER] Inventory reduction failed:",
        stockError.message
      );
      throw new Error("Không thể trừ nguyên liệu. Đơn hàng đã được hủy.");
    }

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      data: {
        order,
        inventoryReduced: true,
        tableNumber: tableNumber || null,
      },
    });
  } catch (error) {
    console.error("❌ [ADMIN ORDER] Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tạo đơn hàng",
      error: error.message,
    });
  }
};

// 📊 Lấy danh sách đơn hàng cho admin
exports.getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter options
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.orderType) filter["delivery.type"] = req.query.orderType;
    if (req.query.paymentMethod)
      filter["payment.method"] = req.query.paymentMethod;

    // Date filter
    if (req.query.fromDate || req.query.toDate) {
      filter.createdAt = {};
      if (req.query.fromDate)
        filter.createdAt.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) filter.createdAt.$lte = new Date(req.query.toDate);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Order.countDocuments(filter);

    // Thống kê nhanh
    const revenueResult = await Order.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]);

    const statusResult = await Order.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = {
      totalOrders: total,
      totalRevenue: revenueResult[0]?.total || 0,
      ordersByStatus: statusResult,
    };

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        stats,
      },
    });
  } catch (error) {
    console.error("❌ [ADMIN ORDER] Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

// 🔄 Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "picked_up",
      "delivered",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Update status và timeline
    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Trạng thái được cập nhật thành ${status}`,
      updatedBy: "admin",
    });

    await order.save();

    console.log(`✅ [ADMIN ORDER] Updated ${order.orderNumber} to ${status}`);

    // 🔔 Emit real-time notifications for status update
    if (req.io) {
      // Notify all admins about status change
      req.io
        .to("role_admin")
        .to("role_manager")
        .emit("order_status_updated", {
          type: "order_status_updated",
          orderId: order._id,
          orderNumber: order.orderNumber,
          oldStatus: order.status,
          newStatus: status,
          updatedBy: "admin",
          message: `Đơn hàng ${order.orderNumber} đã chuyển thành ${status}`,
        });

      // Notify customer if exists
      if (order.customerId) {
        console.log(
          `🔔 [SOCKET] Emitting order_status_updated to user_${order.customerId}:`,
          {
            type: "customer_order_status_updated",
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: status,
            message: `Đơn hàng ${order.orderNumber} đã cập nhật trạng thái: ${status}`,
          }
        );

        req.io.to(`user_${order.customerId}`).emit("order_status_updated", {
          type: "customer_order_status_updated",
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: status,
          message: `Đơn hàng ${order.orderNumber} đã cập nhật trạng thái: ${status}`,
        });
      } else {
        console.log(
          `⚠️ [SOCKET] No customerId found for order ${order.orderNumber}, cannot notify customer`
        );
      }

      // Notify kitchen if food is ready
      if (status === "ready") {
        req.io.to("role_waiter").emit("food_ready", {
          type: "food_ready",
          orderId: order._id,
          orderNumber: order.orderNumber,
          message: `Món ăn đơn ${order.orderNumber} đã sẵn sàng phục vụ`,
        });
      }
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: { order },
    });
  } catch (error) {
    console.error("❌ [ADMIN ORDER] Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật trạng thái",
      error: error.message,
    });
  }
};

// 📈 Dashboard statistics cho admin
exports.getOrderDashboard = async (req, res) => {
  try {
    console.log("🔍 [DASHBOARD] Starting dashboard stats calculation...");

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    console.log("📅 [DASHBOARD] Date ranges:", {
      startOfDay: startOfDay.toISOString(),
      startOfWeek: startOfWeek.toISOString(),
      startOfMonth: startOfMonth.toISOString(),
    });

    // Lấy thống kê từng bước để debug dễ hơn
    console.log("📊 [DASHBOARD] Getting today stats...");
    const todayStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.total" },
          avgOrderValue: { $avg: "$pricing.total" },
        },
      },
    ]);
    console.log("📊 [DASHBOARD] Today stats result:", todayStats);

    console.log("📊 [DASHBOARD] Getting week stats...");
    const weekStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.total" },
        },
      },
    ]);
    console.log("📊 [DASHBOARD] Week stats result:", weekStats);

    console.log("📊 [DASHBOARD] Getting month stats...");
    const monthStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.total" },
        },
      },
    ]);
    console.log("📊 [DASHBOARD] Month stats result:", monthStats);

    console.log("📊 [DASHBOARD] Getting recent orders...");
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "orderNumber customerInfo.name pricing.total status createdAt delivery.type"
      );
    console.log(
      "📊 [DASHBOARD] Recent orders count:",
      recentOrders?.length || 0
    );

    console.log("✅ [DASHBOARD] All data retrieved successfully");

    const responseData = {
      today: todayStats?.[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
      },
      week: weekStats?.[0] || { totalOrders: 0, totalRevenue: 0 },
      month: monthStats?.[0] || { totalOrders: 0, totalRevenue: 0 },
      recentOrders: recentOrders || [],
    };

    console.log(
      "📤 [DASHBOARD] Sending response:",
      JSON.stringify(responseData, null, 2)
    );

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ [ADMIN ORDER] Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  createAdminOrder: exports.createAdminOrder,
  getAdminOrders: exports.getAdminOrders,
  updateOrderStatus: exports.updateOrderStatus,
  getOrderDashboard: exports.getOrderDashboard,
};
