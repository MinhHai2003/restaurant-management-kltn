import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { cartService } from '../services/cartService';
import type { Cart, CartItem } from '../services/cartService';
import { useCart } from '../contexts/CartContext';
const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const { refreshCart } = useCart();

  // Load cart data
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const result = await cartService.getCart();
      if (result.success && result.data) {
        setCart(result.data.cart);
      } else {
        setError(result.error || 'Không thể tải giỏ hàng');
      }
    } catch {
      setError('Có lỗi xảy ra khi tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await cartService.updateCartItem(itemId, newQuantity);
      if (result.success && result.data) {
        setCart(result.data.cart);
      } else {
        setError(result.error || 'Không thể cập nhật sản phẩm');
      }
    } catch {
      setError('Có lỗi xảy ra khi cập nhật sản phẩm');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await cartService.removeFromCart(itemId);
      if (result.success && result.data) {
        setCart(result.data.cart);
        await refreshCart();
        
      } else {
        setError(result.error || 'Không thể xóa sản phẩm');
      }
    } catch {
      setError('Có lỗi xảy ra khi xóa sản phẩm');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
    
    try {
      const result = await cartService.clearCart();
      if (result.success && result.data) {
        setCart(result.data.cart);
        await refreshCart();
      }
    } catch {
      setError('Có lỗi xảy ra khi xóa giỏ hàng');
    }
  };

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
      return;
    }
    // Pass notes to checkout page via navigation state
    navigate('/checkout', { state: { notes } });
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
          Đang tải giỏ hàng...
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
            <span>Giỏ hàng: {cart?.items.length || 0} sản phẩm - {formatPrice(cart?.summary.total || 0)}</span>
          </div>

          {/* Page Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            GIỎ HÀNG
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

          {!cart || cart.items.length === 0 ? (
            // Empty cart
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '60px 40px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛒</div>
              <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '12px' }}>
                Giỏ hàng của bạn đang trống
              </h2>
              <p style={{ color: '#64748b', marginBottom: '30px' }}>
                Hãy thêm sản phẩm yêu thích vào giỏ hàng để tiếp tục mua sắm!
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(14, 165, 233, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Tiếp tục mua hàng
              </button>
            </div>
          ) : (
            // Cart with items
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}
            className="cart-page-layout"
            >
              {/* Cart Items */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              className="cart-items-container"
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '30px',
                  borderBottom: '2px solid #f1f5f9',
                  paddingBottom: '20px'
                }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                    Sản phẩm trong giỏ ({cart.items.length})
                  </h2>
                  {cart.items.length > 0 && (
                    <button
                      onClick={clearCart}
                      style={{
                        background: 'none',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {cart.items.map((item: CartItem) => (
                    <div
                      key={item._id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr auto auto auto',
                        gap: '20px',
                        alignItems: 'center',
                        padding: '20px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        background: updatingItems.has(item._id) ? '#f8fafc' : 'white',
                        opacity: updatingItems.has(item._id) ? 0.7 : 1,
                        transition: 'all 0.3s ease'
                      }}
                      className="cart-item-row"
                    >
                      {/* Product Image */}
                      <div style={{
                        width: '100px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f1f5f9'
                      }}>
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&h=80&fit=crop'}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '4px'
                        }}>
                          {item.name}
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#64748b',
                          marginBottom: '8px'
                        }}>
                          Đơn giá: {formatPrice(item.price)}
                        </p>
                        {item.customizations && (
                          <p style={{
                            fontSize: '13px',
                            color: '#64748b',
                            fontStyle: 'italic'
                          }}>
                            Ghi chú: {item.customizations}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div 
                      className="cart-item-quantity"
                      data-subtotal={formatPrice(item.subtotal)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          disabled={updatingItems.has(item._id) || item.quantity <= 1}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: '#64748b'
                          }}
                        >
                          -
                        </button>
                        <span style={{
                          minWidth: '40px',
                          textAlign: 'center',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          disabled={updatingItems.has(item._id)}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: '#64748b'
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div 
                      className="cart-item-subtotal"
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1e293b',
                        textAlign: 'right'
                      }}>
                        {formatPrice(item.subtotal)}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item._id)}
                        disabled={updatingItems.has(item._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '20px',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title="Xóa sản phẩm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div 
              className="cart-summary-sidebar"
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '20px',
                height: 'fit-content'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '20px'
                }}>
                  Tóm tắt đơn hàng
                </h3>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tạm tính:</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart.summary.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Phí giao hàng:</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart.summary.deliveryFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Thuế VAT (8%):</span>
                    <span style={{ fontWeight: '500' }}>{formatPrice(cart.summary.tax)}</span>
                  </div>
                  
                  {/* Luôn hiển thị breakdown nếu có discount */}
                  {cart.summary.discount > 0 && (
                    <div style={{ 
                      borderTop: '1px dashed #e2e8f0', 
                      paddingTop: '8px', 
                      marginTop: '8px' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#22c55e', fontWeight: '500', fontSize: '14px' }}>💰 Các khoản giảm giá</span>
                      </div>
                      
                      {(() => {
                        const totalDiscount = cart.summary.discount;
                        const appliedCoupon = cart.appliedCoupon;
                        
                        if (appliedCoupon && appliedCoupon.code) {
                          // Có coupon được áp dụng
                          return (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span style={{ color: '#64748b' }}>• Mã giảm giá ({appliedCoupon.code}):</span>
                              <span style={{ color: '#22c55e' }}>-{formatPrice(totalDiscount)}</span>
                            </div>
                          );
                        } else {
                          // Không có coupon, có thể là membership discount
                          const subtotal = cart.summary.subtotal;
                          const discountRate = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
                          
                          if (discountRate >= 4 && discountRate <= 16) {
                            // Có vẻ như membership discount (5%, 10%, 15%)
                            const roundedRate = Math.round(discountRate);
                            return (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#64748b' }}>• Giảm giá thành viên ({roundedRate}%):</span>
                                <span style={{ color: '#22c55e' }}>-{formatPrice(totalDiscount)}</span>
                              </div>
                            );
                          } else {
                            return (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#64748b' }}>• Tổng giảm giá:</span>
                                <span style={{ color: '#22c55e' }}>-{formatPrice(totalDiscount)}</span>
                              </div>
                            );
                          }
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div style={{
                  borderTop: '2px solid #f1f5f9',
                  paddingTop: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    <span>Tổng tiền:</span>
                    <span style={{ color: '#dc2626' }}>{formatPrice(cart.summary.total)}</span>
                  </div>
                  
                  {/* Hiển thị số tiền tiết kiệm */}
                  {cart.summary.discount > 0 && (
                    <div style={{
                      fontSize: '14px',
                      color: '#059669',
                      textAlign: 'right',
                      marginTop: '4px'
                    }}>
                      🎉 Bạn đã tiết kiệm được {formatPrice(cart.summary.discount)}!
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '20px' }}>
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú đặc biệt cho đơn hàng..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '20px',
                  lineHeight: '1.5'
                }}>
                  Nhân Viên DVKH sẽ xác nhận lại đơn hàng của Bạn trước khi giao hàng.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={proceedToCheckout}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: 'white',
                      border: 'none',
                      padding: '16px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Tiến hành đặt hàng
                  </button>

                  <button
                    onClick={() => navigate('/')}
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
                    Tiếp tục mua hàng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
