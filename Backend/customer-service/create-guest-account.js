const mongoose = require("mongoose");
require("dotenv").config();

// Define Customer schema (copy from customer-service)
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },
    addresses: [
      {
        label: {
          type: String,
          default: "Nhà",
        },
        address: {
          type: String,
          required: true,
        },
        district: String,
        city: String,
        phone: {
          type: String,
          required: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isGuest: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

const createGuestAccount = async () => {
  try {
    // Connect to customer database
    await mongoose.connect("mongodb://localhost:27017/restaurant_customers");

    console.log("Connected to customer database");

    // Check if guest account already exists
    const existingGuest = await Customer.findOne({
      email: "guest@restaurant.com",
    });

    if (existingGuest) {
      console.log("Guest account already exists:");
      console.log("  - ID:", existingGuest._id);
      console.log("  - Name:", existingGuest.name);
      console.log("  - Email:", existingGuest.email);
      return existingGuest._id;
    }

    // Create guest account
    const guestCustomer = new Customer({
      name: "Guest Customer",
      email: "guest@restaurant.com",
      phone: "0000000000",
      password: "guest123456", // Will be hashed
      isGuest: true,
      isVerified: true,
      addresses: [
        {
          label: "Mặc định",
          address: "Sẽ được cung cấp khi đặt hàng",
          district: "TBD",
          city: "TBD",
          phone: "0000000000",
          isDefault: true,
        },
      ],
    });

    await guestCustomer.save();
    console.log("✅ Guest account created successfully:");
    console.log("  - ID:", guestCustomer._id);
    console.log("  - Name:", guestCustomer.name);
    console.log("  - Email:", guestCustomer.email);

    return guestCustomer._id;
  } catch (error) {
    console.error("❌ Error creating guest account:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
};

// Run the script
createGuestAccount()
  .then((guestId) => {
    console.log("\n🎉 Guest Customer ID:", guestId);
    console.log("You can now use this ID for guest orders");
    console.log("\nNext steps:");
    console.log("1. Add this ID to your environment variables");
    console.log("2. Update cart/order controllers to use guest account");
  })
  .catch((error) => {
    console.error("Failed to create guest account:", error);
    process.exit(1);
  });
