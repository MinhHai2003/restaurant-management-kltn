// Dữ liệu mẫu cho sản phẩm
export const featuredProducts = [
  {
    id: 1,
    name: "Cá Chép Giòn Đang Bơi",
    price: 228000,
    unit: "1kg",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300",
    category: "Cá",
    isNew: false,
    isBestSeller: true
  },
  {
    id: 2,
    name: "Cá Chình Đang Bơi",
    price: 389000,
    unit: "1kg",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300",
    category: "Cá",
    isNew: false,
    isBestSeller: true
  },
  {
    id: 3,
    name: "Cua thịt Cà Mau (350 - 650g/con)",
    price: 499000,
    unit: "1kg",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=300",
    category: "Cua - Ghẹ",
    isNew: false,
    isBestSeller: true
  },
  {
    id: 4,
    name: "Tôm Sú To (24-28 con/kg)",
    price: 449000,
    unit: "1kg",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300",
    category: "Tôm",
    isNew: false,
    isBestSeller: false
  },
  {
    id: 5,
    name: "Tôm Alaska Đang Bơi (1 - 5 kg/con)",
    price: 999000,
    unit: "1kg",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300",
    category: "Tôm",
    isNew: true,
    isBestSeller: false
  },
  {
    id: 6,
    name: "Tôm Hùm Bông Đang Bơi (0.9-1kg/con)",
    price: 1699000,
    unit: "1kg",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=300",
    category: "Tôm",
    isNew: false,
    isBestSeller: false
  },
  {
    id: 7,
    name: "Bào Ngư Hàn Quốc (10-13 con/kg)",
    price: 69000,
    unit: "1 con",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300",
    category: "Ngao - Sò - Ốc",
    isNew: false,
    isBestSeller: false
  },
  {
    id: 8,
    name: "Ngao Hoa",
    price: 299000,
    unit: "1kg",
    originalPrice: 399000,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300",
    category: "Ngao - Sò - Ốc",
    isNew: false,
    isBestSeller: false
  }
];

export const categories = [
  {
    id: 1,
    name: "CƠM CHIÊN & PHỞ",
    slug: "com-chien-pho",
    image: "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=400",
    subcategories: [
      { name: "Cơm chiên", slug: "com-chien" },
      { name: "Phở", slug: "pho" },
      { name: "Cơm tấm", slug: "com-tam" }
    ]
  },
  {
    id: 2,
    name: "HẢI SẢN & NƯỚNG",
    slug: "hai-san-nuong",
    image: "https://images.unsplash.com/photo-1574781330855-d0db3225c3f0?w=400",
    subcategories: [
      { name: "Hải sản nướng", slug: "hai-san-nuong" },
      { name: "Nướng BBQ", slug: "nuong-bbq" },
      { name: "Hải sản tươi sống", slug: "hai-san-tuoi-song" }
    ]
  },
  {
    id: 3,
    name: "LẨU & CANH",
    slug: "lau-canh",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    subcategories: [
      { name: "Lẩu", slug: "lau" },
      { name: "Canh", slug: "canh" },
      { name: "Mì Quảng", slug: "mi-quang" }
    ]
  },
  {
    id: 4,
    name: "BÁNH & GỎI CUỐN",
    slug: "banh-goi-cuon",
    image: "https://images.unsplash.com/photo-1594736797933-d0a9ba96ad2c?w=400",
    subcategories: [
      { name: "Gỏi cuốn", slug: "goi-cuon" },
      { name: "Bánh mì", slug: "banh-mi" },
      { name: "Bánh xèo", slug: "banh-xeo" },
      { name: "Bún", slug: "bun" }
    ]
  },
  {
    id: 5,
    name: "NƯỚC UỐNG & TRÁNG MIỆNG",
    slug: "nuoc-uong-trang-mieng",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400",
    subcategories: [
      { name: "Nước uống", slug: "nuoc-uong" },
      { name: "Tráng miệng", slug: "trang-mieng" }
    ]
  }
];

export const bannerSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=400&fit=crop",
    title: "Set Lẩu Riêu Cua Gà Tre Khuyến Mãi",
    subtitle: "4-1 con + 348k/Set",
    link: "/sp-detail/set-lau/Set-Lau-Rieu-Cua-Ga-Tre-Khuyen-Mai"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=1200&h=400&fit=crop",
    title: "Hải Sản Tươi Sống",
    subtitle: "Giao hàng 2H - Đổi trả miễn phí",
    link: "/hai-san-tuoi-song"
  }
];

export const companyInfo = {
  name: "HỆ THỐNG HẢI SẢN BIỂN ĐÔNG",
  phone: "0936253588",
  phone2: "0902147886",
  workingHours: "8h-21h từ T2-Chủ Nhật",
  addresses: [
    "Cơ sở 1: Số 2 ngõ 84 phố Trần Thái Tông, Cầu Giấy, Hà Nội",
    "Cơ sở 3: Số 794 đường Láng - Quận Đống Đa - Hà Nội",
    "Cơ sở 6: Phong Lan 01-01, Khu Đô Thị Vinhomes Riverside The Harmony, Quận Long Biên"
  ],
  facebook: "https://www.facebook.com/H%E1%BA%A3i-S%E1%BA%A3n-Bi%E1%BB%83n-%C4%90%C3%B4ng",
  partners: ["TIKI", "GRABMART", "SHOPEE FOOD"]
};
