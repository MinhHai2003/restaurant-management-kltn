import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import QRPayment from '../components/QRPayment';
import { cartService } from '../services/cartService';
import { customerService } from '../services/customerService';
import orderService from '../services/orderService';
import type { Address } from '../services/customerService';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import type { Cart } from '../services/cartService';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);


  // Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    notes: (location.state && location.state.notes) ? location.state.notes : ''
  });

  // Customer membership info
  const [customerMembership, setCustomerMembership] = useState({
    membershipLevel: 'bronze',
    totalSpent: 0,
    loyaltyPoints: 0,
    totalOrders: 0
  });

  // Address selection
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressLoading, setAddressLoading] = useState(false);
  // State cho popup thêm địa chỉ mới
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'Nhà',
    address: '',
    district: '',
    city: '',
    phone: '',
    isDefault: false
  });
  const [newAddressError, setNewAddressError] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // QR Payment state
  const [showQRPayment, setShowQRPayment] = useState(false);
  
  // Generate order number at frontend
  const generateOrderNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const timeStr = now.getTime().toString().slice(-6); // 6 số cuối timestamp
    return `ORD-${dateStr}-${timeStr}`;
  };
  
  const [frontendOrderNumber] = useState(() => generateOrderNumber());
  
  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');


  // Load cart and addresses
  useEffect(() => {
    const loadCartData = async () => {
      try {
        setLoading(true);
        console.log('🛒 [FRONTEND DEBUG] Loading cart data...');
        
        const result = await cartService.getCart();
        console.log('🛒 [FRONTEND DEBUG] Cart API response:', result);
        
        if (result.success && result.data) {
          setCart(result.data.cart);
          
          console.log('🛒 [FRONTEND DEBUG] Cart summary:', {
            subtotal: result.data.cart.summary?.subtotal,
            loyaltyDiscount: result.data.cart.summary?.loyaltyDiscount,
            couponDiscount: result.data.cart.summary?.couponDiscount,
            discount: result.data.cart.summary?.discount,
            total: result.data.cart.summary?.total,
            deliveryFee: result.data.cart.summary?.deliveryFee
          });
          
          console.log('🛒 [FRONTEND DEBUG] Applied coupon:', result.data.cart.appliedCoupon);
          
          if (result.data.cart.items.length === 0) {
            navigate('/cart');
          }
        } else {
          console.error('🛒 [FRONTEND DEBUG] Cart loading failed:', result.error);
          setError(result.error || 'Không thể tải giỏ hàng');
        }
      } catch (error) {
        console.error('🛒 [FRONTEND DEBUG] Cart loading exception:', error);
        setError('Có lỗi xảy ra khi tải giỏ hàng');
      } finally {
        setLoading(false);
      }
    };

    const loadAddresses = async () => {
      setAddressLoading(true);
      try {
        const res = await customerService.getAddresses();
        if (res.success && res.data) {
          setAddresses(res.data);
          // Chọn mặc định nếu có
          const defaultAddr = res.data.find(addr => addr.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id);
            setCustomerInfo(info => ({
              ...info,
              address: `${defaultAddr.address}${defaultAddr.district ? ', ' + defaultAddr.district : ''}${defaultAddr.city ? ', ' + defaultAddr.city : ''}`,
              phone: defaultAddr.phone || info.phone,
            }));
          }
        }
      } finally {
        setAddressLoading(false);
      }
    };

    const loadCustomerInfo = async () => {
      try {
        const customerRes = await customerService.getCustomerInfo();
        if (customerRes.success && customerRes.data) {
          setCustomerInfo(info => ({
            ...info,
            name: customerRes.data!.name,
            email: customerRes.data!.email,
            phone: customerRes.data!.phone
          }));
          
          setCustomerMembership({
            membershipLevel: customerRes.data.membershipLevel,
            totalSpent: customerRes.data.totalSpent,
            loyaltyPoints: customerRes.data.loyaltyPoints,
            totalOrders: customerRes.data.totalOrders
          });
          
          console.log('👤 [FRONTEND DEBUG] Customer membership loaded:', {
            membershipLevel: customerRes.data.membershipLevel,
            totalSpent: customerRes.data.totalSpent,
            loyaltyPoints: customerRes.data.loyaltyPoints
          });
          
          // 🔄 Force refresh cart to apply latest membership discounts
          try {
            console.log('🔄 [FRONTEND DEBUG] Attempting to refresh cart...');
            const token = localStorage.getItem('token');
            console.log('🔑 [FRONTEND DEBUG] Token exists:', !!token);
            
            if (token) {
              const refreshResponse = await fetch('http://localhost:5005/api/cart/refresh', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log('🔄 [FRONTEND DEBUG] Refresh response status:', refreshResponse.status);
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                console.log('🔄 [FRONTEND DEBUG] Cart refresh success:', refreshData);
                // Reload cart data
                await loadCartData();
              } else {
                const errorData = await refreshResponse.text();
                console.error('🔄 [FRONTEND DEBUG] Cart refresh failed:', errorData);
              }
            }
          } catch (refreshError) {
            console.error('🔄 [FRONTEND DEBUG] Cart refresh exception:', refreshError);
          }
        }
      } catch (error) {
        console.error('❌ Lỗi tải thông tin khách hàng:', error);
      }
    };

    loadCartData();
    loadAddresses();
    loadCustomerInfo();
  }, [navigate]);

  useEffect(() => {
    if (user && user.name) {
      setCustomerInfo(info => ({
        ...info,
        name: user.name,
      }));
    }
  }, [user]);

  // Khi chọn địa chỉ khác hoặc thêm mới
  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') {
      setShowNewAddressModal(true);
      setNewAddressForm({ label: 'Nhà', address: '', district: '', city: '', phone: '', isDefault: false });
      setNewAddressError('');
    } else {
      const addr = addresses.find(a => a._id === addressId);
      if (addr) {
        setCustomerInfo(info => ({
          ...info,
          address: addr.address || '',
          city: addr.city || '',
          district: addr.district || '',
          ward: '',
          phone: addr.phone || '',
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.items.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // Nếu chọn chuyển khoản thì hiển thị QR payment với mã đơn frontend
    if (paymentMethod === 'transfer') {
      console.log('🔄 [TRANSFER] Showing QR with frontend order number:', frontendOrderNumber);
      setShowQRPayment(true);
      return;
    }

    // Chỉ xử lý đặt hàng cho COD
    await processOrder();
  };

  const processOrder = async () => {
    setProcessing(true);

    try {
      // Calculate final pricing with frontend discount
      const subtotal = cart.summary.subtotal || 0;
      const tax = cart.summary.tax || 0;
      const deliveryFee = cart.summary.deliveryFee || 0;
      const membershipLevel = customerMembership?.membershipLevel || 'bronze';
      
      const membershipRates: Record<string, number> = { 
        bronze: 0, silver: 0.05, gold: 0.1, platinum: 0.15 
      };
      const loyaltyDiscount = Math.round(subtotal * (membershipRates[membershipLevel] || 0));
      const adjustedDeliveryFee = ['gold', 'platinum'].includes(membershipLevel) ? 0 : deliveryFee;
      
      // Get coupon discount from cart (if any coupon applied)
      const couponDiscount = cart.summary.couponDiscount || 0;
      const totalDiscount = loyaltyDiscount + couponDiscount;
      const finalTotal = subtotal + tax + adjustedDeliveryFee - totalDiscount;
      
      console.log('💰 [ORDER SUBMIT] Calculated pricing:', {
        subtotal,
        tax,
        originalDeliveryFee: deliveryFee,
        adjustedDeliveryFee,
        loyaltyDiscount,
        couponDiscount,
        totalDiscount,
        finalTotal,
        membershipLevel
      });

      // Gửi thông tin đơn hàng đến API theo format mà controller mong muốn
      const orderData = {
        // Thêm orderNumber từ frontend
        orderNumber: paymentMethod === 'transfer' ? frontendOrderNumber : undefined,
        items: cart.items.map(item => ({
          menuItemId: item.menuItemId || item._id,
          quantity: item.quantity,
          customizations: "",
          notes: ''
        })),
        delivery: {
          type: 'delivery',
          address: {
            full: customerInfo.address,
            district: customerInfo.district,
            city: customerInfo.city
          },
          instructions: customerInfo.notes || ''
        },
        payment: {
          method: paymentMethod === 'transfer' ? 'banking' : paymentMethod // Đảm bảo dùng 'banking' cho QR payment
        },
        notes: {
          customer: customerInfo.notes || '',
          kitchen: '',
          delivery: ''
        },
        // Add calculated pricing to ensure consistency
        frontendPricing: {
          subtotal,
          tax,
          deliveryFee: adjustedDeliveryFee,
          loyaltyDiscount,
          couponDiscount,
          total: finalTotal,
          membershipLevel,
          breakdown: {
            originalDeliveryFee: deliveryFee,
            freeShipping: ['gold', 'platinum'].includes(membershipLevel)
          }
        }
      };

      // Add customer info for guest users
      if (!user) {
        console.log('👤 Guest user - Customer info state:', customerInfo);
        
        // Validate required customer info for guest users
        if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
          setError('Vui lòng điền đầy đủ thông tin khách hàng (họ tên, email, số điện thoại)');
          setProcessing(false);
          return;
        }
        
        (orderData as any).customerInfo = {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        };
        console.log('✅ Added customerInfo to orderData:', (orderData as any).customerInfo);
      }

      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      console.log('🔑 Token từ localStorage:', token ? 'Có token' : 'Không có token');
      console.log('👤 User state:', user ? 'Authenticated' : 'Guest');
      console.log('📦 Dữ liệu gửi đi:', orderData);
      console.log('🍽️ Menu items trong cart:', cart.items.map(item => ({ 
        cartItemId: item._id, 
        menuItemId: item.menuItemId,
        name: item.name 
      })));
      
      // Test direct menu API call
      console.log('🧪 Testing menu API directly...');
      try {
        const menuItemId = cart.items[0].menuItemId || cart.items[0]._id;
        console.log('🧪 Using menu item ID:', menuItemId);
        const testResponse = await fetch(`http://localhost:5003/api/menu/${menuItemId}`);
        console.log('🧪 Menu API test response status:', testResponse.status);
        const testData = await testResponse.text();
        console.log('🧪 Menu API test response:', testData);
      } catch (testError) {
        console.error('🧪 Menu API test failed:', testError);
      }
      
      // Use orderService for API call
      const result = await orderService.createOrder(orderData);
      console.log('✅ Đặt hàng thành công:', result);

      // Làm trống giỏ hàng - cập nhật UI ngay lập tức
      setCart(null);
      // Đồng thời cập nhật lại số lượng giỏ hàng trong context hoặc localStorage ngay lập tức
      await updateCartCount();

      // Gọi API xóa giỏ hàng ở nền, không chờ phản hồi để cải thiện tốc độ UI
      cartService.clearCart().catch(error => {
        console.error('Lỗi khi xóa giỏ hàng:', error);
      });

      alert('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');

      // Chuyển hướng về trang chủ
      navigate('/');

    } catch (error) {
      console.error('❌ Lỗi đặt hàng:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      alert(`Có lỗi xảy ra khi đặt hàng: ${errorMessage}. Vui lòng thử lại!`);
    } finally {
      setProcessing(false);
    }
  };

  // Apply coupon function
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }
    
    try {
      setCouponLoading(true);
      setCouponError('');
      
      const response = await cartService.applyCoupon(couponCode.trim());
      
      if (response.success && response.data) {
        setCart(response.data.cart);
        setCouponCode('');
        setCouponError('');
        alert(`Áp dụng mã giảm giá thành công! Tiết kiệm ${formatPrice(response.data.appliedDiscount || 0)}`);
      } else {
        setCouponError(response.error || 'Mã giảm giá không hợp lệ');
      }
    } catch (error) {
      console.error('Apply coupon error:', error);
      setCouponError('Có lỗi xảy ra khi áp dụng mã giảm giá');
    } finally {
      setCouponLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Header />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          fontSize: '18px',
          color: '#64748b'
        }}>
          Đang tải thông tin đặt hàng...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      
      <main style={{ padding: '40px 0', minHeight: '60vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          {/* Breadcrumb */}
          <div style={{ 
            marginBottom: '30px',
            fontSize: '14px',
            color: '#64748b'
          }}>
            <a href="/" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Trang chủ</a>
            <span style={{ margin: '0 8px' }}>/</span>
            <a href="/cart" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Giỏ hàng</a>
            <span style={{ margin: '0 8px' }}>/</span>
            <span>Thanh toán</span>
          </div>

          {/* Page Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            THANH TOÁN ĐẶT HÀNG
          </h1>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
              {/* Customer Information */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                height: 'fit-content'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '24px'
                }}>
                  Thông tin giao hàng
                </h2>


                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Dropdown chọn địa chỉ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                      Địa chỉ giao hàng *
                    </label>
                    {addressLoading ? (
                      <div style={{ color: '#64748b', fontSize: 14 }}>Đang tải địa chỉ...</div>
                    ) : (
                      <select
                        value={selectedAddressId}
                        onChange={e => handleSelectAddress(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16 }}
                        required
                      >
                        <option value="" disabled>Chọn địa chỉ có sẵn</option>
                        {addresses.map(addr => (
                          <option key={addr._id} value={addr._id}>
                            {addr.label} - {addr.address}{addr.district ? ', ' + addr.district : ''}{addr.city ? ', ' + addr.city : ''}
                          </option>
                        ))}
                        <option value="new">+ Thêm địa chỉ mới...</option>
                      </select>
                    )}
                  </div>

                  {/* Popup nhập địa chỉ mới giống AddressesPage */}
                  {showNewAddressModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100vw',
                      height: '100vh',
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000
                    }}>
                      <div style={{ background: '#fff', borderRadius: '10px', padding: '32px', minWidth: '400px', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ marginBottom: 16, fontSize: 20, fontWeight: 600 }}>Thêm địa chỉ mới</h3>
                        <div>
                          {/* Loại địa chỉ */}
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Loại địa chỉ *</label>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <button type="button" onClick={() => setNewAddressForm(f => ({ ...f, label: 'Nhà' }))}
                                style={{ padding: 10, border: newAddressForm.label === 'Nhà' ? '2px solid #ea580c' : '1px solid #d1d5db', borderRadius: 8, background: newAddressForm.label === 'Nhà' ? '#fff7ed' : 'white', color: newAddressForm.label === 'Nhà' ? '#c2410c' : '#374151', cursor: 'pointer' }}>
                                🏠 Nhà
                              </button>
                              <button type="button" onClick={() => setNewAddressForm(f => ({ ...f, label: 'Văn phòng' }))}
                                style={{ padding: 10, border: newAddressForm.label === 'Văn phòng' ? '2px solid #ea580c' : '1px solid #d1d5db', borderRadius: 8, background: newAddressForm.label === 'Văn phòng' ? '#fff7ed' : 'white', color: newAddressForm.label === 'Văn phòng' ? '#c2410c' : '#374151', cursor: 'pointer' }}>
                                🏢 Văn phòng
                              </button>
                            </div>
                          </div>
                          {/* Số điện thoại */}
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Số điện thoại *</label>
                            <input type="tel" value={newAddressForm.phone} required
                              onChange={e => setNewAddressForm(f => ({ ...f, phone: e.target.value }))}
                              style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                              placeholder="Nhập số điện thoại" />
                          </div>
                          {/* Tỉnh/Thành phố và Quận/Huyện */}
                          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Tỉnh/Thành phố *</label>
                              <select value={newAddressForm.city} required
                                onChange={e => setNewAddressForm(f => ({ ...f, city: e.target.value }))}
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                                <option value="">Chọn Tỉnh/Thành phố</option>
                                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="Cần Thơ">Cần Thơ</option>
                                <option value="Hải Phòng">Hải Phòng</option>
                                <option value="Nha Trang">Nha Trang</option>
                                <option value="Hạ Long">Hạ Long</option>
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Quận/Huyện *</label>
                              <select value={newAddressForm.district} required
                                onChange={e => setNewAddressForm(f => ({ ...f, district: e.target.value }))}
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                                <option value="">Chọn Quận/Huyện</option>
                                <option value="Quận 1">Quận 1</option>
                                <option value="Quận 2">Quận 2</option>
                                <option value="Quận 3">Quận 3</option>
                                <option value="Quận 4">Quận 4</option>
                                <option value="Quận 5">Quận 5</option>
                                <option value="Quận 6">Quận 6</option>
                                <option value="Quận 7">Quận 7</option>
                                <option value="Quận 8">Quận 8</option>
                                <option value="Quận 9">Quận 9</option>
                                <option value="Quận 10">Quận 10</option>
                                <option value="Quận 11">Quận 11</option>
                                <option value="Quận 12">Quận 12</option>
                                <option value="Thủ Đức">Thủ Đức</option>
                                <option value="Bình Thạnh">Bình Thạnh</option>
                                <option value="Tân Bình">Tân Bình</option>
                                <option value="Tân Phú">Tân Phú</option>
                                <option value="Phú Nhuận">Phú Nhuận</option>
                                <option value="Gò Vấp">Gò Vấp</option>
                                <option value="Bình Tân">Bình Tân</option>
                              </select>
                            </div>
                          </div>
                          {/* Địa chỉ cụ thể */}
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Địa chỉ cụ thể *</label>
                            <input type="text" value={newAddressForm.address} required
                              onChange={e => setNewAddressForm(f => ({ ...f, address: e.target.value }))}
                              style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                              placeholder="Ví dụ: Số 123 Đường ABC, Phường XYZ" />
                          </div>
                          {/* Đặt làm mặc định */}
                          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                            <input type="checkbox" id="isDefault" checked={newAddressForm.isDefault}
                              onChange={e => setNewAddressForm(f => ({ ...f, isDefault: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#ea580c', borderRadius: 4 }} />
                            <label htmlFor="isDefault" style={{ marginLeft: 12, fontSize: 14, color: '#374151', cursor: 'pointer' }}>Đặt làm địa chỉ giao hàng mặc định</label>
                          </div>
                          {newAddressError && <div style={{ color: 'red', marginBottom: 8 }}>{newAddressError}</div>}
                          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowNewAddressModal(false)}
                              style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>Hủy</button>
                            <button type="button" disabled={addingAddress}
                              onClick={async () => {
                                setAddingAddress(true);
                                setNewAddressError('');
                                console.log('🔍 Thêm địa chỉ mới:', newAddressForm);
                                try {
                                  const userToken = localStorage.getItem('token');
                                  
                                  if (userToken) {
                                    // User đã đăng nhập - lưu địa chỉ vào database
                                    const res = await customerService.addAddress(newAddressForm);
                                    console.log('📨 API response:', res);
                                    if (res.success && res.data && res.data._id) {
                                      // Reload addresses, chọn địa chỉ mới
                                      const addrRes = await customerService.getAddresses();
                                      if (addrRes.success && addrRes.data) {
                                        setAddresses(addrRes.data);
                                        setSelectedAddressId(res.data._id);
                                        setCustomerInfo(info => ({
                                          ...info,
                                        address: res.data?.address || '',
                                        city: res.data?.city || '',
                                        district: res.data?.district || '',
                                        phone: res.data?.phone || ''
                                      }));
                                    }
                                    setShowNewAddressModal(false);
                                  } else {
                                    setNewAddressError(res.error || 'Có lỗi xảy ra khi thêm địa chỉ');
                                  }
                                } else {
                                  // Guest user - lưu địa chỉ vào local state
                                  console.log('👤 Guest user - lưu địa chỉ local');
                                  const newAddress = {
                                    _id: `guest_${Date.now()}`,
                                    ...newAddressForm
                                  };
                                  
                                  // Thêm vào danh sách địa chỉ local
                                  setAddresses(prev => [...prev, newAddress]);
                                  setSelectedAddressId(newAddress._id);
                                  setCustomerInfo(info => ({
                                    ...info,
                                    address: newAddressForm.address || '',
                                    city: newAddressForm.city || '',
                                    district: newAddressForm.district || '',
                                    phone: newAddressForm.phone || ''
                                  }));
                                  setShowNewAddressModal(false);
                                }
                                } catch (error) {
                                  console.error('❌ Lỗi thêm địa chỉ:', error);
                                  setNewAddressError('Có lỗi xảy ra khi thêm địa chỉ');
                                } finally {
                                  setAddingAddress(false);
                                }
                              }}
                              style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer', opacity: addingAddress ? 0.6 : 1 }}>{addingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Họ tên */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    />
                  </div>

                  {/* Địa chỉ cụ thể */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Địa chỉ cụ thể *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address}
                      onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16 }}
                    />
                  </div>

                
                </div>

                {/* Payment Methods */}
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '16px'
                  }}>
                    Phương thức thanh toán
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: paymentMethod === 'cash' ? '#f0f9ff' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span style={{ fontSize: '16px', fontWeight: '500' }}>
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: paymentMethod === 'transfer' ? '#f0f9ff' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="payment"
                        value="transfer"
                        checked={paymentMethod === 'transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span style={{ fontSize: '16px', fontWeight: '500' }}>
                        Chuyển khoản ngân hàng
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                height: 'fit-content'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '20px'
                }}>
                  Đơn hàng của bạn
                </h3>

                {/* Order Items */}
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '20px'
                }}>
                  {cart?.items.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1e293b'
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          {formatPrice(item.price)} x {item.quantity}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {formatPrice(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {/* Calculate Frontend Discount */}
                  {(() => {
                    // Calculate discounts directly in frontend
                    const subtotal = cart?.summary.subtotal || 0;
                    const deliveryFee = cart?.summary.deliveryFee || 0;
                    const tax = cart?.summary.tax || 0;
                    
                    // Membership discount rates
                    const membershipRates: Record<string, number> = {
                      bronze: 0,      // 0%
                      silver: 0.05,   // 5%
                      gold: 0.1,      // 10%
                      platinum: 0.15  // 15%
                    };
                    
                    const membershipLevel = customerMembership?.membershipLevel || 'bronze';
                    const loyaltyDiscount = Math.round(subtotal * (membershipRates[membershipLevel] || 0));
                    
                    // Free shipping for Gold/Platinum
                    const adjustedDeliveryFee = ['gold', 'platinum'].includes(membershipLevel) ? 0 : deliveryFee;
                    const shippingSavings = deliveryFee - adjustedDeliveryFee;
                    
                    // Include both loyalty and coupon discounts in final total
                    const couponDiscount = cart?.summary.couponDiscount || 0;
                    const totalDiscount = loyaltyDiscount + couponDiscount;
                    const finalTotal = subtotal + tax + adjustedDeliveryFee - totalDiscount;
                    
                    console.log('💰 [FRONTEND DISCOUNT CALC]:', {
                      subtotal,
                      membershipLevel,
                      loyaltyDiscount,
                      couponDiscount,
                      totalDiscount,
                      originalDeliveryFee: deliveryFee,
                      adjustedDeliveryFee,
                      shippingSavings,
                      finalTotal
                    });
                    
                    return null; // Just for calculation, don't render anything
                  })()}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tạm tính:</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart?.summary.subtotal || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Phí giao hàng:</span>
                    <span style={{ fontWeight: '500' }}>
                      {(() => {
                        const membershipLevel = customerMembership?.membershipLevel || 'bronze';
                        const originalFee = cart?.summary.deliveryFee || 0;
                        const adjustedFee = ['gold', 'platinum'].includes(membershipLevel) ? 0 : originalFee;
                        
                        if (adjustedFee === 0 && originalFee > 0) {
                          return (
                            <span>
                              <s style={{ color: '#9ca3af' }}>{formatPrice(originalFee)}</s>{' '}
                              <span style={{ color: '#22c55e' }}>MIỄN PHÍ</span>
                            </span>
                          );
                        }
                        return formatPrice(adjustedFee);
                      })()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Thuế VAT (8%):</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart?.summary.tax || 0)}</span>
                  </div>
                  
                  {/* Frontend Discount Section */}
                  {(() => {
                    const membershipLevel = customerMembership?.membershipLevel || 'bronze';
                    const subtotal = cart?.summary.subtotal || 0;
                    const membershipRates: Record<string, number> = { bronze: 0, silver: 0.05, gold: 0.1, platinum: 0.15 };
                    const loyaltyDiscount = Math.round(subtotal * (membershipRates[membershipLevel] || 0));
                    const deliveryFee = cart?.summary.deliveryFee || 0;
                    const shippingSavings = ['gold', 'platinum'].includes(membershipLevel) ? deliveryFee : 0;
                    
                    return (loyaltyDiscount > 0 || shippingSavings > 0) ? (
                      <div style={{ 
                        borderTop: '1px dashed #e2e8f0', 
                        paddingTop: '8px', 
                        marginTop: '8px' 
                      }}>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Coupon Form */}
                <div style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '20px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                    🎫 Mã giảm giá
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Nhập mã giảm giá (VD: WELCOME10)"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: couponError ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit'
                        }}
                        disabled={couponLoading}
                      />
                      {couponError && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {couponError}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: couponLoading || !couponCode.trim() ? '#f1f5f9' : '#3b82f6',
                        color: couponLoading || !couponCode.trim() ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {couponLoading ? 'Đang áp dụng...' : 'Áp dụng'}
                    </button>
                  </div>
                  
                  {/* Hint về mã giảm giá */}
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    💡 Thử: WELCOME10 (giảm 10%), SAVE50K (giảm 50k), FREESHIP (miễn phí ship)
                  </div>
                  
                  {/* Hiển thị mã giảm giá đã áp dụng */}
                  {cart?.summary?.couponDiscount && cart.summary.couponDiscount > 0 && (
                    <div style={{
                      backgroundColor: '#dcfce7',
                      padding: '12px',
                      borderRadius: '8px',
                      marginTop: '12px',
                      border: '1px solid #16a34a'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{
                            color: '#15803d',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            ✅ Mã giảm giá đã áp dụng
                          </span>
                          <div style={{
                            fontSize: '12px',
                            color: '#166534',
                            marginTop: '2px'
                          }}>
                            {(() => {
                              // Hiển thị tên mã dựa trên discount amount
                              const discount = cart.summary.couponDiscount;
                              if (discount === 50000) return 'Mã: SAVE50K';
                              if (discount >= 10000 && discount <= 15000) return 'Mã: WELCOME10';
                              if (discount === 30000) return 'Mã: FREESHIP';
                              return 'Mã giảm giá';
                            })()}
                          </div>
                        </div>
                        <span style={{
                          color: '#15803d',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          -{formatPrice(cart.summary.couponDiscount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{
                  borderTop: '2px solid #f1f5f9',
                  paddingTop: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#dc2626' }}>
                      {(() => {
                        // Calculate final total with frontend discount
                        const subtotal = cart?.summary.subtotal || 0;
                        const tax = cart?.summary.tax || 0;
                        const deliveryFee = cart?.summary.deliveryFee || 0;
                        const membershipLevel = customerMembership?.membershipLevel || 'bronze';
                        
                        const membershipRates: Record<string, number> = { bronze: 0, silver: 0.05, gold: 0.1, platinum: 0.15 };
                        const loyaltyDiscount = Math.round(subtotal * (membershipRates[membershipLevel] || 0));
                        const adjustedDeliveryFee = ['gold', 'platinum'].includes(membershipLevel) ? 0 : deliveryFee;
                        
                        // Include both loyalty and coupon discounts
                        const couponDiscount = cart?.summary.couponDiscount || 0;
                        const totalDiscount = loyaltyDiscount + couponDiscount;
                        const finalTotal = subtotal + tax + adjustedDeliveryFee - totalDiscount;
                        
                        return formatPrice(finalTotal);
                      })()}
                    </span>
                  </div>
                  
                  {/* Hiển thị số tiền tiết kiệm chi tiết */}
                  {(() => {
                    const subtotal = cart?.summary.subtotal || 0;
                    const deliveryFee = cart?.summary.deliveryFee || 0;
                    const membershipLevel = customerMembership?.membershipLevel || 'bronze';
                    const membershipRates: Record<string, number> = { bronze: 0, silver: 0.05, gold: 0.1, platinum: 0.15 };
                    const loyaltyDiscount = Math.round(subtotal * (membershipRates[membershipLevel] || 0));
                    const shippingSavings = ['gold', 'platinum'].includes(membershipLevel) ? deliveryFee : 0;
                    const couponDiscount = cart?.summary.couponDiscount || 0;
                    const totalSavings = loyaltyDiscount + shippingSavings + couponDiscount;
                    
                    return totalSavings > 0 ? (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '12px',
                        border: '2px solid #22c55e'
                      }}>
                        <div style={{
                          fontSize: '16px',
                          color: '#15803d',
                          fontWeight: 'bold',
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}>
                          🎉 Tổng tiết kiệm: {formatPrice(totalSavings)}
                        </div>
                        
                        {/* Breakdown chi tiết */}
                        <div style={{ 
                          backgroundColor: 'white', 
                          padding: '12px', 
                          borderRadius: '8px',
                          border: '1px solid #bbf7d0'
                        }}>
                          <div style={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>
                            <div style={{ marginBottom: '8px', fontWeight: '600', color: '#15803d' }}>
                              📊 Chi tiết ưu đãi:
                            </div>
                            
                            {loyaltyDiscount > 0 && (
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                marginBottom: '6px',
                                padding: '4px 0'
                              }}>
                                <span>• Ưu đãi thành viên {membershipLevel.toUpperCase()} ({membershipRates[membershipLevel] * 100}%):</span>
                                <span style={{ fontWeight: '600' }}>{formatPrice(loyaltyDiscount)}</span>
                              </div>
                            )}
                            
                            {shippingSavings > 0 && (
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                marginBottom: '6px',
                                padding: '4px 0'
                              }}>
                                <span>• Miễn phí giao hàng ({membershipLevel.toUpperCase()}):</span>
                                <span style={{ fontWeight: '600' }}>{formatPrice(shippingSavings)}</span>
                              </div>
                            )}
                            
                            {couponDiscount > 0 && (
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                marginBottom: '6px',
                                padding: '4px 0'
                              }}>
                                <span>• Mã giảm giá:</span>
                                <span style={{ fontWeight: '600' }}>{formatPrice(couponDiscount)}</span>
                              </div>
                            )}
                            
                            <div style={{
                              borderTop: '1px solid #bbf7d0',
                              marginTop: '8px',
                              paddingTop: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontWeight: 'bold',
                              color: '#15803d'
                            }}>
                              <span>Tổng cộng tiết kiệm:</span>
                              <span>{formatPrice(totalSavings)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={processing}
                    style={{
                      width: '100%',
                      background: processing 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: 'white',
                      border: 'none',
                      padding: '16px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {processing 
                      ? 'Đang xử lý...' 
                      : paymentMethod === 'transfer' 
                        ? 'THANH TOÁN QR CODE' 
                        : 'ĐẶT HÀNG NGAY'
                    }
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/cart')}
                    style={{
                      width: '100%',
                      background: 'white',
                      color: '#0ea5e9',
                      border: '2px solid #0ea5e9',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0ea5e9';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#0ea5e9';
                    }}
                  >
                    Quay lại giỏ hàng
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* QR Payment Modal */}
      {showQRPayment && (
        <QRPayment 
          amount={(() => {
            // Sử dụng cùng logic tính toán như phần hiển thị UI
            const subtotal = cart?.summary.subtotal || 0;
            const tax = cart?.summary.tax || 0;
            const deliveryFee = cart?.summary.deliveryFee || 0;
            const membershipLevel = customerMembership?.membershipLevel || 'bronze';
            
            const membershipRates: Record<string, number> = { 
              bronze: 0, silver: 0.05, gold: 0.1, platinum: 0.15 
            };
            const loyaltyDiscount = Math.round(subtotal * (membershipRates[membershipLevel] || 0));
            const adjustedDeliveryFee = ['gold', 'platinum'].includes(membershipLevel) ? 0 : deliveryFee;
            
            // Include both loyalty and coupon discounts
            const couponDiscount = cart?.summary.couponDiscount || 0;
            const totalDiscount = loyaltyDiscount + couponDiscount;
            const finalTotal = subtotal + tax + adjustedDeliveryFee - totalDiscount;
            
            console.log('🔍 [QR Payment Amount] Final calculation:', {
              subtotal,
              tax,
              deliveryFee,
              adjustedDeliveryFee,
              loyaltyDiscount,
              couponDiscount,
              totalDiscount,
              finalTotal,
              membershipLevel,
              frontendOrderNumber
            });
            
            return finalTotal;
          })()}
          orderCode={frontendOrderNumber}
          orderInfo={`Thanh toán đơn hàng ${frontendOrderNumber} - ${customerInfo.name || 'GUEST'}`}
          onPaymentSuccess={async (paymentData: any) => {
            console.log('🎯 [Checkout] QR Payment confirmed:', paymentData);
            console.log('🔄 [Checkout] Creating order with frontend order number:', frontendOrderNumber);
            
            try {
              // Sau khi thanh toán thành công, tạo đơn hàng với mã đã có
              await processOrder();
              
              alert(`Thanh toán thành công! Mã đơn hàng: ${frontendOrderNumber}`);
              
              // Chuyển hướng về trang chủ
              navigate('/');
            } catch (error) {
              console.error('❌ [Checkout] Order creation failed:', error);
              alert('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
              setShowQRPayment(false);
            }
          }}
          onClose={() => setShowQRPayment(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default CheckoutPage;