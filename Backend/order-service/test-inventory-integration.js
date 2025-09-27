const axios = require("axios");

// Test configuration
const ORDER_SERVICE_URL = "http://localhost:5005";
const INVENTORY_SERVICE_URL = "http://localhost:5004";

// Test data
const testOrderItems = [
  { name: "Cơm Chiên Hải Sản", quantity: 2 },
  { name: "Phở Bò Tái", quantity: 1 },
  { name: "Tôm Nướng Muối Ớt", quantity: 1 },
];

async function testInventoryIntegration() {
  try {
    console.log("🧪 Testing Menu-Inventory Integration System");
    console.log("=".repeat(50));

    // 1. Kiểm tra recipes có tồn tại không
    console.log("\n1️⃣ Testing Recipe System...");
    try {
      const recipeResponse = await axios.get(
        `${ORDER_SERVICE_URL}/api/inventory-test/recipes`
      );
      console.log(`✅ Found ${recipeResponse.data.totalMenuItems} recipes`);

      // Show first few recipes
      const recipes = recipeResponse.data.recipes;
      const firstRecipes = Object.keys(recipes).slice(0, 3);
      for (const menuItem of firstRecipes) {
        console.log(
          `   📋 ${menuItem}: ${recipes[menuItem].ingredients.length} ingredients`
        );
      }
    } catch (error) {
      console.log(`❌ Recipe system error: ${error.message}`);
      return;
    }

    // 2. Kiểm tra inventory service
    console.log("\n2️⃣ Testing Inventory Service...");
    try {
      const inventoryResponse = await axios.get(
        `${INVENTORY_SERVICE_URL}/api/inventory`
      );
      const inventoryItems = Array.isArray(inventoryResponse.data)
        ? inventoryResponse.data
        : inventoryResponse.data.data || [];
      console.log(`✅ Found ${inventoryItems.length} inventory items`);

      // Show some inventory items
      const sampleItems = inventoryItems.slice(0, 5);
      for (const item of sampleItems) {
        console.log(
          `   📦 ${item.name}: ${item.quantity} ${
            item.unit
          } - ${item.price?.toLocaleString()} VNĐ`
        );
      }
    } catch (error) {
      console.log(`❌ Inventory service error: ${error.message}`);
      return;
    }

    // 3. Test stock checking
    console.log("\n3️⃣ Testing Stock Checking...");
    console.log(`Testing with orders:`, testOrderItems);
    try {
      const stockResponse = await axios.post(
        `${ORDER_SERVICE_URL}/api/inventory-test/check-menu-stock`,
        {
          orderItems: testOrderItems,
        }
      );

      console.log(`✅ Stock check completed`);
      console.log(
        `   All items available: ${stockResponse.data.data.allAvailable}`
      );

      for (const item of stockResponse.data.data.items) {
        console.log(
          `   🍽️ ${item.menuItem} (${item.orderQuantity}x): ${
            item.available ? "✅" : "❌"
          }`
        );
        if (!item.available) {
          const unavailableIngredients = item.ingredients.filter(
            (ing) => !ing.available
          );
          for (const ing of unavailableIngredients) {
            console.log(`      ⚠️ ${ing.ingredientName}: ${ing.reason}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Stock checking error: ${error.message}`);
      return;
    }

    // 4. Test inventory reduction (WARNING: This will actually reduce inventory!)
    console.log("\n4️⃣ Testing Inventory Reduction...");
    console.log("⚠️  WARNING: This will actually reduce inventory quantities!");
    console.log("   Testing with small quantities...");

    const smallTestOrder = [
      { name: "Trà Đá", quantity: 1 }, // Simple item with minimal ingredients
    ];

    try {
      const reductionResponse = await axios.post(
        `${ORDER_SERVICE_URL}/api/inventory-test/test-reduce`,
        {
          orderItems: smallTestOrder,
        }
      );

      console.log(`✅ Inventory reduction test completed`);
      console.log(
        `   Reduction results:`,
        reductionResponse.data.reductionResult.results.length,
        "items processed"
      );

      for (const result of reductionResponse.data.reductionResult.results) {
        console.log(`   🍽️ ${result.menuItem}: ${result.status}`);
        for (const ing of result.ingredients) {
          if (ing.status === "reduced") {
            console.log(
              `      ✅ ${ing.ingredientName}: ${ing.oldQuantity} → ${ing.newQuantity} ${ing.unit}`
            );
          } else {
            console.log(`      ⚠️ ${ing.ingredientName}: ${ing.status}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Inventory reduction error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Error details:`, error.response.data);
      }
    }

    console.log("\n🎉 Integration Test Completed!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response?.data) {
      console.log("Error response:", error.response.data);
    }
  }
}

// Run test if called directly
if (require.main === module) {
  testInventoryIntegration();
}

module.exports = { testInventoryIntegration };
