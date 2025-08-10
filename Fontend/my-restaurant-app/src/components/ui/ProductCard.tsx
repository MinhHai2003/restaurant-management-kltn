import { useState } from 'react';
import { cartService } from '../../services/cartService';

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

interface ProductCardProps {
  product: Product;
  onCartUpdate?: () => void; // Callback to update cart count in header
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onCartUpdate }) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const handleAddToCart = async () => {
    if (!cartService.isAuthenticated()) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      return;
    }

    try {
      setIsAddingToCart(true);
      
      const result = await cartService.addToCart({
        menuItemId: product.menuItemId || product.id.toString(),
        quantity: 1,
        customizations: '',
        notes: '',
      });

      if (result.success) {
        setShowSuccess(true);
        
        // Call callback to update cart count in header
        if (onCartUpdate) {
          onCartUpdate();
        }

        // Show success message temporarily
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);

        console.log('✅ Added to cart:', product.name);
      } else {
        throw new Error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      border: '1px solid #f1f5f9'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }}
    >
      {/* Product Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={product.image}
          alt={product.name}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '220px',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          pointerEvents: 'none'
        }} />
        
        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {product.isBestSeller && (
            <span style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}>
              🔥 Hot
            </span>
          )}
          {product.isNew && (
            <span style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}>
              ✨ New
            </span>
          )}
        </div>

        {/* Sale Badge */}
        {product.originalPrice && (
          <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
            }}>
              💥 Sale
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '8px',
          lineHeight: '1.4',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '44px'
        }}>
          {product.name}
        </h3>
        
        <div style={{
          fontSize: '12px',
          color: '#64748b',
          marginBottom: '12px',
          padding: '4px 8px',
          background: '#f8fafc',
          borderRadius: '6px',
          display: 'inline-block'
        }}>
          📂 {product.category}
        </div>

        {/* Price */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#dc2626',
              fontFamily: 'monospace'
            }}>
              {formatPrice(product.price)}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              /{product.unit}
            </span>
          </div>
          
          {product.originalPrice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '14px',
                color: '#9ca3af',
                textDecoration: 'line-through',
                fontFamily: 'monospace'
              }}>
                {formatPrice(product.originalPrice)}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#059669',
                fontWeight: '600',
                background: '#dcfce7',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          style={{
            width: '100%',
            background: showSuccess 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : isAddingToCart 
                ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isAddingToCart ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: showSuccess 
              ? '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
              : '0 4px 6px -1px rgba(14, 165, 233, 0.3)',
            opacity: isAddingToCart ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isAddingToCart && !showSuccess) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(14, 165, 233, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAddingToCart && !showSuccess) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(14, 165, 233, 0.3)';
            }
          }}
        >
          {showSuccess ? (
            <>✅ Đã thêm vào giỏ</>
          ) : isAddingToCart ? (
            <>⏳ Đang thêm...</>
          ) : (
            <>🛒 Thêm vào giỏ</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
