const mongoose = require("mongoose");
require("dotenv").config();
const Table = require("./models/Table");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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
    zone: "main",
    features: ["air_conditioned", "window_view"],
    status: "available",
    pricing: {
      basePrice: 0,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.5,
    },
    description: "Cozy table for two by the window",
    amenities: [
      { name: "Free WiFi", description: "High-speed internet", free: true },
      { name: "Phone Charger", description: "USB charging ports", free: true },
    ],
  },
  {
    tableNumber: "T002",
    capacity: 4,
    location: "indoor",
    zone: "main",
    features: ["air_conditioned"],
    status: "available",
    pricing: {
      basePrice: 0,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.5,
    },
    description: "Perfect for small families",
    amenities: [
      { name: "Free WiFi", description: "High-speed internet", free: true },
      { name: "High Chair", description: "Available upon request", free: true },
    ],
  },
  {
    tableNumber: "T003",
    capacity: 6,
    location: "indoor",
    zone: "main",
    features: ["air_conditioned", "quiet_area"],
    status: "available",
    pricing: {
      basePrice: 50000,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.5,
    },
    description: "Spacious table in quiet area",
    amenities: [
      { name: "Free WiFi", description: "High-speed internet", free: true },
      {
        name: "Privacy Screen",
        description: "Semi-private dining",
        free: true,
      },
    ],
  },
  {
    tableNumber: "O001",
    capacity: 4,
    location: "outdoor",
    zone: "terrace",
    features: ["window_view", "smoking_allowed"],
    status: "available",
    pricing: {
      basePrice: 30000,
      peakHourMultiplier: 1.3,
      weekendMultiplier: 1.8,
    },
    description: "Outdoor terrace with city view",
    amenities: [
      { name: "Heater", description: "Available in winter", free: true },
      { name: "Umbrella", description: "Weather protection", free: true },
    ],
  },
  {
    tableNumber: "O002",
    capacity: 6,
    location: "outdoor",
    zone: "garden",
    features: ["pet_friendly", "smoking_allowed"],
    status: "available",
    pricing: {
      basePrice: 40000,
      peakHourMultiplier: 1.3,
      weekendMultiplier: 1.8,
    },
    description: "Garden setting, pet-friendly",
    amenities: [
      { name: "Pet Bowl", description: "Water bowl for pets", free: true },
      {
        name: "Garden View",
        description: "Beautiful garden scenery",
        free: true,
      },
    ],
  },
  {
    tableNumber: "V001",
    capacity: 8,
    location: "private",
    zone: "vip",
    features: ["private_room", "air_conditioned", "wheelchair_accessible"],
    status: "available",
    pricing: {
      basePrice: 200000,
      peakHourMultiplier: 1.5,
      weekendMultiplier: 2.0,
    },
    description: "VIP private dining room",
    amenities: [
      { name: "Private Waiter", description: "Dedicated service", free: false },
      {
        name: "Sound System",
        description: "Music and presentation",
        free: true,
      },
      { name: "Projector", description: "For business meetings", free: false },
    ],
  },
  {
    tableNumber: "V002",
    capacity: 12,
    location: "private",
    zone: "vip",
    features: ["private_room", "air_conditioned", "wheelchair_accessible"],
    status: "available",
    pricing: {
      basePrice: 350000,
      peakHourMultiplier: 1.5,
      weekendMultiplier: 2.0,
    },
    description: "Large VIP room for events",
    amenities: [
      { name: "Private Waiter", description: "Dedicated service", free: false },
      {
        name: "Sound System",
        description: "Music and presentation",
        free: true,
      },
      { name: "Karaoke", description: "Entertainment system", free: false },
    ],
  },
  {
    tableNumber: "T004",
    capacity: 2,
    location: "indoor",
    zone: "main",
    features: ["air_conditioned", "near_entrance"],
    status: "available",
    pricing: {
      basePrice: 0,
      peakHourMultiplier: 1.1,
      weekendMultiplier: 1.3,
    },
    description: "Quick access table near entrance",
    amenities: [
      { name: "Express Service", description: "Faster ordering", free: true },
    ],
  },
];

const seedTables = async () => {
  try {
    await connectDB();

    // Clear existing tables
    await Table.deleteMany({});
    console.log("🧹 Cleared existing tables");

    // Insert sample tables
    const tables = await Table.insertMany(sampleTables);
    console.log(`✅ Created ${tables.length} sample tables`);

    console.log("📋 Sample tables:");
    tables.forEach((table) => {
      console.log(
        `  ${table.tableNumber} - ${table.capacity} seats - ${table.location} - ₫${table.pricing.basePrice}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding tables:", error);
    process.exit(1);
  }
};

seedTables();
