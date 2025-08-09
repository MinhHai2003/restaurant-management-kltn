import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSlider from '../components/ui/HeroSlider';
import Categories from '../components/ui/Categories';
import ProductSection from '../components/ui/ProductSection';
import { featuredProducts } from '../data/products';

const HomePage: React.FC = () => {
  // Filter products by categories for different sections
  const bestSellerProducts = featuredProducts.filter(p => p.isBestSeller);
  const featuredProductsList = featuredProducts.slice(0, 8);
  const cheapProducts = featuredProducts.filter(p => p.originalPrice || p.price < 300000);
  const popularProducts = featuredProducts.slice(3, 7);

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header />
      
      {/* Hero Section */}
      <HeroSlider />

      {/* Categories Section */}
      <Categories />

      {/* Best Sellers Section */}
      <ProductSection
        title="BÁN CHẠY NHẤT"
        products={bestSellerProducts}
        viewAllLink="/sp/group/san-pham-ban-chay"
        backgroundColor="white"
      />

      {/* Featured Products Section */}
      <ProductSection
        title="SẢN PHẨM NỔI BẬT"
        products={featuredProductsList}
        viewAllLink="/sp/group/san-pham-noi-bat"
        backgroundColor="#f9fafb"
      />

      {/* Cheap Products Section */}
      <ProductSection
        title="SẢN PHẨM GIÁ RẺ"
        products={cheapProducts}
        viewAllLink="/sp/group/san-pham-gia-re"
        backgroundColor="white"
      />

      {/* Popular Products Section */}
      <ProductSection
        title="SẢN PHẨM BÁN CHẠY"
        products={popularProducts}
        viewAllLink="/sp/group/san-pham-ban-chay"
        backgroundColor="#f9fafb"
      />

      <Footer />
    </div>
  );
};

export default HomePage;
