require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Trust proxy (required for Railway/reverse proxy)
app.set('trust proxy', true);

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3001",
        process.env.FRONTEND_URL,
        "https://my-restaurant-app-six.vercel.app",
        "https://my-restaurant-b93364dpn-vinh-lois-projects.vercel.app",
      ].filter(Boolean);
      
      // Allow all Vercel deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Default: deny
      callback(new Error('Not allowed by CORS'));
    },
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

// Health check route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Menu Service is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
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
