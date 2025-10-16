const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const axios = require("axios");

class AnalyticsService {
  constructor() {
    this.menuServiceUrl = process.env.MENU_SERVICE_URL || "http://localhost:5003";
  }

  // Get customer's favorite items (most ordered with good ratings)
  async getCustomerFavoriteItems(customerId, limit = 5) {
    try {
      console.log('Getting customer favorite items for:', customerId);
      
      const result = await Order.aggregate([
        {
          $match: {
            customerId: new mongoose.Types.ObjectId(customerId),
            status: { $in: ["completed", "delivered"] },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.menuItemId",
            name: { $first: "$items.name" },
            totalQuantity: { $sum: "$items.quantity" },
            totalSpent: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            lastOrderDate: { $max: "$orderDate" },
            orderCount: { $sum: 1 },
          },
        },
        // Join with reviews to get average rating (by menu item name)
        {
          $lookup: {
            from: "reviews",
            localField: "name",
            foreignField: "menuItemName",
            as: "reviews"
          }
        },
        // Calculate average rating
        {
          $addFields: {
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: "$reviews" }, 0] },
                then: { $avg: "$reviews.rating" },
                else: 0
              }
            },
            reviewCount: { $size: "$reviews" }
          }
        },
        // Filter: orderCount >= 1 AND (rating >= 3 OR no rating yet)
        {
          $match: {
            orderCount: { $gte: 1 },
            $or: [
              { averageRating: { $gte: 3 } },
              { reviewCount: 0 }
            ]
          }
        },
        // Additional filter: exclude items with low ratings (rating < 3)
        {
          $match: {
            $or: [
              { reviewCount: 0 }, // No rating yet
              { averageRating: { $gte: 3 } } // Good rating
            ],
            // Exclude items with low ratings
            $nor: [
              { 
                $and: [
                  { reviewCount: { $gt: 0 } },
                  { averageRating: { $lt: 3 } }
                ]
              }
            ]
          }
        },
        // Sort: prioritize items with good ratings, then by quantity and spending
        {
          $addFields: {
            sortPriority: {
              $cond: {
                if: { $and: [{ $gte: ["$averageRating", 3] }, { $gt: ["$reviewCount", 0] }] },
                then: 1, // High priority for items with rating >= 3
                else: 2  // Lower priority for items without rating
              }
            }
          }
        },
        { $sort: { sortPriority: 1, averageRating: -1, totalQuantity: -1, totalSpent: -1 } },
        { $limit: limit },
      ]);

      console.log('Customer favorite items result:', JSON.stringify(result, null, 2));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error getting customer favorite items:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get customer's personalized recommendations
  async getCustomerRecommendations(customerId) {
    try {
      // Get customer's favorite categories
      const favoriteCategories = await this.getCustomerFavoriteCategories(customerId);
      
      // Get top rated items in favorite categories
      const topRatedInCategories = await this.getTopRatedInCategories(favoriteCategories);
      
      // Get customer's favorite items
      const favoriteItems = await this.getCustomerFavoriteItems(customerId, 3);
      
      // Get trending items (most ordered recently)
      const trendingItems = await this.getTrendingItems(5);
      
      // Get new items customer hasn't tried
      const newItems = await this.getNewItemsForCustomer(customerId, 3);

      return {
        success: true,
        data: {
          favoriteItems: favoriteItems.data || [],
          topRatedInCategories: topRatedInCategories.data || [],
          trendingItems: trendingItems.data || [],
          newItems: newItems.data || [],
          favoriteCategories,
        },
      };
    } catch (error) {
      console.error("Error getting customer recommendations:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get top rated items across all categories (combining rating + order count)
  async getTopRatedItems(limit = 10, minReviews = 1) {
    try {
      console.log('Getting top rated items:', { limit, minReviews });
      
      // First, get review data
      const reviewData = await Review.aggregate([
        {
          $group: {
            _id: "$menuItemName",
            menuItemName: { $first: "$menuItemName" },
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: "$rating",
            },
          },
        },
        { $match: { totalReviews: { $gte: minReviews } } },
      ]);

      // Then, get order count data
      const orderData = await Order.aggregate([
        {
          $match: {
            status: { $in: ["completed", "delivered"] },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            menuItemName: { $first: "$items.name" },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
      ]);

      // Combine review and order data
      const combinedData = reviewData.map(review => {
        const orderInfo = orderData.find(order => order.menuItemName === review.menuItemName);
        return {
          ...review,
          totalOrders: orderInfo ? orderInfo.totalOrders : 0,
          totalQuantity: orderInfo ? orderInfo.totalQuantity : 0,
          totalRevenue: orderInfo ? orderInfo.totalRevenue : 0,
        };
      });

      // Sort by combined score: rating * order count
      const sortedData = combinedData
        .map(item => ({
          ...item,
          combinedScore: item.averageRating * item.totalOrders, // Rating * Popularity
        }))
        .sort((a, b) => {
          // Primary sort: combined score
          if (b.combinedScore !== a.combinedScore) {
            return b.combinedScore - a.combinedScore;
          }
          // Secondary sort: average rating
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          // Tertiary sort: total orders
          return b.totalOrders - a.totalOrders;
        })
        .slice(0, limit);

      // If no data found, return empty array with success
      if (!sortedData || sortedData.length === 0) {
        console.log('No data found matching criteria');
        return {
          success: true,
          data: [],
        };
      }

      // Add display formatting to results
      const enrichedResults = sortedData.map(item => ({
        ...item,
        starRating: this.generateStarRating(item.averageRating),
        ratingPercentage: Math.round((item.averageRating / 5) * 100),
      }));

      console.log('Top rated items result:', JSON.stringify(enrichedResults, null, 2));
      
      return {
        success: true,
        data: enrichedResults,
      };
    } catch (error) {
      console.error("Error getting top rated items:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update menu item ratings statistics
  async updateMenuItemRatings(menuItemId) {
    try {
      // Get all reviews for this menu item
      const reviews = await Review.find({ menuItemId });
      
      if (reviews.length === 0) {
        return { success: true, message: "No reviews found" };
      }

      // Calculate statistics
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      // Calculate rating distribution
      const distribution = {
        star5: reviews.filter(r => r.rating === 5).length,
        star4: reviews.filter(r => r.rating === 4).length,
        star3: reviews.filter(r => r.rating === 3).length,
        star2: reviews.filter(r => r.rating === 2).length,
        star1: reviews.filter(r => r.rating === 1).length,
      };

      // Update menu item via Menu Service API
      const updateData = {
        ratings: {
          average: Math.round(averageRating * 100) / 100,
          count: totalReviews,
          distribution,
        },
      };

      const response = await axios.put(
        `${this.menuServiceUrl}/api/menu-items/${menuItemId}/ratings`,
        updateData
      );

      return {
        success: true,
        data: {
          menuItemId,
          averageRating,
          totalReviews,
          distribution,
        },
      };
    } catch (error) {
      console.error("Error updating menu item ratings:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get customer's favorite categories
  async getCustomerFavoriteCategories(customerId) {
    try {
      const result = await Order.aggregate([
        {
          $match: {
            customerId: new mongoose.Types.ObjectId(customerId),
            status: { $in: ["completed", "delivered"] },
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menuitems",
            localField: "items.menuItemId",
            foreignField: "_id",
            as: "menuItem",
          },
        },
        { $unwind: "$menuItem" },
        {
          $group: {
            _id: "$menuItem.category",
            orderCount: { $sum: "$items.quantity" },
            totalSpent: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { orderCount: -1 } },
        { $limit: 3 },
      ]);

      return result.map(item => item._id).filter(Boolean);
    } catch (error) {
      console.error("Error getting customer favorite categories:", error);
      return [];
    }
  }

  // Get top rated items in specific categories
  async getTopRatedInCategories(categories, limit = 5) {
    try {
      if (categories.length === 0) {
        return { success: true, data: [] };
      }

      // Get menu items in these categories
      const menuItemsResponse = await axios.get(
        `${this.menuServiceUrl}/api/menu-items/categories/${categories.join(",")}`
      );

      if (!menuItemsResponse.data.success) {
        return { success: true, data: [] };
      }

      const menuItems = menuItemsResponse.data.data;
      const menuItemIds = menuItems.map(item => item._id);

      // Get top rated items from these categories
      const result = await Review.aggregate([
        { $match: { menuItemId: { $in: menuItemIds } } },
        {
          $group: {
            _id: "$menuItemId",
            menuItemName: { $first: "$menuItemName" },
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
        { $match: { totalReviews: { $gte: 3 } } },
        { $sort: { averageRating: -1, totalReviews: -1 } },
        { $limit: limit },
      ]);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error getting top rated in categories:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get trending items (most ordered recently)
  async getTrendingItems(limit = 5, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: cutoffDate },
            status: { $in: ["completed", "delivered"] },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.menuItemId",
            name: { $first: "$items.name" },
            recentOrders: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { recentOrders: -1, totalRevenue: -1 } },
        { $limit: limit },
      ]);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error getting trending items:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get new items customer hasn't tried
  async getNewItemsForCustomer(customerId, limit = 3) {
    try {
      // Get items customer has ordered
      const customerOrders = await Order.find({
        customerId: new mongoose.Types.ObjectId(customerId),
        status: { $in: ["completed", "delivered"] },
      });

      const orderedMenuItemIds = new Set();
      customerOrders.forEach(order => {
        order.items.forEach(item => {
          orderedMenuItemIds.add(item.menuItemId.toString());
        });
      });

      // Get new items from Menu Service
      const response = await axios.get(
        `${this.menuServiceUrl}/api/menu-items/new?limit=${limit}`
      );

      if (!response.data.success) {
        return { success: true, data: [] };
      }

      // Filter out items customer has already tried
      const newItems = response.data.data.filter(
        item => !orderedMenuItemIds.has(item._id)
      );

      return {
        success: true,
        data: newItems,
      };
    } catch (error) {
      console.error("Error getting new items for customer:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get menu items details from Menu Service
  async getMenuItemsDetails(menuItemIds) {
    try {
      const response = await axios.post(
        `${this.menuServiceUrl}/api/menu-items/batch`,
        { ids: menuItemIds }
      );

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error getting menu items details:", error);
      return [];
    }
  }

  // Generate star rating string
  generateStarRating(rating) {
    const stars = Math.round(rating);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  }

  // Get analytics dashboard data
  async getAnalyticsDashboard() {
    try {
      const [
        topRatedItems,
        trendingItems,
        totalReviews,
        averageRating,
      ] = await Promise.all([
        this.getTopRatedItems(10),
        this.getTrendingItems(10),
        Review.countDocuments(),
        Review.aggregate([
          { $group: { _id: null, avg: { $avg: "$rating" } } },
        ]),
      ]);

      return {
        success: true,
        data: {
          topRatedItems: topRatedItems.data || [],
          trendingItems: trendingItems.data || [],
          totalReviews,
          averageRating: averageRating[0]?.avg || 0,
        },
      };
    } catch (error) {
      console.error("Error getting analytics dashboard:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new AnalyticsService();
