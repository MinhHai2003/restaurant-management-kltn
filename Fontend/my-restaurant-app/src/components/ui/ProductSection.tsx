import ProductCard from '../ui/ProductCard';

interface Product {
  id: number;
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
}

const ProductSection: React.FC<ProductSectionProps> = ({ 
  title, 
  products, 
  viewAllLink,
  backgroundColor = ""
}) => {
  return (
    <section className="product-section" style={{ background: backgroundColor }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 className="section-title" style={{ marginBottom: 0, textAlign: 'left' }}>{title}</h2>
          {viewAllLink && (
            <a
              href={viewAllLink}
              style={{
                color: '#059669',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>Xem thêm</span>
              <span>→</span>
            </a>
          )}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
