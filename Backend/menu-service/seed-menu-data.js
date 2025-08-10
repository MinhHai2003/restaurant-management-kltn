const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");
require("dotenv").config();

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_menu"
    );
    console.log("📦 Connected to MongoDB");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

// Dữ liệu menu từ website Hải Sản Biển Đông
const menuData = [
  // HẢI SẢN TƯƠI SỐNG - CÁ
  {
    name: "Cá Mú Cọp",
    description: "Cá mú cọp tươi sống (1-5kg/con)",
    price: 269000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500&h=300&fit=crop",
    imageAlt: "Cá mú cọp tươi sống"
  },
  {
    name: "Cá Lăng Đang Bơi",
    description: "Cá lăng tươi sống đang bơi",
    price: 128000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1574781330855-d0db3225c3f0?w=500&h=300&fit=crop",
    imageAlt: "Cá lăng tươi sống đang bơi"
  },
  {
    name: "Cá Chép Giòn Đang Bơi",
    description: "Cá chép giòn tươi sống đang bơi",
    price: 228000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500&h=300&fit=crop",
    imageAlt: "Cá chép giòn tươi sống"
  },
  {
    name: "Cá Tầm Sapa Đang Bơi",
    description: "Cá tầm Sapa tươi sống đang bơi",
    price: 269000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1574781330855-d0db3225c3f0?w=500&h=300&fit=crop",
    imageAlt: "Cá tầm Sapa tươi sống"
  },
  {
    name: "Cá Hồi Sapa Đang Bơi",
    description: "Cá hồi Sapa tươi sống đang bơi",
    price: 389000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1499125562588-29fb8a56b4d1?w=500&h=300&fit=crop",
    imageAlt: "Cá hồi Sapa tươi sống"
  },
  {
    name: "Cá Chình Đang Bơi",
    description: "Cá chình tươi sống đang bơi",
    price: 389000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500&h=300&fit=crop",
    imageAlt: "Cá chình tươi sống"
  },
  {
    name: "Cá Bơn Oliver Đang Bơi",
    description: "Cá bơn Oliver tươi sống đang bơi",
    price: 849000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1574781330855-d0db3225c3f0?w=500&h=300&fit=crop",
    imageAlt: "Cá bơn Oliver tươi sống"
  },

  // HẢI SẢN TƯƠI SỐNG - TÔM
  {
    name: "Bọ Biển",
    description: "Bọ biển tươi sống",
    price: 1499000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=300&fit=crop",
    imageAlt: "Bọ biển tươi sống"
  },
  {
    name: "Tôm Hùm Bông Đang Bơi",
    description: "Tôm hùm bông tươi sống đang bơi (500-700g/con)",
    price: 1399000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=300&fit=crop",
    imageAlt: "Tôm hùm bông tươi sống"
  },
  {
    name: "Tôm Hùm Bông Size Lớn",
    description: "Tôm hùm bông size 0.7-0.9kg/con",
    price: 1599000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=300&fit=crop",
    imageAlt: "Tôm hùm bông size lớn"
  },
  {
    name: "Bề Bề To",
    description: "Bề bề to (9-12 con/kg)",
    price: 499000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=300&fit=crop",
    imageAlt: "Bề bề to tươi sống"
  },
  {
    name: "Tôm Sú",
    description: "Tôm sú (29-33 con/kg)",
    price: 399000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1563897538399-e47f071fd19a?w=500&h=300&fit=crop",
    imageAlt: "Tôm sú tươi sống"
  },
  {
    name: "Tôm Sú To",
    description: "Tôm sú to (24-28 con/kg)",
    price: 449000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1563897538399-e47f071fd19a?w=500&h=300&fit=crop",
    imageAlt: "Tôm sú to"
  },
  {
    name: "Tôm Sú Đại",
    description: "Tôm sú đại (18-23 con/kg)",
    price: 499000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1563897538399-e47f071fd19a?w=500&h=300&fit=crop",
    imageAlt: "Tôm sú đại"
  },
  {
    name: "Tôm Alaska Đang Bơi",
    description: "Tôm Alaska tươi sống đang bơi (1-5kg/con)",
    price: 999000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=300&fit=crop",
    imageAlt: "Tôm Alaska tươi sống"
  },

  // HẢI SẢN TƯƠI SỐNG - CUA GHẸ
  {
    name: "Cua Alaska Đỏ",
    description: "Cua Alaska đỏ (2-4kg/con)",
    price: 2899000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&h=300&fit=crop",
    imageAlt: "Cua Alaska đỏ tươi sống"
  },
  {
    name: "Cua Tuyết",
    description: "Cua tuyết tươi sống",
    price: 1299000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&h=300&fit=crop",
    imageAlt: "Cua tuyết tươi sống"
  },

  // HẢI SẢN TƯƠI SỐNG - NGAO SÒ ỐC
  {
    name: "Ngao Hoa",
    description: "Ngao hoa tươi sống",
    price: 399000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop",
    imageAlt: "Ngao hoa tươi sống"
  },
  {
    name: "Ngán Quảng Ninh",
    description: "Ngán Quảng Ninh tươi sống",
    price: 549000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop",
    imageAlt: "Ngán Quảng Ninh tươi sống"
  },
  {
    name: "Ốc Hương",
    description: "Ốc hương (60-80 con/kg)",
    price: 499000,
    category: "Hải sản tươi sống",
    available: true,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop",
    imageAlt: "Ốc hương tươi sống"
  },

  // HẢI SẢN CHẾ BIẾN - SET LẨU
  {
    name: "Set Lẩu Hải Sản Số 1",
    description: "Set lẩu hải sản phục vụ 2-3 người",
    price: 1399000,
    category: "Hải sản chế biến",
    available: true,
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&h=300&fit=crop",
    imageAlt: "Set lẩu hải sản số 1"
  },
  {
    name: "Set Lẩu Hải Sản Số 2",
    description: "Set lẩu hải sản phục vụ 3-4 người",
    price: 1699000,
    category: "Hải sản chế biến",
    available: true,
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&h=300&fit=crop",
    imageAlt: "Set lẩu hải sản số 2"
  },
  {
    name: "Set Lẩu Hải Sản Số 3",
    description: "Set lẩu hải sản phục vụ 4-5 người",
    price: 1999000,
    category: "Hải sản chế biến",
    available: true,
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&h=300&fit=crop",
    imageAlt: "Set lẩu hải sản số 3"
  },
  {
    name: "Set Lẩu Hải Sản Số 4",
    description: "Set lẩu hải sản phục vụ 5-6 người",
    price: 2999000,
    category: "Hải sản chế biến",
    available: true,
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&h=300&fit=crop",
    imageAlt: "Set lẩu hải sản số 4"
  },
  {
    name: "Set Lẩu Riêu Cua Gà Tre",
    description: "Set lẩu riêu cua gà tre khuyến mãi 20%",
    price: 470000,
    category: "Hải sản chế biến",
    available: true,
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&h=300&fit=crop",
    imageAlt: "Set lẩu riêu cua gà tre"
  },

  // MÓN ĂN ĐỒ PHỤ - CƠM
  {
    name: "Cơm Rang Trứng",
    description: "Cơm rang trứng thơm ngon",
    price: 100000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=300&fit=crop",
    imageAlt: "Cơm rang trứng"
  },
  {
    name: "Cơm Rang Trứng - To",
    description: "Cơm rang trứng size lớn",
    price: 150000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=300&fit=crop",
    imageAlt: "Cơm rang trứng size lớn"
  },
  {
    name: "Cơm Rang Hải Sản",
    description: "Cơm rang hải sản thơm ngon",
    price: 150000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=300&fit=crop",
    imageAlt: "Cơm rang hải sản"
  },
  {
    name: "Cơm Rang Hải Sản - To",
    description: "Cơm rang hải sản size lớn",
    price: 200000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=300&fit=crop",
    imageAlt: "Cơm rang hải sản size lớn"
  },

  // MÓN ĂN ĐỒ PHỤ - MÌ MIẾN
  {
    name: "Mì Xào Hải Sản",
    description: "Mì xào hải sản thơm ngon",
    price: 150000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=300&fit=crop",
    imageAlt: "Mì xào hải sản"
  },
  {
    name: "Mì Xào Hải Sản - To",
    description: "Mì xào hải sản size lớn",
    price: 200000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=300&fit=crop",
    imageAlt: "Mì xào hải sản size lớn"
  },
  {
    name: "Miến Xào Hải Sản",
    description: "Miến xào hải sản thơm ngon",
    price: 150000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=300&fit=crop",
    imageAlt: "Miến xào hải sản"
  },
  {
    name: "Miến Xào Hải Sản - To",
    description: "Miến xào hải sản size lớn",
    price: 200000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=300&fit=crop",
    imageAlt: "Miến xào hải sản size lớn"
  },

  // MÓN ĂN ĐỒ PHỤ - CHÁO CANH SÚP
  {
    name: "Cháo Cá",
    description: "Cháo cá thơm ngon bổ dưỡng",
    price: 100000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo cá thơm ngon"
  },
  {
    name: "Cháo Cá - To",
    description: "Cháo cá size lớn",
    price: 200000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo cá size lớn"
  },
  {
    name: "Cháo Tôm",
    description: "Cháo tôm thơm ngon bổ dưỡng",
    price: 100000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo tôm thơm ngon"
  },
  {
    name: "Cháo Tôm - To",
    description: "Cháo tôm size lớn",
    price: 200000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo tôm size lớn"
  },
  {
    name: "Cháo Ngao",
    description: "Cháo ngao thơm ngon bổ dưỡng",
    price: 100000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo ngao thơm ngon"
  },
  {
    name: "Cháo Ngao - To",
    description: "Cháo ngao size lớn",
    price: 200000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo ngao size lớn"
  },
  {
    name: "Cháo Hải Sản",
    description: "Cháo hải sản thơm ngon bổ dưỡng",
    price: 100000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo hải sản thơm ngon"
  },
  {
    name: "Cháo Hải Sản - To",
    description: "Cháo hải sản size lớn",
    price: 200000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547424450-8ad13c0aa0af?w=500&h=300&fit=crop",
    imageAlt: "Cháo hải sản size lớn"
  },
  {
    name: "Canh Chua Cá",
    description: "Canh chua cá đậm đà hương vị",
    price: 150000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1609114194111-3c63d1975d7a?w=500&h=300&fit=crop",
    imageAlt: "Canh chua cá đậm đà"
  },
  {
    name: "Canh Chua Ngao",
    description: "Canh chua ngao đậm đà hương vị",
    price: 150000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1609114194111-3c63d1975d7a?w=500&h=300&fit=crop",
    imageAlt: "Canh chua ngao đậm đà"
  },
  {
    name: "Súp Tôm",
    description: "Súp tôm thơm ngon (2 bát)",
    price: 100000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop",
    imageAlt: "Súp tôm thơm ngon"
  },
  {
    name: "Súp Bào Ngư",
    description: "Súp bào ngư cao cấp (2 bát)",
    price: 300000,
    category: "Món ăn đồ phụ",
    available: true,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop",
    imageAlt: "Súp bào ngư cao cấp"
  },
];

// Hàm seed data
const seedMenuData = async () => {
  try {
    await connectDB();

    console.log("🗑️ Clearing existing menu data...");
    await MenuItem.deleteMany({});

    console.log("📝 Adding new menu items...");
    const createdItems = await MenuItem.insertMany(menuData);

    console.log(`✅ Successfully added ${createdItems.length} menu items!`);
    console.log("\n📋 Menu categories added:");

    // Hiển thị thống kê theo category
    const categories = [...new Set(menuData.map((item) => item.category))];
    for (const category of categories) {
      const count = menuData.filter(
        (item) => item.category === category
      ).length;
      console.log(`   - ${category}: ${count} items`);
    }

    console.log("\n🍽️ Sample menu items:");
    createdItems.slice(0, 5).forEach((item) => {
      console.log(`   - ${item.name}: ${item.price.toLocaleString("vi-VN")}đ`);
    });

    console.log("\n🎉 Menu data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding menu data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Database connection closed");
  }
};

// Chạy script
if (require.main === module) {
  seedMenuData();
}

module.exports = { seedMenuData, menuData };
