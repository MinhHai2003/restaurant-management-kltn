const { validationResult } = require("express-validator");
const Order = require("../models/Order");
const customerApiClient = require("../services/customerApiClient");
const menuApiClient = require("../services/menuApiClient");
const inventoryApiClient = require("../services/inventoryApiClient");
const paymentService = require("../services/paymentService");

// 📝 Create New Order
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { items, delivery, payment, notes, coupon } = req.body;

    // 1. Validate customer
    const customer = await customerApiClient.validateCustomer(
      req.customerId,
      req.token
    );

    // 2. Validate menu items and get pricing
    const validatedItems = await menuApiClient.validateOrderItems(items);

    // 3. Check inventory stock
    const stockCheck = await inventoryApiClient.checkOrderStock(
      validatedItems.items
    );
    if (!stockCheck.allAvailable) {
      console.log(
        "[ORDER DEBUG] unavailableItems:",
        JSON.stringify(stockCheck.unavailableItems, null, 2)
      );
      console.log(
        "[ORDER DEBUG] stockChecks:",
        JSON.stringify(stockCheck.stockChecks, null, 2)
      );
      return res.status(400).json({
        success: false,
        message: "Some items are not available",
        unavailableItems: stockCheck.unavailableItems,
      });
    }

    // 4. Validate delivery address if delivery
    let deliveryAddress = null;
    if (delivery.type === "delivery") {
      if (delivery.addressId) {
        deliveryAddress = await customerApiClient.validateAddress(
          req.customerId,
          delivery.addressId,
          req.token
        );
      } else if (delivery.address) {
        deliveryAddress = delivery.address;
      } else {
        return res.status(400).json({
          success: false,
          message: "Delivery address is required for delivery orders",
        });
      }
    }

    // 5. Calculate pricing
    const pricing = paymentService.calculateOrderPricing(
      validatedItems.items,
      delivery.type,
      customer.membershipLevel,
      coupon
    );

    // 6. Validate payment method
    if (!paymentService.validatePaymentMethod(payment.method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // 7. Create order
    const orderData = {
      orderNumber: Order.generateOrderNumber(), // Generate order number
      customerId: req.customerId,
      customerInfo: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "N/A", // Default nếu không có phone
      },
      items: validatedItems.items,
      pricing,
      payment: {
        method: payment.method,
        status: payment.method === "cash" ? "pending" : "pending",
      },
      delivery: {
        type: delivery.type,
        address: deliveryAddress
          ? {
              full: deliveryAddress.address || deliveryAddress.full,
              district: deliveryAddress.district,
              city: deliveryAddress.city,
            }
          : null,
        estimatedTime: delivery.estimatedTime || 30,
        fee: pricing.deliveryFee,
        instructions: delivery.instructions,
      },
      loyalty: {
        pointsEarned: paymentService.calculateLoyaltyPoints(pricing.total),
        membershipLevel: customer.membershipLevel,
      },
      coupon: coupon
        ? {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            appliedDiscount: pricing.couponDiscount,
          }
        : undefined,
      notes: {
        customer: notes?.customer,
        kitchen: notes?.kitchen,
        delivery: notes?.delivery,
      },
      requiresAge18: await menuApiClient.checkAgeRestriction(
        validatedItems.items.map((item) => item.menuItemId)
      ),
    };

    const order = new Order(orderData);
    await order.save();

    // Cập nhật thống kê user sau khi order đã lưu thành công
    try {
      console.log(
        "[ORDER DEBUG] Gọi updateLoyaltyPoints cho user:",
        req.customerId,
        "với tổng tiền:",
        pricing.total
      );
      const loyaltyResult = await customerApiClient.updateLoyaltyPoints(
        req.customerId,
        pricing.total,
        req.token
      );
      console.log("[ORDER DEBUG] Kết quả updateLoyaltyPoints:", loyaltyResult);
    } catch (err) {
      console.error(
        "[ORDER DEBUG] Failed to update customer stats after order:",
        err.message
      );
      // Không trả lỗi cho client, chỉ log
    }

    // 8. Reserve stock
    try {
      await inventoryApiClient.reserveStock(validatedItems.items, order._id);
    } catch (stockError) {
      // If stock reservation fails, delete the order
      await Order.findByIdAndDelete(order._id);
      throw stockError;
    }

    // 9. Process payment if not cash
    if (payment.method !== "cash") {
      const paymentResult = await paymentService.processPayment({
        method: payment.method,
        amount: pricing.total,
        customerId: req.customerId,
        orderId: order._id,
      });

      if (paymentResult.success) {
        order.payment.status = paymentResult.status;
        order.payment.transactionId = paymentResult.transactionId;
        order.payment.paidAt = paymentResult.paidAt;
        await order.updateStatus("confirmed", "Payment processed successfully");
      } else {
        await order.updateStatus(
          "cancelled",
          `Payment failed: ${paymentResult.error}`
        );
        await inventoryApiClient.releaseReservedStock(
          validatedItems.items,
          order._id
        );

        return res.status(400).json({
          success: false,
          message: "Payment processing failed",
          error: paymentResult.error,
          order: order,
        });
      }
    }

    // 10. Return success response
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.pricing.total,
          estimatedTime: order.delivery.estimatedTime,
          paymentMethod: order.payment.method,
          paymentStatus: order.payment.status,
        },
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// 🔍 Get Order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to customer
    if (order.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      message: "Order retrieved successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve order",
      error: error.message,
    });
  }
};

// 📋 Get Customer Orders
exports.getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = "orderDate" } = req.query;

    const query = { customerId: req.customerId };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: -1 },
    };

    const orders = await Order.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .select("-timeline -notes.internal")
      .exec();

    const total = await Order.countDocuments(query);

    // Trả về đầy đủ object order (không chỉ các trường cơ bản)
    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders, // trả về toàn bộ object order (bao gồm notes, delivery, payment, ...)
        pagination: {
          total,
          page: options.page,
          pages: Math.ceil(total / options.limit),
          limit: options.limit,
        },
      },
    });
  } catch (error) {
    console.error("Get customer orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: error.message,
    });
  }
};

// ❌ Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to customer
    if (order.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if order can be cancelled
    if (!order.canCancel) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`,
      });
    }

    // Release stock
    await inventoryApiClient.releaseReservedStock(order.items, order._id);

    // Process refund if payment was made
    if (order.payment.status === "paid") {
      const refundResult = await paymentService.processRefund(order);
      if (refundResult.success) {
        order.payment.status = "refunded";
        await order.updateStatus(
          "refunded",
          `Order cancelled: ${reason || "Customer request"}`
        );
      } else {
        // Mark for manual refund processing
        await order.updateStatus(
          "cancelled",
          `Order cancelled, refund pending: ${reason || "Customer request"}`
        );
      }
    } else {
      await order.updateStatus(
        "cancelled",
        `Order cancelled: ${reason || "Customer request"}`
      );
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          cancelledAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// ⭐ Rate Order
exports.rateOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { food, delivery, overall, comment } = req.body;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to customer
    if (order.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if order can be rated
    if (!order.canRate()) {
      return res.status(400).json({
        success: false,
        message:
          "Order cannot be rated. Either not completed or already rated.",
      });
    }

    // Update ratings
    order.ratings = {
      food: food,
      delivery: delivery,
      overall: overall,
      comment: comment,
      ratedAt: new Date(),
    };

    await order.save();

    res.json({
      success: true,
      message: "Order rated successfully",
      data: {
        ratings: order.ratings,
      },
    });
  } catch (error) {
    console.error("Rate order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rate order",
      error: error.message,
    });
  }
};

// 🔄 Track Order
exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .select(
        "orderNumber status timeline delivery.estimatedTime delivery.actualTime pricing.total orderDate"
      )
      .exec();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Get estimated completion time
    const now = new Date();
    const estimatedCompletion = new Date(
      order.orderDate.getTime() + order.delivery.estimatedTime * 60 * 1000
    );
    const timeRemaining = Math.max(
      0,
      Math.round((estimatedCompletion - now) / (1000 * 60))
    );

    res.json({
      success: true,
      message: "Order tracking information",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedTime: order.delivery.estimatedTime,
        timeRemaining: timeRemaining,
        timeline: order.timeline.map((t) => ({
          status: t.status,
          timestamp: t.timestamp,
          note: t.note,
        })),
      },
    });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track order",
      error: error.message,
    });
  }
};

// 📊 Get Order Statistics
exports.getOrderStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await Order.getOrderStats(req.customerId, parseInt(days));

    if (!stats.length) {
      return res.json({
        success: true,
        message: "Order statistics",
        data: {
          totalOrders: 0,
          totalSpent: 0,
          totalItems: 0,
          avgOrderValue: 0,
          lastOrderDate: null,
        },
      });
    }

    res.json({
      success: true,
      message: "Order statistics retrieved successfully",
      data: stats[0],
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve order statistics",
      error: error.message,
    });
  }
};

// 🔄 Reorder (Create order from previous order)
exports.reorder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const previousOrder = await Order.findOne({ orderNumber });
    if (!previousOrder) {
      return res.status(404).json({
        success: false,
        message: "Previous order not found",
      });
    }

    // Check if order belongs to customer
    if (previousOrder.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Prepare new order data
    const reorderItems = previousOrder.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      customizations: item.customizations,
      notes: item.notes,
    }));

    // Create new order with same items
    req.body = {
      items: reorderItems,
      delivery: {
        type: previousOrder.delivery.type,
        address: previousOrder.delivery.address,
        instructions: previousOrder.delivery.instructions,
      },
      payment: {
        method: previousOrder.payment.method,
      },
      notes: {
        customer: `Reorder from ${previousOrder.orderNumber}`,
      },
    };

    // Call create order function
    return exports.createOrder(req, res);
  } catch (error) {
    console.error("Reorder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder: exports.createOrder,
  getOrderById: exports.getOrderById,
  getCustomerOrders: exports.getCustomerOrders,
  cancelOrder: exports.cancelOrder,
  rateOrder: exports.rateOrder,
  trackOrder: exports.trackOrder,
  getOrderStats: exports.getOrderStats,
  reorder: exports.reorder,
};
