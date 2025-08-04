const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

router.get("/", menuController.getAllMenuItems); // Lấy tất cả
router.get("/:id", menuController.getMenuItemById); // Lấy theo ID
router.post("/", menuController.createMenuItem);
router.put("/:id", menuController.updateMenuItem);
router.delete("/:id", menuController.deleteMenuItem);

module.exports = router;
