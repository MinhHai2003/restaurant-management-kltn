import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import UserProfile from '../auth/UserProfile';

const Header: React.FC = () => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const { user } = useAuth();
  const { cartCount, refreshCart } = useCart();

  // Categories từ menu data - Simple list như trong hình
  const menuCategories = [
    { name: "CƠM CHIÊN & PHỞ", link: "/menu/com-chien-pho" },
    { name: "HẢI SẢN & NƯỚNG", link: "/menu/hai-san-nuong" },
    { name: "LẨU  & CANH", link: "/menu/lau-canh" },
    { name: "BÁNH & GỎI CUỐN", link: "/menu/banh-goi-cuon" },
    { name: "NƯỚC UỐNG & TRÁNG MIỆNG", link: "/menu/nuoc-uong-trang-mieng" },
    { name: "Liên hệ nhà hàng", link: "/lien-he" },
    { name: "Đặt bàn", link: "/dat-ban" },
    { name: "Facebook", link: "https://facebook.com" }
  ];

  // Refresh cart count on mount to ensure up-to-date count
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <header className="header">
      {/* Main Header - Single Blue Bar with all content */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
        color: 'white', 
        padding: '0.75rem 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Logo Section */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '2rem' }}>🦀</span>
            </div>
            <div>
              <h1 style={{ 
                color: 'white', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                margin: 0,
                lineHeight: 1,
              }}>
                NHÀ HÀNG
              </h1>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: 'bold',
                color: '#fbbf24',
                lineHeight: 1
              }}>
                HẢI SẢN BIỂN ĐÔNG
              </div>
            </div>
          </a>

          {/* Search Bar */}
          <div style={{ 
            flex: 1, 
            maxWidth: '400px', 
            display: 'flex',
            margin: '0 2rem'
          }}>
            <input
              id="global-search-input"
              type="text"
              placeholder="Tìm kiếm trên nhà hàng hải sản Biển đông"
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '6px 0 0 6px',
                outline: 'none',
                fontSize: '0.9rem'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.currentTarget as HTMLInputElement).value.trim();
                  if (value) window.location.href = `/search?q=${encodeURIComponent(value)}`;
                }
              }}
            />
            <button style={{
              background: '#fbbf24',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0 6px 6px 0',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
            onClick={() => {
              const el = document.getElementById('global-search-input') as HTMLInputElement | null;
              const value = el?.value.trim();
              if (value) window.location.href = `/search?q=${encodeURIComponent(value)}`;
            }}
            >
              🔍
            </button>
          </div>

          {/* Right Section */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2rem',
            fontSize: '0.9rem'
          }}>
            {/* Phone Number */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: '#fbbf24',
                lineHeight: 1
              }}>
                0936.253.588
              </div>
              <div style={{ 
                fontSize: '0.8rem',
                opacity: 0.9,
                lineHeight: 1
              }}>
                (8h-21h từ T2-Chủ Nhật)
              </div>
            </div>

            {/* Delivery Info */}
            <div style={{ 
              color: '#fbbf24',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              ⚡Giao Hàng 2H
            </div>

            {/* Login/Register or User Profile */}
            {user ? (
              <UserProfile />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <a href="/login" style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  Đăng nhập
                </a>
                <a href="/register" style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  Đăng ký
                </a>
              </div>
            )}

            {/* Cart */}
            <div style={{ position: 'relative' }}>
              <a href="/gio-hang" style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🛒</span>
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-0.25rem',
                      right: '-0.25rem',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.75rem',
                      borderRadius: '50%',
                      width: '1.25rem',
                      height: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* DANH MỤC - Special styling with Dropdown */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: '#0284c7',
                padding: '0 2rem',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
              onMouseOver={(e) => e.currentTarget.style.background = '#0369a1'}
              onMouseOut={(e) => e.currentTarget.style.background = '#0284c7'}
              >
                <span style={{ fontSize: '1.1rem' }}>☰</span>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  color: 'white'
                }}>
                  DANH MỤC
                </span>
              </div>

              {/* Dropdown Menu */}
              {showCategoryDropdown && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '280px',
                    background: 'white',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    borderRadius: '0 0 8px 8px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}
                  onMouseEnter={() => setShowCategoryDropdown(true)}
                  onMouseLeave={() => setShowCategoryDropdown(false)}
                >
                  {menuCategories.map((category, index) => (
                    <a
                      key={index}
                      href={category.link}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem 1.5rem',
                        color: '#64748b',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        borderBottom: index < menuCategories.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.color = '#0ea5e9';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#64748b';
                      }}
                    >
                      <span style={{ 
                        marginRight: '0.75rem',
                        color: '#94a3b8',
                        fontSize: '0.8rem'
                      }}>
                        —
                      </span>
                      {category.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Other Navigation Items */}
            <div style={{ display: 'flex', flex: 1 }}>
              <a href="/khuyen-mai" style={{
                color: 'white',
                textDecoration: 'none',
                padding: '0 1.5rem',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.3s ease',
                flex: 1,
                justifyContent: 'center',
                borderRight: '1px solid rgba(255,255,255,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '1.1rem' }}>🏷️</span>
                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>BẢNG GIÁ KHUYẾN MÃI</span>
              </a>

              <a href="/he-thong-cua-hang" style={{
                color: 'white',
                textDecoration: 'none',
                padding: '0 1.5rem',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.3s ease',
                flex: 1,
                justifyContent: 'center',
                borderRight: '1px solid rgba(255,255,255,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '1.1rem' }}>🏪</span>
                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>HỆ THỐNG CỬA HÀNG</span>
              </a>

              <a href="/dat-ban" style={{
                color: 'white',
                textDecoration: 'none',
                padding: '0 1.5rem',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.3s ease',
                flex: 1,
                justifyContent: 'center',
                borderRight: '1px solid rgba(255,255,255,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '1.1rem' }}>🍽️</span>
                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>ĐẶT BÀN NGAY</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
