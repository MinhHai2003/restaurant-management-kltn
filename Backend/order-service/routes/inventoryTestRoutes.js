const express = require("express");
const router = express.Router();
const inventoryApiClient = require("../services/inventoryApiClient");

// 🔍 Kiểm tra stock availability cho menu items
router.post("/check-menu-stock", async (req, res) => {
  try {
    const { orderItems } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // Validate orderItems format
    for (const item of orderItems) {
      if (
        !item.name ||
        !item.quantity ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Each item must have name and positive quantity",
        });
      }
    }

    console.log("🔍 Checking menu stock for:", orderItems);

    const stockCheck = await inventoryApiClient.checkMenuItemsStock(orderItems);

    res.json({
      success: true,
      data: stockCheck,
    });
  } catch (error) {
    console.error("Error checking menu stock:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check menu stock",
      error: error.message,
    });
  }
});

// 🍽️ Test inventory reduction cho menu items (for testing purposes)
router.post("/test-reduce", async (req, res) => {
  try {
    const { orderItems } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    console.log("🧪 Testing inventory reduction for:", orderItems);

    // Kiểm tra stock trước
    const stockCheck = await inventoryApiClient.checkMenuItemsStock(orderItems);

    if (!stockCheck.allAvailable) {
      return res.status(400).json({
        success: false,
        message: "Some ingredients are not available",
        stockCheck,
      });
    }

    // Thực hiện reduction
    const reductionResult = await inventoryApiClient.reduceInventoryByMenuItems(
      orderItems
    );

    res.json({
      success: true,
      message: "Inventory reduction test completed",
      stockCheck,
      reductionResult,
    });
  } catch (error) {
    console.error("Error testing inventory reduction:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to test inventory reduction",
      error: error.message,
    });
  }
});

// 📋 Lấy recipe information cho menu item từ database
router.get("/recipe/:menuItemName", async (req, res) => {
  try {
    const { menuItemName } = req.params;

    // Sử dụng inventoryApiClient để lấy recipe từ database
    const recipe = await inventoryApiClient.getMenuItemRecipe(menuItemName);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: `Recipe not found for menu item: ${menuItemName}`,
      });
    }

    res.json({
      success: true,
      menuItem: menuItemName,
      recipe,
    });
  } catch (error) {
    console.error("Error getting recipe:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get recipe",
      error: error.message,
    });
  }
});

// 📋 Lấy tất cả recipes từ database
router.get("/recipes", async (req, res) => {
  try {
    // Lấy tất cả menu items từ menu service
    const axios = require("axios");
    const menuServiceURL =
      process.env.MENU_SERVICE_URL || "http://localhost:5003";
    const response = await axios.get(`${menuServiceURL}/api/menu`);
    const menuItems = response.data;

    // Filter chỉ những items có ingredients
    const itemsWithRecipes = menuItems.filter(
      (item) => item.ingredients && item.ingredients.length > 0
    );

    const recipes = {};
    itemsWithRecipes.forEach((item) => {
      recipes[item.name] = { ingredients: item.ingredients };
    });

    res.json({
      success: true,
      recipes: recipes,
      totalMenuItems: Object.keys(recipes).length,
    });
  } catch (error) {
    console.error("Error getting all recipes:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get recipes",
      error: error.message,
    });
  }
});

module.exports = router;
