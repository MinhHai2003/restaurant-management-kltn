const { validationResult } = require("express-validator");
const Cart = require("../models/Cart");
const menuApiClient = require("../services/menuApiClient");
const customerApiClient = require("../services/customerApiClient");

// 🛒 Get Cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOrCreateCart(req.customerId, req.sessionId);

    res.json({
      success: true,
      message: "Cart retrieved successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cart",
      error: error.message,
    });
  }
};

// ➕ Add Item to Cart
exports.addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { menuItemId, quantity, customizations, notes } = req.body;

    // Validate menu item
    const menuItem = await menuApiClient.getMenuItem(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    if (!menuItem.available) {
      return res.status(400).json({
        success: false,
        message: "Menu item is not available",
      });
    }

    // Get or create cart
    const cart = await Cart.findOrCreateCart(req.customerId, req.sessionId);

    // Add item to cart
    await cart.addItem({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: parseInt(quantity),
      image: menuItem.image || "",
      customizations: customizations || "",
      notes: notes || "",
    });

    // 🔔 Emit real-time notification for cart update
    if (req.io) {
      req.io.to(`user_${req.customerId}`).emit("cart_updated", {
        type: "item_added",
        itemName: menuItem.name,
        quantity: parseInt(quantity),
        cartTotal: cart.summary.total,
        cartItemCount: cart.items.length,
        message: `${menuItem.name} đã được thêm vào giỏ hàng`,
      });
    }

    res.json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        cart,
        addedItem: {
          name: menuItem.name,
          quantity: parseInt(quantity),
          price: menuItem.price,
        },
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
};

// 🔄 Update Cart Item
exports.updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ customerId: req.customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await cart.updateItem(itemId, parseInt(quantity));

    res.json({
      success: true,
      message:
        quantity > 0
          ? "Cart item updated successfully"
          : "Cart item removed successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    if (error.message === "Item not found in cart") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    });
  }
};

// ❌ Remove Item from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ customerId: req.customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    const removedItemName = item.name;
    await cart.removeItem(itemId);

    res.json({
      success: true,
      message: `${removedItemName} removed from cart successfully`,
      data: { cart },
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
};

// 🗑️ Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await cart.clearCart();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

// 🎫 Apply Coupon
exports.applyCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { couponCode } = req.body;

    const cart = await Cart.findOne({ customerId: req.customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (cart.isEmpty) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply coupon to empty cart",
      });
    }

    // TODO: Validate coupon with coupon service
    // For now, mock coupon validation
    const mockCoupons = {
      WELCOME10: { discountType: "percentage", discountValue: 10 },
      SAVE50K: { discountType: "fixed", discountValue: 50000 },
      FREESHIP: { discountType: "fixed", discountValue: 30000 },
    };

    const couponData = mockCoupons[couponCode.toUpperCase()];
    if (!couponData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired coupon code",
      });
    }

    await cart.applyCoupon({
      code: couponCode.toUpperCase(),
      ...couponData,
    });

    res.json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        cart,
        appliedDiscount: cart.appliedCoupon.appliedDiscount,
      },
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
      error: error.message,
    });
  }
};

// 🎫 Remove Coupon
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await cart.removeCoupon();

    res.json({
      success: true,
      message: "Coupon removed successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Remove coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove coupon",
      error: error.message,
    });
  }
};

// 🚚 Update Delivery Info
exports.updateDelivery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { type, addressId, address, estimatedTime } = req.body;

    const cart = await Cart.findOne({ customerId: req.customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // If delivery type is delivery and addressId provided, validate address
    let validatedAddress = null;
    if (type === "delivery" && addressId) {
      try {
        validatedAddress = await customerApiClient.validateAddress(
          req.customerId,
          addressId,
          req.token
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery address",
          error: error.message,
        });
      }
    }

    const deliveryUpdate = {
      type,
      ...(addressId && { addressId }),
      ...(validatedAddress && { address: validatedAddress }),
      ...(address && { address }),
      ...(estimatedTime && { estimatedTime }),
    };

    await cart.updateDelivery(deliveryUpdate);

    res.json({
      success: true,
      message: "Delivery information updated successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Update delivery error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update delivery information",
      error: error.message,
    });
  }
};

// 📊 Get Cart Summary
exports.getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.getCartSummary(req.customerId);

    if (!cart) {
      return res.json({
        success: true,
        message: "Cart summary",
        data: {
          summary: {
            totalItems: 0,
            subtotal: 0,
            deliveryFee: 0,
            discount: 0,
            tax: 0,
            total: 0,
          },
          itemCount: 0,
        },
      });
    }

    res.json({
      success: true,
      message: "Cart summary retrieved successfully",
      data: {
        summary: cart.summary,
        itemCount: cart.itemCount,
      },
    });
  } catch (error) {
    console.error("Get cart summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cart summary",
      error: error.message,
    });
  }
};

// 🛒➡️📦 Convert Cart to Order
exports.checkoutCart = async (req, res) => {
  try {
    const { payment, notes } = req.body;

    const cart = await Cart.findOne({ customerId: req.customerId });
    if (!cart || cart.isEmpty) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Prepare order data from cart
    const orderData = {
      items: cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations,
        notes: item.notes,
      })),
      delivery: {
        type: cart.delivery.type,
        ...(cart.delivery.address && { address: cart.delivery.address }),
        ...(cart.delivery.addressId && { addressId: cart.delivery.addressId }),
        estimatedTime: cart.delivery.estimatedTime,
      },
      payment,
      notes,
      ...(cart.appliedCoupon && { coupon: cart.appliedCoupon }),
    };

    // Forward to order creation
    req.body = orderData;
    const orderController = require("./orderController");

    // Create order and clear cart on success
    const originalJson = res.json;
    res.json = function (data) {
      if (data.success) {
        // Clear cart after successful order creation
        cart.clearCart().catch(console.error);
      }
      return originalJson.call(this, data);
    };

    return orderController.createOrder(req, res);
  } catch (error) {
    console.error("Checkout cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to checkout cart",
      error: error.message,
    });
  }
};

module.exports = {
  getCart: exports.getCart,
  addToCart: exports.addToCart,
  updateCartItem: exports.updateCartItem,
  removeFromCart: exports.removeFromCart,
  clearCart: exports.clearCart,
  applyCoupon: exports.applyCoupon,
  removeCoupon: exports.removeCoupon,
  updateDelivery: exports.updateDelivery,
  getCartSummary: exports.getCartSummary,
  checkoutCart: exports.checkoutCart,
};
