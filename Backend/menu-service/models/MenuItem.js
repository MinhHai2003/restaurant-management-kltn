const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    available: { type: Boolean, default: true },
    image: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          // Kiểm tra URL hợp lệ hoặc path file hợp lệ
          return !v || /^(https?:\/\/|\/|[a-zA-Z]:\\)/.test(v);
        },
        message: "Image must be a valid URL or file path",
      },
    },
    imageAlt: {
      type: String,
      default: function () {
        return this.name || "Menu item image";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
