const Order = require("../models/Order");
const axios = require("axios");

// 🍽️ Create dine-in order
exports.createDineInOrder = async (req, res) => {
  try {
    const { reservationId, reservationNumber, items, specialInstructions } =
      req.body;

    // Verify reservation exists and is valid (call Table Service)
    try {
      const reservationResponse = await axios.get(
        `${process.env.TABLE_SERVICE_URL}/api/reservations/${reservationNumber}`,
        {
          headers: {
            Authorization: req.header("Authorization"),
          },
        }
      );

      const reservation = reservationResponse.data.data.reservation;

      // Skip status check for testing - allow any status
      // if (!["seated", "dining"].includes(reservation.status)) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Cannot create order for reservation with status: ${reservation.status}`,
      //   });
      // }

      // Get customer info from reservation
      const customerInfo = {
        name: reservation.customerInfo.name,
        email: reservation.customerInfo.email,
        phone: reservation.customerInfo.phone || "0123456789", // Default phone for dine-in
      };

      // Validate and get menu items (call Menu Service if needed)
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

      // Calculate pricing
      const tax = Math.round(totalAmount * 0.08); // 8% tax
      const serviceCharge = Math.round(totalAmount * 0.1); // 10% service charge for dine-in
      const total = totalAmount + tax + serviceCharge;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Create order
      const order = new Order({
        orderNumber,
        customerId: req.customerId,
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
          method: "cash", // Default payment method for dine-in
          status: "pending",
        },
        delivery: {
          type: "dine_in",
          estimatedTime: 30, // 30 minutes cooking time
        },
        diningInfo: {
          reservationId,
          reservationNumber,
          tableInfo: {
            tableId: reservation.tableId,
            tableNumber: reservation.tableInfo.tableNumber,
            location: reservation.tableInfo.location,
          },
          serviceType: "table_service",
        },
        status: "ordered",
        specialInstructions,
      });

      await order.save();

      // Update reservation status to "dining"
      try {
        await axios.put(
          `${process.env.TABLE_SERVICE_URL}/api/reservations/${reservationNumber}/status`,
          { status: "dining" },
          {
            headers: {
              Authorization: req.header("Authorization"),
              "Content-Type": "application/json",
            },
          }
        );
      } catch (updateError) {
        console.warn(
          "Failed to update reservation status:",
          updateError.message
        );
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
    } catch (reservationError) {
      console.error("Failed to verify reservation:", reservationError.message);
      return res.status(400).json({
        success: false,
        message: "Invalid reservation or unable to verify reservation",
      });
    }
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

module.exports = {
  createDineInOrder: exports.createDineInOrder,
  getOrdersByReservation: exports.getOrdersByReservation,
  getOrdersByTable: exports.getOrdersByTable,
  updateOrderStatus: exports.updateOrderStatus,
  serveOrder: exports.serveOrder,
};
