const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Customer Database connected!");
  } catch (error) {
    console.error("❌ Customer Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
