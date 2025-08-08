const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { uploadCloudinary } = require("../config/cloudinary");

// Basic CRUD routes với Cloudinary
router.get("/", menuController.getAllMenuItems); // Lấy tất cả
router.get("/:id", menuController.getMenuItemById); // Lấy theo ID
router.post(
  "/",
  uploadCloudinary.single("image"),
  menuController.createMenuItem
); // Tạo món với Cloudinary
router.put(
  "/:id",
  uploadCloudinary.single("image"),
  menuController.updateMenuItem
); // Cập nhật với Cloudinary
router.delete("/:id", menuController.deleteMenuItem);

// Specific routes
router.post("/json-only", menuController.createMenuItem); // Tạo món chỉ với JSON (không file)
router.post(
  "/upload-image",
  uploadCloudinary.single("image"),
  menuController.uploadImageOnly
); // Upload riêng

// Image-specific routes
router.put("/:id/image", menuController.updateMenuItemImage); // Cập nhật hình ảnh (URL)
router.put(
  "/:id/image-upload",
  uploadCloudinary.single("image"),
  menuController.updateMenuItemImage
); // Cập nhật với file
router.delete("/:id/image", menuController.removeMenuItemImage); // Xóa hình ảnh

// Filter routes
router.get("/filter/with-images", menuController.getMenuItemsWithImages); // Lấy món có hình
router.get("/filter/without-images", menuController.getMenuItemsWithoutImages); // Lấy món không có hình

module.exports = router;
