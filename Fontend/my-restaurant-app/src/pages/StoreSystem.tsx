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
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop',
      mapUrl: 'https://www.google.com/maps/search/123+Nguyễn+Văn+Linh+Q.7+TP.HCM'
    },
    {
      id: 2,
      name: 'Hải Sản Biển Đông - Chi nhánh 2',
      address: '456 Võ Văn Tần, Q.3, TP.HCM',
      phone: '0936.253.589',
      hours: '8:00 - 22:00 (Thứ 2 - Chủ nhật)',
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop',
      mapUrl: 'https://www.google.com/maps/search/456+Võ+Văn+Tần+Q.3+TP.HCM'
    },
    {
      id: 3,
      name: 'Hải Sản Biển Đông - Chi nhánh 3',
      address: '789 Lê Lợi, Q.1, TP.HCM',
      phone: '0936.253.590',
      hours: '8:00 - 22:00 (Thứ 2 - Chủ nhất)',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
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
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      <Header />
      
      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '4rem 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15
          }} />
          
          <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
              }}>
                🏪 HỆ THỐNG CỬA HÀNG
              </h1>
              <p style={{
                fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                opacity: 0.95,
                lineHeight: '1.6',
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
              }}>
                Hệ thống nhà hàng hải sản Biển Đông với các chi nhánh trên toàn thành phố
              </p>
              <div style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏪</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>3</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Chi nhánh</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏰</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>8h-22h</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Mỗi ngày</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚀</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>2h</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Giao hàng</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store List */}
        <div style={{ padding: '4rem 0' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2.5rem'
            }}>
              {stores.map((store) => (
                <div key={store.id} style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(102,126,234,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                }}>
                  {/* Image */}
                  <div style={{
                    height: '240px',
                    background: `url(${store.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '0.5rem 1.2rem',
                      borderRadius: '25px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        background: 'white',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }} />
                      Đang hoạt động
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)'
                    }} />
                  </div>
                  
                  {/* Content */}
                  <div style={{ padding: '1.8rem' }}>
                    <h3 style={{
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      marginBottom: '1.2rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {store.name}
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.8rem',
                        padding: '0.8rem',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '12px'
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>📍</span>
                        <span style={{ color: '#475569', lineHeight: '1.6', flex: 1 }}>{store.address}</span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        padding: '0.8rem',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '12px'
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>📞</span>
                        <a 
                          href={`tel:${store.phone}`}
                          style={{ 
                            color: '#d97706',
                            fontWeight: 'bold',
                            fontSize: '1.15rem',
                            textDecoration: 'none',
                            flex: 1
                          }}
                        >
                          {store.phone}
                        </a>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        padding: '0.8rem',
                        background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                        borderRadius: '12px'
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>⏰</span>
                        <span style={{ color: '#831843', fontWeight: '500', flex: 1 }}>{store.hours}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{
                      marginTop: '1.5rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem'
                    }}>
                      <button 
                        onClick={() => handleViewOnMap(store.mapUrl)}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '0.9rem',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(102,126,234,0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)';
                        }}
                      >
                        🗺️ Bản đồ
                      </button>
                      
                      <button 
                        onClick={handleBookTable}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          padding: '0.9rem',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)';
                        }}
                      >
                        🍽️ Đặt bàn
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Section */}
            <div style={{
              marginTop: '4rem',
              background: 'white',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  margin: 0,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}>
                  🗺️ VỊ TRÍ CÁC CHI NHÁNH
                </h2>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3251826451947!2d106.66408731480082!3d10.786834992313708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ed2392c44df%3A0xd2ecb62e0d050fe9!2sBen%20Thanh%20Market!5e0!3m2!1sen!2s!4v1642567890123!5m2!1sen!2s"
                  width="100%"
                  height="450"
                  style={{ border: 0, borderRadius: '16px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Vị trí cửa hàng"
                ></iframe>
              </div>
            </div>

            {/* Contact Section */}
            <div style={{
              marginTop: '4rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '3rem',
              borderRadius: '20px',
              color: 'white',
              boxShadow: '0 10px 30px rgba(102,126,234,0.3)'
            }}>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '2rem',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
              }}>
                📞 LIÊN HỆ VỚI CHÚNG TÔI
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📞</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Hotline</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0936.253.588</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.5rem' }}>(8h - 21h từ T2-CN)</div>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Email</div>
                  <div style={{ fontSize: '1.1rem' }}>info@haisanbiendong.vn</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.5rem' }}>Phản hồi trong 24h</div>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Giao hàng</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Trong 2 giờ</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.5rem' }}>Miễn phí đơn từ 300K</div>
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
