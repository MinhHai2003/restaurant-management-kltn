const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Cấu hình Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Validate config
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error("❌ Cloudinary configuration is missing! Please check environment variables:");
  console.error("   - CLOUDINARY_CLOUD_NAME:", cloudinaryConfig.cloud_name ? "✓" : "✗");
  console.error("   - CLOUDINARY_API_KEY:", cloudinaryConfig.api_key ? "✓" : "✗");
  console.error("   - CLOUDINARY_API_SECRET:", cloudinaryConfig.api_secret ? "✓" : "✗");
} else {
  console.log("✅ Cloudinary configuration loaded:", {
    cloud_name: cloudinaryConfig.cloud_name,
    api_key: cloudinaryConfig.api_key ? `${cloudinaryConfig.api_key.substring(0, 8)}...` : "missing",
    api_secret: cloudinaryConfig.api_secret ? "***" : "missing",
  });
}

cloudinary.config(cloudinaryConfig);

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
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Kiểm tra Cloudinary config
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error("Cloudinary configuration is incomplete. Please check environment variables.");
    }

    // Upload file KHÔNG có options gì cả để tránh lỗi signature
    // Cloudinary sẽ tự động tạo public_id và upload
    console.log(`📤 Uploading to Cloudinary (no options):`, {
      cloud_name: config.cloud_name,
      has_api_key: !!config.api_key,
      has_api_secret: !!config.api_secret,
      file_path: filePath,
    });

    // Upload file KHÔNG có options - để Cloudinary tự động xử lý
    // Chỉ merge options nếu thực sự cần thiết
    const uploadOptions = Object.keys(options).length > 0 ? options : {};
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    // Sau khi upload thành công, rename file để có folder structure
    if (result.public_id && !result.public_id.startsWith('restaurant-menu/')) {
      const newPublicId = `restaurant-menu/${result.public_id}`;
      try {
        const renameResult = await cloudinary.uploader.rename(result.public_id, newPublicId);
        // Cập nhật result với public_id mới
        result.public_id = renameResult.public_id;
        result.secure_url = renameResult.secure_url;
        console.log(`📁 Renamed to folder: ${newPublicId}`);
      } catch (renameError) {
        console.warn("⚠️ Could not rename file to folder:", renameError.message);
        // Giữ nguyên public_id nếu không rename được
      }
    }
    
    console.log(`✅ Uploaded to Cloudinary: ${result.public_id} -> ${result.secure_url}`);
    
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
    
    // Log chi tiết lỗi để debug
    console.error("❌ Cloudinary upload error details:", {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
      config: {
        cloud_name: cloudinary.config().cloud_name,
        has_api_key: !!cloudinary.config().api_key,
        has_api_secret: !!cloudinary.config().api_secret,
      }
    });
    
    // Nếu là lỗi signature, có thể là do API secret không đúng
    if (error.message && error.message.includes("Invalid Signature")) {
      throw new Error(`Cloudinary signature error. Please verify CLOUDINARY_API_SECRET is correct. Original error: ${error.message}`);
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
