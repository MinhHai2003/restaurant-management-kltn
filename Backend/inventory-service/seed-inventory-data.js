const mongoose = require("mongoose");
const Inventory = require("./models/Inventory");

const seedData = [
  {
    name: "Cá Lăng Đang Bơi",
    quantity: 100,
    unit: "kg",
    status: "in-stock",
    note: "Cá lăng tươi ngon",
    supplier: "Nhà cung cấp A"
  },
  {
    name: "Tôm Sú Tươi",
    quantity: 200,
    unit: "kg",
    status: "in-stock",
    note: "Tôm sú chất lượng cao",
    supplier: "Nhà cung cấp B"
  },
  {
    name: "Mực Ống",
    quantity: 150,
    unit: "kg",
    status: "in-stock",
    note: "Mực ống tươi sống",
    supplier: "Nhà cung cấp C"
  }
];

async function seedInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/inventory", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Inventory.deleteMany({});
    await Inventory.insertMany(seedData);

    console.log("Inventory data seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding inventory data:", error);
    process.exit(1);
  }
}

seedInventory();
