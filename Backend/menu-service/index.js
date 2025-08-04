require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");

const app = express();
app.use(express.json());
connectDB();

const menuRoutes = require("./routes/menuRoutes");
app.use("/api/menu", menuRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 menu-service running on port ${PORT}`));
