const mongoose = require("mongoose");
require("dotenv").config();
const Table = require("./models/Table");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/restaurant_management"
    );
    console.log("📊 MongoDB Connected");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

const sampleTables = [
  {
    tableNumber: "T001",
    capacity: 2,
    location: "indoor",
    features: ["air_conditioned", "window_view"],
    status: "available",
    pricing: {
      basePrice: 0,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.5,
    },
    description: "Bàn ấm cúng cho 2 người bên cửa sổ, view đẹp ra phố",
    amenities: [
      { name: "WiFi miễn phí", description: "Internet tốc độ cao", free: true },
      {
        name: "Sạc điện thoại",
        description: "Cổng sạc USB tiện lợi",
        free: true,
      },
    ],
  },
  {
    tableNumber: "T002",
    capacity: 4,
    location: "indoor",
    features: ["air_conditioned", "wheelchair_accessible"],
    status: "occupied",
    pricing: {
      basePrice: 0,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.5,
    },
    description: "Bàn tiện nghi cho người khuyết tật, không gian rộng rãi",
    amenities: [
      { name: "WiFi miễn phí", description: "Internet tốc độ cao", free: true },
      { name: "Ghế em bé", description: "Có sẵn khi yêu cầu", free: true },
    ],
  },
  {
    tableNumber: "T003",
    capacity: 6,
    location: "indoor",
    features: ["air_conditioned", "quiet_area", "private_room"],
    status: "reserved",
    pricing: {
      basePrice: 50000,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.5,
    },
    description:
      "Bàn riêng tư trong phòng yên tĩnh, phù hợp họp mặt quan trọng",
    amenities: [
      { name: "WiFi miễn phí", description: "Internet tốc độ cao", free: true },
      {
        name: "Vách ngăn riêng tư",
        description: "Không gian ăn uống riêng biệt",
        free: true,
      },
    ],
  },
  {
    tableNumber: "T004",
    capacity: 2,
    location: "indoor",
    features: ["air_conditioned", "near_entrance"],
    status: "available",
    pricing: {
      basePrice: 0,
      peakHourMultiplier: 1.1,
      weekendMultiplier: 1.3,
    },
    description: "Bàn gần lối vào, thuận tiện cho khách cần nhanh gọn",
    amenities: [
      {
        name: "Phục vụ nhanh",
        description: "Order và phục vụ nhanh chóng",
        free: true,
      },
    ],
  },
  {
    tableNumber: "T005",
    capacity: 8,
    location: "indoor",
    features: ["air_conditioned", "quiet_area", "wheelchair_accessible"],
    status: "maintenance",
    pricing: {
      basePrice: 80000,
      peakHourMultiplier: 1.3,
      weekendMultiplier: 1.6,
    },
    description: "Bàn lớn cho nhóm bạn, gia đình đông người (đang bảo trì)",
    amenities: [
      { name: "WiFi miễn phí", description: "Internet tốc độ cao", free: true },
      { name: "Ghế trẻ em", description: "Ghế cao cho trẻ nhỏ", free: true },
    ],
  },
  {
    tableNumber: "O001",
    capacity: 4,
    location: "outdoor",
    features: ["window_view", "smoking_allowed", "pet_friendly"],
    status: "available",
    pricing: {
      basePrice: 30000,
      peakHourMultiplier: 1.3,
      weekendMultiplier: 1.8,
    },
    description: "Sân thượng ngoài trời, cho phép hút thuốc và mang thú cưng",
    amenities: [
      { name: "Máy sưởi", description: "Có sẵn vào mùa đông", free: true },
      { name: "Ô che mưa", description: "Bảo vệ khỏi thời tiết", free: true },
      {
        name: "Bát nước cho thú cưng",
        description: "Dịch vụ thú cưng",
        free: true,
      },
    ],
  },
  {
    tableNumber: "O002",
    capacity: 6,
    location: "outdoor",
    features: ["pet_friendly", "smoking_allowed", "wheelchair_accessible"],
    status: "cleaning",
    pricing: {
      basePrice: 40000,
      peakHourMultiplier: 1.3,
      weekendMultiplier: 1.8,
    },
    description: "Sân vườn xanh mát, thân thiện với thú cưng (đang dọn dẹp)",
    amenities: [
      {
        name: "Bát nước cho thú cưng",
        description: "Dịch vụ cho thú cưng",
        free: true,
      },
      {
        name: "Đèn trang trí",
        description: "Ánh sáng đẹp buổi tối",
        free: true,
      },
    ],
  },
  {
    tableNumber: "V001",
    capacity: 8,
    location: "private",
    features: [
      "private_room",
      "air_conditioned",
      "wheelchair_accessible",
      "quiet_area",
    ],
    status: "available",
    pricing: {
      basePrice: 200000,
      peakHourMultiplier: 1.5,
      weekendMultiplier: 2.0,
    },
    description: "Phòng VIP riêng tư cao cấp với đầy đủ tiện nghi",
    amenities: [
      {
        name: "Phục vụ riêng",
        description: "Nhân viên phục vụ chuyên biệt",
        free: false,
      },
      {
        name: "Hệ thống âm thanh",
        description: "Âm nhạc và thuyết trình",
        free: true,
      },
      { name: "Máy chiếu", description: "Phục vụ họp kinh doanh", free: false },
    ],
  },
  {
    tableNumber: "V002",
    capacity: 12,
    location: "vip",
    features: [
      "private_room",
      "air_conditioned",
      "wheelchair_accessible",
      "quiet_area",
    ],
    status: "reserved",
    pricing: {
      basePrice: 350000,
      peakHourMultiplier: 1.5,
      weekendMultiplier: 2.0,
    },
    description:
      "Phòng VIP lớn nhất, phục vụ sự kiện và tiệc tùng cao cấp (đã đặt trước)",
    amenities: [
      {
        name: "Phục vụ riêng",
        description: "Nhân viên phục vụ chuyên biệt",
        free: false,
      },
      {
        name: "Hệ thống âm thanh",
        description: "Âm nhạc chuyên nghiệp",
        free: true,
      },
      {
        name: "Karaoke",
        description: "Hệ thống giải trí karaoke",
        free: false,
      },
      {
        name: "Máy chiếu",
        description: "Thuyết trình và chiếu phim",
        free: false,
      },
    ],
  },
  {
    tableNumber: "T006",
    capacity: 4,
    location: "indoor",
    features: ["air_conditioned", "window_view", "quiet_area"],
    status: "available",
    pricing: {
      basePrice: 40000,
      peakHourMultiplier: 1.4,
      weekendMultiplier: 1.7,
    },
    description: "Bàn lãng mạn cho cặp đôi, không gian ấm cúng và yên tĩnh",
    amenities: [
      {
        name: "Nến thơm",
        description: "Nến tạo không khí lãng mạn",
        free: true,
      },
      { name: "Hoa trang trí", description: "Hoa tươi trên bàn", free: true },
    ],
  },
  {
    tableNumber: "O003",
    capacity: 10,
    location: "terrace",
    features: [
      "pet_friendly",
      "wheelchair_accessible",
      "smoking_allowed",
      "window_view",
    ],
    status: "available",
    pricing: {
      basePrice: 120000,
      peakHourMultiplier: 1.4,
      weekendMultiplier: 2.0,
    },
    description: "Sân thượng view đẹp, phù hợp tiệc tùng nhóm lớn",
    amenities: [
      {
        name: "Bát nước cho thú cưng",
        description: "Dịch vụ thú cưng",
        free: true,
      },
      {
        name: "Đèn trang trí",
        description: "Ánh sáng đẹp buổi tối",
        free: true,
      },
      { name: "Loa bluetooth", description: "Kết nối nhạc riêng", free: true },
      { name: "Máy sưởi", description: "Ấm áp vào mùa đông", free: true },
    ],
  },
  {
    tableNumber: "T007",
    capacity: 3,
    location: "indoor",
    features: ["air_conditioned", "near_entrance", "wheelchair_accessible"],
    status: "occupied",
    pricing: {
      basePrice: 20000,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.4,
    },
    description: "Bàn 3 người tiện lợi, gần lối vào với tiện nghi khuyết tật",
    amenities: [
      { name: "WiFi miễn phí", description: "Internet tốc độ cao", free: true },
      {
        name: "Sạc không dây",
        description: "Sạc điện thoại không dây",
        free: true,
      },
    ],
  },
];

const seedTables = async () => {
  try {
    await connectDB();

    // Clear existing tables
    await Table.deleteMany({});
    console.log("🧹 Cleared existing tables");

    // Insert sample tables with individual logging
    console.log("📝 Inserting tables...");
    const tables = [];

    for (let i = 0; i < sampleTables.length; i++) {
      try {
        const table = new Table(sampleTables[i]);
        const savedTable = await table.save();
        tables.push(savedTable);
        console.log(
          `✅ Saved: ${savedTable.tableNumber} - ${savedTable.status}`
        );
      } catch (error) {
        console.error(
          `❌ Error saving table ${sampleTables[i].tableNumber}:`,
          error.message
        );
      }
    }

    console.log(`✅ Created ${tables.length} sample tables total`);

    // Verify the data was saved
    const count = await Table.countDocuments();
    console.log(`📊 Verification: ${count} tables in database`);

    if (count > 0) {
      const statusCounts = await Table.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      console.log("📋 Status distribution:");
      statusCounts.forEach((item) => {
        console.log(`  ${item._id}: ${item.count} bàn`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding tables:", error);
    process.exit(1);
  }
};

seedTables();
