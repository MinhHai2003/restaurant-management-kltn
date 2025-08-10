import ProductCard from '../ui/ProductCard';

interface Product {
  id: number;
  menuItemId?: string; // Original MongoDB ObjectId for cart operations
  name: string;
  price: number;
  unit: string;
  originalPrice?: number | null;
  image: string;
  category: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

interface ProductSectionProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
  backgroundColor?: string;
  onCartUpdate?: () => void; // Add callback prop
}

const ProductSection: React.FC<ProductSectionProps> = ({ 
  title, 
  products, 
  viewAllLink,
  backgroundColor = "#ffffff",
  onCartUpdate
}) => {
  return (
    <section style={{ 
      background: backgroundColor,
      padding: '60px 0',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative'
      }}>
        {/* Section Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              position: 'relative'
            }}>
              {title}
              <div style={{
                position: 'absolute',
                bottom: '-12px',
                left: 0,
                width: '60px',
                height: '4px',
                background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)',
                borderRadius: '2px'
              }} />
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0,
              fontWeight: '500'
            }}>
              🍤 Tươi ngon từ biển cả
            </p>
          </div>
          
          {viewAllLink && (
            <a
              href={viewAllLink}
              style={{
                color: '#0ea5e9',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: '2px solid #0ea5e9',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0ea5e9';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(14, 165, 233, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#0ea5e9';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>Xem thêm</span>
              <span style={{ fontSize: '16px' }}>→</span>
            </a>
          )}
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '20px'
        }}>
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onCartUpdate={onCartUpdate}
            />
          ))}
        </div>

        {/* Show message if no products */}
        {products.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🦀</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Chưa có sản phẩm</h3>
            <p style={{ fontSize: '14px', margin: 0 }}>Vui lòng quay lại sau</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
