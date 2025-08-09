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
    name: "HẢI SẢN TƯƠI SỐNG",
    slug: "hai-san-tuoi-song",
    image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400",
    subcategories: [
      { name: "Cá", slug: "ca" },
      { name: "Tôm", slug: "tom" },
      { name: "Cua - Ghẹ", slug: "cua-ghe" },
      { name: "Ngao - Sò - Ốc", slug: "ngao-so-oc" },
      { name: "Mực", slug: "muc" }
    ]
  },
  {
    id: 2,
    name: "HẢI SẢN CHẾ BIẾN",
    slug: "hai-san-che-bien",
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400",
    subcategories: [
      { name: "Cá phi lê", slug: "ca-phi-le" },
      { name: "Tôm chế biến", slug: "tom-che-bien" },
      { name: "Cua đóng hộp", slug: "cua-dong-hop" }
    ]
  },
  {
    id: 3,
    name: "SASHIMI NHẬT BẢN",
    slug: "sashimi-nhat-ban",
    image: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400",
    subcategories: [
      { name: "Cá hồi", slug: "ca-hoi" },
      { name: "Cá ngừ", slug: "ca-ngu" },
      { name: "Combo sashimi", slug: "combo-sashimi" }
    ]
  },
  {
    id: 4,
    name: "MÓN ĂN, ĐỒ PHỤ",
    slug: "mon-an-do-phu",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    subcategories: [
      { name: "Cơm", slug: "com" },
      { name: "Cháo - Canh - Súp", slug: "chao-canh-sup" },
      { name: "Sốt gia vị đồ phụ", slug: "sot-gia-vi-do-phu" }
    ]
  },
  {
    id: 5,
    name: "SẢN PHẨM KHUYẾN MÃI",
    slug: "san-pham-khuyen-mai",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    subcategories: [
      { name: "Giảm 20%", slug: "giam-20" },
      { name: "Combo tiết kiệm", slug: "combo-tiet-kiem" }
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
