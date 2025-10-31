import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, type Cart } from '../services/cartService';
import GuestCheckout from '../components/customer/GuestCheckout';

// Simple toast implementation
const toast = {
  error: (message: string) => alert(`❌ ${message}`),
  success: (message: string) => alert(`✅ ${message}`),
};

const GuestCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const result = await cartService.getCart();
      if (result.success && result.data?.cart) {
        setCart(result.data.cart);
      } else {
        toast.error(result.error || 'Không thể tải giỏ hàng');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSuccess = (orderNumber: string) => {
    // Clear cart after successful order
    setCart(null);
    toast.success(`Đặt hàng thành công! Mã đơn: ${orderNumber}`);
  };

  const handleBackToMenu = () => {
    navigate('/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Đặt hàng không cần đăng nhập</h1>
          <button
            onClick={handleBackToMenu}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Quay lại menu
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Đặt hàng nhanh chóng
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Bạn có thể đặt hàng mà không cần tạo tài khoản. Chỉ cần điền thông tin cần thiết và chúng tôi sẽ xử lý đơn hàng của bạn.
                </p>
              </div>
              <div className="mt-3">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
                  >
                    Tạo tài khoản để nhận ưu đãi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Checkout Component */}
        <GuestCheckout 
          cart={cart} 
          onOrderSuccess={handleOrderSuccess}
        />

        {/* Additional Info */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Tại sao nên tạo tài khoản?</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="font-medium mb-2">Tích điểm thưởng</h4>
              <p className="text-sm text-gray-600">Nhận điểm thưởng cho mỗi đơn hàng và đổi quà hấp dẫn</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-medium mb-2">Lịch sử đơn hàng</h4>
              <p className="text-sm text-gray-600">Xem lại các đơn hàng đã đặt và đặt lại dễ dàng</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3m6.366-.366l-2.12 2.12M21 12h-3m-.366 6.366l-2.12-2.12M12 21v-3m-6.366.366l2.12-2.12M3 12h3m.366-6.366l2.12 2.12" />
                </svg>
              </div>
              <h4 className="font-medium mb-2">Ưu đãi đặc biệt</h4>
              <p className="text-sm text-gray-600">Nhận thông báo về khuyến mãi và ưu đãi dành riêng cho thành viên</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckoutPage;