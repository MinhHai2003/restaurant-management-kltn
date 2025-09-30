import React, { useState } from 'react';
import { useOrderSocket } from '../../hooks/useOrderSocket';

interface KitchenOrder {
  orderId: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    customizations?: string;
    notes?: string;
  }>;
  specialInstructions?: string;
  priority: 'normal' | 'high' | 'urgent';
  timestamp: Date;
  status: 'pending' | 'preparing' | 'ready';
}

const KitchenDashboard: React.FC = () => {
  const { notifications, isConnected } = useOrderSocket();
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);

  // Filter kitchen-related notifications
  const kitchenNotifications = notifications.filter(n => 
    n.type === 'new_order' || n.type === 'order_cancelled'
  );

  const updateOrderStatus = (orderId: string, status: KitchenOrder['status']) => {
    setKitchenOrders(prev => 
      prev.map(order => 
        order.orderId === orderId ? { ...order, status } : order
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👨‍🍳 Bếp - Dashboard</h1>
        <div className={`px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>

      {/* Recent Notifications */}
      {kitchenNotifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">📢 Thông báo mới</h2>
          <div className="space-y-2">
            {kitchenNotifications.slice(-3).map((notification, index) => (
              <div key={index} className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {notification.type === 'new_order' ? '🍽️' : '❌'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{notification.message}</p>
                    {notification.orderNumber && (
                      <p className="text-xs text-gray-500">
                        #{notification.orderNumber}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {notification.timestamp?.toLocaleTimeString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-3">🍳 Đơn hàng đang xử lý</h2>
        
        {kitchenOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Không có đơn hàng nào đang chờ xử lý</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitchenOrders.map(order => (
              <div key={order.orderId} className={`border-2 rounded-lg p-4 ${getPriorityColor(order.priority)}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">#{order.orderNumber}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                    {order.status === 'pending' ? 'Chờ' : 
                     order.status === 'preparing' ? 'Đang làm' : 'Sẵn sàng'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium">{item.quantity}x {item.name}</p>
                      {item.customizations && (
                        <p className="text-gray-600 text-xs">📝 {item.customizations}</p>
                      )}
                      {item.notes && (
                        <p className="text-orange-600 text-xs">⚠️ {item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {order.specialInstructions && (
                  <div className="mb-4 p-2 bg-yellow-100 rounded text-sm">
                    <p className="font-medium text-yellow-800">Ghi chú đặc biệt:</p>
                    <p className="text-yellow-700">{order.specialInstructions}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.orderId, 'preparing')}
                      className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      🚀 Bắt đầu làm
                    </button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.orderId, 'ready')}
                      className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      ✅ Hoàn thành
                    </button>
                  )}

                  <p className="text-xs text-gray-500 self-center">
                    {order.timestamp.toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-blue-100 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-800">
            {kitchenOrders.filter(o => o.status === 'pending').length}
          </p>
          <p className="text-blue-600 text-sm">Chờ xử lý</p>
        </div>
        <div className="bg-yellow-100 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-800">
            {kitchenOrders.filter(o => o.status === 'preparing').length}
          </p>
          <p className="text-yellow-600 text-sm">Đang làm</p>
        </div>
        <div className="bg-green-100 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-800">
            {kitchenOrders.filter(o => o.status === 'ready').length}
          </p>
          <p className="text-green-600 text-sm">Sẵn sàng</p>
        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;