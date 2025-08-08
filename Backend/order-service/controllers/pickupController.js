const Order = require("../models/Order");

// 🏃 Create pickup/takeaway order (no reservation needed)
exports.createPickupOrder = async (req, res) => {
  try {
    const {
      items,
      customerName,
      phoneNumber,
      scheduledTime,
      pickupInstructions,
      specialInstructions,
    } = req.body;

    // Validate items and calculate pricing
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Here you would typically call Menu Service to validate items and get current prices
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

    // Calculate pricing (no delivery fee for pickup)
    const tax = Math.round(totalAmount * 0.08); // 8% tax
    const total = totalAmount + tax;

    // Generate order number
    const orderNumber = `PKP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = new Order({
      orderNumber,
      customerId: req.customerId,
      customerInfo: {
        name: customerName,
        email: req.customerEmail || "pickup@restaurant.com", // Default email for pickup orders
        phone: phoneNumber,
      },
      items: orderItems,
      pricing: {
        subtotal: totalAmount,
        tax,
        deliveryFee: 0, // No delivery fee for pickup
        discount: 0,
        loyaltyDiscount: 0,
        total,
      },
      payment: {
        method: "cash", // Default to cash payment for pickup orders
        status: "pending",
      },
      delivery: {
        type: "pickup",
        estimatedTime: 20, // 20 minutes preparation time
        pickupInfo: {
          customerName,
          phoneNumber,
          scheduledTime: scheduledTime
            ? new Date(scheduledTime)
            : new Date(Date.now() + 30 * 60 * 1000), // Default 30 minutes from now
          instructions: pickupInstructions || "Please call when you arrive",
        },
      },
      status: "pending",
      specialInstructions,
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Pickup order created successfully",
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          estimatedTime: order.delivery.estimatedTime,
          scheduledPickupTime: order.delivery.pickupInfo.scheduledTime,
          items: order.items,
          pricing: order.pricing,
          customerName: order.delivery.pickupInfo.customerName,
          phoneNumber: order.delivery.pickupInfo.phoneNumber,
        },
      },
    });
  } catch (error) {
    console.error("Create pickup order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pickup order",
      error: error.message,
    });
  }
};

// ✅ Confirm pickup order (staff accepts and starts preparing)
exports.confirmPickupOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { estimatedTime } = req.body; // Optional: update estimated time

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.delivery.type !== "pickup") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for pickup orders",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm order. Current status: ${order.status}`,
      });
    }

    // Update order status
    order.status = "preparing";
    if (estimatedTime) {
      order.delivery.estimatedTime = estimatedTime;
    }

    order.timeline.push({
      status: "preparing",
      timestamp: new Date(),
      note: "Order confirmed and preparation started",
    });

    await order.save();

    res.json({
      success: true,
      message: "Pickup order confirmed and preparation started",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedTime: order.delivery.estimatedTime,
      },
    });
  } catch (error) {
    console.error("Confirm pickup order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm pickup order",
      error: error.message,
    });
  }
};

// 📞 Mark pickup order as ready (notify customer)
exports.markPickupReady = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.delivery.type !== "pickup") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for pickup orders",
      });
    }

    if (order.status !== "preparing") {
      return res.status(400).json({
        success: false,
        message: `Cannot mark order as ready. Current status: ${order.status}`,
      });
    }

    // Update order status
    order.status = "ready";
    order.timeline.push({
      status: "ready",
      timestamp: new Date(),
      note: "Order is ready for pickup",
    });

    await order.save();

    // Here you would typically send SMS/notification to customer
    console.log(
      `📱 NOTIFICATION: Order ${orderNumber} is ready for pickup. Customer: ${order.delivery.pickupInfo.phoneNumber}`
    );

    res.json({
      success: true,
      message: "Order marked as ready for pickup",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.delivery.pickupInfo.customerName,
        phoneNumber: order.delivery.pickupInfo.phoneNumber,
        instructions: order.delivery.pickupInfo.instructions,
      },
    });
  } catch (error) {
    console.error("Mark pickup ready error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as ready",
      error: error.message,
    });
  }
};

// 📦 Complete pickup (customer has picked up the order)
exports.completePickup = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { pickedUpBy, paymentMethod } = req.body;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.delivery.type !== "pickup") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for pickup orders",
      });
    }

    if (order.status !== "ready") {
      return res.status(400).json({
        success: false,
        message: `Cannot complete pickup. Current status: ${order.status}`,
      });
    }

    // Update order
    order.status = "picked_up";
    order.delivery.pickupInfo.actualPickupTime = new Date();
    order.payment.method = paymentMethod || "cash";
    order.payment.status = "paid";
    order.payment.paidAt = new Date();

    order.timeline.push({
      status: "picked_up",
      timestamp: new Date(),
      note: `Order picked up by ${
        pickedUpBy || order.delivery.pickupInfo.customerName
      }`,
    });

    // Mark as completed immediately for pickup orders
    order.status = "completed";
    order.timeline.push({
      status: "completed",
      timestamp: new Date(),
      note: "Pickup order completed",
    });

    await order.save();

    res.json({
      success: true,
      message: "Pickup completed successfully",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        pickedUpAt: order.delivery.pickupInfo.actualPickupTime,
        pickedUpBy: pickedUpBy || order.delivery.pickupInfo.customerName,
        totalPaid: order.pricing.total,
      },
    });
  } catch (error) {
    console.error("Complete pickup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete pickup",
      error: error.message,
    });
  }
};

// 📋 Get all pickup orders (for staff dashboard)
exports.getPickupOrders = async (req, res) => {
  try {
    const { status = "all", date } = req.query;

    let query = { "delivery.type": "pickup" };

    if (status !== "all") {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const orders = await Order.find(query)
      .sort({ "delivery.pickupInfo.scheduledTime": 1 })
      .select(
        "orderNumber status delivery.pickupInfo pricing.total createdAt timeline"
      );

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
        summary: {
          pending: orders.filter((o) => o.status === "pending").length,
          confirmed: orders.filter((o) => o.status === "confirmed").length,
          preparing: orders.filter((o) => o.status === "preparing").length,
          ready: orders.filter((o) => o.status === "ready").length,
          completed: orders.filter((o) => o.status === "completed").length,
        },
      },
    });
  } catch (error) {
    console.error("Get pickup orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickup orders",
      error: error.message,
    });
  }
};

module.exports = {
  createPickupOrder: exports.createPickupOrder,
  confirmPickupOrder: exports.confirmPickupOrder,
  markPickupReady: exports.markPickupReady,
  completePickup: exports.completePickup,
  getPickupOrders: exports.getPickupOrders,
};
