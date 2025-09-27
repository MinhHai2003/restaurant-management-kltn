// Recipe mapping giữa menu items và nguyên liệu cần thiết
// Mỗi món ăn sẽ có danh sách nguyên liệu và số lượng cần dùng

const menuItemRecipes = {
  // === CƠM CHIÊN ===
  "Cơm Chiên Hải Sản": {
    ingredients: [
      { name: "Cơm Tấm", quantity: 0.3, unit: "kg" }, // 300g cơm/phần
      { name: "Tôm Sú Tươi", quantity: 0.1, unit: "kg" }, // 100g tôm/phần
      { name: "Mực Ống Tươi", quantity: 0.08, unit: "kg" }, // 80g mực/phần
      { name: "Trứng Gà", quantity: 2, unit: "cái" }, // 2 quả trứng/phần
      { name: "Hành Tây", quantity: 0.05, unit: "kg" }, // 50g hành tây/phần
      { name: "Dầu Ăn", quantity: 0.02, unit: "lít" }, // 20ml dầu/phần
    ],
  },

  "Cơm Chiên Dương Châu": {
    ingredients: [
      { name: "Cơm Tấm", quantity: 0.3, unit: "kg" },
      { name: "Xúc Xích", quantity: 0.05, unit: "kg" }, // 50g xúc xích/phần
      { name: "Tôm Khô", quantity: 0.02, unit: "kg" }, // 20g tôm khô/phần
      { name: "Trứng Gà", quantity: 2, unit: "cái" },
      { name: "Đậu Hà Lan", quantity: 0.03, unit: "kg" }, // 30g đậu/phần
      { name: "Cà Rốt", quantity: 0.03, unit: "kg" }, // 30g cà rốt/phần
      { name: "Dầu Ăn", quantity: 0.02, unit: "lít" },
    ],
  },

  // === PHỞ ===
  "Phở Bò Tái": {
    ingredients: [
      { name: "Bánh Phở", quantity: 0.2, unit: "kg" }, // 200g bánh phở/bát
      { name: "Thịt Bò Tái", quantity: 0.15, unit: "kg" }, // 150g thịt bò/bát
      { name: "Hành Tây", quantity: 0.02, unit: "kg" }, // 20g hành tây/bát
      { name: "Ngò Gai", quantity: 0.01, unit: "kg" }, // 10g ngò/bát
      { name: "Giá Đỗ", quantity: 0.05, unit: "kg" }, // 50g giá đỗ/bát
    ],
  },

  "Phở Gà": {
    ingredients: [
      { name: "Bánh Phở", quantity: 0.2, unit: "kg" },
      { name: "Thịt Gà", quantity: 0.15, unit: "kg" }, // 150g thịt gà/bát
      { name: "Hành Tây", quantity: 0.02, unit: "kg" },
      { name: "Ngò Gai", quantity: 0.01, unit: "kg" },
      { name: "Giá Đỗ", quantity: 0.05, unit: "kg" },
    ],
  },

  // === HẢI SẢN NƯỚNG ===
  "Cá Lăng Nướng Giấy Bạc": {
    ingredients: [
      { name: "Cá Lăng Đang Bơi", quantity: 0.8, unit: "kg" }, // 800g cá/phần
      { name: "Sả", quantity: 0.02, unit: "kg" }, // 20g sả/phần
      { name: "Ớt", quantity: 0.01, unit: "kg" }, // 10g ớt/phần
      { name: "Hành Tây", quantity: 0.05, unit: "kg" }, // 50g hành/phần
      { name: "Dầu Ăn", quantity: 0.03, unit: "lít" }, // 30ml dầu/phần
    ],
  },

  "Tôm Nướng Muối Ớt": {
    ingredients: [
      { name: "Tôm Sú Tươi", quantity: 0.4, unit: "kg" }, // 400g tôm/phần
      { name: "Muối Biển", quantity: 0.01, unit: "kg" }, // 10g muối/phần
      { name: "Ớt", quantity: 0.02, unit: "kg" }, // 20g ớt/phần
      { name: "Tỏi", quantity: 0.01, unit: "kg" }, // 10g tỏi/phần
      { name: "Dầu Ăn", quantity: 0.02, unit: "lít" }, // 20ml dầu/phần
    ],
  },

  // === LẨU ===
  "Lẩu Cá Khoai": {
    ingredients: [
      { name: "Cá Tra Phi Lê", quantity: 0.3, unit: "kg" }, // 300g cá/nồi
      { name: "Khoai Tây", quantity: 0.2, unit: "kg" }, // 200g khoai/nồi
      { name: "Cà Chua", quantity: 0.1, unit: "kg" }, // 100g cà chua/nồi
      { name: "Thơm", quantity: 0.15, unit: "kg" }, // 150g thơm/nồi
      { name: "Đậu Bắp", quantity: 0.1, unit: "kg" }, // 100g đậu bắp/nồi
      { name: "Nước Mắm", quantity: 0.05, unit: "lít" }, // 50ml nước mắm/nồi
    ],
  },

  // === NƯỚNG BBQ ===
  "Sườn Nướng BBQ": {
    ingredients: [
      { name: "Sườn Heo", quantity: 0.4, unit: "kg" }, // 400g sườn/phần
      { name: "Tỏi", quantity: 0.02, unit: "kg" }, // 20g tỏi/phần
      { name: "Hành Tây", quantity: 0.03, unit: "kg" }, // 30g hành/phần
      { name: "Dầu Ăn", quantity: 0.02, unit: "lít" }, // 20ml dầu/phần
    ],
  },

  // === GỎI CUỐN ===
  "Gỏi Cuốn Tôm Thịt": {
    ingredients: [
      { name: "Bánh Tráng", quantity: 0.05, unit: "kg" }, // 50g bánh tráng/phần
      { name: "Tôm Sú Tươi", quantity: 0.15, unit: "kg" }, // 150g tôm/phần
      { name: "Thịt Ba Chỉ", quantity: 0.1, unit: "kg" }, // 100g thịt/phần
      { name: "Bún Tươi", quantity: 0.05, unit: "kg" }, // 50g bún/phần
      { name: "Xà Lách", quantity: 0.05, unit: "kg" }, // 50g xà lách/phần
      { name: "Ngò Gai", quantity: 0.01, unit: "kg" }, // 10g ngò/phần
    ],
  },

  // === CANH ===
  "Canh Chua Cá Lăng": {
    ingredients: [
      { name: "Cá Lăng Đang Bơi", quantity: 0.3, unit: "kg" }, // 300g cá/nồi
      { name: "Cà Chua", quantity: 0.1, unit: "kg" }, // 100g cà chua/nồi
      { name: "Thơm", quantity: 0.05, unit: "kg" }, // 50g thơm/nồi
      { name: "Đậu Bắp", quantity: 0.05, unit: "kg" }, // 50g đậu bắp/nồi
      { name: "Giá Đỗ", quantity: 0.03, unit: "kg" }, // 30g giá đỗ/nồi
      { name: "Me", quantity: 0.02, unit: "kg" }, // 20g me/nồi
    ],
  },

  // === MÌ QUẢNG ===
  "Mì Quảng Tôm Cua": {
    ingredients: [
      { name: "Mì Quảng Khô", quantity: 0.15, unit: "kg" }, // 150g mì/bát
      { name: "Tôm Sú Tươi", quantity: 0.12, unit: "kg" }, // 120g tôm/bát
      { name: "Cua Biển", quantity: 0.1, unit: "kg" }, // 100g cua/bát
      { name: "Thịt Ba Chỉ", quantity: 0.05, unit: "kg" }, // 50g thịt/bát
      { name: "Trứng Gà", quantity: 1, unit: "cái" }, // 1 quả trứng/bát
      { name: "Hành Lá", quantity: 0.01, unit: "kg" }, // 10g hành lá/bát
    ],
  },

  // === BÁNH MÌ ===
  "Bánh Mì Thịt Nướng": {
    ingredients: [
      { name: "Bánh Mì", quantity: 1, unit: "cái" }, // 1 ổ bánh mì/phần
      { name: "Thịt Nướng", quantity: 0.1, unit: "kg" }, // 100g thịt/phần
      { name: "Pate", quantity: 0.02, unit: "kg" }, // 20g pate/phần
      { name: "Dưa Leo", quantity: 0.03, unit: "kg" }, // 30g dưa leo/phần
      { name: "Cà Chua", quantity: 0.03, unit: "kg" }, // 30g cà chua/phần
      { name: "Ngò Gai", quantity: 0.005, unit: "kg" }, // 5g ngò/phần
    ],
  },

  // === NƯỚC UỐNG ===
  "Trà Đá": {
    ingredients: [
      { name: "Trà", quantity: 0.005, unit: "kg" }, // 5g trà/ly
      { name: "Đá Lạnh", quantity: 0.1, unit: "kg" }, // 100g đá/ly
    ],
  },

  "Nước Cam Tươi": {
    ingredients: [
      { name: "Cam Tươi", quantity: 0.3, unit: "kg" }, // 3 quả cam/ly (~300g)
      { name: "Đá Lạnh", quantity: 0.05, unit: "kg" }, // 50g đá/ly
    ],
  },
  

  // === DESSERT ===
  "Chè Ba Màu": {
    ingredients: [
      { name: "Đậu Xanh", quantity: 0.03, unit: "kg" }, // 30g đậu xanh/tô
      { name: "Khoai Môn", quantity: 0.05, unit: "kg" }, // 50g khoai môn/tô
      { name: "Nước Cốt Dừa", quantity: 0.1, unit: "lít" }, // 100ml nước cốt dừa/tô
      { name: "Đá Lạnh", quantity: 0.05, unit: "kg" }, // 50g đá/tô
    ],
  },
};

module.exports = menuItemRecipes;
