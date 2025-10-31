import React from 'react';
import { useOrderSocket } from '../hooks/useOrderSocket';

interface StaffNotificationsProps {
  userRole?: string;
  maxNotifications?: number;
  showConnectionStatus?: boolean;
}

const StaffNotifications: React.FC<StaffNotificationsProps> = ({ 
  userRole = 'staff',
  maxNotifications = 5,
  showConnectionStatus = true 
}) => {
  const { notifications, isConnected, clearNotifications } = useOrderSocket();

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      'admin': '🔧',
      'manager': '👔',
      'waiter': '🍽️',
      'chef': '👨‍🍳',
      'cashier': '💰',
      'delivery': '🚚',
      'receptionist': '📞'
    };
    return icons[role] || '👤';
  };


  const getRelevantNotifications = () => {
    if (!notifications.length) return [];
    
    // Filter notifications based on user role
    return notifications
      .filter(notif => {
        if (userRole === 'admin' || userRole === 'manager') return true;
        if (userRole === 'waiter') return ['new_order_service', 'order_activity', 'order_created'].includes(notif.type);
        if (userRole === 'chef') return ['new_order_kitchen', 'order_cancelled_kitchen'].includes(notif.type);
        if (userRole === 'cashier') return ['new_order_payment', 'order_activity'].includes(notif.type);
        if (userRole === 'delivery') return ['new_delivery', 'delivery_cancelled'].includes(notif.type);
        return ['order_activity'].includes(notif.type); // Default for other roles
      })
      .slice(-maxNotifications)
      .reverse();
  };

  const relevantNotifications = getRelevantNotifications();

  if (!showConnectionStatus && !relevantNotifications.length) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '350px'
    }}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <div style={{
          background: isConnected 
            ? 'linear-gradient(135deg, #10b981, #059669)' 
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px 8px 0 0',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {getRoleIcon(userRole)} {userRole.toUpperCase()}
          <span style={{ marginLeft: 'auto' }}>
            {isConnected ? '🟢 Kết nối' : '🔴 Mất kết nối'}
          </span>
        </div>
      )}

      {/* Notifications */}
      {relevantNotifications.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: showConnectionStatus ? '0 0 8px 8px' : '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f9fafb'
          }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              📢 Thông báo ({relevantNotifications.length})
            </span>
            {relevantNotifications.length > 0 && (
              <button
                onClick={clearNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                🗑️ Xóa
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div>
            {relevantNotifications.map((notification, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 16px',
                  borderBottom: index < relevantNotifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    marginTop: '2px'
                  }}>
                    {notification.type === 'new_order_kitchen' && '👨‍🍳'}
                    {notification.type === 'new_order_service' && '🍽️'}
                    {notification.type === 'new_order_payment' && '💰'}
                    {notification.type === 'admin_order_created' && '📊'}
                    {notification.type === 'order_activity' && '📈'}
                    {notification.type === 'new_delivery' && '🚚'}
                    {!['new_order_kitchen', 'new_order_service', 'new_order_payment', 'admin_order_created', 'order_activity', 'new_delivery'].includes(notification.type) && '📢'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      lineHeight: '1.4',
                      marginBottom: '4px'
                    }}>
                      {notification.message}
                    </div>
                    {notification.timestamp && (
                      <div style={{
                        fontSize: '11px',
                        color: '#9ca3af'
                      }}>
                        {new Date(notification.timestamp).toLocaleTimeString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffNotifications;