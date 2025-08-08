const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Order Database connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Order Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
