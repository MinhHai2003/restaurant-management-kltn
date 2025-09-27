import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MenuWithInventory from '../components/menu/MenuWithInventory';
import { useCart } from '../contexts/CartContext';

interface MenuItemWithStock {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  imageAlt?: string;
  stockStatus?: {
    allAvailable: boolean;
    unavailableIngredients?: string[];
  };
}

const MenuInventoryTestPage: React.FC = () => {
  const { updateCartCount } = useCart();
  const [notification, setNotification] = useState<string | null>(null);

  const handleAddToCart = (item: MenuItemWithStock) => {
    // Simulate adding to cart
    console.log('Adding to cart:', item);
    
    setNotification(`✅ Đã thêm "${item.name}" vào giỏ hàng!`);
    setTimeout(() => setNotification(null), 3000);
    
    // Update cart count
    updateCartCount();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '20px',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            🍽️ Menu Tích Hợp Inventory
          </h1>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.9,
            lineHeight: '1.6',
            marginBottom: '30px'
          }}>
            Hệ thống menu thông minh với kiểm tra tồn kho nguyên liệu real-time.
            <br />
            Chỉ hiển thị những món có đủ nguyên liệu để chế biến.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
              <div style={{ fontWeight: '600' }}>Tự động kiểm tra</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Nguyên liệu có sẵn</div>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔄</div>
              <div style={{ fontWeight: '600' }}>Real-time</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Cập nhật liên tục</div>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
              <div style={{ fontWeight: '600' }}>Recipe system</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Quản lý công thức</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notification}
        </div>
      )}

      {/* Info Section */}
      <div style={{
        background: 'white',
        padding: '40px 20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            🔍 Cách hoạt động
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            marginTop: '30px'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                marginBottom: '10px',
                color: '#0ea5e9' 
              }}>
                1️⃣
              </div>
              <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>Kiểm tra Recipe</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                System tự động tìm recipe cho từng món ăn và tính toán nguyên liệu cần thiết.
              </p>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                marginBottom: '10px',
                color: '#10b981' 
              }}>
                2️⃣
              </div>
              <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>Kiểm tra Inventory</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Gọi API inventory service để kiểm tra tồn kho nguyên liệu real-time.
              </p>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                marginBottom: '10px',
                color: '#f59e0b' 
              }}>
                3️⃣
              </div>
              <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>Hiển thị Status</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Hiển thị món có thể đặt (xanh) hoặc hết nguyên liệu (vàng) với chi tiết.
              </p>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                marginBottom: '10px',
                color: '#dc2626' 
              }}>
                4️⃣
              </div>
              <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>Auto Reduce</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Khi đặt hàng thành công, tự động giảm inventory theo recipe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <MenuWithInventory onAddToCart={handleAddToCart} />
      
      <Footer />
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MenuInventoryTestPage;