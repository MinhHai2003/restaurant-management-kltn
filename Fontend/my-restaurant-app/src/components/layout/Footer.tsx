import { companyInfo } from '../../data/products';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      {/* Partners Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '2rem 0',
        boxShadow: '0 -4px 20px rgba(102, 126, 234, 0.2)'
      }}>
        <div className="container">
          <h3 style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem', 
            fontSize: '1.5rem', 
            fontWeight: '700',
            background: 'linear-gradient(135deg, #ffffff, #f0f9ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ✨ Đối tác của Siêu thị hải sản Biển đông
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {companyInfo.partners.map((partner, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                color: '#667eea',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontWeight: 'bold',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.3)';
                e.currentTarget.style.background = 'rgba(255,255,255,1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
              }}
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container" style={{ padding: '3rem 0' }}>
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <h4>THÔNG TIN</h4>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{companyInfo.name}</p>
              <p style={{ color: '#3b82f6', fontWeight: '600', fontSize: '0.95rem' }}>📞 {companyInfo.phone} - {companyInfo.phone2}</p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>({companyInfo.workingHours})</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              {companyInfo.addresses.map((address, index) => (
                <p key={index} style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>📍 {address}</p>
              ))}
            </div>
            <div>
              <a href="/dat-ban">Đặt bàn</a>
              <a href="/he-thong-cua-hang">Hệ Thống Cửa Hàng</a>
              <a href="/tin-tuc">Chính sách - Tin tức</a>
              <a href={companyInfo.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
            </div>
          </div>

          {/* Products */}
          <div className="footer-section">
            <h4>SẢN PHẨM</h4>
            <a href="/sp/com-chien-pho/all">Cơm chiên & Phở</a>
            <a href="/sp/hai-san-nuong/all">Hải sản & Nướng</a>
            <a href="/sp/lau-canh/all">Lẩu  & Canh</a>
            <a href="/sp/banh-goi-cuon/all">Bánh & Gỏi cuốn</a>
            <a href="/sp/nuoc-uong-trang-mieng/all">Nước uống & Tráng miệng</a>
            <a href="/sp/san-pham-khuyen-mai/all">Sản Phẩm Khuyến Mãi</a>
          </div>

          {/* Contact & Services */}
          <div className="footer-section">
            <h4>DỊCH VỤ</h4>
            {/* Delivery Info */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              padding: '1.25rem',
              borderRadius: '16px',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              <h5 style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>🚚 GIAO HÀNG 2H</h5>
              <p style={{ fontSize: '0.9rem' }}>Đổi trả miễn phí</p>
            </div>
            
            {/* Hotline */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              padding: '1.25rem',
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              <h5 style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>📞 TƯ VẤN ĐẶT HÀNG</h5>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{companyInfo.phone}</p>
              <p style={{ fontSize: '0.9rem' }}>({companyInfo.workingHours})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <p>© 2024 Hệ thống hải sản Biển Đông. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
