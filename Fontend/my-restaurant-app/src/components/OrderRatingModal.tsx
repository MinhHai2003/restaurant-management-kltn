import React, { useState } from 'react';
import RatingStars from './RatingStars';
import type { ReviewData } from '../services/reviewService';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations?: string;
  notes?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  status?: string;
  pricing?: {
    subtotal?: number;
    tax?: number;
    deliveryFee?: number;
    discount?: number;
    loyaltyDiscount?: number;
    total: number;
  };
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface OrderRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmit: (reviews: ReviewData[]) => Promise<void>;
}

const OrderRatingModal: React.FC<OrderRatingModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}) => {
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize reviews when order changes
  React.useEffect(() => {
    if (order && isOpen) {
      const initialReviews: Record<string, ReviewData> = {};
      order.items.forEach((item, index) => {
        const itemKey = `${item.name}-${index}`;
        initialReviews[itemKey] = {
          menuItemId: item.name, // Use item name as identifier
          menuItemName: item.name, // Also send name for backend
          rating: 0,
          comment: '',
          images: [],
        };
      });
      setReviews(initialReviews);
      setError(null);
    }
  }, [order, isOpen]);

  const handleRatingChange = (itemKey: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        rating,
      },
    }));
  };

  const handleCommentChange = (itemKey: string, comment: string) => {
    setReviews(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        comment,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!order) return;

    // Check if order is delivered
    if (order.status !== 'delivered') {
      setError('Chỉ có thể đánh giá đơn hàng đã hoàn thành');
      return;
    }

    // Validate that all items have ratings
    const reviewData = Object.values(reviews);
    const hasUnratedItems = reviewData.some(review => review.rating === 0);
    
    if (hasUnratedItems) {
      setError('Vui lòng đánh giá tất cả các món ăn');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(reviewData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !order) return null;

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: '32rem',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, #f97316, #ef4444)',
          color: 'white',
          padding: '1.25rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Đánh giá đơn hàng</h2>
              <p style={{
                color: '#fed7aa',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                Đơn hàng #{order.orderNumber} • {order.customerInfo?.name || 'Khách hàng'}
              </p>
              {order.status !== 'delivered' && (
                <p style={{
                  color: '#fecaca',
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.875rem'
                }}>
                  ⚠️ Chỉ có thể đánh giá đơn hàng đã hoàn thành
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.5rem',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {order.items.map((item, index) => {
              const itemKey = `${item.name}-${index}`;
              return (
              <div key={itemKey} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                backgroundColor: '#f9fafb',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                {/* Item Details */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{
                    fontWeight: '600',
                    fontSize: '1.25rem',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.75rem'
                  }}>
                    {item.name}
                  </h3>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '1rem',
                    margin: 0
                  }}>
                    Số lượng: {item.quantity} • Giá: {order.pricing?.total.toLocaleString() || item.price.toLocaleString()}đ
                  </p>
                </div>

                {/* Rating */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.75rem'
                  }}>
                    Đánh giá món ăn *
                  </label>
                  <RatingStars
                    value={reviews[itemKey]?.rating || 0}
                    onChange={(rating) => handleRatingChange(itemKey, rating)}
                    size="lg"
                    showText={true}
                  />
                </div>

                {/* Comment */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.75rem'
                  }}>
                    Nhận xét (tùy chọn)
                  </label>
                  <textarea
                    value={reviews[itemKey]?.comment || ''}
                    onChange={(e) => handleCommentChange(itemKey, e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    rows={4}
                    maxLength={500}
                  />
                  <div style={{
                    textAlign: 'right',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    {(reviews[itemKey]?.comment || '').length}/500
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              color: '#6b7280',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || order.status !== 'delivered'}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: order.status !== 'delivered' || isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '1rem',
              opacity: (order.status !== 'delivered' || isSubmitting) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (order.status === 'delivered' && !isSubmitting) {
                e.currentTarget.style.backgroundColor = '#ea580c';
              }
            }}
            onMouseLeave={(e) => {
              if (order.status === 'delivered' && !isSubmitting) {
                e.currentTarget.style.backgroundColor = '#f97316';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <svg style={{
                  animation: 'spin 1s linear infinite',
                  width: '16px',
                  height: '16px'
                }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang gửi...
              </>
            ) : order.status !== 'delivered' ? (
              'Chỉ đánh giá đơn đã hoàn thành'
            ) : (
              'Gửi đánh giá'
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default OrderRatingModal;
