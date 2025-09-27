const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "lít", "cái", "gói", "thùng", "hộp", "lon", "gram"],
    },
    price: { type: Number, required: true }, // ✅ giá của nguyên liệu (VNĐ)
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "in-stock",
    },
    note: { type: String },
    supplier: { type: String, required: true }, // ✅ nhà cung cấp
    category: {
      type: String,
      required: true,
      enum: ["thịt-cá", "rau-củ-quả", "gia-vị", "bánh-mì", "đồ-uống", "khác"],
    },
    expiryDate: { type: Date },
    minimumStock: { type: Number, default: 10 },
    updated_by_admin: { type: String }, // Track admin updates
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);
