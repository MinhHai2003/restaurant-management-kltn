import React from 'react';

interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: { fontSize: '0.875rem', starSize: '18px' },
    md: { fontSize: '1rem', starSize: '22px' },
    lg: { fontSize: '1.125rem', starSize: '26px' },
  };

  const currentSize = sizeStyles[size];

  const handleStarClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Rất tệ';
      case 2:
        return 'Tệ';
      case 3:
        return 'Bình thường';
      case 4:
        return 'Tốt';
      case 5:
        return 'Tuyệt vời';
      default:
        return '';
    }
  };

  const getStarColor = (star: number) => {
    if (star <= value) {
      return '#fbbf24'; // Yellow for filled stars
    }
    return '#d1d5db'; // Gray for empty stars
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem',
      fontSize: currentSize.fontSize
    }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleStarClick(star)}
          disabled={readonly}
          style={{
            background: 'none',
            border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            padding: '0.25rem',
            borderRadius: '0.375rem',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: readonly ? 1 : 0.8
          }}
          onMouseEnter={(e) => {
            if (!readonly) {
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.opacity = '1';
            }
          }}
          onMouseLeave={(e) => {
            if (!readonly) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '0.8';
            }
          }}
          aria-label={`Đánh giá ${star} sao`}
        >
          <svg
            width={currentSize.starSize}
            height={currentSize.starSize}
            style={{
              color: getStarColor(star),
              fill: 'currentColor',
              transition: 'color 0.2s ease',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
            }}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {showText && value > 0 && (
        <span style={{
          marginLeft: '0.75rem',
          color: '#6b7280',
          fontWeight: '500',
          fontSize: currentSize.fontSize
        }}>
          {getRatingText(value)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;