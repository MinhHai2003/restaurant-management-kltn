require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true,
  })
);

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
