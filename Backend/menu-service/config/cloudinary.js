const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình multer để lưu file tạm thời
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(os.tmpdir(), "menu-uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1e9);
    const originalName = file.originalname
      .split(".")[0]
      .replace(/[^a-zA-Z0-9]/g, "-");
    const ext = path.extname(file.originalname);
    cb(null, `menu-${timestamp}-${randomNum}-${originalName}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Cho phép không có file (optional upload)
  if (!file) {
    return cb(null, true);
  }

  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error("Chỉ cho phép upload file hình ảnh (JPEG, JPG, PNG, GIF, WEBP)")
    );
  }
};

// Cấu hình multer
const uploadCloudinary = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

// Helper function để upload file lên Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: "restaurant-menu",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [
        {
          width: 800,
          height: 600,
          crop: "limit",
          quality: "auto:good",
        },
      ],
      ...options,
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    
    // Xóa file tạm thời sau khi upload
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.warn("⚠️ Could not delete temp file:", unlinkError.message);
    }

    return result;
  } catch (error) {
    // Xóa file tạm thời nếu có lỗi
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (unlinkError) {
      console.warn("⚠️ Could not delete temp file after error:", unlinkError.message);
    }
    throw error;
  }
};

// Helper function để xóa file từ Cloudinary
const deleteCloudinaryFile = async (publicId) => {
  try {
    if (!publicId) return false;

    // Extract public_id từ URL nếu cần
    let id = publicId;
    if (publicId.includes("cloudinary.com")) {
      const urlParts = publicId.split("/");
      const uploadIndex = urlParts.findIndex((part) => part === "upload");
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        // Lấy phần sau /upload/v{version}/
        const pathParts = urlParts.slice(uploadIndex + 2);
        id = pathParts.join("/").split(".")[0]; // Bỏ extension
      }
    }

    const result = await cloudinary.uploader.destroy(id);
    console.log(`🗑️ Deleted Cloudinary file: ${id}`, result);
    return result.result === "ok";
  } catch (error) {
    console.error(`❌ Error deleting Cloudinary file: ${error.message}`);
    return false;
  }
};

// Helper function để tạo optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      quality: "auto:good",
      fetch_format: "auto",
      ...options,
    };

    return cloudinary.url(publicId, defaultOptions);
  } catch (error) {
    console.error(`❌ Error creating optimized URL: ${error.message}`);
    return null;
  }
};

// Helper function để generate thumbnail
const getThumbnailUrl = (publicId, width = 200, height = 150) => {
  try {
    return cloudinary.url(publicId, {
      width: width,
      height: height,
      crop: "fill",
      quality: "auto:good",
      fetch_format: "auto",
    });
  } catch (error) {
    console.error(`❌ Error creating thumbnail URL: ${error.message}`);
    return null;
  }
};

module.exports = {
  uploadCloudinary,
  uploadToCloudinary,
  deleteCloudinaryFile,
  getOptimizedUrl,
  getThumbnailUrl,
  cloudinary,
};
