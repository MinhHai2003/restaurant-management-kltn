require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Connect to database
connectDB();

// Routes
const menuRoutes = require("./routes/menuRoutes");
app.use("/api/menu", menuRoutes);

// Debug route để test config
app.get("/api/debug/cloudinary", (req, res) => {
  res.json({
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY?.substring(0, 5) + "...",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("❌ Global error handler:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
  });

  // Multer errors
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large",
      error: "Maximum file size is 10MB",
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      message: "Unexpected file field",
      error: 'Only "image" field is allowed',
    });
  }

  // Cloudinary errors
  if (error.message && error.message.includes("cloudinary")) {
    return res.status(500).json({
      message: "Image upload service error",
      error: error.message,
    });
  }

  // Default error
  res.status(500).json({
    message: "Internal server error",
    error: error.message || "Unknown error",
    details: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`🚀 menu-service running on port ${PORT}`));
