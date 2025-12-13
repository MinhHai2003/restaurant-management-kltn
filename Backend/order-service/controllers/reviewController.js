const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const analyticsService = require("../services/analyticsService");

// Create review for order items
exports.createReview = async (req, res) => {
  try {
    console.log('Create review request:', {
      orderNumber: req.params.orderNumber,
      items: req.body.items,
      customerId: req.customerId,
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { orderNumber } = req.params;
    const { items } = req.body;

    // Find the order
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to customer
    if (!req.customerId) {
      console.log('No customerId in request:', req.customerId);
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    
    if (order.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if order can be rated - only delivered or completed orders
    console.log('Order status:', order.status);
    console.log('Order itemRatings:', order.itemRatings);
    
    const canRate = (order.status === 'delivered' || order.status === 'completed') && 
                   (!order.itemRatings || !order.itemRatings.isRated);
    
    if (!canRate) {
      if (order.status !== 'delivered' && order.status !== 'completed') {
        console.log('Order status is not delivered or completed:', order.status);
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể đánh giá đơn hàng đã hoàn thành",
        });
      }
      if (order.itemRatings && order.itemRatings.isRated) {
        console.log('Order already rated');
        return res.status(400).json({
          success: false,
          message: "Đơn hàng đã được đánh giá rồi",
        });
      }
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty",
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.menuItemId || !item.rating) {
        return res.status(400).json({
          success: false,
          message: "Each item must have menuItemId and rating",
        });
      }
      if (item.rating < 1 || item.rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
    }

    // Create reviews for each item
    const reviews = [];
    const reviewIds = [];

    for (const item of items) {
      // Find the menu item in the order by name (since we don't have real menuItemId)
      const orderItem = order.items.find(
        oi => oi.name === item.menuItemName || oi.name === item.menuItemId
      );

      if (!orderItem) {
        console.log('Order items:', order.items);
        console.log('Looking for:', item.menuItemName || item.menuItemId);
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.menuItemId} not found in order`,
        });
      }

      // Use a placeholder ObjectId for menuItemId since we don't have real ones
      const placeholderMenuId = new mongoose.Types.ObjectId();

      const review = new Review({
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerId: req.customerId,
        customerName: (order.customerInfo && order.customerInfo.name) || "Khách hàng",
        menuItemId: placeholderMenuId,
        menuItemName: orderItem.name,
        rating: item.rating,
        comment: item.comment || "",
        images: item.images || [],
        orderDate: order.orderDate || new Date(),
      });

      try {
        await review.save();
        reviews.push(review);
        reviewIds.push(review._id);
      } catch (reviewError) {
        console.error('Error saving review:', reviewError);
        return res.status(500).json({
          success: false,
          message: "Failed to save review",
          error: reviewError.message,
        });
      }

      // Update menu item ratings statistics (skip for now since we don't have real menuItemId)
      // await analyticsService.updateMenuItemRatings(item.menuItemId);
    }

    // Update order to mark as rated
    if (!order.itemRatings) {
      order.itemRatings = {};
    }
    order.itemRatings.isRated = true;
    order.itemRatings.ratedAt = new Date();
    order.itemRatings.reviewIds = reviewIds;
    
    try {
      await order.save();
    } catch (saveError) {
      console.error('Error saving order:', saveError);
      return res.status(500).json({
        success: false,
        message: "Failed to update order",
        error: saveError.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Reviews created successfully",
      data: {
        orderNumber: order.orderNumber,
        reviewsCount: reviews.length,
        reviews: reviews.map(review => ({
          id: review._id,
          orderNumber: review.orderNumber,
          menuItemName: review.menuItemName,
          rating: review.rating,
          comment: review.comment,
          images: review.images,
          ratedAt: review.ratedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create reviews",
      error: error.message,
    });
  }
};

// Get customer's review history
exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ customerId: req.customerId })
      .sort({ ratedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("menuItemId", "name image category");

    const total = await Review.countDocuments({ customerId: req.customerId });

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => review.toDisplayFormat()),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get my reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Get reviews for a specific menu item
exports.getMenuItemReviews = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;
    const skip = (page - 1) * limit;

    let sortOption = { ratedAt: -1 };
    if (sort === "rating") {
      sortOption = { rating: -1, ratedAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { ratedAt: 1 };
    }

    const reviews = await Review.find({ menuItemId })
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customerId", "name");

    const total = await Review.countDocuments({ menuItemId });

    // Get average rating for this menu item
    const ratingStats = await Review.aggregate([
      { $match: { menuItemId: menuItemId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => review.toDisplayFormat()),
        ratingStats: ratingStats[0] || { averageRating: 0, totalReviews: 0 },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get menu item reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu item reviews",
      error: error.message,
    });
  }
};

// Get top rated items
exports.getTopRated = async (req, res) => {
  try {
    const { limit = 10, minReviews = 1 } = req.query;

    console.log('Getting top rated items:', { limit, minReviews });

    const result = await analyticsService.getTopRatedItems(
      parseInt(limit),
      parseInt(minReviews)
    );

    console.log('Top rated result:', result);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch top rated items",
        error: result.error,
      });
    }

    // Ensure data is always an array
    const data = Array.isArray(result.data) ? result.data : [];

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Get top rated error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top rated items",
      error: error.message,
    });
  }
};

// Get personalized recommendations for customer
exports.getRecommendations = async (req, res) => {
  try {
    const result = await analyticsService.getCustomerRecommendations(req.customerId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch recommendations",
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
};

// Update existing review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if review belongs to customer
    if (review.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if review can be edited
    if (!review.canBeEdited()) {
      return res.status(400).json({
        success: false,
        message: "Review cannot be edited (more than 24 hours old)",
      });
    }

    // Update review
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    if (images !== undefined) {
      review.images = images;
    }

    await review.save();

    // Update menu item ratings statistics
    await analyticsService.updateMenuItemRatings(review.menuItemId);

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review.toDisplayFormat(),
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if review belongs to customer
    if (review.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update menu item ratings statistics
    await analyticsService.updateMenuItemRatings(review.menuItemId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};
