import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  orderType: 'pickup' | 'dineIn' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: Array<{
    menuItem: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  totalAmount: number;
  notes?: string;
  pickupTime?: Date;
  tableNumber?: number;
  deliveryAddress?: string;
  createdAt: Date;
}

interface OrderNotification {
  type: string;
  orderId?: string;
  orderNumber?: string;
  message: string;
  timestamp?: Date;
}

export const useOrderSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('employeeToken') || localStorage.getItem('customerToken');
    
    if (!token) {
      setError('No authentication token found');
      return;
    }

    const newSocket = io('http://localhost:5005', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError(`Connection error: ${error.message}`);
      setIsConnected(false);
    });

    // Order events
    newSocket.on('new_order_kitchen', (order: Order) => {
      console.log('New order received:', order);
      setOrders(prev => [order, ...prev]);
      
      if (Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order #${order.orderNumber} - ${order.orderType}`,
          icon: '/vite.svg'
        });
      }
    });

    newSocket.on('admin_order_created', (order: Order) => {
      console.log('Admin order created:', order);
      setOrders(prev => [order, ...prev]);
      
      if (Notification.permission === 'granted') {
        new Notification('New Order Created!', {
          body: `Order #${order.orderNumber} created`,
          icon: '/vite.svg'
        });
      }
    });

    newSocket.on('order_status_updated', (data: { orderId: string; status: string; order?: Order }) => {
      console.log('Order status updated:', data);
      
      if (data.order) {
        setOrders(prev => {
          const index = prev.findIndex(order => order._id === data.orderId);
          if (index !== -1 && data.order) {
            const newOrders = [...prev];
            newOrders[index] = data.order;
            return newOrders;
          }
          return prev;
        });
      }
      
      setNotifications(prev => [...prev, {
        type: 'status_update',
        orderId: data.orderId,
        message: `Order status changed to: ${data.status}`,
        timestamp: new Date()
      }]);
      
      if (Notification.permission === 'granted') {
        new Notification('Order Status Updated!', {
          body: `Order status changed to: ${data.status}`,
          icon: '/vite.svg'
        });
      }
    });

    newSocket.on('customer_order_status_updated', (data: { orderId: string; status: string; order?: Order }) => {
      console.log('Customer order status updated:', data);
      
      if (data.order) {
        setOrders(prev => {
          const index = prev.findIndex(order => order._id === data.orderId);
          if (index !== -1 && data.order) {
            const newOrders = [...prev];
            newOrders[index] = data.order;
            return newOrders;
          }
          return prev;
        });
      }
      
      setNotifications(prev => [...prev, {
        type: 'customer_status_update',
        orderId: data.orderId,
        message: `Your order status: ${data.status}`,
        timestamp: new Date()
      }]);
      
      if (Notification.permission === 'granted') {
        new Notification('Your Order Updated!', {
          body: `Your order status: ${data.status}`,
          icon: '/vite.svg'
        });
      }
    });

    newSocket.on('order_created', (order: Order) => {
      console.log('Order created:', order);
      setOrders(prev => [order, ...prev]);
    });

    setSocket(newSocket);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.close();
    };
  }, []);

  const updateOrderStatus = (orderId: string, status: string) => {
    if (socket && isConnected) {
      socket.emit('update_order_status', { orderId, status });
    }
  };

  const emitOrderEvent = (eventName: string, data: Record<string, unknown>) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    socket,
    isConnected,
    orders,
    notifications,
    error,
    updateOrderStatus,
    emitOrderEvent,
    clearNotifications
  };
};
