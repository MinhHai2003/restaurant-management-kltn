import { useEffect, useState, useRef } from 'react';
import socketService from '../services/socketService';

interface UseSocketReturn {
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data: unknown) => void;
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback: (data: unknown) => void) => void;
}

interface SocketNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export const useSocket = (userType: 'employee' | 'customer' = 'employee'): UseSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  const socketRef = useRef(socketService);
  const [autoConnect, setAutoConnect] = useState(true);

  const connect = async () => {
    try {
      await socketRef.current.connect(userType);
      setConnected(true);
    } catch (error) {
      console.error('Socket connection failed:', error);
      setConnected(false);
    }
  };

  const disconnect = () => {
    socketRef.current.disconnect();
    setConnected(false);
  };

  const emit = (event: string, data: unknown) => {
    const socket = socketRef.current.getSocket();
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: unknown) => void) => {
    socketRef.current.on(event, callback);
  };

  const off = (event: string, callback: (data: unknown) => void) => {
    socketRef.current.off(event, callback);
  };

  // Auto connect on mount if user has token
  useEffect(() => {
    if (autoConnect) {
      const token = userType === 'employee' 
        ? localStorage.getItem('employeeToken')
        : localStorage.getItem('customerToken');
      
      if (token) {
        connect();
      }
    }

    return () => {
      disconnect();
    };
  }, [userType, autoConnect]);

  // Setup connection status listener
  useEffect(() => {
    const socket = socketRef.current.getSocket();
    if (socket) {
      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
    }
  }, []);

  return {
    connected,
    connect,
    disconnect,
    emit,
    on,
    off
  };
};

export const useSocketNotifications = () => {
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification: SocketNotification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only last 10
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Setup global notification handler
  useEffect(() => {
    window.showSocketNotification = addNotification;
    
    return () => {
      delete window.showSocketNotification;
    };
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  };
};

export default useSocket;