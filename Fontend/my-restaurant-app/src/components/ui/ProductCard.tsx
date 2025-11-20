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
  description?: string; // Mô tả món ăn
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
      background: '#ffffff',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-6px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)';
      e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)';
      e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
    }}
    >
      {/* Product Image */}
      <div style={{ 
        position: 'relative', 
        overflow: 'hidden',
        background: '#f8fafc',
        aspectRatio: '4/3'
      }}>
        <img
          src={product.image}
          alt={product.name}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
        
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
      <div style={{ 
        padding: '20px 20px 24px 20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #1e293b, #475569)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '12px',
          lineHeight: '1.4',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '50px',
          letterSpacing: '-0.3px'
        }}>
          {product.name}
        </h3>
        
        {/* Description */}
        {product.description && (
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '16px',
            lineHeight: '1.6',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            minHeight: '60px',
            fontWeight: '400'
          }}>
            {product.description}
          </p>
        )}

        {/* Price */}
        <div style={{ 
          marginBottom: '18px',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#dc2626',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.5px'
            }}>
              {formatPrice(product.price)}
            </span>
            <span style={{
              fontSize: '13px',
              color: '#94a3b8',
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
              ? '#10b981' 
              : isAddingToCart 
                ? '#94a3b8'
                : '#1e293b',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: isAddingToCart ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.3px',
            boxShadow: showSuccess 
              ? '0 4px 12px rgba(16, 185, 129, 0.25)'
              : isAddingToCart
                ? '0 2px 6px rgba(148, 163, 184, 0.2)'
                : '0 4px 12px rgba(30, 41, 59, 0.15)',
            opacity: isAddingToCart ? 0.7 : 1,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!isAddingToCart && !showSuccess) {
              e.currentTarget.style.background = '#0f172a';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 41, 59, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAddingToCart && !showSuccess) {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 41, 59, 0.15)';
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
