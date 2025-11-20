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

    const {
      items,
      delivery,
      payment,
      notes,
      coupon,
      customerInfo,
      orderNumber,
      tablePaymentData,
    } = req.body;

    // 1. Validate customer (skip for guest users)
    let customer;
    if (req.customerId) {
      // Authenticated user - validate via API (req.token should exist)
      const token = req.headers.authorization?.split(" ")[1];
      customer = await customerApiClient.validateCustomer(
        req.customerId,
        token
      );
    } else if (req.sessionId) {
      // Guest user - use customer info from request body
      if (
        !customerInfo ||
        !customerInfo.name ||
        !customerInfo.email ||
        !customerInfo.phone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer information (name, email, phone) is required for guest orders",
        });
      }
      customer = {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        membershipLevel: "bronze", // Default membership level for guests (lowercase)
      };
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2. Validate menu items and get pricing
    const validatedItems = await menuApiClient.validateOrderItems(items);

    // 3. Check inventory stock using recipe-based checking
    const stockCheck = await inventoryApiClient.checkMenuItemsStock(
      validatedItems.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      }))
    );

    if (!stockCheck.allAvailable) {
      console.log(
        "[ORDER DEBUG] unavailable menu items:",
        JSON.stringify(stockCheck.unavailableItems, null, 2)
      );
      console.log(
        "[ORDER DEBUG] stock details:",
        JSON.stringify(stockCheck.items, null, 2)
      );

      // Convert to format expected by frontend
      const unavailableItems = (stockCheck.unavailableItems || []).map(
        (item) => {
          const missingIngredients = (item.ingredients || [])
            .filter((ing) => !ing.available)
            .map((ing) => {
              if (ing.reason === "Not found in inventory") {
                return `${ing.ingredientName} (không tìm thấy trong kho)`;
              } else if (ing.reason === "Insufficient stock") {
                return `${ing.ingredientName} (thiếu ${ing.quantityNeeded - (ing.quantityAvailable || 0)} ${ing.unit})`;
              }
              return `${ing.ingredientName} (${ing.reason})`;
            });
          
          return {
            itemId: null, // Menu item không có ID trong inventory
            name: item.menuItem,
            requestedQuantity: item.orderQuantity,
            availableStock: 0, // Không áp dụng cho recipe-based checking
            missingIngredients: missingIngredients,
            reason: `Thiếu nguyên liệu: ${missingIngredients.join(", ")}`,
          };
        }
      );

      // Tạo message chi tiết
      const itemNames = unavailableItems.map(item => item.name).join(", ");
      const allMissingIngredients = unavailableItems
        .flatMap(item => item.missingIngredients)
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
      
      const detailedMessage = unavailableItems.length === 1
        ? `Món "${itemNames}" không thể đặt vì thiếu nguyên liệu: ${unavailableItems[0].missingIngredients.join(", ")}`
        : `Các món "${itemNames}" không thể đặt vì thiếu nguyên liệu: ${allMissingIngredients.join(", ")}`;

      return res.status(400).json({
        success: false,
        message: detailedMessage,
        unavailableItems: unavailableItems,
      });
    }

    // 4. Validate delivery address if delivery
    let deliveryAddress = null;
    if (delivery.type === "delivery") {
      if (delivery.addressId && req.customerId) {
        // Authenticated user with saved address
        const token = req.headers.authorization?.split(" ")[1];
        deliveryAddress = await customerApiClient.validateAddress(
          req.customerId,
          delivery.addressId,
          token
        );
      } else if (delivery.address) {
        // Guest user or authenticated user with new address
        deliveryAddress = delivery.address;
      } else {
        return res.status(400).json({
          success: false,
          message: "Delivery address is required for delivery orders",
        });
      }
    }

    // 5. Get pricing - prioritize frontend calculation, then cart, then fallback
    const Cart = require("../models/Cart");
    let pricing;

    // Check if frontend sent calculated pricing
    if (req.body.frontendPricing) {
      console.log(
        "💰 Using frontend calculated pricing:",
        req.body.frontendPricing
      );
      pricing = {
        subtotal: req.body.frontendPricing.subtotal,
        tax: req.body.frontendPricing.tax,
        deliveryFee: req.body.frontendPricing.deliveryFee,
        discount:
          req.body.frontendPricing.loyaltyDiscount +
          req.body.frontendPricing.couponDiscount,
        loyaltyDiscount: req.body.frontendPricing.loyaltyDiscount,
        couponDiscount: req.body.frontendPricing.couponDiscount,
        total: req.body.frontendPricing.total,
        breakdown: {
          membershipDiscount: req.body.frontendPricing.loyaltyDiscount,
          couponDiscount: req.body.frontendPricing.couponDiscount,
          membershipLevel: req.body.frontendPricing.membershipLevel,
          originalDeliveryFee:
            req.body.frontendPricing.breakdown?.originalDeliveryFee,
          freeShipping: req.body.frontendPricing.breakdown?.freeShipping,
        },
      };
    } else {
      // Fallback to cart pricing
      try {
        let cart;
        if (req.customerId) {
          // Authenticated user cart
          cart = await Cart.findOne({ customerId: req.customerId });
        } else if (req.sessionId) {
          // Guest user session cart
          const SessionCart = require("../models/SessionCart");
          cart = await SessionCart.findOne({ sessionId: req.sessionId });
        }

        if (cart && cart.summary) {
          // Use cart pricing for consistency
          pricing = {
            subtotal: cart.summary.subtotal,
            tax: cart.summary.tax,
            deliveryFee: cart.summary.deliveryFee,
            discount: cart.summary.discount,
            loyaltyDiscount: cart.summary.loyaltyDiscount,
            couponDiscount: cart.summary.couponDiscount,
            total: cart.summary.total,
            breakdown: {
              membershipDiscount: cart.summary.loyaltyDiscount,
              couponDiscount: cart.summary.couponDiscount,
              membershipLevel: customer.membershipLevel,
            },
          };
          console.log("🛒 Using cart pricing for order:", pricing);
        } else {
          // Fallback to payment service calculation
          pricing = paymentService.calculateOrderPricing(
            validatedItems.items,
            delivery.type,
            customer.membershipLevel,
            coupon
          );
          console.log("💰 Using payment service pricing as fallback:", pricing);
        }
      } catch (error) {
        console.error("Error getting cart pricing, using fallback:", error);
        pricing = paymentService.calculateOrderPricing(
          validatedItems.items,
          delivery.type,
          customer.membershipLevel,
          coupon
        );
      }
    }

    // 6. Validate payment method
    if (!paymentService.validatePaymentMethod(payment.method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // 7. Handle table payment data
    let finalTablePaymentData = tablePaymentData;
    if (tablePaymentData?.isTablePayment && tablePaymentData?.tableNumber) {
      console.log('💳 [TABLE PAYMENT] Processing table payment order for table:', tablePaymentData.tableNumber);
      console.log('🔍 [TABLE PAYMENT] tablePaymentData received:', JSON.stringify(tablePaymentData, null, 2));
      
      // Tìm tất cả đơn hàng chưa thanh toán của bàn này
      const query = {
        'diningInfo.tableInfo.tableNumber': tablePaymentData.tableNumber,
        $or: [
          { 'payment.status': { $nin: ['paid', 'completed'] } },
          { 'payment.status': { $exists: false } },
          { 'paymentStatus': { $nin: ['paid', 'completed'] } },
          { 'paymentStatus': { $exists: false } }
        ],
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'ordered'] }
      };
      
      console.log('🔍 [TABLE PAYMENT] Query used:', JSON.stringify(query, null, 2));
      
      const allTableOrders = await Order.find(query);
      
      console.log(`💳 [TABLE PAYMENT] Found ${allTableOrders.length} unpaid orders for table ${tablePaymentData.tableNumber}`);
      
      // Debug: Log cấu trúc đơn hàng để kiểm tra
      if (allTableOrders.length > 0) {
        console.log('💳 [TABLE PAYMENT] Sample order structure:', {
          _id: allTableOrders[0]._id,
          orderNumber: allTableOrders[0].orderNumber,
          diningInfo: allTableOrders[0].diningInfo,
          delivery: allTableOrders[0].delivery,
          payment: allTableOrders[0].payment,
          status: allTableOrders[0].status
        });
      }
      
      // Cập nhật originalOrderIds với tất cả đơn hàng của bàn
      finalTablePaymentData = {
        ...tablePaymentData,
        originalOrderIds: allTableOrders.map(order => order._id.toString())
      };
      
      console.log('💳 [TABLE PAYMENT] Updated originalOrderIds:', finalTablePaymentData.originalOrderIds);
    }

    // 8. Create order
    const orderData = {
      orderNumber: orderNumber || Order.generateOrderNumber(), // Use frontend orderNumber if provided, otherwise generate
      customerId: req.customerId || null, // null for guest users
      sessionId: req.sessionId || null, // session ID for guest users
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
      tablePaymentData: finalTablePaymentData,
    };

    const order = new Order(orderData);
    await order.save();

    // 🔔 Emit real-time notifications via Socket.io
    if (req.io) {
      console.log(
        "🔔 [SOCKET DEBUG] Starting to emit Socket.io events for order:",
        order.orderNumber
      );
      console.log(
        "🔔 [SOCKET DEBUG] Customer ID:",
        req.customerId || "Guest",
        "Session ID:",
        req.sessionId || "None",
        "Order type:",
        order.delivery.type
      );
      console.log(
        "🔔 [SOCKET DEBUG] Customer email:",
        order.customerInfo.email,
        "Customer name:",
        order.customerInfo.name
      );

      // Notify customer about order confirmation (only for authenticated users)
      if (req.customerId) {
        req.io.to(`user_${req.customerId}`).emit("order_created", {
          type: "order_confirmed",
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.pricing.total,
          estimatedTime: order.delivery.estimatedTime,
          message: `Đơn hàng ${order.orderNumber} đã được tạo thành công!`,
        });
      }
      // Note: Guest users won't receive real-time notifications
      // They can check order status via order tracking page

      // Notify kitchen staff about new order
      req.io.to("role_chef").emit("new_order_kitchen", {
        type: "new_order",
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        specialInstructions: order.notes.kitchen,
        priority: order.priority || "normal",
        message: `Đơn hàng mới ${order.orderNumber} cần chuẩn bị`,
      });

      // Notify waiters/service staff about new order
      req.io.to("role_waiter").emit("new_order_service", {
        type: "new_order_service",
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerInfo.name,
        tableNumber: order.tableNumber || null,
        orderType: order.delivery.type,
        items: order.items.length,
        message: `Đơn hàng mới ${order.orderNumber} - ${order.customerInfo.name}`,
      });

      // Notify cashier about new order for payment processing
      req.io.to("role_cashier").emit("new_order_payment", {
        type: "new_order_payment",
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: order.payment.method,
        total: order.pricing.total,
        paymentStatus: order.payment.status,
        message: `Đơn hàng ${
          order.orderNumber
        } - ${order.pricing.total.toLocaleString()}đ (${order.payment.method})`,
      });

      // Notify all staff about general order activity
      req.io.to("staff").emit("order_activity", {
        type: "order_created",
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerInfo.name,
        total: order.pricing.total,
        orderType: order.delivery.type,
        message: `Đơn hàng ${order.orderNumber} - ${order.customerInfo.name}`,
      });

      // Notify delivery staff if it's a delivery order
      if (order.delivery.type === "delivery") {
        req.io.to("role_delivery").emit("new_delivery", {
          type: "new_delivery",
          orderId: order._id,
          orderNumber: order.orderNumber,
          address: order.delivery.address,
          customerPhone: order.customerInfo.phone,
          message: `Đơn giao hàng mới ${order.orderNumber}`,
        });
      }

      // Notify admins/managers about new order
      console.log(
        "🔔 [SOCKET DEBUG] Emitting admin_order_created to all staff roles"
      );
      console.log("🔔 [SOCKET DEBUG] Order details for admin:", {
        orderNumber: order.orderNumber,
        customerId: req.customerId,
        customerEmail: order.customerInfo.email,
        customerName: order.customerInfo.name,
        total: order.pricing.total,
      });
      req.io
        .to("role_admin")
        .to("role_manager")
        .to("role_waiter")
        .to("role_chef")
        .to("role_cashier")
        .to("role_delivery")
        .to("role_receptionist")
        .emit("admin_order_created", {
          type: "admin_order_created",
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderValue: order.pricing.total,
          orderType: order.delivery.type,
          customerName: order.customerInfo.name,
          items: order.items.length,
          message: `Đơn hàng mới ${
            order.orderNumber
          } - ${order.pricing.total.toLocaleString()}đ`,
          timestamp: new Date(),
        });

      // Also emit order analytics for dashboard
      console.log(
        "🔔 [SOCKET DEBUG] Emitting order_analytics to all staff for dashboard updates"
      );
      req.io
        .to("role_admin")
        .to("role_manager")
        .to("role_waiter")
        .to("role_chef")
        .to("role_cashier")
        .to("role_delivery")
        .to("role_receptionist")
        .emit("order_analytics", {
          type: "new_order_stats",
          orderId: order._id,
          orderValue: order.pricing.total,
          orderType: order.delivery.type,
          timestamp: new Date(),
        });
    }

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

    // 8. Reduce inventory based on recipe ingredients
    try {
      const inventoryReduction =
        await inventoryApiClient.reduceInventoryByMenuItems(
          validatedItems.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
          }))
        );
      console.log(
        "[ORDER DEBUG] Inventory reduced successfully:",
        inventoryReduction
      );
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
        
        // For banking method via Casso, keep as pending and wait for webhook
        if (payment.method === "banking" && paymentResult.status === "awaiting_payment") {
          console.log(`💳 [ORDER] Banking payment initiated for order ${order.orderNumber}, awaiting Casso confirmation`);
          // Don't update status to confirmed yet, wait for Casso webhook
        } else {
          await order.updateStatus("confirmed", "Payment processed successfully");
        }
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

    // 10. Clear cart after successful order creation
    try {
      const cart = await Cart.findOne({ customerId: req.customerId });
      if (cart) {
        await cart.clearCart();
        console.log("🛒 Cart cleared after successful order creation");
      }
    } catch (error) {
      console.error("Error clearing cart after order:", error);
      // Don't fail the order creation if cart clearing fails
    }

    // 11. Return success response
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

    // 🔔 Emit real-time notifications for order cancellation
    if (req.io) {
      // Notify customer about cancellation confirmation
      req.io.to(`user_${req.customerId}`).emit("order_cancelled", {
        type: "order_cancelled",
        orderId: order._id,
        orderNumber: order.orderNumber,
        refundStatus: order.payment.status,
        message: `Đơn hàng ${order.orderNumber} đã được hủy thành công`,
      });

      // Notify kitchen staff to stop preparing
      req.io.to("role_chef").emit("order_cancelled_kitchen", {
        type: "order_cancelled",
        orderId: order._id,
        orderNumber: order.orderNumber,
        message: `Đơn hàng ${order.orderNumber} đã bị hủy, dừng chuẩn bị`,
      });

      // Notify delivery if applicable
      if (order.delivery.type === "delivery") {
        req.io.to("role_delivery").emit("delivery_cancelled", {
          type: "delivery_cancelled",
          orderId: order._id,
          orderNumber: order.orderNumber,
          message: `Đơn giao hàng ${order.orderNumber} đã bị hủy`,
        });
      }
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
