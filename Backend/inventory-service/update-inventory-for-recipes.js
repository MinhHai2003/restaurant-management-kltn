const mongoose = require("mongoose");

// Schema cho Inventory
const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "lít", "cái", "gói", "thùng", "hộp", "lon", "gram"],
    },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "in-stock",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["thịt-cá", "rau-củ-quả", "gia-vị", "bánh-mì", "đồ-uống", "khác"],
    },
    expiryDate: {
      type: Date,
    },
    minimumStock: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model("Inventory", inventorySchema);

// Danh sách nguyên liệu cần thiết từ recipes
const requiredIngredients = [
  // Thịt cá
  {
    name: "Cá Lăng Đang Bơi",
    quantity: 100,
    unit: "kg",
    price: 350000,
    supplier: "Chợ Hải Sản Bình Điền",
    category: "thịt-cá",
  },
  {
    name: "Cá Tra Phi Lê",
    quantity: 50,
    unit: "kg",
    price: 180000,
    supplier: "Chợ Hải Sản Bình Điền",
    category: "thịt-cá",
  },
  {
    name: "Tôm Sú Tươi",
    quantity: 80,
    unit: "kg",
    price: 450000,
    supplier: "Chợ Hải Sản Bình Điền",
    category: "thịt-cá",
  },
  {
    name: "Mực Ống Tươi",
    quantity: 30,
    unit: "kg",
    price: 280000,
    supplier: "Chợ Hải Sản Bình Điền",
    category: "thịt-cá",
  },
  {
    name: "Cua Biển",
    quantity: 20,
    unit: "kg",
    price: 320000,
    supplier: "Chợ Hải Sản Bình Điền",
    category: "thịt-cá",
  },
  {
    name: "Thịt Bò Tái",
    quantity: 40,
    unit: "kg",
    price: 380000,
    supplier: "Chợ Thịt An Phú",
    category: "thịt-cá",
  },
  {
    name: "Thịt Gà",
    quantity: 35,
    unit: "kg",
    price: 85000,
    supplier: "Chợ Thịt An Phú",
    category: "thịt-cá",
  },
  {
    name: "Thịt Ba Chỉ",
    quantity: 25,
    unit: "kg",
    price: 180000,
    supplier: "Chợ Thịt An Phú",
    category: "thịt-cá",
  },
  {
    name: "Sườn Heo",
    quantity: 30,
    unit: "kg",
    price: 165000,
    supplier: "Chợ Thịt An Phú",
    category: "thịt-cá",
  },
  {
    name: "Thịt Nướng",
    quantity: 15,
    unit: "kg",
    price: 200000,
    supplier: "Chợ Thịt An Phú",
    category: "thịt-cá",
  },
  {
    name: "Tôm Khô",
    quantity: 5,
    unit: "kg",
    price: 650000,
    supplier: "Chợ Khô Hạt Điều",
    category: "thịt-cá",
  },

  // Rau củ quả
  {
    name: "Hành Tây",
    quantity: 100,
    unit: "kg",
    price: 12000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Hành Lá",
    quantity: 30,
    unit: "kg",
    price: 18000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Cà Chua",
    quantity: 50,
    unit: "kg",
    price: 25000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Cà Rốt",
    quantity: 40,
    unit: "kg",
    price: 15000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Khoai Tây",
    quantity: 60,
    unit: "kg",
    price: 20000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Khoai Môn",
    quantity: 25,
    unit: "kg",
    price: 35000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Thơm",
    quantity: 40,
    unit: "kg",
    price: 45000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Cam Tươi",
    quantity: 100,
    unit: "kg",
    price: 35000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Dưa Leo",
    quantity: 30,
    unit: "kg",
    price: 12000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Ngò Gai",
    quantity: 10,
    unit: "kg",
    price: 40000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Giá Đỗ",
    quantity: 20,
    unit: "kg",
    price: 8000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Xà Lách",
    quantity: 15,
    unit: "kg",
    price: 25000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Đậu Bắp",
    quantity: 25,
    unit: "kg",
    price: 18000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Đậu Hà Lan",
    quantity: 20,
    unit: "kg",
    price: 55000,
    supplier: "Chợ Rau Củ Sài Gòn",
    category: "rau-củ-quả",
  },
  {
    name: "Đậu Xanh",
    quantity: 15,
    unit: "kg",
    price: 45000,
    supplier: "Chợ Khô Hạt Điều",
    category: "rau-củ-quả",
  },

  // Gia vị, nước mắm, dầu ăn
  {
    name: "Muối Biển",
    quantity: 30,
    unit: "kg",
    price: 15000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },
  {
    name: "Dầu Ăn",
    quantity: 50,
    unit: "lít",
    price: 45000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },
  {
    name: "Nước Mắm",
    quantity: 30,
    unit: "lít",
    price: 85000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },
  {
    name: "Nước Cốt Dừa",
    quantity: 200,
    unit: "hộp",
    price: 18000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },
  {
    name: "Tỏi",
    quantity: 25,
    unit: "kg",
    price: 85000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },
  {
    name: "Ớt",
    quantity: 15,
    unit: "kg",
    price: 95000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },
  {
    name: "Sả",
    quantity: 10,
    unit: "kg",
    price: 35000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },
  {
    name: "Me",
    quantity: 8,
    unit: "kg",
    price: 65000,
    supplier: "Cửa Hàng Gia Vị Sài Gòn",
    category: "gia-vị",
  },

  // Bánh mì, bún, mì
  {
    name: "Bánh Mì",
    quantity: 500,
    unit: "cái",
    price: 5000,
    supplier: "Lò Bánh Mì Hương Lan",
    category: "bánh-mì",
  },
  {
    name: "Bánh Phở",
    quantity: 100,
    unit: "kg",
    price: 35000,
    supplier: "Xưởng Bánh Phở Tân Phú",
    category: "bánh-mì",
  },
  {
    name: "Bánh Tráng",
    quantity: 50,
    unit: "kg",
    price: 45000,
    supplier: "Xưởng Bánh Tráng Tây Ninh",
    category: "bánh-mì",
  },
  {
    name: "Bún Tươi",
    quantity: 30,
    unit: "kg",
    price: 25000,
    supplier: "Xưởng Bún Tươi Bình Tây",
    category: "bánh-mì",
  },
  {
    name: "Mì Quảng Khô",
    quantity: 40,
    unit: "kg",
    price: 55000,
    supplier: "Xưởng Mì Quảng Hội An",
    category: "bánh-mì",
  },
  {
    name: "Cơm Tấm",
    quantity: 200,
    unit: "kg",
    price: 28000,
    supplier: "Kho Gạo Minh Tâm",
    category: "bánh-mì",
  },

  // Trứng và thực phẩm khác
  {
    name: "Trứng Gà",
    quantity: 1000,
    unit: "cái",
    price: 3500,
    supplier: "Trại Gà Đông Anh",
    category: "thịt-cá",
  },
  {
    name: "Xúc Xích",
    quantity: 20,
    unit: "kg",
    price: 125000,
    supplier: "Xưởng Xúc Xích Việt Sin",
    category: "thịt-cá",
  },
  {
    name: "Pate",
    quantity: 10,
    unit: "kg",
    price: 180000,
    supplier: "Cửa Hàng Pate Minh Châu",
    category: "thịt-cá",
  },

  // Đồ uống
  {
    name: "Trà",
    quantity: 5,
    unit: "kg",
    price: 350000,
    supplier: "Cửa Hàng Trà Tân Cương",
    category: "đồ-uống",
  },
  {
    name: "Đá Lạnh",
    quantity: 500,
    unit: "kg",
    price: 8000,
    supplier: "Xưởng Đá Lạnh Sài Gòn",
    category: "đồ-uống",
  },
];

async function updateInventoryWithRecipeIngredients() {
  try {
    console.log("🔄 Đang kết nối MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/inventory-db"
    );
    console.log("✅ Đã kết nối MongoDB\n");

    console.log("🧹 Xóa toàn bộ inventory cũ...");
    await Inventory.deleteMany({});
    console.log("✅ Đã xóa inventory cũ\n");

    console.log("📦 Đang thêm nguyên liệu mới...\n");

    for (const ingredient of requiredIngredients) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 ngày sau

      const newItem = new Inventory({
        ...ingredient,
        expiryDate: expiryDate,
        minimumStock: Math.round(ingredient.quantity * 0.2), // 20% của số lượng hiện tại
      });

      await newItem.save();
      console.log(
        `✅ Thêm: ${ingredient.name} (${ingredient.quantity} ${ingredient.unit})`
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 CÂP NHẬT INVENTORY THÀNH CÔNG!");
    console.log("=".repeat(60));
    console.log(`📦 Đã thêm ${requiredIngredients.length} nguyên liệu`);
    console.log("📊 Phân loại:");

    const categories = {};
    requiredIngredients.forEach((item) => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} items`);
    });

    console.log(
      "\n💡 Bây giờ có thể chạy lại check-recipe-inventory-match.js để kiểm tra!"
    );

    await mongoose.connection.close();
    console.log("📦 Đã đóng kết nối database");
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// Chạy cập nhật
if (require.main === module) {
  updateInventoryWithRecipeIngredients();
}

module.exports = { updateInventoryWithRecipeIngredients, requiredIngredients };
