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
    image: "https://res.cloudinary.com/dgqgwefnv/image/upload/v1759332733/restaurant-menu/menu-1759332727925-385629513-comchienhaisan.jpg",
    subcategories: [
      { name: "Cơm chiên", slug: "com-chien" },
      { name: "Phở", slug: "pho" }
    ]
  },
  {
    id: 2,
    name: "HẢI SẢN & NƯỚNG",
    slug: "hai-san-nuong",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=300&fit=crop",
    subcategories: [
      { name: "Hải sản", slug: "hai-san" },
      { name: "Nướng BBQ", slug: "thit-nuong" }
    ]
  },
  {
    id: 3,
    name: "LẨU & CANH",
    slug: "lau-canh",
    image: "https://res.cloudinary.com/dgqgwefnv/image/upload/v1759332847/restaurant-menu/menu-1759332843485-105455699-lau-ca-khoai-quang-binh-01-1632812019.jpg",
    subcategories: [
      { name: "Lẩu", slug: "lau" },
      { name: "Canh", slug: "canh" }
    ]
  },
  {
    id: 4,
    name: "BÁNH & GỎI CUỐN",
    slug: "banh-goi-cuon",
    image: "https://res.cloudinary.com/dgqgwefnv/image/upload/v1759332867/restaurant-menu/menu-1759332863100-256812385-goi-cuon-tom-thit-508499.jpg",
    subcategories: [
      { name: "Gỏi cuốn", slug: "goi-cuon" },
      { name: "Bánh mì", slug: "banh-mi" },
      { name: "Bánh xèo", slug: "banh-xeo" }
    ]
  },
  {
    id: 5,
    name: "NƯỚC UỐNG & TRÁNG MIỆNG",
    slug: "nuoc-uong-trang-mieng",
    image: "https://res.cloudinary.com/dgqgwefnv/image/upload/v1759332938/restaurant-menu/menu-1759332934400-20242317-aquafina-500ml.jpg",
    subcategories: [
      { name: "Nước uống", slug: "do-uong" },
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
