import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSlider from '../components/ui/HeroSlider';
import Categories from '../components/ui/Categories';
import ProductSection from '../components/ui/ProductSection';

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

  // Fetch menu data from API
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5003/api/menu');
        
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
  const seafoodProducts = convertToProducts(menuItems.filter(item => 
    item.category === 'Hải sản tươi sống' && item.available
  ));
  
  const processedSeafoodProducts = convertToProducts(menuItems.filter(item => 
    item.category === 'Hải sản chế biến' && item.available
  ));
  
  const sideDisheProducts = convertToProducts(menuItems.filter(item => 
    item.category === 'Món ăn đồ phụ' && item.available
  ));

  // Featured products (mix of all categories)
  const featuredProducts = convertToProducts(menuItems.filter(item => item.available).slice(0, 8));

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
      
      {/* Hero Section */}
      <HeroSlider />

      {/* Categories Section */}
      <Categories />

      {/* Featured Products Section */}
      <ProductSection
        title="SẢN PHẨM NỔI BẬT"
        products={featuredProducts}
        viewAllLink="/sp/group/san-pham-noi-bat"
        backgroundColor="white"
      />

      {/* Fresh Seafood Section */}
      <ProductSection
        title="HẢI SẢN TƯƠI SỐNG"
        products={seafoodProducts}
        viewAllLink="/sp/group/hai-san-tuoi-song"
        backgroundColor="#f9fafb"
      />

      {/* Processed Seafood Section */}
      <ProductSection
        title="HẢI SẢN CHẾ BIẾN"
        products={processedSeafoodProducts}
        viewAllLink="/sp/group/hai-san-che-bien"
        backgroundColor="white"
      />

      {/* Side Dishes Section */}
      <ProductSection
        title="MÓN ĂN ĐỒ PHỤ"
        products={sideDisheProducts}
        viewAllLink="/sp/group/mon-an-do-phu"
        backgroundColor="#f9fafb"
      />

      <Footer />
    </div>
  );
};

export default HomePage;
