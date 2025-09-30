import { io, Socket } from 'socket.io-client';

interface SocketMessage {
  id?: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface ShiftNotification {
  shift: any;
  message: string;
  timestamp: Date;
}

interface OrderNotification {
  order: any;
  message: string;
  timestamp: Date;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Event listeners storage
  private listeners = new Map<string, Function[]>();

  connect(userType: 'employee' | 'customer' = 'employee'): Promise<Socket> {
    return new Promise((resolve, reject) => {
      try {
        const token = userType === 'employee' 
          ? localStorage.getItem('employeeToken')
          : localStorage.getItem('customerToken');

        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
          auth: {
            token,
            type: userType
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('🔌 Socket connected:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔌 Socket connection error:', error);
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
              this.socket?.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
          } else {
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            this.socket?.connect();
          }
        });

        // Setup default event listeners
        this.setupDefaultListeners();

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupDefaultListeners() {
    if (!this.socket) return;

    // Welcome message
    this.socket.on('connected', (data) => {
      console.log('🎉 Welcome message:', data.message);
      this.showNotification(data.message, 'success');
    });

    // New shift created
    this.socket.on('new_shift_created', (data: ShiftNotification) => {
      console.log('📅 New shift created:', data);
      this.showNotification(data.message, 'info');
      this.emit('shift_created', data);
    });

    // Shift assignment
    this.socket.on('shift_assignment', (data: ShiftNotification) => {
      console.log('👤 Shift assigned:', data);
      this.showNotification(data.message, 'success');
      this.emit('shift_assigned', data);
    });

    // Shift assignment update
    this.socket.on('shift_assignment_update', (data: ShiftNotification) => {
      console.log('🔄 Shift assignment updated:', data);
      this.emit('shift_assignment_update', data);
    });

    // Employee status updates
    this.socket.on('employee_status_updated', (data) => {
      console.log('👤 Employee status updated:', data);
      this.emit('employee_status_updated', data);
    });

    // Order notifications
    this.socket.on('new_order_for_kitchen', (data: OrderNotification) => {
      console.log('🍳 New order for kitchen:', data);
      this.showNotification(data.message, 'info');
      this.emit('new_order_kitchen', data);
    });

    this.socket.on('order_ready_for_delivery', (data: OrderNotification) => {
      console.log('🚚 Order ready for delivery:', data);
      this.showNotification(data.message, 'success');
      this.emit('order_ready_delivery', data);
    });

    this.socket.on('order_status_update', (data: OrderNotification) => {
      console.log('📦 Order status updated:', data);
      this.showNotification(data.message, 'info');
      this.emit('order_status_updated', data);
    });

    // Table status updates
    this.socket.on('table_status_updated', (data) => {
      console.log('🪑 Table status updated:', data);
      this.emit('table_status_updated', data);
    });

    // Reservation notifications
    this.socket.on('new_reservation', (data) => {
      console.log('📝 New reservation:', data);
      this.showNotification(data.message, 'info');
      this.emit('new_reservation', data);
    });

    // Inventory alerts
    this.socket.on('inventory_alert', (data) => {
      console.log('📦 Inventory alert:', data);
      this.showNotification(data.message, 'warning');
      this.emit('inventory_alert', data);
    });

    // Staff messages
    this.socket.on('staff_message_received', (data) => {
      console.log('💬 Staff message:', data);
      this.emit('staff_message', data);
    });
  }

  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    // Create a simple notification system
    if (window.showSocketNotification) {
      window.showSocketNotification(message, type);
    } else {
      // Fallback to console or create simple toast
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Socket emission methods
  createShift(shiftData: any) {
    this.socket?.emit('shift_created', shiftData);
  }

  assignShift(shiftId: string, employeeId: string, shiftData: any) {
    this.socket?.emit('shift_assigned', { shiftId, employeeId, shift: shiftData });
  }

  updateEmployeeStatus(employeeData: any) {
    this.socket?.emit('update_employee_status', employeeData);
  }

  changeOrderStatus(orderData: any) {
    this.socket?.emit('order_status_changed', orderData);
  }

  changeTableStatus(tableData: any) {
    this.socket?.emit('table_status_changed', tableData);
  }

  createReservation(reservationData: any) {
    this.socket?.emit('reservation_created', reservationData);
  }

  inventoryLowAlert(inventoryData: any) {
    this.socket?.emit('inventory_low', inventoryData);
  }

  sendStaffMessage(message: string, channel: string = 'general') {
    this.socket?.emit('staff_message', { message, channel });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

// Global notification function for window object
declare global {
  interface Window {
    showSocketNotification?: (message: string, type: string) => void;
  }
}

export default socketService;