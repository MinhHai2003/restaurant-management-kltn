const axios = require("axios");

class MenuApiClient {
  constructor() {
    this.baseURL = process.env.MENU_SERVICE_URL || "http://localhost:5003";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Get menu item by ID
  async getMenuItemById(itemId) {
    try {
      const response = await this.client.get(`/api/menu/${itemId}`);
      return response.data; // Menu Service trả về data trực tiếp
    } catch (error) {
      console.error("Menu API Error:", error.message);
      if (error.response?.status === 404) {
        throw new Error("Menu item not found");
      }
      throw new Error("Failed to fetch menu item");
    }
  }

  // Alias for getMenuItemById (for cart controller compatibility)
  async getMenuItem(itemId) {
    return this.getMenuItemById(itemId);
  }

  // Get multiple menu items
  async getMenuItems(itemIds) {
    try {
      const promises = itemIds.map((id) => this.getMenuItemById(id));
      const items = await Promise.all(promises);
      return items;
    } catch (error) {
      throw error;
    }
  }

  // Validate menu items and get pricing
  async validateOrderItems(orderItems) {
    try {
      const validatedItems = [];
      let totalPrice = 0;

      for (const orderItem of orderItems) {
        const menuItem = await this.getMenuItemById(orderItem.menuItemId);

        // Check if item is available
        if (!menuItem.available) {
          throw new Error(
            `Menu item "${menuItem.name}" is currently unavailable`
          );
        }

        // Validate quantity
        if (orderItem.quantity < 1) {
          throw new Error(`Invalid quantity for "${menuItem.name}"`);
        }

        // Calculate item total
        const itemTotal = menuItem.price * orderItem.quantity;
        totalPrice += itemTotal;

        validatedItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: orderItem.quantity,
          customizations: orderItem.customizations || "",
          notes: orderItem.notes || "",
          category: menuItem.category,
          image: menuItem.image,
          itemTotal,
        });
      }

      return {
        items: validatedItems,
        subtotal: totalPrice,
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if items require age verification
  async checkAgeRestriction(itemIds) {
    try {
      const items = await this.getMenuItems(itemIds);
      return items.some((item) => item.requiresAge18 === true);
    } catch (error) {
      console.error("Age restriction check error:", error.message);
      return false;
    }
  }

  // Get menu categories
  async getCategories() {
    try {
      const response = await this.client.get("/api/menu/categories");
      return response.data.data.categories;
    } catch (error) {
      console.error("Get categories error:", error.message);
      return [];
    }
  }

  // Search menu items
  async searchItems(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        search: query,
        ...filters,
      });

      const response = await this.client.get(`/api/menu/search?${params}`);
      return response.data.data.items;
    } catch (error) {
      console.error("Search items error:", error.message);
      return [];
    }
  }
}

module.exports = new MenuApiClient();
