const axios = require("axios");

class InventoryApiClient {
  constructor() {
    this.baseURL = process.env.INVENTORY_SERVICE_URL || "http://localhost:5004";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Check stock availability by item name
  async checkItemStockByName(itemName, quantity) {
    try {
      // Get all inventory items và tìm by name
      const response = await this.client.get("/api/inventory");
      const inventoryItems = response.data;

      const item = inventoryItems.find((inv) => inv.name === itemName);

      if (!item) {
        return {
          itemName,
          available: false,
          currentStock: 0,
          requestedQuantity: quantity,
          isActive: false,
          error: "Item not found in inventory",
        };
      }

      return {
        itemName,
        available: item.quantity >= quantity,
        currentStock: item.quantity,
        requestedQuantity: quantity,
        isActive: item.status === "in-stock",
      };
    } catch (error) {
      console.error("Check stock error:", error.message);
      return {
        itemName,
        available: false,
        currentStock: 0,
        requestedQuantity: quantity,
        isActive: false,
        error: "Error checking inventory",
      };
    }
  }

  // Check stock for multiple items
  async checkOrderStock(orderItems) {
    try {
      const stockChecks = [];
      const unavailableItems = [];

      for (const item of orderItems) {
        const stockInfo = await this.checkItemStockByName(
          item.name,
          item.quantity
        );
        stockChecks.push(stockInfo);

        if (!stockInfo.available || !stockInfo.isActive) {
          unavailableItems.push({
            itemId: item.menuItemId,
            name: item.name,
            requestedQuantity: item.quantity,
            availableStock: stockInfo.currentStock,
            reason: !stockInfo.isActive
              ? "Item inactive"
              : "Insufficient stock",
          });
        }
      }

      return {
        allAvailable: unavailableItems.length === 0,
        stockChecks,
        unavailableItems,
      };
    } catch (error) {
      console.error("Check order stock error:", error.message);
      throw error;
    }
  }

  // Reserve stock for order (reduce quantity immediately)
  async reserveStock(orderItems, orderId) {
    try {
      const reservations = [];

      for (const item of orderItems) {
        // Get current inventory
        const inventoryResponse = await this.client.get("/api/inventory");
        const inventoryItems = Array.isArray(inventoryResponse.data)
          ? inventoryResponse.data
          : [inventoryResponse.data];
        const inventoryItem = inventoryItems.find(
          (inv) => inv.name === item.name
        );

        if (!inventoryItem) {
          throw new Error(`Inventory item "${item.name}" not found`);
        }

        // Calculate new quantity
        const newQuantity = inventoryItem.quantity - item.quantity;

        if (newQuantity < 0) {
          throw new Error(`Insufficient stock for "${item.name}"`);
        }

        // Update inventory quantity
        const updateResponse = await this.client.put(
          `/api/inventory/${inventoryItem._id}`,
          {
            quantity: newQuantity,
            note: `Reduced by order ${orderId}: -${item.quantity}`,
          }
        );

        reservations.push({
          itemId: item.menuItemId,
          inventoryId: inventoryItem._id,
          quantity: item.quantity,
          previousQuantity: inventoryItem.quantity,
          newQuantity: newQuantity,
        });
      }

      return {
        success: true,
        reservations,
      };
    } catch (error) {
      console.error("Reserve stock error:", error.message);
      throw new Error("Failed to reserve stock for order");
    }
  }

  // Confirm stock reduction (already reduced in reserveStock)
  async confirmStockReduction(orderItems, orderId) {
    try {
      // Stock already reduced in reserveStock, just return success
      console.log(`Stock reduction confirmed for order ${orderId}`);
      return {
        success: true,
        message: "Stock reduction already applied during reservation",
      };
    } catch (error) {
      console.error("Confirm stock reduction error:", error.message);
      throw error;
    }
  }

  // Release reserved stock (when order is cancelled)
  async releaseReservedStock(orderItems, orderId) {
    try {
      const releases = [];

      for (const item of orderItems) {
        try {
          // Find the inventory item by name
          const itemsResponse = await this.client.get("/api/inventory");
          const inventoryItems = Array.isArray(itemsResponse.data)
            ? itemsResponse.data
            : itemsResponse.data.data || [];

          const inventoryItem = inventoryItems.find(
            (inv) =>
              inv.name &&
              inv.name.toLowerCase() === item.menuItemId.toLowerCase()
          );

          if (!inventoryItem) {
            console.warn(`Inventory item not found for ${item.menuItemId}`);
            continue;
          }

          // Increase quantity back (release the reserved stock)
          const newQuantity = inventoryItem.quantity + item.quantity;

          await this.client.put(`/api/inventory/${inventoryItem._id}`, {
            name: inventoryItem.name,
            quantity: newQuantity,
            unit: inventoryItem.unit,
            minQuantity: inventoryItem.minQuantity,
          });

          releases.push({
            itemId: item.menuItemId,
            quantity: item.quantity,
            released: true,
          });
        } catch (itemError) {
          console.error(
            `Failed to release stock for ${item.menuItemId}:`,
            itemError.message
          );
          releases.push({
            itemId: item.menuItemId,
            quantity: item.quantity,
            released: false,
            error: itemError.message,
          });
        }
      }

      return {
        success: true,
        releases,
      };
    } catch (error) {
      console.error("Release stock error:", error.message);
      // Log error but don't throw - cancellation should still proceed
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get low stock alerts
  async getLowStockItems() {
    try {
      const response = await this.client.get("/api/inventory");
      const inventoryItems = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      // Filter items where quantity is less than minQuantity
      const lowStockItems = inventoryItems.filter(
        (item) => item.quantity <= (item.minQuantity || 10)
      );

      return lowStockItems;
    } catch (error) {
      console.error("Get low stock items error:", error.message);
      return [];
    }
  }

  // Get inventory report for specific items
  async getInventoryReport(itemIds) {
    try {
      const response = await this.client.get("/api/inventory");
      const inventoryItems = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      // Filter items by itemIds if provided
      let reportItems = inventoryItems;
      if (itemIds && itemIds.length > 0) {
        reportItems = inventoryItems.filter((item) =>
          itemIds.some(
            (id) => item.name && item.name.toLowerCase() === id.toLowerCase()
          )
        );
      }

      return {
        items: reportItems,
        total: reportItems.length,
        lowStock: reportItems.filter(
          (item) => item.quantity <= (item.minQuantity || 10)
        ).length,
      };
    } catch (error) {
      console.error("Get inventory report error:", error.message);
      return null;
    }
  }
}

module.exports = new InventoryApiClient();
