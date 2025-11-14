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
      background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: '1px solid rgba(102, 126, 234, 0.1)',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.2), 0 0 0 1px rgba(102, 126, 234, 0.15)';
      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.08)';
      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.1)';
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
            height: '240px',
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(1deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
        />
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.4) 50%, transparent 100%)',
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease'
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
          fontSize: '17px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
          lineHeight: '1.4',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '48px',
          textShadow: '0 2px 10px rgba(102, 126, 234, 0.1)'
        }}>
          {product.name}
        </h3>
        
        <div style={{
          fontSize: '12px',
          color: '#667eea',
          marginBottom: '14px',
          padding: '6px 12px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08))',
          borderRadius: '8px',
          display: 'inline-block',
          fontWeight: '600',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          backdropFilter: 'blur(10px)'
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
                : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            padding: '14px 18px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: isAddingToCart ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            boxShadow: showSuccess 
              ? '0 8px 16px rgba(16, 185, 129, 0.3)'
              : isAddingToCart
                ? '0 4px 8px rgba(107, 114, 128, 0.3)'
                : '0 8px 16px rgba(102, 126, 234, 0.3)',
            opacity: isAddingToCart ? 0.7 : 1,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!isAddingToCart && !showSuccess) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #764ba2, #667eea)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAddingToCart && !showSuccess) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
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
