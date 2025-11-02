import React, { useState, useEffect } from 'react';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import OrderNotifications from '../OrderNotifications';
import { API_CONFIG } from '../../config/api';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  customizations?: string;
  notes?: string;
}

const OrderingSystem: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { isConnected } = useOrderSocket();

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('http://localhost:5003/api/menu');
        const data = await response.json();
        if (data.success) {
          setMenuItems(data.data.menuItems || []);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Listen for cart updates via socket
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      const data = event.detail;
      if (data?.type === 'item_added') {
        // Optionally refresh cart from server or update UI
        console.log('Cart updated via Socket.io:', data);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, []);

  const addToCart = async (menuItem: MenuItem, quantity: number = 1, customizations?: string) => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        alert('Vui lòng đăng nhập để đặt món');
        return;
      }

      const response = await fetch(`${API_CONFIG.ORDER_API}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          menuItemId: menuItem._id,
          quantity,
          customizations
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Cart will be updated via Socket.io notification
        console.log('✅ Item added to cart');
      } else {
        alert(data.message || 'Lỗi thêm món vào giỏ hàng');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Lỗi kết nối server');
    }
  };

  const placeOrder = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        alert('Vui lòng đăng nhập để đặt hàng');
        return;
      }

      // Checkout cart (convert cart to order)
      const response = await fetch(`${API_CONFIG.ORDER_API}/cart/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery: {
            type: 'pickup', // or 'delivery'
          },
          payment: {
            method: 'cash'
          },
          notes: {
            customer: 'Đặt món từ app'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Order confirmation will come via Socket.io
        setCart([]); // Clear local cart
        console.log('✅ Order placed successfully');
      } else {
        alert(data.message || 'Lỗi đặt hàng');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Lỗi kết nối server');
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🍽️ Đặt Món</h1>
        <div className={`px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Real-time' : '🔴 Offline'}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'Tất cả' : category}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item._id} className={`border rounded-lg overflow-hidden shadow-lg ${
            !item.available ? 'opacity-50 grayscale' : 'hover:shadow-xl transition-shadow'
          }`}>
            {item.image && (
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-blue-600">
                  {item.price.toLocaleString()}đ
                </span>
                <button
                  onClick={() => addToCart(item)}
                  disabled={!item.available}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    item.available
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {item.available ? '🛒 Thêm' : '❌ Hết'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="font-semibold mb-2">🛒 Giỏ hàng ({cart.length} món)</h3>
          <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>{(item.price * item.quantity).toLocaleString()}đ</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold">
              <span>Tổng:</span>
              <span>
                {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}đ
              </span>
            </div>
            <button
              onClick={placeOrder}
              className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              🚀 Đặt hàng
            </button>
          </div>
        </div>
      )}

      {/* Real-time Notifications */}
      <OrderNotifications />
    </div>
  );
};

export default OrderingSystem;