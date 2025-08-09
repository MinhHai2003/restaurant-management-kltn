import { useState } from 'react';

const Header: React.FC = () => {
  const [cartCount] = useState(0);

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>📞 0936.253.588 (8h-21h từ T2-Chủ Nhật)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/dang-nhap" style={{ color: 'inherit', textDecoration: 'none' }}>Đăng nhập</a>
            <span>/</span>
            <a href="/dang-ky" style={{ color: 'inherit', textDecoration: 'none' }}>Đăng ký</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="main-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Logo */}
          <div>
            <h1 className="logo">
              🦐 Siêu thị hải sản Biển Đông
            </h1>
          </div>

          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: '500px', display: 'flex' }}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem 0 0 0.375rem',
                outline: 'none'
              }}
            />
            <button 
              style={{
                background: '#059669',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0 0.375rem 0.375rem 0',
                cursor: 'pointer'
              }}
            >
              🔍
            </button>
          </div>

          {/* Cart */}
          <div>
            <a href="/gio-hang" style={{ position: 'relative', textDecoration: 'none' }}>
              <div style={{
                background: '#d1fae5',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                display: 'inline-block',
                transition: 'background-color 0.2s'
              }}>
                <span style={{ fontSize: '1.25rem' }}>🛒</span>
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '-0.5rem',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '50%',
                    width: '1.25rem',
                    height: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {cartCount}
                  </span>
                )}
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-menu">
        <div className="container">
          <ul>
            <li><a href="/hai-san-tuoi-song">HẢI SẢN TƯƠI SỐNG</a></li>
            <li><a href="/hai-san-che-bien">HẢI SẢN CHẾ BIẾN</a></li>
            <li><a href="/sashimi-nhat-ban">SASHIMI NHẬT BẢN</a></li>
            <li><a href="/mon-an-do-phu">MÓN ĂN, ĐỒ PHỤ</a></li>
            <li><a href="/san-pham-khuyen-mai">SẢN PHẨM KHUYẾN MÃI</a></li>
            <li><a href="/dat-ban">Đặt bàn</a></li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
