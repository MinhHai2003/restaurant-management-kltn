// Test script for guest checkout functionality
const axios = require("axios");

const BASE_URL = "http://localhost:5005/api/universal-cart";

async function testGuestCheckout() {
  try {
    console.log("🧪 Testing Guest Checkout Functionality\n");

    // 1. Test getting empty cart without authentication
    console.log("1. Testing get empty cart (no auth)...");
    const emptyCartResponse = await axios.get(`${BASE_URL}/`);
    console.log("✅ Empty cart response:", {
      success: emptyCartResponse.data.success,
      isGuest: emptyCartResponse.data.cart?.isGuest || "Not specified",
      customerId: emptyCartResponse.data.cart?.customerId,
      itemCount: emptyCartResponse.data.cart?.items?.length || 0,
    });

    // 2. Test adding item to cart without authentication
    console.log("\n2. Testing add item to cart (no auth)...");
    const addItemResponse = await axios.post(`${BASE_URL}/add`, {
      menuItemId: "670b78c2abc123456789abcd", // Mock menu item ID
      quantity: 2,
      customizations: "Extra spicy",
      notes: "Guest order test",
    });
    console.log("✅ Add item response:", {
      success: addItemResponse.data.success,
      isGuest: addItemResponse.data.isGuest,
      message: addItemResponse.data.message,
    });
  } catch (error) {
    if (error.response) {
      console.log("❌ Error response:", {
        status: error.response.status,
        message: error.response.data?.message || "Unknown error",
        errors: error.response.data?.errors || [],
      });
    } else {
      console.log("❌ Network error:", error.message);
    }
  }
}

async function testGuestCheckoutProcess() {
  try {
    console.log("\n🛒 Testing Full Guest Checkout Process\n");

    // Mock guest checkout with required info
    const guestCheckoutData = {
      guestInfo: {
        name: "Nguyễn Văn Guest",
        email: "guest@test.com",
        phone: "0987654321",
        address: {
          full: "123 Đường Test, Quận 1, TP.HCM",
          district: "Quận 1",
          city: "TP.HCM",
        },
      },
      payment: {
        method: "cash",
      },
      notes: {
        customer: "Đây là đơn hàng guest test",
      },
      delivery: {
        type: "delivery",
      },
    };

    console.log("Testing guest checkout with data:", {
      guestName: guestCheckoutData.guestInfo.name,
      guestEmail: guestCheckoutData.guestInfo.email,
      paymentMethod: guestCheckoutData.payment.method,
      deliveryType: guestCheckoutData.delivery.type,
    });

    const checkoutResponse = await axios.post(
      `${BASE_URL}/checkout`,
      guestCheckoutData
    );
    console.log("✅ Guest checkout response:", {
      success: checkoutResponse.data.success,
      message: checkoutResponse.data.message,
      orderNumber: checkoutResponse.data.order?.orderNumber,
    });
  } catch (error) {
    if (error.response) {
      console.log("❌ Checkout error:", {
        status: error.response.status,
        message: error.response.data?.message || "Unknown error",
        errors: error.response.data?.errors || [],
      });
    } else {
      console.log("❌ Network error:", error.message);
    }
  }
}

// Run tests
async function runAllTests() {
  await testGuestCheckout();
  await testGuestCheckoutProcess();
  console.log("\n✅ Guest checkout tests completed!");
}

runAllTests();
