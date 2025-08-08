require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");

const app = express();
app.use(express.json());

connectDB();

const inventoryRoutes = require("./routes/inventoryRoutes");
app.use("/api/inventory", inventoryRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`📦 Inventory Service running on port ${PORT}`);
});
