import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

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
    // Check if user is customer (has 'token' in localStorage and user data)
    const customerToken = localStorage.getItem('token');
    const customerUser = localStorage.getItem('user');
    const employeeToken = localStorage.getItem('employeeToken');
    
    // Priority logic:
    // 1. If customer is logged in (has token + user), use customer token
    // 2. Otherwise, use employee token if exists
    // 3. Fallback to guest
    const token = (customerToken && customerUser) 
      ? customerToken 
      : (employeeToken || customerToken || localStorage.getItem('customerToken') || '');

    console.log('🔐 [useOrderSocket] Token selection debug:');
    console.log('   - employeeToken:', employeeToken ? 'EXISTS' : 'NULL');
    console.log('   - token (customer):', customerToken ? 'EXISTS' : 'NULL');
    console.log('   - customerUser:', customerUser ? 'EXISTS' : 'NULL');
    console.log('   - customerToken:', localStorage.getItem('customerToken') ? 'EXISTS' : 'NULL');
    console.log('   - Selected token:', token ? 'EXISTS' : 'NULL');
    console.log('   - Token source:', (customerToken && customerUser) ? 'CUSTOMER' : (employeeToken ? 'EMPLOYEE' : 'NONE'));

    // Không còn chặn khi thiếu token: cho phép kết nối guest tới order-service

    // Determine auth type based on which token we're using
    const isEmployeeToken = token && employeeToken === token;
    const authType = token ? (isEmployeeToken ? 'employee' : 'customer') : 'guest';

    console.log('🔐 [useOrderSocket] Auth type:', authType);

    const socketUrl = API_CONFIG.ORDER_SOCKET_URL;
    console.log('🔌 [useOrderSocket] Connecting to socket URL:', socketUrl);
    console.log('🔌 [useOrderSocket] API_CONFIG.ORDER_SOCKET_URL:', API_CONFIG.ORDER_SOCKET_URL);
    const newSocket = io(socketUrl, {
      auth: token ? { token, type: authType } : { type: 'guest' },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ [ORDER SOCKET] Connected:', newSocket.id);
      console.log('✅ [ORDER SOCKET] Socket URL:', socketUrl);
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
      console.log('📢 [ORDER SOCKET] Received order_status_updated event:', data);

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

    // Cart update events
    newSocket.on('cart_updated', (data: { type: string; itemName: string; quantity: number; cartTotal: number; cartItemCount: number; message: string }) => {
      console.log('🛒 Cart updated via Socket.io:', data);

      // Emit custom event for cart components to listen
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: data }));

      setNotifications(prev => [...prev, {
        type: 'cart_update',
        message: data.message,
        timestamp: new Date()
      }]);
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
