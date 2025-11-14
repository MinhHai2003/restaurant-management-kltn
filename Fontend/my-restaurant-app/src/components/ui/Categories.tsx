import { categories } from '../../data/products';

const Categories: React.FC = () => {
  return (
    <section style={{
      padding: '80px 0',
      background: 'linear-gradient(180deg, #fff 0%, #f8f9fa 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Modern Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px',
            animation: 'sparkle 2s ease-in-out infinite',
          }}>✨</div>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '900',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientText 5s ease infinite',
            letterSpacing: '1px',
          }}>
            Danh Mục Sản Phẩm
          </h2>
          <p style={{
            fontSize: '1.3rem',
            color: '#6b7280',
            fontWeight: '500',
          }}>
            Khám phá thế giới ẩm thực hải sản đa dạng
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '35px',
          marginBottom: '40px',
        }}>
          {categories.map((category, index) => (
            <div 
              key={category.id} 
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                borderRadius: '25px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: 'pointer',
                border: '2px solid transparent',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              {/* Gradient overlay on hover */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, 
                  ${index % 3 === 0 ? 'rgba(239, 68, 68, 0.05)' : 
                    index % 3 === 1 ? 'rgba(34, 197, 94, 0.05)' : 
                    'rgba(59, 130, 246, 0.05)'})`,
                opacity: 0,
                transition: 'opacity 0.4s ease',
                pointerEvents: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              />
              
              <div style={{
                position: 'relative',
                height: '220px',
                overflow: 'hidden',
              }}>
                <img 
                  src={category.image} 
                  alt={category.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.1) rotate(2deg)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1) rotate(0deg)'; }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.85))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  opacity: 0,
                  transition: 'opacity 0.4s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  <h3 style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    marginBottom: '12px',
                    textAlign: 'center',
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    {category.name}
                  </h3>
                  <p style={{
                    fontSize: '1.1rem',
                    opacity: 0.95,
                    fontWeight: '600',
                  }}>
                    {category.subcategories.length} loại món
                  </p>
                </div>
              </div>
              
              <div style={{
                padding: '30px',
              }}>
                <h4 style={{
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {category.name}
                </h4>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '24px',
                }}>
                  {category.subcategories.slice(0, 3).map((sub, idx) => (
                    <a
                      key={idx}
                      href={`/menu/${category.slug}?sub=${sub.slug}`}
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '25px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        display: 'inline-block',
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; 
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'; 
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      {sub.name}
                    </a>
                  ))}
                  {category.subcategories.length > 3 && (
                    <span style={{
                      background: 'rgba(102, 126, 234, 0.15)',
                      color: '#667eea',
                      padding: '8px 16px',
                      borderRadius: '25px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                    }}>
                      +{category.subcategories.length - 3} loại khác
                    </span>
                  )}
                </div>
                
                <a 
                  href={`/menu/${category.slug}`} 
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    padding: '14px 32px',
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '1rem',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  Xem Tất Cả →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px',
          marginBottom: '40px',
        }}>
          {categories.map((category) => (
            <div 
              key={category.id} 
              style={{
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                border: '1px solid rgba(14, 165, 233, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(14, 165, 233, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                position: 'relative',
                height: '200px',
                overflow: 'hidden',
              }}>
                <img 
                  src={category.image} 
                  alt={category.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.35s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.8), rgba(6, 182, 212, 0.8))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    textAlign: 'center',
                  }}>
                    {category.name}
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    opacity: 0.9,
                  }}>
                    {category.subcategories.length} loại
                  </p>
                </div>
              </div>
              
              <div style={{
                padding: '25px',
              }}>
                <h4 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '15px',
                  color: '#1e293b',
                }}>
                  {category.name}
                </h4>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px',
                }}>
                  {category.subcategories.slice(0, 3).map((sub, index) => (
                    <a
                      key={index}
                      href={`/menu/${category.slug}?sub=${sub.slug}`}
                      style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {sub.name}
                    </a>
                  ))}
                  {category.subcategories.length > 3 && (
                    <span style={{
                      background: 'linear-gradient(135deg, #64748b, #475569)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                    }}>
                      +{category.subcategories.length - 3} loại khác
                    </span>
                  )}
                </div>
                
                <a 
                  href={`/menu/${category.slug}`} 
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '25px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.4)';
                  }}
                >
                  Xem Tất Cả →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
