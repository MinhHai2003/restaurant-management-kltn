const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình storage cho multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "restaurant-menu", // Thư mục trên Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"], // Định dạng được phép
    transformation: [
      {
        width: 800,
        height: 600,
        crop: "limit", // Giữ tỷ lệ, resize nếu lớn hơn
        quality: "auto:good", // Tự động optimize chất lượng
      },
    ],
    public_id: (req, file) => {
      // Tạo tên file duy nhất
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1e9);
      const originalName = file.originalname
        .split(".")[0]
        .replace(/[^a-zA-Z0-9]/g, "-");
      return `menu-${timestamp}-${randomNum}-${originalName}`;
    },
  },
});

// File filter
const fileFilter = (req, file, cb) => {
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

// Cấu hình multer với Cloudinary
const uploadCloudinary = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

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
  deleteCloudinaryFile,
  getOptimizedUrl,
  getThumbnailUrl,
  cloudinary,
};
