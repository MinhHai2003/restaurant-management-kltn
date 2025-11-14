import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Categories from '../components/ui/Categories';
import ProductSection from '../components/ui/ProductSection';
import ChatBotContainer from '../components/ChatBot/ChatBotContainer';
import { useCart } from '../contexts/CartContext';
import { API_CONFIG } from '../config/api';
import '../styles/modern-home.css';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  imageAlt?: string;
}

const HomePage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateCartCount } = useCart();

  // Fetch menu data from API
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const menuApiUrl = API_CONFIG.MENU_API;
        const response = await fetch(`${menuApiUrl}/menu`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch menu data');
        }
        
        const data = await response.json();
        setMenuItems(data);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Convert menu items to product format for existing components
  const convertToProducts = (items: MenuItem[]) => {
    return items.map(item => ({
      id: parseInt(item._id.slice(-6), 16), // Convert ObjectId to number for compatibility
      menuItemId: item._id, // Keep original ObjectId for cart operations
      name: item.name,
      description: item.description,
      price: item.price,
      unit: 'phần', // Default unit for menu items
      image: item.image || 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop',
      imageAlt: item.imageAlt || item.name,
      category: item.category,
      available: item.available,
      isBestSeller: Math.random() > 0.7, // Random for demo
      isNew: Math.random() > 0.8, // Random for demo
    }));
  };

  // Filter products by categories for different sections
  const riceAndNoodleProducts = convertToProducts(menuItems.filter(item => 
    ['com-chien', 'pho', 'com-tam', 'bun', 'mi-quang'].includes(item.category) && item.available
  ));
  
  const seafoodAndGrillProducts = convertToProducts(menuItems.filter(item => 
    ['hai-san', 'thit-nuong'].includes(item.category) && item.available
  ));
  
  const hotpotAndSoupProducts = convertToProducts(menuItems.filter(item => 
    ['lau', 'canh'].includes(item.category) && item.available
  ));

  const snacksAndRollsProducts = convertToProducts(menuItems.filter(item => 
    ['goi-cuon', 'banh-mi', 'banh-xeo'].includes(item.category) && item.available
  ));

  const drinksAndDessertProducts = convertToProducts(menuItems.filter(item => 
    ['do-uong', 'trang-mieng'].includes(item.category) && item.available
  ));

  // Featured products (mix of popular dishes)
  const featuredProducts = convertToProducts(menuItems.filter(item => 
    item.available && ['Cơm Chiên Hải Sản', 'Phở Bò Tái', 'Lẩu Cá Khoai', 'Tôm Nướng Muối Ớt', 'Cá Lăng Nướng Giấy Bạc'].includes(item.name)
  ).slice(0, 8));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'white' }}>
        <Header />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#64748b'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🦀</div>
            <div>Đang tải menu hải sản...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'white' }}>
        <Header />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#ef4444'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <div>Lỗi: {error}</div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header />

      {/* Modern Hero Section */}
      <div className="modern-hero">
        <div className="modern-hero-content">
          <h1 className="modern-hero-title">🦀 HẢI SẢN BIỂN ĐÔNG</h1>
          <p className="modern-hero-subtitle">
            Trải nghiệm hương vị tươi ngon từ biển cả - Nơi ẩm thực hội tụ đam mê
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="modern-features">
        <div className="modern-features-grid">
          <div className="modern-feature-card">
            <div className="modern-feature-icon">🎯</div>
            <h3 className="modern-feature-title">Hải sản tươi sống</h3>
            <p className="modern-feature-description">
              Nhập khẩu trực tiếp từ biển, đảm bảo độ tươi ngon và chất lượng cao nhất
            </p>
          </div>
          <div className="modern-feature-card">
            <div className="modern-feature-icon">👨‍🍳</div>
            <h3 className="modern-feature-title">Đầu bếp chuyên nghiệp</h3>
            <p className="modern-feature-description">
              Đội ngũ đầu bếp 5 sao với hơn 15 năm kinh nghiệm trong ẩm thực hải sản
            </p>
          </div>
          <div className="modern-feature-card">
            <div className="modern-feature-icon">🚚</div>
            <h3 className="modern-feature-title">Giao hàng nhanh chóng</h3>
            <p className="modern-feature-description">
              Giao hàng trong vòng 60 phút, đảm bảo món ăn còn nóng hổi khi đến tay bạn
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="modern-stats">
        <div className="modern-stats-grid">
          <div className="modern-stat-card">
            <span className="modern-stat-number">15+</span>
            <span className="modern-stat-label">Năm kinh nghiệm</span>
          </div>
          <div className="modern-stat-card">
            <span className="modern-stat-number">50K+</span>
            <span className="modern-stat-label">Khách hàng hài lòng</span>
          </div>
          <div className="modern-stat-card">
            <span className="modern-stat-number">200+</span>
            <span className="modern-stat-label">Món ăn đa dạng</span>
          </div>
          <div className="modern-stat-card">
            <span className="modern-stat-number">4.9⭐</span>
            <span className="modern-stat-label">Đánh giá trung bình</span>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <Categories />

      {/* Featured Products Section */}
      <ProductSection
        title="MÓN ĂN NỔI BẬT"
        products={featuredProducts}
        viewAllLink="/sp/group/mon-an-noi-bat"
        backgroundColor="white"
        onCartUpdate={updateCartCount}
      />

      {/* Rice & Noodle Section */}
      <ProductSection
        title="CƠM CHIÊN & PHỞ"
        products={riceAndNoodleProducts}
        viewAllLink="/sp/group/com-chien-pho"
        backgroundColor="#f9fafb"
        onCartUpdate={updateCartCount}
      />

      {/* Seafood & Grill Section */}
      <ProductSection
        title="HẢI SẢN & NƯỚNG"
        products={seafoodAndGrillProducts}
        viewAllLink="/sp/group/hai-san-nuong"
        backgroundColor="white"
        onCartUpdate={updateCartCount}
      />

      {/* Hotpot & Soup Section */}
      <ProductSection
        title="LẨU & CANH"
        products={hotpotAndSoupProducts}
        viewAllLink="/sp/group/lau-canh"
        backgroundColor="#f9fafb"
        onCartUpdate={updateCartCount}
      />

      {/* Snacks & Rolls Section */}
      <ProductSection
        title="BÁNH & GỎI CUỐN"
        products={snacksAndRollsProducts}
        viewAllLink="/sp/group/banh-goi-cuon"
        backgroundColor="white"
        onCartUpdate={updateCartCount}
      />

      {/* Drinks & Dessert Section */}
      <ProductSection
        title="NƯỚC UỐNG & TRÁNG MIỆNG"
        products={drinksAndDessertProducts}
        viewAllLink="/sp/group/nuoc-uong-trang-mieng"
        backgroundColor="#f9fafb"
        onCartUpdate={updateCartCount}
      />

      <Footer />
      
      {/* ChatBot */}
      <ChatBotContainer />
    </div>
  );
};

export default HomePage;
