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

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const handleAddToCart = () => {
    console.log('Added to cart:', product.name);
  };

  return (
    <div className="product-card">
      {/* Product Image */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
        
        {/* Badges */}
        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {product.isBestSeller && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px'
            }}>
              Bán chạy
            </span>
          )}
          {product.isNew && (
            <span style={{
              background: '#10b981',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px'
            }}>
              Mới
            </span>
          )}
        </div>

        {/* Sale Badge */}
        {product.originalPrice && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
            <span style={{
              background: '#f59e0b',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontWeight: 'bold'
            }}>
              SALE
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div>
        <h3 className="product-name">
          {product.name}
        </h3>
        
        <div className="product-category">
          Danh mục: {product.category}
        </div>

        {/* Price */}
        <div className="product-price">
          <span className="price-current">
            {formatPrice(product.price)}
          </span>
          <span className="price-unit">/ {product.unit}</span>
          
          {product.originalPrice && (
            <span className="price-original">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="add-to-cart"
        >
          🛒 THÊM VÀO GIỎ
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
