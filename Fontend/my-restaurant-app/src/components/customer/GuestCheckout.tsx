import React, { useState } from 'react';
import { cartService, type Cart } from '../../services/cartService';
import { useNavigate } from 'react-router-dom';

// Simple toast implementation
const toast = {
  error: (message: string) => alert(`❌ ${message}`),
  success: (message: string) => alert(`✅ ${message}`),
};

interface GuestCheckoutData {
  guestInfo: {
    name: string;
    email: string;
    phone: string;
    address?: {
      full: string;
      district?: string;
      city?: string;
    };
  };
  payment: {
    method: string;
  };
  delivery: {
    type: string;
    estimatedTime: number;
  };
  notes?: {
    customer?: string;
    kitchen?: string;
  };
}

interface GuestCheckoutProps {
  cart: Cart | null;
  onOrderSuccess?: (orderNumber: string) => void;
}

const GuestCheckout: React.FC<GuestCheckoutProps> = ({ cart, onOrderSuccess }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    paymentMethod: 'cash' as const,
    deliveryType: 'delivery' as const,
    customerNotes: '',
    kitchenNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10 chữ số)';
    }

    if (formData.deliveryType === 'delivery' && !formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ giao hàng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart || cart.items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setLoading(true);

    try {
      const checkoutData: GuestCheckoutData = {
        guestInfo: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.deliveryType === 'delivery' ? {
            full: formData.address.trim(),
            district: formData.district.trim() || undefined,
            city: formData.city.trim() || undefined,
          } : undefined,
        },
        payment: {
          method: formData.paymentMethod,
        },
        delivery: {
          type: formData.deliveryType,
          estimatedTime: formData.deliveryType === 'delivery' ? 30 : 15,
        },
        notes: {
          customer: formData.customerNotes.trim() || undefined,
          kitchen: formData.kitchenNotes.trim() || undefined,
        },
      };

      console.log('🛒 [GUEST CHECKOUT] Submitting checkout data:', checkoutData);

      const result = await cartService.guestCheckout(checkoutData);

      if (result.success && result.data?.order) {
        toast.success(`Đặt hàng thành công! Mã đơn hàng: ${result.data.order.orderNumber}`);
        
        if (onOrderSuccess) {
          onOrderSuccess(result.data.order.orderNumber);
        }
        
        // Redirect to order tracking or success page
        navigate(`/track-order/${result.data.order.orderNumber}`);
      } else {
        throw new Error(result.error || 'Đặt hàng thất bại');
      }
    } catch (error) {
      console.error('Guest checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Đặt hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Calculate delivery fee
  const deliveryFee = formData.deliveryType === 'delivery' ? 30000 : 0;
  const finalTotal = (cart?.summary?.total || 0) + deliveryFee;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Đặt hàng không cần đăng nhập</h2>
      
      {/* Cart Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Tóm tắt đơn hàng</h3>
        {cart.items.map((item) => (
          <div key={item._id} className="flex justify-between items-center mb-2">
            <span>{item.name} x {item.quantity}</span>
            <span>{cartService.formatPrice(item.subtotal)}</span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{cartService.formatPrice(cart.summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Phí giao hàng:</span>
            <span>{cartService.formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng cộng:</span>
            <span className="text-red-600">{cartService.formatPrice(finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Guest Information Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Thông tin khách hàng</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full p-3 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nguyễn Văn A"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className={`w-full p-3 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0123456789"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Delivery Type */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Hình thức nhận hàng</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="deliveryType"
                value="delivery"
                checked={formData.deliveryType === 'delivery'}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryType: e.target.value as 'delivery' }))}
                className="mr-2"
              />
              <span>Giao hàng tận nơi (+30,000đ)</span>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="deliveryType"
                value="pickup"
                checked={formData.deliveryType === 'pickup'}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryType: (e.target.value === 'pickup' ? 'pickup' : 'delivery') as 'pickup' | 'delivery' }))}
                className="mr-2"
              />
              <span>Lấy tại cửa hàng</span>
            </label>
          </div>
        </div>

        {/* Address (only for delivery) */}
        {formData.deliveryType === 'delivery' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Địa chỉ giao hàng</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className={`w-full p-3 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Số nhà, tên đường, phường/xã..."
                rows={3}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Quận 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="TP. Hồ Chí Minh"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Phương thức thanh toán</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={formData.paymentMethod === 'cash'}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' }))}
                className="mr-2"
              />
              <span>Tiền mặt</span>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="momo"
                checked={formData.paymentMethod === 'momo'}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'momo' }))}
                className="mr-2"
              />
              <span>Ví MoMo</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Ghi chú đơn hàng</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú cho khách hàng</label>
            <textarea
              value={formData.customerNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Ghi chú về đơn hàng, thời gian giao..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú cho bếp</label>
            <textarea
              value={formData.kitchenNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, kitchenNotes: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Yêu cầu về món ăn: ít cay, nhiều rau..."
              rows={2}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
          } transition-colors`}
        >
          {loading ? 'Đang xử lý...' : `Đặt hàng - ${cartService.formatPrice(finalTotal)}`}
        </button>
      </form>
    </div>
  );
};

export default GuestCheckout;