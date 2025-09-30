import React from 'react';
import { useOrderSocket } from '../hooks/useOrderSocket';

interface NotificationItemProps {
  notification: {
    type: string;
    message: string;
    timestamp?: Date;
    orderNumber?: string;
  };
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'order_confirmed':
        return '✅';
      case 'order_cancelled':
        return '❌';
      case 'new_order':
        return '🍽️';
      case 'new_delivery':
        return '🚚';
      case 'item_added':
        return '🛒';
      default:
        return '📢';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'order_confirmed':
        return 'bg-green-50 border-green-200';
      case 'order_cancelled':
        return 'bg-red-50 border-red-200';
      case 'new_order':
        return 'bg-blue-50 border-blue-200';
      case 'item_added':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getBgColor()} mb-2 relative`}>
      <button
        onClick={onClose}
        className="absolute top-1 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
      <div className="flex items-start space-x-2">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {notification.message}
          </p>
          {notification.orderNumber && (
            <p className="text-xs text-gray-500">
              Đơn hàng: {notification.orderNumber}
            </p>
          )}
          {notification.timestamp && (
            <p className="text-xs text-gray-400">
              {notification.timestamp.toLocaleTimeString('vi-VN')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderNotifications: React.FC = () => {
  const { notifications, cartUpdates, isConnected, removeNotification, clearNotifications } = useOrderSocket();

  if (notifications.length === 0 && !cartUpdates) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* Connection Status */}
      <div className={`mb-2 px-2 py-1 rounded text-xs ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '🟢 Real-time kết nối' : '🔴 Mất kết nối'}
      </div>

      {/* Cart Update Notification */}
      {cartUpdates && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🛒</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {cartUpdates.message}
              </p>
              {cartUpdates.cartTotal && (
                <p className="text-xs text-yellow-600">
                  Tổng giỏ hàng: {cartUpdates.cartTotal.toLocaleString()}đ
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Notifications */}
      {notifications.length > 0 && (
        <div>
          {notifications.length > 3 && (
            <button
              onClick={clearNotifications}
              className="mb-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Xóa tất cả thông báo
            </button>
          )}
          
          {notifications.slice(-5).map((notification, index) => (
            <NotificationItem
              key={index}
              notification={notification}
              onClose={() => removeNotification(notifications.length - 5 + index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderNotifications;