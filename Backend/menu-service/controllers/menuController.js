const MenuItem = require("../models/MenuItem");
const {
  deleteCloudinaryFile,
  getThumbnailUrl,
} = require("../config/cloudinary");

// Helper function để xóa file ảnh từ Cloudinary
const deleteImageFile = async (imagePath) => {
  if (!imagePath) return false;

  // Chỉ xử lý Cloudinary URLs
  if (imagePath.includes("cloudinary.com")) {
    return await deleteCloudinaryFile(imagePath);
  }

  return false;
};

exports.getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find();
    // Thêm thông tin hình ảnh vào response
    const itemsWithImageInfo = items.map((item) => ({
      ...item.toObject(),
      hasImage: !!item.image,
      imageUrl: item.image,
    }));
    res.json(itemsWithImageInfo);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    // Xử lý dữ liệu từ form-data hoặc JSON
    const itemData = { ...req.body };

    // Parse dữ liệu từ form-data (nếu cần)
    if (
      req.file ||
      req.headers["content-type"]?.includes("multipart/form-data")
    ) {
      // Form-data gửi tất cả là string, cần parse
      if (itemData.price) itemData.price = parseFloat(itemData.price);
      if (itemData.available !== undefined) {
        itemData.available =
          itemData.available === "true" || itemData.available === true;
      }
      // Parse ingredients từ JSON string
      if (itemData.ingredients && typeof itemData.ingredients === "string") {
        try {
          itemData.ingredients = JSON.parse(itemData.ingredients);
        } catch (e) {
          console.warn("Failed to parse ingredients:", e);
          itemData.ingredients = [];
        }
      }
    }

    // Xử lý file upload nếu có
    if (req.file) {
      // Cloudinary upload - multer-storage-cloudinary tự động upload và trả về URL
      itemData.image = req.file.path; // Cloudinary URL
      console.log(`📁 File uploaded to Cloudinary: ${req.file.filename}`);
    }

    // Nếu có hình ảnh từ URL (không phải file upload), validate format
    if (itemData.image && !req.file) {
      // Chỉ chấp nhận HTTP/HTTPS URLs
      if (!/^https?:\/\//.test(itemData.image)) {
        return res.status(400).json({
          message: "Invalid image format",
          error: "Image must be a valid HTTP/HTTPS URL",
        });
      }
    }

    // Tự động tạo imageAlt nếu không có
    if (!itemData.imageAlt && itemData.name) {
      itemData.imageAlt = `${itemData.name} image`;
    }

    const newItem = new MenuItem(itemData);
    await newItem.save();

    // Thêm thông tin hình ảnh vào response
    const responseItem = {
      ...newItem.toObject(),
      hasImage: !!newItem.image,
      imageUrl: newItem.image,
      thumbnailUrl: newItem.image ? getThumbnailUrl(req.file?.filename) : null,
      uploadedFile: req.file
        ? {
            originalName: req.file.originalname,
            filename: req.file.filename, // Cloudinary public_id
            path: req.file.path, // Cloudinary URL
            size: req.file.size,
          }
        : null,
    };

    res.status(201).json(responseItem);
  } catch (err) {
    // Log lỗi chi tiết để debug
    console.error("❌ Create menu item error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
    });

    // Xóa file Cloudinary đã upload nếu có lỗi
    if (req.file && req.file.filename) {
      try {
        await deleteCloudinaryFile(req.file.filename);
        console.log(
          `🗑️ Deleted failed Cloudinary upload: ${req.file.filename}`
        );
      } catch (deleteError) {
        console.error("❌ Error deleting failed upload:", deleteError.message);
      }
    }

    res.status(500).json({
      message: "Create failed",
      error: err.message || "Unknown error",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    console.log("📝 Update menu item request:", {
      id: req.params.id,
      hasFile: !!req.file,
      bodyKeys: Object.keys(req.body),
      body: req.body,
    });

    const updateData = { ...req.body };

    // Parse dữ liệu từ FormData (tất cả đều là string)
    if (req.file || req.headers["content-type"]?.includes("multipart/form-data")) {
      // Convert price từ string sang number
      if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
        if (isNaN(updateData.price)) {
          return res.status(400).json({
            message: "Invalid price",
            error: "Price must be a valid number",
          });
        }
      }

      // Convert available từ string sang boolean
      if (updateData.available !== undefined) {
        updateData.available = updateData.available === "true" || updateData.available === true;
      }

      // Parse ingredients từ JSON string
      if (updateData.ingredients && typeof updateData.ingredients === "string") {
        try {
          updateData.ingredients = JSON.parse(updateData.ingredients);
        } catch (e) {
          console.warn("Failed to parse ingredients:", e);
          updateData.ingredients = [];
        }
      }
    }

    // Lấy thông tin món ăn hiện tại để check ảnh cũ
    const existingItem = await MenuItem.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Xử lý file upload mới (nếu có)
    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (existingItem.image) {
        await deleteImageFile(existingItem.image);
      }
      // Đặt ảnh mới từ Cloudinary
      updateData.image = req.file.path; // Cloudinary URL
      console.log(`📁 New image uploaded to Cloudinary: ${req.file.path}`);
    } else if (updateData.image && updateData.image !== existingItem.image) {
      // Nếu cập nhật bằng URL mới và khác ảnh cũ
      // Validate URL format - chỉ chấp nhận HTTP/HTTPS
      if (!/^https?:\/\//.test(updateData.image)) {
        return res.status(400).json({
          message: "Invalid image format",
          error: "Image must be a valid HTTP/HTTPS URL",
        });
      }
      // Xóa ảnh cũ nếu là file upload
      if (existingItem.image && existingItem.image !== updateData.image) {
        await deleteImageFile(existingItem.image);
      }
    } else {
      // Nếu không có file mới và không có URL mới, giữ nguyên ảnh cũ
      delete updateData.image;
    }

    // Cập nhật imageAlt nếu có thay đổi name
    if (updateData.name && !updateData.imageAlt) {
      updateData.imageAlt = `${updateData.name} image`;
    }

    // Validate ingredients format nếu có
    if (updateData.ingredients && Array.isArray(updateData.ingredients)) {
      updateData.ingredients = updateData.ingredients.map(ing => {
        // Đảm bảo quantity là number
        if (typeof ing.quantity === 'string') {
          ing.quantity = parseFloat(ing.quantity) || 0;
        }
        return ing;
      });
    }

    // Chỉ giữ lại các trường hợp lệ để update
    const allowedFields = ['name', 'description', 'price', 'category', 'available', 'image', 'imageAlt', 'ingredients'];
    const filteredUpdateData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredUpdateData[key] = updateData[key];
      }
    }

    console.log("📤 Updating with data:", filteredUpdateData);

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: filteredUpdateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Thêm thông tin hình ảnh vào response
    const responseItem = {
      ...updated.toObject(),
      hasImage: !!updated.image,
      imageUrl: updated.image,
      thumbnailUrl: updated.image ? getThumbnailUrl(req.file?.filename) : null,
      uploadedFile: req.file
        ? {
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
          }
        : null,
    };

    res.json(responseItem);
  } catch (err) {
    // Log lỗi chi tiết
    console.error("❌ Update menu item error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      errors: err.errors,
    });

    // Xóa file Cloudinary mới upload nếu có lỗi
    if (req.file && req.file.filename) {
      try {
        await deleteCloudinaryFile(req.file.filename);
        console.log(
          `🗑️ Deleted failed Cloudinary upload: ${req.file.filename}`
        );
      } catch (deleteError) {
        console.error("❌ Error deleting failed upload:", deleteError.message);
      }
    }

    // Xử lý lỗi validation của Mongoose
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        error: validationErrors.join(', ') || err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }

    res.status(500).json({
      message: "Update failed",
      error: err.message || "Unknown error",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    // Tìm món ăn trước khi xóa để lấy thông tin ảnh
    const itemToDelete = await MenuItem.findById(req.params.id);
    if (!itemToDelete) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Xóa file ảnh nếu có
    if (itemToDelete.image) {
      const deleted = await deleteImageFile(itemToDelete.image);
      console.log(`🗑️ Image deletion result: ${deleted}`);
    }

    // Xóa món ăn khỏi database
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);

    res.json({
      message: "Deleted successfully",
      deletedItem: {
        id: deleted._id,
        name: deleted.name,
        hadImage: !!deleted.image,
        imageDeleted: !!deleted.image,
      },
    });
  } catch (err) {
    res.status(400).json({ message: "Delete failed", error: err.message });
  }
};
exports.getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item)
      return res.status(404).json({ message: "Không tìm thấy món ăn" });

    // Thêm thông tin hình ảnh vào response
    const responseItem = {
      ...item.toObject(),
      hasImage: !!item.image,
      imageUrl: item.image,
    };

    res.json(responseItem);
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi lấy món ăn", error: err.message });
  }
};

// API riêng để cập nhật hình ảnh
exports.updateMenuItemImage = async (req, res) => {
  try {
    const { image, imageAlt } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    // Validate image format
    if (!/^(https?:\/\/|\/|[a-zA-Z]:\\)/.test(image)) {
      return res.status(400).json({
        message: "Invalid image format",
        error: "Image must be a valid URL or file path",
      });
    }

    // Lấy thông tin món ăn hiện tại
    const existingItem = await MenuItem.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Xóa ảnh cũ nếu có và khác ảnh mới
    if (existingItem.image && existingItem.image !== image) {
      deleteImageFile(existingItem.image);
    }

    const updateData = { image };
    if (imageAlt) updateData.imageAlt = imageAlt;

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: "Image updated successfully",
      oldImageDeleted: existingItem.image && existingItem.image !== image,
      item: {
        ...updated.toObject(),
        hasImage: !!updated.image,
        imageUrl: updated.image,
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Image update failed", error: err.message });
  }
};

// API để xóa hình ảnh
exports.removeMenuItemImage = async (req, res) => {
  try {
    // Tìm món ăn để lấy thông tin ảnh trước khi xóa
    const existingItem = await MenuItem.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Xóa file ảnh nếu có
    const imageDeleted = deleteImageFile(existingItem.image);

    // Xóa thông tin ảnh khỏi database
    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $unset: { image: 1, imageAlt: 1 } },
      { new: true }
    );

    res.json({
      message: "Image removed successfully",
      imageFileDeleted: imageDeleted,
      item: {
        ...updated.toObject(),
        hasImage: false,
        imageUrl: null,
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Image removal failed", error: err.message });
  }
};

// API để lấy tất cả món ăn có hình ảnh
exports.getMenuItemsWithImages = async (req, res) => {
  try {
    const items = await MenuItem.find({ image: { $exists: true, $ne: null } });
    const itemsWithImageInfo = items.map((item) => ({
      ...item.toObject(),
      hasImage: true,
      imageUrl: item.image,
    }));
    res.json(itemsWithImageInfo);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// API để lấy tất cả món ăn không có hình ảnh
exports.getMenuItemsWithoutImages = async (req, res) => {
  try {
    const items = await MenuItem.find({
      $or: [{ image: { $exists: false } }, { image: null }, { image: "" }],
    });
    const itemsWithImageInfo = items.map((item) => ({
      ...item.toObject(),
      hasImage: false,
      imageUrl: null,
    }));
    res.json(itemsWithImageInfo);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// API để upload file hình ảnh riêng
exports.uploadImageOnly = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (err) {
    // Xóa file đã upload nếu có lỗi
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({ message: "Upload failed", error: err.message });
  }
};

// API để tạo menu với file upload
exports.createMenuItemWithUpload = async (req, res) => {
  try {
    // Xử lý dữ liệu từ form-data
    const itemData = { ...req.body };

    // Parse số từ string (form-data gửi tất cả là string)
    if (itemData.price) itemData.price = parseFloat(itemData.price);
    if (itemData.available) itemData.available = itemData.available === "true";

    // Xử lý file upload
    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      itemData.image = imageUrl;
    }

    // Tự động tạo imageAlt nếu không có
    if (!itemData.imageAlt && itemData.name) {
      itemData.imageAlt = `${itemData.name} image`;
    }

    const newItem = new MenuItem(itemData);
    await newItem.save();

    // Thêm thông tin hình ảnh vào response
    const responseItem = {
      ...newItem.toObject(),
      hasImage: !!newItem.image,
      imageUrl: newItem.image,
      uploadedFile: req.file
        ? {
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
          }
        : null,
    };

    res.status(201).json(responseItem);
  } catch (err) {
    // Xóa file đã upload nếu có lỗi
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res
      .status(400)
      .json({ message: "Create with upload failed", error: err.message });
  }
};
