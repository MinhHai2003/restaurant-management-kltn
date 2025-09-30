import React from 'react';
import { useSocketNotifications } from '../hooks/useSocket';

interface NotificationProps {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ 
  id, 
  message, 
  type, 
  timestamp, 
  onClose 
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: '✅'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          icon: '⚠️'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          icon: '❌'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getTypeStyles();
  const timeAgo = new Date().getTime() - timestamp.getTime();
  const seconds = Math.floor(timeAgo / 1000);
  const timeText = seconds < 60 ? 'vừa xong' : `${Math.floor(seconds / 60)} phút trước`;

  return (
    <div
      style={{
        background: styles.background,
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        maxWidth: '350px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <span style={{ fontSize: '16px' }}>{styles.icon}</span>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
          {message}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {timeText}
        </div>
      </div>
      
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          opacity: 0.7,
          padding: '2px'
        }}
        onMouseOver={(e) => (e.target as HTMLElement).style.opacity = '1'}
        onMouseOut={(e) => (e.target as HTMLElement).style.opacity = '0.7'}
      >
        ×
      </button>
    </div>
  );
};

const SocketNotifications: React.FC = () => {
  const { notifications, removeNotification, clearNotifications } = useSocketNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      
      {/* Clear All Button */}
      {notifications.length > 1 && (
        <div style={{ marginBottom: '12px', textAlign: 'right' }}>
          <button
            onClick={clearNotifications}
            style={{
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🗑️ Xóa tất cả
          </button>
        </div>
      )}

      {/* Notifications */}
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          timestamp={notification.timestamp}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default SocketNotifications;