const { body, validationResult } = require("express-validator");

// Validation cho tạo/cập nhật inventory
const validateInventoryData = [
  body("name")
    .notEmpty()
    .withMessage("Tên nguyên liệu là bắt buộc")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên nguyên liệu phải có từ 2-100 ký tự"),

  body("quantity")
    .isNumeric()
    .withMessage("Số lượng phải là số")
    .isFloat({ min: 0 })
    .withMessage("Số lượng phải lớn hơn hoặc bằng 0"),

  body("unit")
    .notEmpty()
    .withMessage("Đơn vị là bắt buộc")
    .isIn(["kg", "lít", "cái", "gói", "thùng", "hộp", "lon", "gram"])
    .withMessage("Đơn vị không hợp lệ"),

  body("price")
    .isNumeric()
    .withMessage("Giá phải là số")
    .isFloat({ min: 0 })
    .withMessage("Giá phải lớn hơn hoặc bằng 0"),

  body("status")
    .optional()
    .isIn(["in-stock", "low-stock", "out-of-stock"])
    .withMessage("Trạng thái không hợp lệ"),

  body("supplier")
    .notEmpty()
    .withMessage("Nhà cung cấp là bắt buộc")
    .isLength({ max: 200 })
    .withMessage("Tên nhà cung cấp tối đa 200 ký tự"),

  body("category")
    .notEmpty()
    .withMessage("Danh mục là bắt buộc")
    .isIn(["thịt-cá", "rau-củ-quả", "gia-vị", "bánh-mì", "đồ-uống", "khác"])
    .withMessage("Danh mục không hợp lệ"),

  body("note")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Ghi chú tối đa 500 ký tự"),
];

// Validation cho cập nhật số lượng
const validateQuantityUpdate = [
  body("quantity")
    .isNumeric()
    .withMessage("Số lượng phải là số")
    .isFloat({ min: 0 })
    .withMessage("Số lượng phải lớn hơn hoặc bằng 0"),

  body("operation")
    .isIn(["add", "subtract", "set"])
    .withMessage("Operation phải là: add, subtract, hoặc set"),

  body("note")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Ghi chú tối đa 500 ký tự"),
];

// Middleware để xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

module.exports = {
  validateInventoryData,
  validateQuantityUpdate,
  handleValidationErrors,
};
