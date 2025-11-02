import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { API_CONFIG } from '../config/api';

interface ReservationSocketData {
  reservation: {
    reservationNumber: string;
    customerName: string;
    tableNumber: string;
    reservationDate: string;
    timeSlot: { start: string; end: string };
    partySize: number;
    status: string;
  };
}

interface CreateReservationData {
  tableId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  guestInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface TableStatusData {
  tableId: string;
  status: string;
  reason?: string;
}

export interface Reservation {
  _id: string;
  reservationNumber: string;
  customerId?: string;
  sessionId?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  tableId: string;
  tableInfo: {
    tableNumber: string;
    capacity: number;
    location: string;
  };
  reservationDate: Date;
  timeSlot: {
    start: string;
    end: string;
  };
  partySize: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  type: string;
  reservationId: string;
  reservationNumber: string;
  tableNumber: string;
  message: string;
  timestamp: Date;
}

export const useTableSocket = () => {
  const { user } = useAuth(); // Get user info for room joining
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔌 [TABLE SOCKET] Initializing table socket connection...');
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socketUrl = API_CONFIG.TABLE_SOCKET_URL;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ [TABLE SOCKET] Connected to table service');
      setIsConnected(true);
      setError(null);
      
      // Join appropriate room based on user status
      if (user && user._id) {
        console.log('🏠 [TABLE SOCKET] Joining customer room:', `customer_${user._id}`);
        newSocket.emit('join_customer', user._id);
      } else {
        console.log('👤 [TABLE SOCKET] Connected as guest user');
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ [TABLE SOCKET] Disconnected from table service');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('💥 [TABLE SOCKET] Connection error:', error);
      setError('Failed to connect to table service');
      setIsConnected(false);
    });

    // Reservation events
    newSocket.on('new_reservation', (data: ReservationSocketData) => {
      console.log('🎉 [TABLE SOCKET] New reservation received:', data);
      
      // Safe check for reservation data
      if (!data || !data.reservation) {
        console.warn('⚠️ [TABLE SOCKET] Received invalid reservation data:', data);
        return;
      }
      
      const reservation = data.reservation;
      
      // Add to reservations list (create a proper reservation object)
      const newReservation: Reservation = {
        _id: reservation.reservationNumber || 'temp-id',
        reservationNumber: reservation.reservationNumber,
        customerInfo: {
          name: reservation.customerName || 'Unknown',
          email: '',
          phone: ''
        },
        tableId: '',
        tableInfo: {
          tableNumber: reservation.tableNumber || 'Unknown',
          capacity: 0,
          location: ''
        },
        reservationDate: new Date(reservation.reservationDate),
        timeSlot: reservation.timeSlot || { start: '', end: '' },
        partySize: reservation.partySize || 1,
        status: reservation.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setReservations(prev => [newReservation, ...prev]);
      
      setNotifications(prev => [...prev, {
        type: 'new_reservation',
        reservationId: newReservation._id,
        reservationNumber: newReservation.reservationNumber,
        tableNumber: reservation.tableNumber,
        message: `New reservation for table ${reservation.tableNumber}`,
        timestamp: new Date()
      }]);
      
      if (Notification.permission === 'granted') {
        new Notification('New Reservation!', {
          body: `Table ${reservation.tableNumber} - ${reservation.customerName}`,
          icon: '/vite.svg'
        });
      }
    });

    newSocket.on('reservation_status_updated', (data: unknown) => {
      console.log('🔄 [TABLE SOCKET] Reservation status updated:', data);
      const reservationData = data as { reservationId?: string; reservationNumber?: string; tableNumber?: string; message?: string };
      
      setNotifications(prev => [...prev, {
        type: 'reservation_status_updated',
        reservationId: reservationData.reservationId || '',
        reservationNumber: reservationData.reservationNumber || '',
        tableNumber: reservationData.tableNumber || '',
        message: reservationData.message || 'Reservation status updated',
        timestamp: new Date()
      }]);
    });

    newSocket.on('table_status_updated', (data: unknown) => {
      console.log('🪑 [TABLE SOCKET] Table status updated:', data);
      const tableData = data as { tableNumber?: string; message?: string };
      
      setNotifications(prev => [...prev, {
        type: 'table_status_updated',
        reservationId: '',
        reservationNumber: '',
        tableNumber: tableData.tableNumber || '',
        message: tableData.message || 'Table status updated',
        timestamp: new Date()
      }]);
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 [TABLE SOCKET] Cleaning up table socket connection');
      newSocket.disconnect();
    };
  }, [user]); // Add user as dependency to reconnect when auth status changes

  const updateReservationStatus = (reservationId: string, status: string) => {
    if (socket && isConnected) {
      console.log('📤 [TABLE SOCKET] Updating reservation status:', { reservationId, status });
      socket.emit('reservation_status_update', { reservationId, status });
    }
  };

  const createReservation = (reservationData: CreateReservationData) => {
    if (socket && isConnected) {
      console.log('📤 [TABLE SOCKET] Creating reservation:', reservationData);
      socket.emit('reservation_created', reservationData);
    }
  };

  const changeTableStatus = (tableData: TableStatusData) => {
    if (socket && isConnected) {
      console.log('📤 [TABLE SOCKET] Changing table status:', tableData);
      socket.emit('table_status_changed', tableData);
    }
  };

  const emitTableEvent = (eventName: string, data: Record<string, unknown>) => {
    if (socket && isConnected) {
      console.log(`📤 [TABLE SOCKET] Emitting event ${eventName}:`, data);
      socket.emit(eventName, data);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    socket,
    isConnected,
    reservations,
    notifications,
    error,
    updateReservationStatus,
    createReservation,
    changeTableStatus,
    emitTableEvent,
    clearNotifications
  };
};