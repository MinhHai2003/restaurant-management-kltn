import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const StoreSystemPage: React.FC = () => {
  const stores = [
    {
      id: 1,
      name: 'Cơ sở 1',
      address: 'Số 2 ngõ 84 phố Trần Thái Tông, Cầu Giấy, Hà Nội',
      hotline: '0902147886 - 0936253588',
      image: 'https://via.placeholder.com/400x300'
    },
    {
      id: 2,
      name: 'Cơ sở 3',
      address: 'Số 794 đường Láng - Quận Đống Đa - Hà Nội',
      hotline: '0898080794 - 0977910986',
      image: 'https://via.placeholder.com/400x300'
    },
    {
      id: 3,
      name: 'Cơ sở 6',
      address: 'Phong Lan 01-01, Khu Đô Thị Vinhomes Riverside The Harmony, Quận Long Biên (mặt đường Nguyễn Lam - cạnh cổng an ninh 34)',
      hotline: '0906263616 – 0363283898',
      image: 'https://via.placeholder.com/400x300'
    }
  ];

  const partners = [
    { name: 'TIKI', logo: '🛒' },
    { name: 'GRABMART', logo: '🚗' },
    { name: 'SHOPEE FOOD', logo: '🍔' },
    { name: 'BAEMIN', logo: '🥘' },
    { name: 'NOW', logo: '⚡' },
    { name: 'GOJEK', logo: '🏍️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white py-4 border-b">
        <div className="container">
          <div className="breadcrumb">
            <a href="/" className="breadcrumb-link">Trang chủ</a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Cửa Hàng</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            CỬA HÀNG / SIÊU THỊ
          </h1>
          <div style={{
            width: '100px',
            height: '3px',
            background: 'linear-gradient(90deg, #0ea5e9, #0284c7)',
            margin: '0 auto'
          }}></div>
        </div>

        {/* Store Locations */}
        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {stores.map((store) => (
            <div key={store.id} style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            }}
            >
              {/* Store Image */}
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '3rem'
              }}>
                🏪
              </div>

              {/* Store Info */}
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#1e40af',
                  marginBottom: '1rem'
                }}>
                  {store.name}
                </h3>

                {/* Address */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}>
                    📍
                  </div>
                  <div style={{
                    flex: 1,
                    color: '#374151',
                    lineHeight: '1.5'
                  }}>
                    {store.address}
                  </div>
                </div>

                {/* Hotline */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    background: '#22c55e',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}>
                    📞
                  </div>
                  <div style={{
                    color: '#1e40af',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}>
                    {store.hotline}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem'
                }}>
                  <button style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    📞 Gọi ngay
                  </button>
                  <button style={{
                    flex: 1,
                    background: '#22c55e',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🗺️ Xem đường
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Company Info */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '1rem'
          }}>
            HỆ THỐNG HẢI SẢN BIỂN ĐÔNG
          </h2>
          <div style={{
            fontSize: '1.2rem',
            color: '#374151',
            marginBottom: '1rem'
          }}>
            <strong>ĐT:</strong> 0936253588 - 0902147886
          </div>
          <div style={{
            color: '#6b7280',
            lineHeight: '1.6',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Hệ thống nhà hàng hải sản Biển Đông với nhiều cơ sở tại Hà Nội, 
            chuyên cung cấp hải sản tươi sống chất lượng cao và dịch vụ giao hàng nhanh chóng.
          </div>
        </div>

        {/* Partners Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: '#1e40af',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            Đối tác của Nhà hàng hải sản Biển Đông
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            {partners.map((partner, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {partner.logo}
                </div>
                <div style={{
                  fontWeight: 'bold',
                  color: '#374151',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  {partner.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StoreSystemPage;
