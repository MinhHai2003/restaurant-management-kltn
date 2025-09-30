const axios = require("axios");

class PaymentService {
  constructor() {
    this.defaultDeliveryFee =
      parseFloat(process.env.DEFAULT_DELIVERY_FEE) || 30000; // Fixed delivery fee to match cart
    this.freeDeliveryThreshold =
      parseFloat(process.env.FREE_DELIVERY_THRESHOLD) || 500000;
    this.taxRate = parseFloat(process.env.TAX_RATE) || 0.08; // 8% VAT to match cart
    this.paymentGatewayURL = process.env.PAYMENT_GATEWAY_URL;
  }

  // Calculate order pricing
  calculateOrderPricing(
    items,
    deliveryType = "delivery",
    customerLevel = "bronze",
    coupon = null
  ) {
    // Calculate subtotal
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Calculate delivery fee
    let deliveryFee = 0;
    if (deliveryType === "delivery") {
      if (
        subtotal >= this.freeDeliveryThreshold ||
        ["gold", "platinum"].includes(customerLevel)
      ) {
        deliveryFee = 0; // Free delivery
      } else {
        deliveryFee = this.defaultDeliveryFee;
      }
    }

    // Calculate tax
    const tax = Math.round(subtotal * this.taxRate);

    // Calculate membership discount
    let membershipDiscount = 0;
    const membershipRates = {
      bronze: 0,
      silver: 0.05, // 5%
      gold: 0.1, // 10%
      platinum: 0.15, // 15%
    };
    membershipDiscount = Math.round(
      subtotal * (membershipRates[customerLevel] || 0)
    );

    // Calculate coupon discount
    let couponDiscount = 0;
    if (coupon && this.validateCoupon(coupon, subtotal)) {
      if (coupon.discountType === "percentage") {
        couponDiscount = Math.round(subtotal * (coupon.discountValue / 100));
      } else if (coupon.discountType === "fixed") {
        couponDiscount = Math.min(coupon.discountValue, subtotal);
      }
    }

    // Calculate total
    const total = Math.max(
      0,
      subtotal + tax + deliveryFee - membershipDiscount - couponDiscount
    );

    return {
      subtotal,
      tax,
      deliveryFee,
      discount: membershipDiscount + couponDiscount,
      loyaltyDiscount: membershipDiscount,
      couponDiscount,
      total,
      breakdown: {
        membershipDiscount,
        couponDiscount,
        membershipLevel: customerLevel,
      },
    };
  }

  // Validate coupon
  validateCoupon(coupon, subtotal) {
    if (!coupon) return false;

    // Check if coupon is active
    if (!coupon.isActive) return false;

    // Check expiry date
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return false;
    }

    // Check minimum order value
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return false;
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return false;
    }

    return true;
  }

  // Calculate loyalty points
  calculateLoyaltyPoints(orderTotal) {
    // 1 point per 10,000 VND
    return Math.floor(orderTotal / 10000);
  }

  // Process payment (mock implementation)
  async processPayment(paymentData) {
    try {
      const { method, amount, customerId, orderId } = paymentData;

      // Mock payment processing
      if (method === "cash") {
        return {
          success: true,
          status: "pending", // Will be paid on delivery
          transactionId: `CASH_${orderId}_${Date.now()}`,
          paidAt: null,
          message: "Cash payment will be collected on delivery",
        };
      }

      // For digital payments, simulate API call
      const paymentResult = await this.simulatePaymentGateway({
        amount,
        method,
        customerId,
        orderId,
      });

      return paymentResult;
    } catch (error) {
      console.error("Payment processing error:", error.message);
      return {
        success: false,
        status: "failed",
        error: error.message,
      };
    }
  }

  // Simulate payment gateway response
  async simulatePaymentGateway(paymentData) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { amount, method, orderId } = paymentData;

    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      return {
        success: true,
        status: "paid",
        transactionId: `${method.toUpperCase()}_${orderId}_${Date.now()}`,
        paidAt: new Date(),
        amount: amount,
        method: method,
        message: "Payment processed successfully",
      };
    } else {
      return {
        success: false,
        status: "failed",
        error: "Payment gateway declined transaction",
        message: "Please try again or use a different payment method",
      };
    }
  }

  // Refund payment
  async processRefund(order, refundAmount = null) {
    try {
      const amount = refundAmount || order.pricing.total;

      if (order.payment.method === "cash") {
        return {
          success: true,
          refundId: `REFUND_CASH_${order._id}_${Date.now()}`,
          amount: amount,
          method: "cash",
          message: "Cash refund will be processed manually",
        };
      }

      // Simulate refund API call
      const refundResult = await this.simulateRefundGateway({
        originalTransactionId: order.payment.transactionId,
        amount: amount,
        orderId: order._id,
      });

      return refundResult;
    } catch (error) {
      console.error("Refund processing error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Simulate refund gateway
  async simulateRefundGateway(refundData) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      refundId: `REFUND_${refundData.orderId}_${Date.now()}`,
      amount: refundData.amount,
      originalTransactionId: refundData.originalTransactionId,
      processedAt: new Date(),
      message: "Refund processed successfully",
    };
  }

  // Get payment methods
  getAvailablePaymentMethods() {
    return [
      {
        id: "cash",
        name: "Cash on Delivery",
        description: "Pay with cash when order arrives",
        processingTime: "instant",
        fee: 0,
      },
      {
        id: "card",
        name: "Credit/Debit Card",
        description: "Visa, MasterCard, etc.",
        processingTime: "instant",
        fee: 0,
      },
      {
        id: "momo",
        name: "MoMo Wallet",
        description: "Pay with MoMo e-wallet",
        processingTime: "instant",
        fee: 0,
      },
      {
        id: "banking",
        name: "Internet Banking",
        description: "Bank transfer",
        processingTime: "1-3 minutes",
        fee: 0,
      },
      {
        id: "zalopay",
        name: "ZaloPay",
        description: "Pay with ZaloPay wallet",
        processingTime: "instant",
        fee: 0,
      },
    ];
  }

  // Validate payment method
  validatePaymentMethod(method) {
    const availableMethods = this.getAvailablePaymentMethods();
    return availableMethods.some((m) => m.id === method);
  }
}

module.exports = new PaymentService();
