import { useState, useEffect } from 'react';

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

interface MenuWithInventoryProps {
  onAddToCart: (item: MenuItemWithStock) => void;
}

const MenuWithInventory: React.FC<MenuWithInventoryProps> = ({ onAddToCart }) => {
  const [menuItems, setMenuItems] = useState<MenuItemWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'Tất cả' },
    { key: 'Cơm chiên', label: 'Cơm chiên' },
    { key: 'Phở', label: 'Phở' },
    { key: 'Hải sản nướng', label: 'Hải sản nướng' },
    { key: 'Lẩu', label: 'Lẩu' },
    { key: 'Gỏi cuốn', label: 'Gỏi cuốn' },
    { key: 'Nước uống', label: 'Nước uống' },
    { key: 'Tráng miệng', label: 'Tráng miệng' }
  ];

  useEffect(() => {
    fetchMenuWithStock();
  }, []);

  const fetchMenuWithStock = async () => {
    try {
      setLoading(true);
      
      // Fetch menu items
      const menuResponse = await fetch('http://localhost:5003/api/menu');
      if (!menuResponse.ok) throw new Error('Failed to fetch menu');
      const menuData = await menuResponse.json();

      // Check stock for each menu item
      const menuWithStock = await Promise.all(
        menuData.map(async (item: any) => {
          try {
            // Check if this menu item has a recipe and stock availability
            const stockResponse = await fetch('http://localhost:5005/api/inventory-test/check-menu-stock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderItems: [{ name: item.name, quantity: 1 }]
              })
            });

            if (stockResponse.ok) {
              const stockData = await stockResponse.json();
              const itemStock = stockData.data.items[0];
              
              return {
                ...item,
                stockStatus: {
                  allAvailable: itemStock?.available || false,
                  unavailableIngredients: itemStock?.ingredients
                    ?.filter((ing: any) => !ing.available)
                    ?.map((ing: any) => ing.ingredientName) || []
                }
              };
            }
          } catch (error) {
            console.warn(`Stock check failed for ${item.name}:`, error);
          }

          // Default: assume available if no stock check
          return {
            ...item,
            stockStatus: { allAvailable: true, unavailableIngredients: [] }
          };
        })
      );

      setMenuItems(menuWithStock);
    } catch (error) {
      console.error('Error fetching menu with stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-block', 
          padding: '20px', 
          background: '#f0f9ff', 
          borderRadius: '10px',
          color: '#0369a1'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '18px' }}>🍽️ Đang tải menu...</div>
          <div style={{ fontSize: '14px' }}>Kiểm tra tồn kho nguyên liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          color: '#1e293b', 
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🍽️ Menu Nhà Hàng
        </h2>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Kiểm tra tình trạng nguyên liệu real-time
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px', 
        marginBottom: '30px',
        justifyContent: 'center'
      }}>
        {categories.map(category => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '25px',
              border: 'none',
              background: selectedCategory === category.key 
                ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)' 
                : '#f1f5f9',
              color: selectedCategory === category.key ? 'white' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (selectedCategory !== category.key) {
                e.currentTarget.style.background = '#e2e8f0';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCategory !== category.key) {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {filteredItems.map(item => (
          <div 
            key={item._id}
            style={{
              background: 'white',
              borderRadius: '15px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: item.stockStatus?.allAvailable 
                ? '2px solid #10b981' 
                : '2px solid #f59e0b',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={item.image || 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop'}
                alt={item.imageAlt || item.name}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '15px'
                }}
              />
              
              {/* Stock Status Badge */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: item.stockStatus?.allAvailable ? '#10b981' : '#f59e0b',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {item.stockStatus?.allAvailable ? '✅ Có sẵn' : '⚠️ Hết nguyên liệu'}
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {item.category}
              </span>
            </div>

            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '18px',
              color: '#1e293b',
              fontWeight: '600'
            }}>
              {item.name}
            </h3>

            <p style={{
              color: '#64748b',
              fontSize: '14px',
              margin: '0 0 15px 0',
              lineHeight: '1.5'
            }}>
              {item.description}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <span style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#dc2626'
              }}>
                {item.price.toLocaleString('vi-VN')}đ
              </span>
              
              {!item.stockStatus?.allAvailable && (
                <span style={{ fontSize: '12px', color: '#f59e0b' }}>
                  Thiếu: {item.stockStatus?.unavailableIngredients?.slice(0, 2).join(', ')}
                  {(item.stockStatus?.unavailableIngredients?.length || 0) > 2 && '...'}
                </span>
              )}
            </div>

            <button
              onClick={() => onAddToCart(item)}
              disabled={!item.stockStatus?.allAvailable}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: item.stockStatus?.allAvailable 
                  ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)'
                  : '#9ca3af',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: item.stockStatus?.allAvailable ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (item.stockStatus?.allAvailable) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (item.stockStatus?.allAvailable) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {item.stockStatus?.allAvailable ? '🛒 Thêm vào giỏ' : '❌ Hết nguyên liệu'}
            </button>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🍽️</div>
          <h3>Không có món ăn nào trong danh mục này</h3>
        </div>
      )}
    </div>
  );
};

export default MenuWithInventory;