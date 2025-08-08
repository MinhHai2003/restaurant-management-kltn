const express = require("express");
const { uploadCloudinary } = require("./config/cloudinary");

const app = express();

// Test route đơn giản
app.post("/test-upload", uploadCloudinary.single("image"), (req, res) => {
  try {
    console.log("File received:", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.json({
      message: "Upload successful",
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
});

// Test route kiểm tra config
app.get("/test-config", (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    hasSecret: !!process.env.CLOUDINARY_API_SECRET,
  });
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
});
