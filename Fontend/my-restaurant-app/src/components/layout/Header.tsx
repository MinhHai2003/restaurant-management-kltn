import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import UserProfile from '../auth/UserProfile';
import './Header.css';

const Header: React.FC = () => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
      {/* Main Header - Modern Purple Gradient */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)', 
        backgroundSize: '200% 200%',
        animation: 'gradientShift 10s ease infinite',
        color: 'white', 
        padding: '0.75rem 0',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'visible',
        zIndex: 1000
      }}>
        <div className="container header-main-container">
          {/* Mobile: First Row - Logo, Menu Toggle, Cart */}
          <div className="header-top-row">
            {/* Mobile Menu Toggle Button */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                display: 'none',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1.5rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              ☰
            </button>

            {/* Logo Section */}
            <a href="/" className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '2rem' }}>🦀</span>
              </div>
              <div className="header-logo-text">
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

            {/* Mobile Cart Icon */}
            <div className="mobile-cart-icon" style={{ position: 'relative', display: 'none' }}>
              <a href="/gio-hang" style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '0.5rem',
                  borderRadius: '12px',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🛒</span>
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-0.25rem',
                      right: '-0.25rem',
                      background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                      color: 'white',
                      fontSize: '0.75rem',
                      borderRadius: '50%',
                      width: '1.25rem',
                      height: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(240, 147, 251, 0.5)'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </div>
              </a>
            </div>
          </div>

          {/* Desktop: All content in one row */}
          <div className="header-desktop-content" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '1rem',
            width: '100%'
          }}>
            {/* Desktop Logo (hidden on mobile) */}
            <a href="/" className="header-desktop-logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
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
            <div className="header-search" style={{ 
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
                background: 'linear-gradient(135deg, #f093fb, #4facfe)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '0 10px 10px 0',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)',
                transition: 'all 0.3s ease'
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
            <div className="header-right" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2rem',
              fontSize: '0.9rem',
              position: 'relative',
              zIndex: 100
            }}>
              {/* Phone Number */}
              <div className="header-phone" style={{ textAlign: 'center' }}>
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
              <div className="header-delivery" style={{ 
                background: 'linear-gradient(135deg, #f093fb, #4facfe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textShadow: '0 0 20px rgba(240, 147, 251, 0.5)'
              }}>
                ⚡Giao Hàng 2H
              </div>

              {/* Login/Register or User Profile */}
              <div className="header-auth">
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
              </div>

              {/* Cart (Desktop) */}
              <div className="header-cart-desktop" style={{ position: 'relative' }}>
                <a href="/gio-hang" style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>🛒</span>
                    {cartCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-0.25rem',
                        right: '-0.25rem',
                        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                        color: 'white',
                        fontSize: '0.75rem',
                        borderRadius: '50%',
                        width: '1.25rem',
                        height: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(240, 147, 251, 0.5)'
                      }}>
                        {cartCount}
                      </span>
                    )}
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Mobile: Second Row - Search Bar */}
          <div className="header-mobile-search" style={{ 
            display: 'none',
            width: '100%',
            marginTop: '0.75rem'
          }}>
            <div style={{ display: 'flex', width: '100%' }}>
              <input
                id="mobile-search-input"
                type="text"
                placeholder="Tìm kiếm trên nhà hàng hải sản..."
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '6px 0 0 6px',
                  outline: 'none',
                  fontSize: '1rem'
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
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '0 6px 6px 0',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
              onClick={() => {
                const el = document.getElementById('mobile-search-input') as HTMLInputElement | null;
                const value = el?.value.trim();
                if (value) window.location.href = `/search?q=${encodeURIComponent(value)}`;
              }}
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Desktop */}
      <div className="header-nav-desktop" style={{ 
        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)', 
        borderTop: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 2px 10px rgba(102, 126, 234, 0.2)',
        position: 'relative',
        zIndex: 50
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* DANH MỤC - Special styling with Dropdown */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '0 2rem',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                borderRight: '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
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
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08))';
                        e.currentTarget.style.color = '#667eea';
                        e.currentTarget.style.transform = 'translateX(8px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#64748b';
                        e.currentTarget.style.transform = 'translateX(0)';
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

      {/* Mobile Menu Sidebar */}
      {showMobileMenu && (
        <>
          {/* Overlay */}
          <div 
            className="mobile-menu-overlay"
            onClick={() => setShowMobileMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              display: 'none'
            }}
          />
          
          {/* Sidebar */}
          <div 
            className="mobile-menu-sidebar"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              background: 'white',
              boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
              zIndex: 1000,
              overflowY: 'auto',
              display: 'none',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 10px rgba(102, 126, 234, 0.2)'
            }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                DANH MỤC
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Menu Items */}
            <div style={{ flex: 1 }}>
              {/* Auth section for mobile - Show at top if not logged in */}
              {!user && (
                <div style={{
                  padding: '1rem 1.5rem',
                  background: '#f0f9ff',
                  borderBottom: '2px solid #e0f2fe',
                  display: 'flex',
                  gap: '0.75rem'
                }}>
                  <a
                    href="/login"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      borderRadius: '10px',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    🔐 Đăng nhập
                  </a>
                  <a
                    href="/register"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      color: '#667eea',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      borderRadius: '10px',
                      border: '2px solid #667eea',
                      gap: '0.5rem',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                    }}
                  >
                    ✍️ Đăng ký
                  </a>
                </div>
              )}

              {/* User info for logged in users */}
              {user && (
                <div style={{
                  padding: '1rem 1.5rem',
                  background: '#f0fdf4',
                  borderBottom: '2px solid #d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#10b981',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    {user.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#065f46', fontSize: '0.95rem' }}>
                      {user.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {user.email}
                    </div>
                  </div>
                </div>
              )}

              {/* Menu categories - ALIGN LEFT */}
              {menuCategories.map((category, index) => (
                <a
                  key={index}
                  href={category.link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '1rem 1.5rem',
                    color: '#475569',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    borderBottom: '1px solid #f1f5f9',
                    gap: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  {index === 0 && '🍚'}
                  {index === 1 && '🦐'}
                  {index === 2 && '🥘'}
                  {index === 3 && '🥙'}
                  {index === 4 && '🍹'}
                  {index === 5 && '📞'}
                  {index === 6 && '🍽️'}
                  {index === 7 && '👍'}
                  <span>{category.name}</span>
                </a>
              ))}

              {/* Account link for logged in users */}
              {user && (
                <>
                  <a
                    href="/account"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: '1rem 1.5rem',
                      color: '#475569',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      borderBottom: '1px solid #f1f5f9',
                      gap: '0.75rem',
                      textAlign: 'left'
                    }}
                  >
                    👤 <span>Tài khoản của tôi</span>
                  </a>
                  <button
                    onClick={() => {
                      // Get logout function from auth context
                      const confirmed = window.confirm('Bạn có chắc muốn đăng xuất?');
                      if (confirmed) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: '1rem 1.5rem',
                      color: '#dc2626',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      borderBottom: '1px solid #f1f5f9',
                      gap: '0.75rem',
                      background: 'white',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    🚪 <span>Đăng xuất</span>
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Hotline
              </div>
              <a href="tel:0936253588" style={{
                display: 'block',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#0ea5e9',
                textDecoration: 'none'
              }}>
                0936.253.588
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
