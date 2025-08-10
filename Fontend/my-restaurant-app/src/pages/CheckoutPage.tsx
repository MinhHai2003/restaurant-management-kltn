import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { cartService } from '../services/cartService';
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
    notes: ''
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('cash');

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

    loadCartData();
  }, [navigate]);

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
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
      navigate('/');
    } catch {
      alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
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
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Địa chỉ giao hàng *
                    </label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Ghi chú
                    </label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      rows={3}
                      placeholder="Ghi chú đặc biệt cho đơn hàng..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
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
