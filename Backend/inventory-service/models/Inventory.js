const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  status: {
    type: String,
    enum: ["in-stock", "low-stock", "out-of-stock"],
    default: "in-stock"
  },
  note: { type: String },
  supplier: { type: String } // ✅ bổ sung trường nhà cung cấp
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model("Inventory", inventorySchema);