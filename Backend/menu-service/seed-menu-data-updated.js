const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");
require("dotenv").config();

// Kết nối database
const connectDB = async () => {
  try {
    const connectionString =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/restaurant_menu";
    console.log(
      "🔗 Trying to connect to:",
      connectionString.replace(/:[^:@]+@/, ":****@")
    );

    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("📦 Connected to MongoDB successfully!");
    console.log("📊 Database name:", mongoose.connection.db.databaseName);
    console.log("📡 Connection state:", mongoose.connection.readyState); // 1 = connected
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("🔍 Full error:", error);
    process.exit(1);
  }
};

// Dữ liệu menu tương thích với recipe system
const menuData = [
  // === CƠM CHIÊN ===
  {
    name: "Cơm Chiên Hải Sản",
    description: "Cơm chiên với tôm sú tươi, mực ống và trứng gà thơm ngon",
    price: 85000,
    category: "Cơm chiên",
    available: true,
    image:
      "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=500&h=300&fit=crop",
    imageAlt: "Cơm chiên hải sản",
  },
  {
    name: "Cơm Chiên Dương Châu",
    description: "Cơm chiên truyền thống với xúc xích, tôm khô và rau củ",
    price: 65000,
    category: "Cơm chiên",
    available: true,
    image:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=300&fit=crop",
    imageAlt: "Cơm chiên Dương Châu",
  },

  // === PHỞ ===
  {
    name: "Phở Bò Tái",
    description: "Phở bò truyền thống với thịt tái mềm thơm, nước dùng đậm đà",
    price: 55000,
    category: "Phở",
    available: true,
    image:
      "https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&h=300&fit=crop",
    imageAlt: "Phở bò tái",
  },
  {
    name: "Phở Gà",
    description: "Phở gà đậm đà với thịt gà thơm ngon, nước dùng trong vắt",
    price: 50000,
    category: "Phở",
    available: true,
    image:
      "https://images.unsplash.com/photo-1559847844-d721426d6edc?w=500&h=300&fit=crop",
    imageAlt: "Phở gà",
  },

  // === HẢI SẢN NƯỚNG ===
  {
    name: "Cá Lăng Nướng Giấy Bạc",
    description: "Cá lăng tươi nướng giấy bạc với sả và gia vị đặc biệt",
    price: 280000,
    category: "Hải sản nướng",
    available: true,
    image:
      "https://images.unsplash.com/photo-1574781330855-d0db3225c3f0?w=500&h=300&fit=crop",
    imageAlt: "Cá lăng nướng giấy bạc",
  },
  {
    name: "Tôm Nướng Muối Ớt",
    description: "Tôm sú tươi nướng muối ớt thơm cay hấp dẫn",
    price: 180000,
    category: "Hải sản nướng",
    available: true,
    image:
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=300&fit=crop",
    imageAlt: "Tôm nướng muối ớt",
  },

  // === LẨU ===
  {
    name: "Lẩu Cá Khoai",
    description: "Lẩu cá khoai chua cay đậm đà với cà chua và thơm (3-4 người)",
    price: 350000,
    category: "Lẩu",
    available: true,
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop",
    imageAlt: "Lẩu cá khoai",
  },

  // === NƯỚNG BBQ ===
  {
    name: "Sườn Nướng BBQ",
    description: "Sườn heo nướng BBQ thơm lừng với sốt đặc biệt",
    price: 150000,
    category: "Nướng BBQ",
    available: true,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=300&fit=crop",
    imageAlt: "Sườn nướng BBQ",
  },

  // === GỎI CUỐN ===
  {
    name: "Gỏi Cuốn Tôm Thịt",
    description:
      "Gỏi cuốn tôm thịt tươi mát với rau sống và nước chấm đậm đà (8 cuốn)",
    price: 45000,
    category: "Gỏi cuốn",
    available: true,
    image:
      "https://images.unsplash.com/photo-1594736797933-d0a9ba96ad2c?w=500&h=300&fit=crop",
    imageAlt: "Gỏi cuốn tôm thịt",
  },

  // === CANH ===
  {
    name: "Canh Chua Cá Lăng",
    description: "Canh chua cá lăng với cà chua, thơm và rau thơm (4 người)",
    price: 120000,
    category: "Canh",
    available: true,
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop",
    imageAlt: "Canh chua cá lăng",
  },

  // === MÌ QUẢNG ===
  {
    name: "Mì Quảng Tôm Cua",
    description: "Mì Quảng truyền thống với tôm sú, cua biển và thịt ba chỉ",
    price: 75000,
    category: "Mì Quảng",
    available: true,
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=300&fit=crop",
    imageAlt: "Mì Quảng tôm cua",
  },

  // === BÁNH MÌ ===
  {
    name: "Bánh Mì Thịt Nướng",
    description: "Bánh mì Việt Nam với thịt nướng thơm ngon và rau sống",
    price: 25000,
    category: "Bánh mì",
    available: true,
    image:
      "https://images.unsplash.com/photo-1626844131082-256783844137?w=500&h=300&fit=crop",
    imageAlt: "Bánh mì thịt nướng",
  },

  // === NƯỚC UỐNG ===
  {
    name: "Trà Đá",
    description: "Trà đá truyền thống Việt Nam mát lạnh",
    price: 5000,
    category: "Nước uống",
    available: true,
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&h=300&fit=crop",
    imageAlt: "Trà đá",
  },
  {
    name: "Nước Cam Tươi",
    description: "Nước cam tươi ép nguyên chất 100%",
    price: 20000,
    category: "Nước uống",
    available: true,
    image:
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&h=300&fit=crop",
    imageAlt: "Nước cam tươi",
  },
  {
    name: "Bia Saigon",
    description: "Bia Saigon lạnh (lon 330ml)",
    price: 15000,
    category: "Nước uống",
    available: true,
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&h=300&fit=crop",
    imageAlt: "Bia Saigon",
  },
  {
    name: "Bia 333",
    description: "Bia 333 lạnh (lon 330ml)",
    price: 15000,
    category: "Nước uống",
    available: true,
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&h=300&fit=crop",
    imageAlt: "Bia 333",
  },
  {
    name: "Nước Suối",
    description: "Nước suối La Vie (chai 500ml)",
    price: 8000,
    category: "Nước uống",
    available: true,
    image:
      "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&h=300&fit=crop",
    imageAlt: "Nước suối",
  },

  // === TRÁNG MIỆNG ===
  {
    name: "Chè Ba Màu",
    description:
      "Chè ba màu truyền thống với đậu xanh, khoai môn và nước cốt dừa",
    price: 18000,
    category: "Tráng miệng",
    available: true,
    image:
      "https://images.unsplash.com/photo-1563379091339-03246c7face4?w=500&h=300&fit=crop",
    imageAlt: "Chè ba màu",
  },
  {
    name: "Bánh Flan",
    description: "Bánh flan caramen thơm ngon mịn màng",
    price: 15000,
    category: "Tráng miệng",
    available: true,
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&h=300&fit=crop",
    imageAlt: "Bánh flan",
  },

  // === THÊM MỘT SỐ MÓN PHỔ BIẾN KHÁC ===
  {
    name: "Cơm Tấm Sườn Nướng",
    description: "Cơm tấm với sườn nướng, chả trứng và nước mắm pha",
    price: 45000,
    category: "Cơm tấm",
    available: true,
    image:
      "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=500&h=300&fit=crop",
    imageAlt: "Cơm tấm sườn nướng",
  },
  {
    name: "Bún Thịt Nướng",
    description: "Bún với thịt nướng, chả giò và rau sống, nước mắm chua ngọt",
    price: 40000,
    category: "Bún",
    available: true,
    image:
      "https://images.unsplash.com/photo-1594736797933-d0a9ba96ad2c?w=500&h=300&fit=crop",
    imageAlt: "Bún thịt nướng",
  },
  {
    name: "Bánh Xèo Miền Tây",
    description: "Bánh xèo giòn rụm với tôm thịt, ăn kèm rau sống và nước chấm",
    price: 35000,
    category: "Bánh xèo",
    available: true,
    image:
      "https://images.unsplash.com/photo-1559847844-d721426d6edc?w=500&h=300&fit=crop",
    imageAlt: "Bánh xèo miền Tây",
  },

  // === HẢI SẢN TƯƠI SỐNG (Một số món giữ lại) ===
  {
    name: "Cá Mú Cọp",
    description:
      "Cá mú cọp tươi sống (1-5kg/con) - có thể chế biến theo yêu cầu",
    price: 269000,
    category: "Hải sản tươi sống",
    available: true,
    image:
      "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500&h=300&fit=crop",
    imageAlt: "Cá mú cọp tươi sống",
  },
  {
    name: "Tôm Hùm Bông",
    description:
      "Tôm hùm bông tươi sống (500-700g/con) - có thể chế biến theo yêu cầu",
    price: 1399000,
    category: "Hải sản tươi sống",
    available: true,
    image:
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=300&fit=crop",
    imageAlt: "Tôm hùm bông tươi sống",
  },
];

// Hàm seed data
const seedMenuData = async () => {
  try {
    await connectDB();

    console.log("🗑️ Clearing existing menu data...");
    const deleteResult = await MenuItem.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing items`);

    console.log("📝 Adding new menu items...");
    const createdItems = await MenuItem.insertMany(menuData);
    console.log(`   Inserted ${createdItems.length} new items`);

    // Verify data was actually saved
    console.log("� Verifying data in database...");
    const totalCount = await MenuItem.countDocuments();
    const sampleItems = await MenuItem.find().limit(3);

    console.log(
      `✅ Verification complete! Found ${totalCount} items in database`
    );
    console.log("📋 Sample items from database:");
    sampleItems.forEach((item) => {
      console.log(
        `   - ${item.name} (${item._id}): ${item.price.toLocaleString(
          "vi-VN"
        )}đ`
      );
    });

    console.log("\n📋 Menu categories added:");

    // Hiển thị thống kê theo category từ database
    const categories = await MenuItem.distinct("category");
    for (const category of categories) {
      const count = await MenuItem.countDocuments({ category });
      console.log(`   - ${category}: ${count} items`);
    }

    console.log("\n🎉 Menu data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding menu data:", error);
    console.error("🔍 Full error details:", error.stack);
  } finally {
    console.log("📦 Closing database connection...");
    await mongoose.connection.close();
    console.log("📦 Database connection closed");
  }
};

// Chạy script
if (require.main === module) {
  seedMenuData();
}

module.exports = { seedMenuData, menuData };
