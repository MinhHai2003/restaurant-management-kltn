const Order = require("../models/Order");
const axios = require("axios");

// 🍽️ Create dine-in order
exports.createDineInOrder = async (req, res) => {
  try {
    const {
      tableNumber,
      tableSession,
      items,
      customerInfo,
      notes,
      payment = { method: "cash", status: "pending" },
      orderNumber,
    } = req.body;

    console.log("🍽️ [DINE-IN] Creating order for table:", tableNumber);
    console.log(
      "🍽️ [DINE-IN] Items:",
      items?.map((i) => `${i.name} x${i.quantity}`)
    );

    if (!tableNumber || !items || !customerInfo) {
      return res.status(400).json({
        success: false,
        message: "Table number, items, and customer info are required",
      });
    }

    // Validate table exists
    let tableInfo;
    try {
      const tableResponse = await axios.get(
        `${
          process.env.TABLE_SERVICE_URL || "http://localhost:5004"
        }/api/tables/number/${tableNumber}`
      );

      if (tableResponse.data.success) {
        tableInfo = tableResponse.data.data.table;
      } else {
        throw new Error("Table not found");
      }
    } catch (tableError) {
      console.warn(
        "[DINE-IN] Table verification failed, proceeding with provided tableNumber:",
        tableNumber,
        tableError.message
      );
      // Fallback: vẫn cho phép tạo đơn với thông tin bàn tối thiểu để tránh chặn đặt món từ tab khác
      tableInfo = {
        _id: undefined,
        tableNumber: String(tableNumber),
        location: "unknown",
      };
    }

    // Calculate pricing
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Here you would typically call Menu Service to validate items and get current prices
      // For now, we'll trust the provided data
      orderItems.push({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations || "",
        notes: item.notes || "",
      });

      totalAmount += item.price * item.quantity;
    }

    // Pricing for dine-in: giá menu đã bao gồm thuế -> không cộng thêm
    const tax = 0;
    const total = totalAmount;

    // Generate or use provided order number
    const finalOrderNumber =
      orderNumber ||
      `TBL-${tableNumber}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = new Order({
      orderNumber: finalOrderNumber,
      sessionId: `table-${tableNumber}-${Date.now()}`, // Guest session
      customerInfo,
      items: orderItems,
      pricing: {
        subtotal: totalAmount,
        tax,
        deliveryFee: 0, // No delivery fee for dine-in
        discount: 0,
        loyaltyDiscount: 0,
        total,
      },
      payment: {
        method: payment?.method === "banking" ? "banking" : payment?.method || "none",
        status: payment?.status || "pending",
      },
      delivery: {
        type: "dine_in",
        estimatedTime: 30, // 30 minutes cooking time
      },
      diningInfo: {
        tableInfo: {
          tableId: tableInfo._id,
          tableNumber: tableInfo.tableNumber,
          location: tableInfo.location,
        },
        serviceType: "table_service",
      },
      status: "ordered",
      notes: {
        customer: notes?.customer || "",
        kitchen: notes?.kitchen || `Bàn ${tableNumber} - ${customerInfo.name}`,
        delivery: notes?.delivery || "",
      },
    });

    await order.save();

    console.log("✅ [DINE-IN] Order created successfully:", finalOrderNumber);

    // 🔔 Emit real-time events to kitchen/admins and specific table room
    if (req.io) {
      try {
        // Notify kitchen and admins similar to other order flows
        req.io.to("role_chef").emit("new_order_kitchen", {
          type: "new_order",
          orderId: order._id,
          orderNumber: order.orderNumber,
          items: order.items,
          specialInstructions: order.notes?.kitchen || "",
          priority: "normal",
          message: `Đơn tại bàn ${tableNumber} - ${order.orderNumber}`,
        });

        req.io.to("role_admin").to("role_manager").emit("admin_order_created", {
          type: "dinein_order_created",
          orderId: order._id,
          orderNumber: order.orderNumber,
          total: order.pricing.total,
          orderType: "dine_in",
        });

        // Notify all clients joined this table room
        req.io.to(`table_${tableNumber}`).emit("table_order_created", {
          order: {
            orderNumber: order.orderNumber,
            items: order.items,
            pricing: order.pricing,
            status: order.status,
            createdAt: order.createdAt,
          },
          tableNumber: String(tableNumber),
        });
      } catch (emitErr) {
        console.error("[SOCKET] Emit dine-in events error:", emitErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Dine-in order created successfully",
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          estimatedTime: order.delivery.estimatedTime,
          items: order.items,
          pricing: order.pricing,
          tableNumber: order.diningInfo.tableInfo.tableNumber,
        },
      },
    });
  } catch (error) {
    console.error("Create dine-in order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create dine-in order",
      error: error.message,
    });
  }
};

// 📋 Get orders for a reservation
exports.getOrdersByReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const orders = await Order.find({
      "diningInfo.reservationId": reservationId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error("Get orders by reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders for reservation",
      error: error.message,
    });
  }
};

// 📋 Get orders for a table by table number
exports.getOrdersByTableNumber = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    console.log(
      `🔍 [GET ORDERS] Fetching orders for table number: ${tableNumber}`
    );

    // Try both possible field structures
    const orders = await Order.find({
      $or: [
        { "diningInfo.tableInfo.tableNumber": tableNumber },
        { tableNumber: tableNumber },
      ],
      "delivery.type": "dine_in",
    }).sort({ createdAt: -1 });

    console.log(
      `📋 [GET ORDERS] Found ${orders.length} orders for table ${tableNumber}`
    );
    if (orders.length > 0) {
      console.log(`📋 [GET ORDERS] Sample order structure:`, {
        orderNumber: orders[0].orderNumber,
        tableNumber: orders[0].tableNumber,
        diningInfo: orders[0].diningInfo,
        total: orders[0].pricing?.total,
        status: orders[0].status,
        paymentStatus: orders[0].payment?.status,
      });
    }

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error("Get orders by table number error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders for table",
      error: error.message,
    });
  }
};

// 📋 Get orders for a table
exports.getOrdersByTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    const orders = await Order.find({
      "diningInfo.tableInfo.tableId": tableId,
      status: { $in: ["ordered", "cooking", "served", "dining"] },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error("Get orders by table error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders for table",
      error: error.message,
    });
  }
};

// 🍳 Update order status (for kitchen/staff)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, note } = req.body;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate status transition - Skip for testing
    // const validTransitions = {
    //   ordered: ["cooking", "cancelled"],
    //   cooking: ["served", "cancelled"],
    //   served: ["dining", "cancelled"],
    //   dining: ["completed"],
    // };

    // if (!validTransitions[order.status]?.includes(status)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Invalid status transition from ${order.status} to ${status}`,
    //   });
    // }

    // Update order
    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed to ${status}`,
    });

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// 🍽️ Mark order as served
exports.serveOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { servedBy } = req.body;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "cooking") {
      return res.status(400).json({
        success: false,
        message: `Cannot serve order with status: ${order.status}`,
      });
    }

    order.status = "served";
    order.timeline.push({
      status: "served",
      timestamp: new Date(),
      note: `Order served by ${servedBy || "staff"}`,
    });

    await order.save();

    res.json({
      success: true,
      message: "Order marked as served",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        servedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Serve order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as served",
      error: error.message,
    });
  }
};

// Mark all orders of a table as completed (for session payment)
exports.completeTableOrders = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { paymentData, paymentMethod, totalAmount } = req.body;

    console.log(
      `💳 [COMPLETE] Marking all orders of table ${tableNumber} as completed`
    );

    // Find all unpaid, non-cancelled orders for this table
    const orders = await Order.find({
      $or: [
        { tableNumber: tableNumber },
        { "diningInfo.tableInfo.tableNumber": tableNumber },
      ],
      "delivery.type": "dine_in",
      status: { $nin: ["completed", "canceled"] },
      "payment.status": { $nin: ["completed", "paid"] },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy order nào cho bàn này",
      });
    }

    // Update all orders to completed status
    const updateResult = await Order.updateMany(
      {
        $or: [
          { tableNumber: tableNumber },
          { "diningInfo.tableInfo.tableNumber": tableNumber },
        ],
        "delivery.type": "dine_in",
        status: { $nin: ["completed", "canceled"] },
        "payment.status": { $nin: ["completed", "paid"] },
      },
      {
        $set: {
          status: "completed",
          "payment.status": "paid",
          "payment.method": paymentMethod === "cash" ? "cash" : "banking",
          "payment.completedAt": new Date(),
          "payment.sessionTotal": totalAmount,
          "payment.paymentData": paymentData,
        },
      }
    );

    console.log(
      `✅ [COMPLETE] Updated ${updateResult.modifiedCount} orders for table ${tableNumber}`
    );

    // 🔔 Emit realtime event to all clients in this table room to close session
    if (req.io) {
      try {
        req.io.to(`table_${tableNumber}`).emit("table_session_closed", {
          tableNumber: String(tableNumber),
          ordersCompleted: updateResult.modifiedCount,
          totalAmount,
          method: paymentMethod === "cash" ? "cash" : "banking",
          timestamp: new Date().toISOString(),
        });

        // 🔔 Emit order_status_updated for each updated order to notify admin dashboard
        // Fetch updated orders to emit their full data
        const updatedOrders = await Order.find({
          $or: [
            { tableNumber: tableNumber },
            { "diningInfo.tableInfo.tableNumber": tableNumber },
          ],
          "delivery.type": "dine_in",
          status: "completed",
          "payment.status": "paid",
        }).select("-__v");

        console.log(`🔔 [COMPLETE] Emitting order_status_updated for ${updatedOrders.length} orders`);

        // Emit order_status_updated for each order to notify admin dashboard
        updatedOrders.forEach((order) => {
          req.io
            .to("role_admin")
            .to("role_manager")
            .to("role_waiter")
            .to("role_chef")
            .to("role_cashier")
            .to("role_delivery")
            .to("role_receptionist")
            .emit("order_status_updated", {
              type: "order_status_updated",
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
              oldStatus: "pending", // Previous status before payment
              newStatus: "completed",
              order: order, // Include full order object for frontend
              updatedBy: "payment",
              message: `Đơn hàng ${order.orderNumber} đã được thanh toán và hoàn thành`,
            });
        });
      } catch (emitErr) {
        console.error("[SOCKET] Emit error:", emitErr.message);
      }
    }

    res.json({
      success: true,
      message: `Đã hoàn thành thanh toán cho ${updateResult.modifiedCount} đơn hàng`,
      data: {
        ordersCompleted: updateResult.modifiedCount,
        totalAmount: totalAmount,
      },
    });
  } catch (error) {
    console.error("Mark table orders complete error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi hoàn thành thanh toán",
      error: error.message,
    });
  }
};

module.exports = {
  createDineInOrder: exports.createDineInOrder,
  getOrdersByReservation: exports.getOrdersByReservation,
  getOrdersByTable: exports.getOrdersByTable,
  getOrdersByTableNumber: exports.getOrdersByTableNumber,
  updateOrderStatus: exports.updateOrderStatus,
  serveOrder: exports.serveOrder,
  completeTableOrders: exports.completeTableOrders,
};
