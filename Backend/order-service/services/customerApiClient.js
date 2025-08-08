const axios = require("axios");

class CustomerApiClient {
  constructor() {
    this.baseURL = process.env.CUSTOMER_SERVICE_URL || "http://localhost:5002";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Get customer by ID
  async getCustomerById(customerId, token) {
    try {
      const response = await this.client.get("/api/customers/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data.customer;
    } catch (error) {
      console.error("Customer API Error:", error.message);
      throw new Error("Failed to fetch customer information");
    }
  }

  // Validate customer and get info
  async validateCustomer(customerId, token) {
    try {
      const customer = await this.getCustomerById(customerId, token);
      if (!customer || !customer.isActive) {
        throw new Error("Customer not found or inactive");
      }
      return {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints,
        membershipLevel: customer.membershipLevel,
        totalSpent: customer.totalSpent,
        addresses: customer.addresses,
      };
    } catch (error) {
      throw error;
    }
  }

  // Update customer loyalty points (after order completion)
  async updateLoyaltyPoints(customerId, orderTotal, token) {
    try {
      // Calculate points (1 point per 10,000 VND)
      const pointsEarned = Math.floor(orderTotal / 10000);

      const response = await this.client.put(
        "/api/customers/profile",
        {
          $inc: {
            loyaltyPoints: pointsEarned,
            totalSpent: orderTotal,
            totalOrders: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        pointsEarned,
        newTotal: response.data.data.customer.loyaltyPoints,
      };
    } catch (error) {
      console.error("Update loyalty points error:", error.message);
      throw error;
    }
  }

  // Get customer addresses
  async getCustomerAddresses(customerId, token) {
    try {
      const response = await this.client.get("/api/customers/addresses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data.addresses;
    } catch (error) {
      console.error("Get addresses error:", error.message);
      throw error;
    }
  }

  // Validate address belongs to customer
  async validateAddress(customerId, addressId, token) {
    try {
      const addresses = await this.getCustomerAddresses(customerId, token);
      const address = addresses.find(
        (addr) => addr._id.toString() === addressId
      );

      if (!address) {
        throw new Error("Address not found or does not belong to customer");
      }

      return address;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CustomerApiClient();
