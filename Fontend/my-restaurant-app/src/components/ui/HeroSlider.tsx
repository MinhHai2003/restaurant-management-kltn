import { useState, useEffect } from 'react';

const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <div>
        <h2>🦐 Hải Sản Tươi Sống Chất Lượng Cao</h2>
        <p>Giao hàng 2H - Đổi trả miễn phí - Uy tín hàng đầu</p>
        <a href="/hai-san-tuoi-song" className="btn-primary">
          Xem sản phẩm
        </a>
      </div>
      
      {/* Features */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '1rem 0'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <div>🚚 GIAO HÀNG 2H</div>
          <div>↩️ ĐỔI TRẢ MIỄN PHÍ</div>
          <div>🐟 HẢI SẢN TƯƠI SỐNG</div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
