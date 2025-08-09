import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const StoreSystem: React.FC = () => {
  const stores = [
    {
      id: 1,
      name: 'Hải Sản Biển Đông - Chi nhánh 1',
      address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
      phone: '0936.253.588',
      hours: '8:00 - 22:00 (Thứ 2 - Chủ nhật)',
      image: 'https://via.placeholder.com/300x200?text=Cua+Hang+1',
      mapUrl: 'https://www.google.com/maps/search/123+Nguyễn+Văn+Linh+Q.7+TP.HCM'
    },
    {
      id: 2,
      name: 'Hải Sản Biển Đông - Chi nhánh 2',
      address: '456 Võ Văn Tần, Q.3, TP.HCM',
      phone: '0936.253.589',
      hours: '8:00 - 22:00 (Thứ 2 - Chủ nhật)',
      image: 'https://via.placeholder.com/300x200?text=Cua+Hang+2',
      mapUrl: 'https://www.google.com/maps/search/456+Võ+Văn+Tần+Q.3+TP.HCM'
    },
    {
      id: 3,
      name: 'Hải Sản Biển Đông - Chi nhánh 3',
      address: '789 Lê Lợi, Q.1, TP.HCM',
      phone: '0936.253.590',
      hours: '8:00 - 22:00 (Thứ 2 - Chủ nhật)',
      image: 'https://via.placeholder.com/300x200?text=Cua+Hang+3',
      mapUrl: 'https://www.google.com/maps/search/789+Lê+Lợi+Q.1+TP.HCM'
    }
  ];

  const handleViewOnMap = (mapUrl: string) => {
    window.open(mapUrl, '_blank');
  };

  const handleBookTable = () => {
    alert('Chức năng đặt bàn đang được phát triển!');
  };

  return (
    <div className="store-system-page">
      <Header />
      
      <main className="main-content">
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{
          background: '#f8f9fa',
          padding: '1rem 0',
          borderBottom: '1px solid #dee2e6'
        }}>
          <div className="container">
            <nav>
              <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>Trang chủ</a>
              <span style={{ margin: '0 0.5rem', color: '#6c757d' }}>/</span>
              <span style={{ color: '#6c757d' }}>Hệ thống cửa hàng</span>
            </nav>
          </div>
        </div>

        {/* Page Header */}
        <div className="page-header" style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          color: 'white',
          padding: '3rem 0',
          textAlign: 'center'
        }}>
          <div className="container">
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              HỆ THỐNG CỬA HÀNG
            </h1>
            <p style={{
              fontSize: '1.2rem',
              opacity: 0.9,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Hệ thống nhà hàng hải sản Biển Đông với các chi nhánh trên toàn thành phố
            </p>
          </div>
        </div>

        {/* Store List */}
        <div className="store-list" style={{
          padding: '3rem 0'
        }}>
          <div className="container">
            <div className="stores-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
              marginBottom: '3rem'
            }}>
              {stores.map((store) => (
                <div key={store.id} className="store-card" style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease'
                }}>
                  <div className="store-image" style={{
                    height: '200px',
                    background: `url(${store.image}) center/cover`,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: '#28a745',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      Đang hoạt động
                    </div>
                  </div>
                  
                  <div className="store-info" style={{
                    padding: '1.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      marginBottom: '1rem',
                      color: '#0284c7'
                    }}>
                      {store.name}
                    </h3>
                    
                    <div className="store-details" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#0284c7', fontSize: '1.1rem' }}>📍</span>
                        <span style={{ color: '#6c757d' }}>{store.address}</span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#0284c7', fontSize: '1.1rem' }}>📞</span>
                        <a 
                          href={`tel:${store.phone}`}
                          style={{ 
                            color: '#0284c7', 
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            textDecoration: 'none'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {store.phone}
                        </a>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#0284c7', fontSize: '1.1rem' }}>⏰</span>
                        <span style={{ color: '#6c757d' }}>{store.hours}</span>
                      </div>
                    </div>
                    
                    <div className="store-actions" style={{
                      marginTop: '1.5rem',
                      display: 'flex',
                      gap: '1rem'
                    }}>
                      <button 
                        onClick={() => handleViewOnMap(store.mapUrl)}
                        style={{
                          flex: 1,
                          background: '#0284c7',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#0369a1'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#0284c7'}
                      >
                        Xem trên bản đồ
                      </button>
                      
                      <button 
                        onClick={handleBookTable}
                        style={{
                          flex: 1,
                          background: '#fbbf24',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f59e0b'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#fbbf24'}
                      >
                        Đặt bàn ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Section */}
            <div className="map-section" style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div className="map-header" style={{
                background: '#0284c7',
                color: 'white',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  VỊ TRÍ CÁC CHI NHÁNH
                </h2>
              </div>
              
              <div className="map-container" style={{ padding: '1rem' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3251826451947!2d106.66408731480082!3d10.786834992313708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ed2392c44df%3A0xd2ecb62e0d050fe9!2sBen%20Thanh%20Market!5e0!3m2!1sen!2s!4v1642567890123!5m2!1sen!2s"
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Vị trí cửa hàng"
                ></iframe>
              </div>
            </div>

            {/* Contact Info */}
            <div className="contact-info" style={{
              marginTop: '3rem',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#0284c7'
              }}>
                LIÊN HỆ VỚI CHÚNG TÔI
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                marginTop: '1.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
                  <div style={{ fontWeight: 'bold', color: '#0284c7' }}>Hotline</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>
                    0936.253.588
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                  <div style={{ fontWeight: 'bold', color: '#0284c7' }}>Email</div>
                  <div style={{ color: '#6c757d' }}>info@haisanbiendong.vn</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                  <div style={{ fontWeight: 'bold', color: '#0284c7' }}>Giao hàng</div>
                  <div style={{ color: '#28a745', fontWeight: 'bold' }}>Trong vòng 2 giờ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StoreSystem;
