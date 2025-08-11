import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { cartService } from '../services/cartService';
import { customerService } from '../services/customerService';
import type { Address } from '../services/customerService';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import type { Cart } from '../services/cartService';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
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
    notes: ''
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


  // Load cart and addresses
  useEffect(() => {
    const loadCartData = async () => {
      try {
        setLoading(true);
        const result = await cartService.getCart();
        if (result.success && result.data) {
          setCart(result.data.cart);
          if (result.data.cart.items.length === 0) {
            navigate('/cart');
          }
        } else {
          setError(result.error || 'Không thể tải giỏ hàng');
        }
      } catch {
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
            name: customerRes.data.name || info.name,
          }));
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

    setProcessing(true);

    try {
      // Gửi thông tin đơn hàng đến API theo format mà controller mong muốn
      const orderData = {
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
          method: paymentMethod
        },
        notes: {
          customer: customerInfo.notes || '',
          kitchen: '',
          delivery: ''
        }
      };

      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      console.log('🔑 Token từ localStorage:', token ? 'Có token' : 'Không có token');
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
      
      const response = await fetch('http://localhost:5005/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        // Lấy chi tiết lỗi từ server
        const errorData = await response.json();
        console.error('❌ Chi tiết lỗi từ server:', errorData);
        throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
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

          {/* Temporary Clear Cart Button */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  const result = await cartService.clearCart();
                  if (result.success) {
                    alert('Giỏ hàng đã được xóa! Vui lòng thêm sản phẩm mới.');
                    navigate('/menu');
                  } else {
                    alert('Lỗi xóa giỏ hàng: ' + result.error);
                  }
                } catch (error) {
                  alert('Lỗi xóa giỏ hàng: ' + error);
                }
              }}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🗑️ Xóa giỏ hàng (để khắc phục lỗi menu ID)
            </button>
          </div>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tạm tính:</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart?.summary.subtotal || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Phí giao hàng:</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart?.summary.deliveryFee || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Thuế VAT:</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart?.summary.tax || 0)}</span>
                  </div>
                  {(cart?.summary.discount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#059669' }}>Giảm giá:</span>
                      <span style={{ color: '#059669', fontWeight: '500' }}>-{formatPrice(cart?.summary.discount || 0)}</span>
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
                    <span style={{ color: '#dc2626' }}>{formatPrice(cart?.summary.total || 0)}</span>
                  </div>
                </div>

                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '20px',
                  lineHeight: '1.5'
                }}>
                  Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng của chúng tôi.
                </p>

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
                    {processing ? 'Đang xử lý...' : 'ĐẶT HÀNG NGAY'}
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

      <Footer />
    </div>
  );
};

export default CheckoutPage;
