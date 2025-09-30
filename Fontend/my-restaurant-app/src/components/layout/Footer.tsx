import { companyInfo } from '../../data/products';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      {/* Partners Section */}
      <div style={{ background: '#4b5563', padding: '2rem 0' }}>
        <div className="container">
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Đối tác của Siêu thị hải sản Biển đông
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {companyInfo.partners.map((partner, index) => (
              <div key={index} style={{
                background: 'white',
                color: '#374151',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold'
              }}>
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
              <p style={{ fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{companyInfo.name}</p>
              <p>📞 {companyInfo.phone} - {companyInfo.phone2}</p>
              <p style={{ fontSize: '0.875rem' }}>({companyInfo.workingHours})</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              {companyInfo.addresses.map((address, index) => (
                <p key={index} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{address}</p>
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
            <a href="/sp/hai-san-tuoi-song/all">Hải Sản Tươi Sống</a>
            <a href="/sp/hai-san-che-bien/all">Hải Sản Chế Biến</a>
            <a href="/sp/sashimi-nhat-ban/all">Sashimi Nhật Bản</a>
            <a href="/sp/mon-an-do-phu/all">Món ăn, đồ phụ</a>
            <a href="/sp/san-pham-khuyen-mai/all">Sản Phẩm Khuyến Mãi</a>
          </div>

          {/* Contact & Services */}
          <div className="footer-section">
            <h4>DỊCH VỤ</h4>
            {/* Delivery Info */}
            <div style={{
              background: '#059669',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>🚚 GIAO HÀNG 2H</h5>
              <p style={{ fontSize: '0.875rem' }}>Đổi trả miễn phí</p>
            </div>
            
            {/* Hotline */}
            <div style={{
              background: '#16a34a',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>📞 TƯ VẤN ĐẶT HÀNG</h5>
              <p style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{companyInfo.phone}</p>
              <p style={{ fontSize: '0.875rem' }}>({companyInfo.workingHours})</p>
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
