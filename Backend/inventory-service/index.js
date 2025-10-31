require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Trust proxy for Railway
app.set('trust proxy', true);

// CORS configuration - allow Vercel deployments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Vercel deployments (all *.vercel.app domains)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins for now (can restrict later)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

const inventoryRoutes = require("./routes/inventoryRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/inventory", inventoryRoutes);
app.use("/api/admin/inventory", adminRoutes);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`📦 Inventory Service running on port ${PORT}`);
});
