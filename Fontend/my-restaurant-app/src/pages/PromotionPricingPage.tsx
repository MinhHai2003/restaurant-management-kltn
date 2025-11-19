import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import '../styles/promotion-pricing.css';

const promoHighlights = [
  {
    icon: '⚡',
    title: 'Flash Sale cuối tuần',
    description: 'Áp dụng cho mọi đơn hàng từ 18h - 21h',
    value: 'Giảm 25%',
    accent: 'flash',
  },
  {
    icon: '🥂',
    title: 'Tiệc gia đình 4 người',
    description: 'Free combo tráng miệng + nâng cấp hải sản',
    value: '1.290.000đ',
    accent: 'family',
  },
  {
    icon: '🚚',
    title: 'Giao nhanh trong 2h',
    description: 'Miễn phí khi hoá đơn từ 799.000đ',
    value: '0đ phí ship',
    accent: 'delivery',
  },
  {
    icon: '💎',
    title: 'Thành viên Platinum',
    description: 'Tặng ngay set sashimi cao cấp & ưu tiên đặt bàn',
    value: '+12 đặc quyền',
    accent: 'member',
  },
];

const comboPackages = [
  {
    name: 'Combo Hải Sản Signature',
    price: '1.590.000đ',
    savings: 'Tiết kiệm 420.000đ',
    badge: 'Best Seller',
    items: ['Tôm hùm nướng bơ tỏi', 'Hàu Nhật phô mai', 'Lẩu cá bớp', '6 phần khai vị'],
    gradient: 'combo-gradient-1',
  },
  {
    name: 'Combo Chill by The Sea',
    price: '890.000đ',
    savings: 'Tiết kiệm 210.000đ',
    badge: 'Couple Choice',
    items: ['Cá hồi sashimi', 'Bạch tuộc sốt cay', 'Vẹm xanh New Zealand', '2 cocktail signature'],
    gradient: 'combo-gradient-2',
  },
  {
    name: 'Combo Party Wave',
    price: '2.390.000đ',
    savings: 'Tiết kiệm 680.000đ',
    badge: 'New',
    items: ['Tháp hải sản 3 tầng', 'Cua Alaska', 'Sushi premium', 'Tráng miệng lạnh không giới hạn'],
    gradient: 'combo-gradient-3',
  },
];

const membershipTiers = [
  {
    tier: 'Pearl',
    icon: '✨',
    color: '#7c3aed',
    price: 'Đơn từ 3.000.000đ/tháng',
    perks: ['Voucher 10% mọi hoá đơn', 'Ưu tiên đặt bàn Lầu VIP', 'Miễn phí món tráng miệng theo mùa'],
  },
  {
    tier: 'Coral',
    icon: '🌊',
    color: '#0ea5e9',
    price: 'Đơn từ 6.000.000đ/tháng',
    perks: ['Tặng set khai vị đặc biệt', 'Giữ chỗ trước 48h', 'Nâng cấp rượu vang', 'Giảm 15% tiệc doanh nghiệp'],
  },
  {
    tier: 'Platinum Wave',
    icon: '💠',
    color: '#f97316',
    price: 'Theo trải nghiệm cá nhân hoá',
    perks: ['Chef Table riêng', 'Thiết kế menu độc quyền', 'Quản gia ẩm thực 24/7', 'Ưu đãi 20% sự kiện lớn'],
  },
];

const seasonalEvents = [
  {
    month: '06',
    title: 'Lễ hội Sashimi Nhật Bản',
    detail: 'Combo 6 loại cá sống + rượu sake giảm thêm 18%',
  },
  {
    month: '07',
    title: 'Summer Chill Sunset',
    detail: 'Happy hour 1 tặng 1 cocktail từ 17h - 19h',
  },
  {
    month: '08',
    title: 'Seafood Carnival',
    detail: 'Chef show trực tiếp + ưu đãi nhóm từ 6 người',
  },
];

const addOnPerks = [
  'Free nướng tại bàn với combo trên 1.2 triệu',
  'Tặng voucher spa 30 phút khi đặt tiệc doanh nghiệp',
  'Giảm thêm 5% khi thanh toán bằng thẻ tín dụng liên kết',
  'Hỗ trợ trang trí kỷ niệm/ cầu hôn hoàn toàn miễn phí',
];

const PromotionPricingPage: React.FC = () => {
  return (
    <div className="promotion-page">
      <Header />
      <main className="promotion-wrapper">
        <section className="promotion-hero">
          <div className="promotion-hero__badge">Bảng giá ưu đãi 2025 • Cập nhật hằng tuần</div>
          <h1>Chạm sóng ưu đãi — tận hưởng hải sản 5 sao trong tầm tay</h1>
          <p>
            Từ tiệc gia đình ấm cúng đến sự kiện doanh nghiệp đẳng cấp, chúng tôi mang đến những gói khuyến mãi linh hoạt,
            cá nhân hoá theo khẩu vị & trải nghiệm bạn mong muốn.
          </p>
          <div className="promotion-hero__cta">
            <a href="/dat-ban" className="cta-primary">Đặt bàn ưu đãi ngay</a>
            <a href="/gio-hang" className="cta-secondary">Xem combo giao tận nơi</a>
          </div>
          <div className="promotion-hero__stats">
            <div>
              <strong>3200+</strong>
              <span>Khách hàng đặt combo ưu đãi mỗi tháng</span>
            </div>
            <div>
              <strong>45%</strong>
              <span>Tiết kiệm trung bình mỗi gói tiệc</span>
            </div>
            <div>
              <strong>12</strong>
              <span>Đặc quyền riêng cho thành viên thân thiết</span>
            </div>
          </div>
        </section>

        <section className="promo-highlight-grid">
          {promoHighlights.map((item) => (
            <article key={item.title} className={`promo-highlight-card ${item.accent}`}>
              <div className="icon">{item.icon}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className="value">{item.value}</span>
            </article>
          ))}
        </section>

        <section className="promo-section">
          <div className="section-heading">
            <div>
              <p>Bảng giá combo</p>
              <h2>Gói tiệc best-seller</h2>
            </div>
            <span>Đã bao gồm khai vị + tráng miệng + nước detox</span>
          </div>

          <div className="combo-grid">
            {comboPackages.map((combo) => (
              <article key={combo.name} className={`combo-card ${combo.gradient}`}>
                <div className="combo-card__header">
                  <span className="badge">{combo.badge}</span>
                  <h3>{combo.name}</h3>
                </div>
                <div className="combo-card__price">
                  <strong>{combo.price}</strong>
                  <span>{combo.savings}</span>
                </div>
                <ul>
                  {combo.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a href="/dat-ban" className="combo-card__action">Giữ chỗ & áp dụng ưu đãi</a>
              </article>
            ))}
          </div>
        </section>

        <section className="promo-section membership">
          <div className="section-heading">
            <div>
              <p>Thành viên signature</p>
              <h2>Tầng ưu đãi cá nhân hoá</h2>
            </div>
            <span>Trải nghiệm thiết kế riêng cho khách hàng trung thành</span>
          </div>
          <div className="membership-grid">
            {membershipTiers.map((tier) => (
              <article key={tier.tier} className="tier-card">
                <div className="tier-card__icon" style={{ color: tier.color }}>
                  {tier.icon}
                </div>
                <p className="tier-name" style={{ color: tier.color }}>
                  {tier.tier}
                </p>
                <p className="tier-price">{tier.price}</p>
                <ul>
                  {tier.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <button type="button">Tư vấn gói {tier.tier}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="promo-section timeline">
          <div className="section-heading">
            <div>
              <p>Lịch ưu đãi mùa hè</p>
              <h2>Sự kiện trải nghiệm theo tháng</h2>
            </div>
            <span>Đặt trước để giữ slot trải nghiệm chef show</span>
          </div>
          <div className="timeline-grid">
            {seasonalEvents.map((event) => (
              <article key={event.title} className="timeline-card">
                <div className="month">{event.month}</div>
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.detail}</p>
                </div>
                <a href="/dat-ban">Giữ chỗ</a>
              </article>
            ))}
          </div>
        </section>

        <section className="promo-section perks">
          <div className="perks-card">
            <div>
              <p>Quà tặng thêm</p>
              <h2>Tinh chỉnh ưu đãi theo nhu cầu</h2>
              <span>Áp dụng cho đơn đặt bàn từ 1.000.000đ</span>
            </div>
            <ul>
              {addOnPerks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
            <div className="perks-action">
              <a href="tel:0936253588">Hotline 0936.253.588</a>
              <a href="/chat" className="link-underline">Chat với tư vấn viên</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PromotionPricingPage;

