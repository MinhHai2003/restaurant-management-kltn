import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminInventoryManagement from '../components/admin/AdminInventoryManagement';
import StaffManagement from '../components/admin/StaffManagement';
import ShiftManagement from '../components/admin/ShiftManagement';
import MenuManagement from '../components/admin/MenuManagement';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { useTableSocket } from '../hooks/useTableSocket';

interface ApiReservation {
  _id: string;
  reservationNumber: string;
  customerName?: string;
  customerPhone?: string;
  table?: {
    tableNumber: string;
    capacity: number;
  };
  reservationDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  partySize: number;
  status: string;
  occasion?: string;
  specialRequests?: string;
  createdAt: string;
}

type TabType = 'overview' | 'reservations' | 'tables' | 'inventory' | 'staff' | 'shifts' | 'statistics' | 'orders';

interface Stats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  totalReservations: number;
  pendingReservations: number;
  totalRevenue: number;
  totalOrders: number;
}

interface Reservation {
  _id: string;
  customerName: string;
  customerPhone?: string;
  tableNumber: string;
  reservationDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  partySize: number;
  status: string;
  occasion: string;
  specialRequests?: string;
}

interface AdminTable {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  features?: string[];
  description?: string;
}

interface OrderItem {
  _id: string;
  status: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  delivery: {
    type: 'pickup' | 'delivery' | 'dine-in';
  };
  pricing: {
    total: number;
  };
  status: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats>({
    totalTables: 0,
    availableTables: 0,
    occupiedTables: 0,
    reservedTables: 0,
    totalReservations: 0,
    pendingReservations: 0,
    totalRevenue: 0,
    totalOrders: 0
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Table creation states
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [tableFormData, setTableFormData] = useState({
    tableNumber: '',
    capacity: 4,
    location: 'indoor',
    features: [] as string[],
    description: '',
    pricing: { basePrice: 0 }
  });
  const [creatingTable, setCreatingTable] = useState(false);
  const [updatingTable, setUpdatingTable] = useState(false);
  const [deletingTable, setDeletingTable] = useState('');
  
  // Order management states
  const [orderActiveTab, setOrderActiveTab] = useState('dashboard');
  
  // Service status states
  const [serviceStatus, setServiceStatus] = useState({
    orderService: false,
    menuService: false,
    inventoryService: false
  });
  
  // Order dashboard data
  const [orderStats, setOrderStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    avgOrders: 0,
    pendingOrders: 0
  });
  
  // Orders list data
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPagination, setOrdersPagination] = useState({
    current: 1,
    total: 1,
    hasNext: false,
    hasPrev: false
  });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  
  // Socket.io for real-time updates
  const { notifications, isConnected, socket } = useOrderSocket();
  const { isConnected: tableSocketConnected, socket: tableSocket } = useTableSocket();
  
  const navigate = useNavigate();

  // Get employee data from localStorage
  const getEmployeeInfo = () => {
    try {
      const employeeData = localStorage.getItem('employeeData');
      return employeeData ? JSON.parse(employeeData) : null;
    } catch {
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeData');
    navigate('/employee-login');
  };

  const employeeInfo = getEmployeeInfo();

  // Helper function to get Vietnamese occasion names
  // Helper function to get Vietnamese occasion display
  const getOccasionDisplay = (occasion: string): string => {
    const occasionMap: { [key: string]: string } = {
      'birthday': '🎂 Sinh nhật',
      'anniversary': '💕 Kỷ niệm', 
      'business': '💼 Công việc',
      'date': '💘 Hẹn hò',
      'family': '👨‍👩‍👧‍👦 Gia đình',
      'other': '📝 Khác'
    };
    return occasionMap[occasion] || '📝 Khác';
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadTableStats(),
          loadReservations(),
          loadTables()
        ]);
      } catch {
        setError('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    checkServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load orders list when switching to orders tab
  useEffect(() => {
    if (orderActiveTab === 'orders' && serviceStatus.orderService) {
      loadOrdersList(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderActiveTab, serviceStatus.orderService]);

  // Listen to Socket.io events for real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🔌 AdminDashboard: Setting up Socket.io event listeners...');

      const handleOrderStatusUpdate = (data: { orderId: string; status: string; [key: string]: unknown }) => {
        console.log('🔄 AdminDashboard: Order status updated via Socket.io:', data);
        // Refresh both dashboard stats and orders list
        loadOrderDashboard();
        if (orderActiveTab === 'orders') {
          loadOrdersList(ordersPagination.current);
        }
      };

      const handleNewOrder = (data: { orderNumber?: string; [key: string]: unknown }) => {
        console.log('🆕 AdminDashboard: New order received via Socket.io:', data);
        // Refresh both dashboard stats and orders list
        loadOrderDashboard();
        if (orderActiveTab === 'orders') {
          loadOrdersList(ordersPagination.current);
        }
      };

      // Register event listeners
      socket.on('order_status_updated', handleOrderStatusUpdate);
      socket.on('customer_order_status_updated', handleOrderStatusUpdate);
      socket.on('admin_order_created', handleNewOrder);
      socket.on('new_order_kitchen', handleNewOrder);
      socket.on('order_created', handleNewOrder);

      // Cleanup listeners
      return () => {
        console.log('🔌 AdminDashboard: Cleaning up Socket.io event listeners...');
        socket.off('order_status_updated', handleOrderStatusUpdate);
        socket.off('customer_order_status_updated', handleOrderStatusUpdate);
        socket.off('admin_order_created', handleNewOrder);
        socket.off('new_order_kitchen', handleNewOrder);
        socket.off('order_created', handleNewOrder);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, orderActiveTab]);

  // Listen to Table Socket events for real-time table and reservation updates  
  useEffect(() => {
    if (tableSocket && tableSocketConnected) {
      console.log('🪑 AdminDashboard: Table socket connected, setting up event listeners...');
      
      // Handle new reservations
      const handleNewReservation = (data: unknown) => {
        console.log('🎉 AdminDashboard: New reservation received:', data);
        // Reload reservations and stats
        Promise.all([
          loadReservations(),
          loadTableStats()
        ]).catch(error => {
          console.error('❌ AdminDashboard: Error reloading after new reservation:', error);
        });
      };

      // Handle reservation status updates
      const handleReservationStatusUpdate = (data: unknown) => {
        console.log('🔄 AdminDashboard: Reservation status updated:', data);
        // Reload reservations and stats
        Promise.all([
          loadReservations(),
          loadTableStats()
        ]).catch(error => {
          console.error('❌ AdminDashboard: Error reloading after status update:', error);
        });
      };

      // Handle table status updates
      const handleTableStatusUpdate = (data: unknown) => {
        console.log('🪑 AdminDashboard: Table status updated:', data);
        // Reload tables and stats
        Promise.all([
          loadTables(),
          loadTableStats()
        ]).catch(error => {
          console.error('❌ AdminDashboard: Error reloading after table update:', error);
        });
      };

      // Register event listeners
      tableSocket.on('new_reservation', handleNewReservation);
      tableSocket.on('reservation_status_updated', handleReservationStatusUpdate);
      tableSocket.on('table_status_updated', handleTableStatusUpdate);

      // Initial load when socket connects
      const loadInitialData = () => {
        console.log('🔄 AdminDashboard: Loading initial reservation data...');
        Promise.all([
          loadReservations(),
          loadTableStats(),
          loadTables()
        ]).catch(error => {
          console.error('❌ AdminDashboard: Error loading initial data:', error);
        });
      };

      loadInitialData();

      // Cleanup event listeners
      return () => {
        console.log('🪑 AdminDashboard: Cleaning up table socket event listeners...');
        tableSocket.off('new_reservation', handleNewReservation);
        tableSocket.off('reservation_status_updated', handleReservationStatusUpdate);
        tableSocket.off('table_status_updated', handleTableStatusUpdate);
      };
    }
  }, [tableSocket, tableSocketConnected]);

  const checkServices = async () => {
    const services = [
      { name: 'orderService', url: 'http://localhost:5005/health' },
      { name: 'menuService', url: 'http://localhost:5003/api/menu' }, // Menu service không có /health
      { name: 'inventoryService', url: 'http://localhost:5004/api/inventory' } // Inventory service không có /health
    ];

    const statusChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await fetch(service.url);
          return { name: service.name, status: response.ok };
        } catch {
          return { name: service.name, status: false };
        }
      })
    );

    const newStatus: { [key: string]: boolean } = {};
    statusChecks.forEach((result) => {
      if (result.status === 'fulfilled') {
        newStatus[result.value.name] = result.value.status;
      }
    });

    setServiceStatus({
      orderService: newStatus.orderService || false,
      menuService: newStatus.menuService || false,
      inventoryService: newStatus.inventoryService || false
    });

    if (newStatus.orderService) {
      loadOrderDashboard();
    }
  };

  const loadOrderDashboard = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/admin/orders/dashboard');
      if (response.ok) {
        const data = await response.json();
        console.log('Order dashboard data:', data);
        
        if (data.success) {
          setOrderStats({
            todayOrders: data.data.today?.totalOrders || 0,
            todayRevenue: data.data.today?.totalRevenue || 0,
            avgOrders: Math.round(data.data.week?.totalOrders / 7) || 0,
            pendingOrders: data.data.recentOrders?.filter((order: OrderItem) => order.status === 'pending').length || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading order dashboard:', error);
    }
  };

  const loadOrdersList = async (page = 1, filters = {}) => {
    if (!serviceStatus.orderService) return;
    
    setOrdersLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });
      
      const response = await fetch(`http://localhost:5005/api/admin/orders?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Orders list data:', data);
        
        if (data.success) {
          setOrdersList(data.data.orders || []);
          setOrdersPagination(data.data.pagination || {
            current: 1,
            total: 1,
            hasNext: false,
            hasPrev: false
          });
        }
      }
    } catch (error) {
      console.error('Error loading orders list:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!serviceStatus.orderService) return;
    
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`http://localhost:5005/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Trạng thái được cập nhật thành ${newStatus} bởi admin`
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Order status updated:', data);
        
        if (data.success) {
          // Cập nhật trạng thái trong danh sách local
          setOrdersList(prevOrders => 
            prevOrders.map((order: Order) => 
              order._id === orderId 
                ? { ...order, status: newStatus }
                : order
            )
          );
          
          // Reload dashboard stats để cập nhật số liệu
          loadOrderDashboard();
        }
      } else {
        console.error('Failed to update order status');
        alert('Không thể cập nhật trạng thái đơn hàng');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Lỗi khi cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const loadTableStats = async () => {
    try {
      const res = await fetch('http://localhost:5006/api/tables/stats');
      const data = await res.json();
      if (data.success) {
        setStats(prev => ({
          ...prev,
          totalTables: data.data.summary.total,
          availableTables: data.data.summary.available,
          occupiedTables: data.data.summary.occupied,
          reservedTables: data.data.summary.reserved
        }));
      }
    } catch {
      console.error('Error loading table stats');
    }
  };

  const loadTables = async () => {
    try {
      const res = await fetch('http://localhost:5006/api/tables?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.tables) {
          setTables(data.data.tables);
        }
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadReservations = async () => {
    try {
      const res = await fetch('http://localhost:5006/api/reservations/admin/all?limit=100');
      if (res.ok) {
        const data = await res.json();
        
        if (data.success && data.data && data.data.reservations) {
          const realReservations: Reservation[] = data.data.reservations.map((res: ApiReservation) => ({
            _id: res._id,
            customerName: res.customerName || 'Khách hàng ẩn danh',
            customerPhone: res.customerPhone || 'N/A',
            tableNumber: res.table?.tableNumber || 'N/A',
            reservationDate: res.reservationDate.split('T')[0], // Get date only
            timeSlot: res.timeSlot,
            partySize: res.partySize,
            status: res.status,
            occasion: res.occasion,
            specialRequests: res.specialRequests || 'Không có yêu cầu đặc biệt'
          }));
          
          setReservations(realReservations);
          setStats(prev => ({
            ...prev,
            totalReservations: realReservations.length,
            pendingReservations: realReservations.filter(r => r.status === 'pending').length
          }));
        } else {
          console.error('Invalid API response structure:', data);
          setReservations([]);
        }
      } else {
        console.error('Failed to fetch reservations:', res.statusText);
        setReservations([]);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
    }
  };

  // Hàm tạo bàn mới
  const handleCreateTable = async () => {
    if (!tableFormData.tableNumber || !tableFormData.capacity) {
      alert('Vui lòng nhập số bàn và sức chứa');
      return;
    }

    // Kiểm tra số bàn đã tồn tại
    const existingTable = tables.find(table => table.tableNumber === tableFormData.tableNumber);
    if (existingTable) {
      alert('Số bàn này đã tồn tại!');
      return;
    }

    setCreatingTable(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Debug: Log data được gửi
      console.log('Creating table with data:', tableFormData);
      
      const response = await fetch('http://localhost:5006/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tableFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi tạo bàn');
      }

      const newTable = await response.json();
      
      // Fetch lại danh sách bàn để đảm bảo dữ liệu đồng bộ
      await loadTables();
      
      // Reset form và đóng modal
      setShowCreateTableModal(false);
      setTableFormData({
        tableNumber: '',
        capacity: 4,
        location: 'indoor',
        features: [],
        description: '',
        pricing: { basePrice: 0 }
      });
      
      alert('✅ Tạo bàn thành công!');
    } catch (error) {
      console.error('Error creating table:', error);
      alert('❌ Lỗi tạo bàn: ' + error.message);
    } finally {
      setCreatingTable(false);
    }
  };

  // Hàm xóa bàn
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
      return;
    }

    setDeletingTable(tableId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5006/api/tables/${tableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi xóa bàn');
      }

      // Cập nhật danh sách bàn
      setTables(prev => prev.filter(table => table._id !== tableId));
      alert('✅ Xóa bàn thành công!');
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('❌ Lỗi xóa bàn: ' + (error as Error).message);
    } finally {
      setDeletingTable('');
    }
  };

  // Hàm mở modal chỉnh sửa
  const openEditModal = (table: any) => {
    setEditingTable(table);
    setTableFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      features: table.features || [],
      pricing: { basePrice: table.pricing?.basePrice || 0 },
      description: table.description || ''
    });
    setShowEditTableModal(true);
  };

  // Hàm cập nhật bàn
  const handleUpdateTable = async () => {
    if (!tableFormData.tableNumber.trim() || !tableFormData.capacity) {
      alert('Vui lòng nhập số bàn và sức chứa');
      return;
    }

    // Kiểm tra số bàn đã tồn tại (ngoại trừ bàn đang chỉnh sửa)
    const existingTable = tables.find(table => 
      table.tableNumber === tableFormData.tableNumber && 
      table._id !== editingTable._id
    );
    if (existingTable) {
      alert('Số bàn này đã tồn tại!');
      return;
    }

    setUpdatingTable(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5006/api/tables/${editingTable._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tableFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi cập nhật bàn');
      }

      // Reload tables list để cập nhật UI
      await loadTables();
      
      // Reset form và đóng modal
      setShowEditTableModal(false);
      setEditingTable(null);
      setTableFormData({
        tableNumber: '',
        capacity: 4,
        location: 'indoor',
        features: [],
        pricing: { basePrice: 0 },
        description: ''
      });
      
      alert('✅ Cập nhật bàn thành công!');
    } catch (error) {
      console.error('Error updating table:', error);
      alert('❌ Lỗi cập nhật bàn: ' + (error as Error).message);
    } finally {
      setUpdatingTable(false);
    }
  };

  const resetMaintenanceTables = async () => {
    if (!confirm('Bạn có chắc chắn muốn chuyển tất cả bàn đang bảo trì về trạng thái trống?')) {
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5006/api/tables/admin/reset-maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        // Reload data
        await Promise.all([loadTableStats(), loadTables()]);
      } else {
        setError('Không thể reset trạng thái bàn bảo trì');
      }
    } catch {
      setError('Lỗi khi reset trạng thái bàn bảo trì');
    }
  };

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:5006/api/reservations/admin/${reservationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Reload both reservations and table data to reflect changes
          await Promise.all([loadReservations(), loadTableStats(), loadTables()]);
        } else {
          setError(data.message || 'Không thể cập nhật trạng thái đặt bàn');
        }
      } else {
        setError('Lỗi khi gọi API cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      setError('Lỗi kết nối khi cập nhật trạng thái đặt bàn');
    }
  };

  const updateTableStatus = async (tableId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:5006/api/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        // Reload data
        await Promise.all([loadTableStats(), loadReservations(), loadTables()]);
      } else {
        setError('Không thể cập nhật trạng thái bàn');
      }
    } catch {
      setError('Lỗi khi cập nhật trạng thái bàn');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', color: '#d97706', label: 'Chờ xác nhận' };
      case 'confirmed': return { bg: '#d1fae5', color: '#059669', label: 'Đã xác nhận' };
      case 'seated': return { bg: '#dbeafe', color: '#2563eb', label: 'Đã nhận bàn' };
      case 'completed': return { bg: '#e5e7eb', color: '#6b7280', label: 'Hoàn thành' };
      case 'cancelled': return { bg: '#fee2e2', color: '#dc2626', label: 'Đã hủy' };
      default: return { bg: '#f3f4f6', color: '#6b7280', label: status };
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: '#d1fae5', color: '#059669', label: 'Còn trống' };
      case 'occupied': return { bg: '#fef3c7', color: '#d97706', label: 'Đang sử dụng' };
      case 'reserved': return { bg: '#dbeafe', color: '#2563eb', label: 'Đã đặt trước' };
      case 'maintenance': return { bg: '#fee2e2', color: '#dc2626', label: 'Bảo trì' };
      case 'cleaning': return { bg: '#f3e8ff', color: '#9333ea', label: 'Đang dọn' };
      default: return { bg: '#f3f4f6', color: '#6b7280', label: status };
    }
  };

  const renderOverview = () => (
    <div style={{ padding: '24px' }}>
      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Tổng số bàn</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.totalTables}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            Trống: {stats.availableTables} | Đang dùng: {stats.occupiedTables}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Đặt bàn hôm nay</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.totalReservations}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            Chờ duyệt: {stats.pendingReservations}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Doanh thu hôm nay</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
            {stats.totalRevenue.toLocaleString('vi-VN')}đ
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            Đơn hàng: {stats.totalOrders}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Cần xử lý</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.pendingReservations}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            Đặt bàn chờ xác nhận
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
          🕐 Hoạt động gần đây
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: '8px 0', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            ✅ <strong>Nguyễn Văn A</strong> đã đặt bàn T001 lúc 14:30
          </p>
          <p style={{ margin: '8px 0', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            🍽️ <strong>Bàn T003</strong> đã hoàn thành phục vụ - Thu: 850,000đ
          </p>
          <p style={{ margin: '8px 0', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            📦 <strong>Nguyên liệu</strong> tôm hùm sắp hết - Còn 5kg
          </p>
        </div>
      </div>
    </div>
  );

  const renderReservations = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          📝 Quản lý đặt bàn & Trạng thái bàn
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Socket status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: tableSocketConnected ? '#dcfce7' : '#fee2e2',
            color: tableSocketConnected ? '#059669' : '#dc2626',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: tableSocketConnected ? '#10b981' : '#ef4444'
            }}></div>
            {tableSocketConnected ? 'Real-time ON' : 'Disconnected'}
          </div>
          
          {/* Manual refresh button */}
          <button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              Promise.all([loadReservations(), loadTableStats(), loadTables()]);
            }}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
          
          <button style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            📊 Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Reservations Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            📝 Danh sách đặt bàn
          </h3>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '150px 100px 120px 150px 100px 120px 150px 120px 200px 120px',
          gap: '12px',
          padding: '12px 20px',
          background: '#f9fafb',
          fontWeight: '600',
          fontSize: '13px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <span>Khách hàng</span>
          <span>Bàn</span>
          <span>Ngày đặt</span>
          <span>Thời gian</span>
          <span>Số người</span>
          <span>SĐT</span>
          <span>Dịp</span>
          <span>Trạng thái</span>
          <span>Yêu cầu đặc biệt</span>
          <span>Hành động</span>
        </div>

        {reservations.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#6b7280',
            fontSize: '14px'
          }}>
            📝 Chưa có đặt bàn nào trong hệ thống
          </div>
        ) : (
          reservations.map(reservation => {
            const statusInfo = getStatusColor(reservation.status);
            return (
              <div key={reservation._id} style={{
                display: 'grid',
                gridTemplateColumns: '150px 100px 120px 150px 100px 120px 150px 120px 200px 120px',
                gap: '12px',
                padding: '12px 20px',
                borderBottom: '1px solid #f1f5f9',
                alignItems: 'center',
                fontSize: '13px'
              }}>
                <span style={{ fontWeight: '600' }}>{reservation.customerName}</span>
                <span style={{
                  background: '#dbeafe',
                  color: '#2563eb',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {reservation.tableNumber}
                </span>
                <span>{new Date(reservation.reservationDate).toLocaleDateString('vi-VN')}</span>
                <span style={{ fontSize: '12px' }}>
                  {reservation.timeSlot.startTime} - {reservation.timeSlot.endTime}
                </span>
                <span style={{ textAlign: 'center' }}>{reservation.partySize} người</span>
                <span style={{ fontSize: '12px', color: '#4b5563' }}>
                  {reservation.customerPhone || 'N/A'}
                </span>
                <span style={{ 
                  fontSize: '12px',
                  color: '#4b5563'
                }}>{getOccasionDisplay(reservation.occasion)}</span>
                <span style={{
                  background: statusInfo.bg,
                  color: statusInfo.color,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {statusInfo.label}
                </span>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }} title={reservation.specialRequests}>
                  {reservation.specialRequests || 'Không có yêu cầu đặc biệt'}
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {reservation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateReservationStatus(reservation._id, 'confirmed')}
                        style={{
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                        title="Xác nhận"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => updateReservationStatus(reservation._id, 'cancelled')}
                        style={{
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                        title="Hủy"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {reservation.status === 'confirmed' && (
                    <button
                      onClick={() => updateReservationStatus(reservation._id, 'seated')}
                      style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                      title="Đã nhận bàn"
                    >
                      🪑 Nhận bàn
                    </button>
                  )}
                  {reservation.status === 'seated' && (
                    <button
                      onClick={() => updateReservationStatus(reservation._id, 'completed')}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                      title="Hoàn thành"
                    >
                      ✅ Xong
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderTableManagement = () => (
    <div style={{ padding: '24px' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🪑 Quản lý trạng thái bàn
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowCreateTableModal(true)}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ➕ Tạo bàn mới
            </button>
            <button
              onClick={resetMaintenanceTables}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔧➡️✅ Reset bảo trì
            </button>
            <button
              onClick={loadTables}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {tables.map(table => (
            <div
              key={table._id}
              style={{
                border: `2px solid ${getTableStatusColor(table.status).color}`,
                borderRadius: '8px',
                padding: '16px',
                background: getTableStatusColor(table.status).bg
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Bàn {table.tableNumber}
                </h3>
                <span style={{
                  background: getTableStatusColor(table.status).color,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getTableStatusColor(table.status).label}
                </span>
              </div>

              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
                <div>👥 Sức chứa: {table.capacity} người</div>
                <div>📍 Vị trí: {table.location}</div>
                {table.description && <div>📝 {table.description}</div>}
                {table.features && table.features.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    🔧 Tiện nghi: {table.features.map((feature) => (
                      <span key={`${table._id}-feature-${feature}`} style={{ 
                        fontSize: '12px', 
                        background: '#f3f4f6', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        marginRight: '4px',
                        display: 'inline-block',
                        marginTop: '2px'
                      }}>
                        {feature.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap' 
              }}>
                {['available', 'occupied', 'reserved', 'maintenance', 'cleaning'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateTableStatus(table._id, status)}
                    disabled={table.status === status}
                    style={{
                      background: table.status === status ? '#9ca3af' : getTableStatusColor(status).color,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: table.status === status ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      opacity: table.status === status ? 0.6 : 1
                    }}
                    title={`Chuyển sang ${getTableStatusColor(status).label}`}
                  >
                    {getTableStatusColor(status).label}
                  </button>
                ))}
              </div>

              {/* Edit và Delete buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => openEditModal(table)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    flex: 1
                  }}
                >
                  ✏️ Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDeleteTable(table._id)}
                  disabled={deletingTable === table._id}
                  style={{
                    background: deletingTable === table._id ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: deletingTable === table._id ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    flex: 1,
                    opacity: deletingTable === table._id ? 0.6 : 1
                  }}
                >
                  {deletingTable === table._id ? '⏳ Đang xóa...' : '🗑️ Xóa'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🪑</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Chưa có bàn nào
            </div>
            <div style={{ fontSize: '14px' }}>
              Thêm bàn mới để bắt đầu quản lý trạng thái
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrderManagement = () => {

    return (
      <div style={{ margin: '24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          backgroundColor: 'white',
          borderRadius: '16px 16px 0 0',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: 0 }}>
              🍽️ Quản lý Đơn hàng
            </h2>
            <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '14px' }}>
              Xem và quản lý đơn hàng từ khách hàng
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={checkServices}
              style={{
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', padding: '0 24px' }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard' },
              { key: 'orders', label: '📋 Danh sách đơn hàng' },
              { key: 'menu', label: '🍽️ Quản lý Menu' },
              { key: 'analytics', label: '📈 Báo cáo' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setOrderActiveTab(tab.key)}
                style={{
                  backgroundColor: orderActiveTab === tab.key ? '#1890ff' : 'transparent',
                  color: orderActiveTab === tab.key ? 'white' : '#666',
                  border: 'none',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  borderBottom: orderActiveTab === tab.key ? '2px solid #1890ff' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 16px 16px',
          minHeight: '400px'
        }}>
          {orderActiveTab === 'dashboard' && (
            <div style={{ padding: '24px' }}>
              {/* Info Banner */}
              <div style={{
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '20px' }}>ℹ️</div>
                <div>
                  <div style={{ fontWeight: '500', color: '#0050b3', fontSize: '14px' }}>
                    Thống kê Đơn hàng từ Khách hàng
                  </div>
                  <div style={{ color: '#096dd9', fontSize: '12px', marginTop: '4px' }}>
                    Hiển thị tất cả đơn hàng được khách hàng đặt qua website/app, không bao gồm đơn hàng tại quầy
                  </div>
                </div>
              </div>

              {/* Recent Notifications */}
              {notifications.length > 0 && (
                <div style={{
                  backgroundColor: '#fefce8',
                  border: '1px solid #facc15',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#854d0e' }}>
                    📢 Thông báo mới ({notifications.slice(-3).length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.slice(-3).reverse().map((notification, index) => (
                      <div key={`notification-${notification.timestamp || Date.now()}-${index}`} style={{
                        fontSize: '12px',
                        color: '#713f12',
                        padding: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '4px'
                      }}>
                        <strong>{notification.message}</strong>
                        {notification.timestamp && (
                          <div style={{ fontSize: '10px', color: '#a16207', marginTop: '4px' }}>
                            {notification.timestamp.toLocaleTimeString('vi-VN')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #0ea5e9',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0ea5e9', fontSize: '14px' }}>Đơn hàng hôm nay</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7' }}>
                    {serviceStatus.orderService ? orderStats.todayOrders : '0'}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #22c55e',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: '14px' }}>Doanh thu hôm nay</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                    {serviceStatus.orderService ? `${orderStats.todayRevenue.toLocaleString()}đ` : '0đ'}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#fffbeb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #f59e0b',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '14px' }}>Đơn TB/ngày</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
                    {serviceStatus.orderService ? orderStats.avgOrders : '0'}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#fdf2f8',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ec4899',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#ec4899', fontSize: '14px' }}>Chờ xử lý</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#be185d' }}>
                    {serviceStatus.orderService ? orderStats.pendingOrders : '0'}
                  </div>
                </div>
              </div>

              {/* Service Status */}
              <div style={{
                backgroundColor: '#fafafa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>🔧 Trạng thái Services</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                    <span>Order Service (5005)</span>
                    <span style={{ color: serviceStatus.orderService ? '#22c55e' : '#ef4444', fontSize: '12px' }}>
                      {serviceStatus.orderService ? '✅ Online' : '❌ Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                    <span>Menu Service (5003)</span>
                    <span style={{ color: serviceStatus.menuService ? '#22c55e' : '#ef4444', fontSize: '12px' }}>
                      {serviceStatus.menuService ? '✅ Online' : '❌ Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                    <span>Inventory Service (5004)</span>
                    <span style={{ color: serviceStatus.inventoryService ? '#22c55e' : '#ef4444', fontSize: '12px' }}>
                      {serviceStatus.inventoryService ? '✅ Online' : '❌ Offline'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={checkServices}
                  style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔄 Kiểm tra lại
                </button>
                <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#666' }}>
                  Khi tất cả services chạy, dashboard sẽ hiển thị dữ liệu thực tế.
                </p>
              </div>
            </div>
          )}

          {orderActiveTab === 'orders' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                  📋 Danh sách Đơn hàng từ Khách hàng
                </h3>
                <button
                  onClick={() => loadOrdersList(1)}
                  style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔄 Tải lại
                </button>
              </div>
              
              {/* Filters */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                <select style={{
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <option>Tất cả trạng thái</option>
                  <option>pending</option>
                  <option>confirmed</option>
                  <option>preparing</option>
                  <option>ready</option>
                  <option>completed</option>
                </select>
                
                <select style={{
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <option>Tất cả loại</option>
                  <option>pickup</option>
                  <option>delivery</option>
                  <option>dine-in</option>
                </select>
                
                <input 
                  type="date"
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>

              {/* Order List */}
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                {/* Header */}
                <div style={{
                  backgroundColor: '#fafafa',
                  padding: '12px',
                  borderBottom: '1px solid #e5e5e5',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.5fr 0.8fr 1fr 1.2fr 1fr 0.8fr',
                  gap: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666'
                }}>
                  <div>Mã đơn</div>
                  <div>Khách hàng</div>
                  <div>Địa chỉ & SĐT</div>
                  <div>Loại</div>
                  <div>Tổng tiền</div>
                  <div>Ghi chú</div>
                  <div>Trạng thái</div>
                  <div>Thao tác</div>
                </div>

                {/* Orders Content */}
                {!serviceStatus.orderService ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    <div>❌ Order Service (5005) offline</div>
                    <small>Khởi động Order Service để xem danh sách đơn hàng</small>
                  </div>
                ) : ordersLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <div>🔄 Đang tải danh sách đơn hàng...</div>
                  </div>
                ) : ordersList.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <div>📋 Chưa có đơn hàng nào</div>
                    <button
                      onClick={() => loadOrdersList(1)}
                      style={{
                        marginTop: '10px',
                        padding: '6px 12px',
                        backgroundColor: '#1890ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Tải lại
                    </button>
                  </div>
                ) : (
                  ordersList.map((order: Order) => (
                    <div
                      key={order._id}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.2fr 1.5fr 0.8fr 1fr 1.2fr 1fr 0.8fr',
                        gap: '12px',
                        fontSize: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontWeight: '500', color: '#1890ff', fontSize: '11px' }}>
                        {order.orderNumber}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '12px', marginBottom: '2px' }}>{order.customerInfo?.name || 'N/A'}</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>{order.customerInfo?.email || ''}</div>
                      </div>
                      <div style={{ minHeight: '36px' }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#333', 
                          fontWeight: '500', 
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          📞 <span>{order.customerInfo?.phone || 'N/A'}</span>
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#666', 
                          lineHeight: '1.3',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '4px'
                        }}>
                          📍 <span style={{ 
                            flex: 1,
                            wordBreak: 'break-word',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {(order.delivery as any)?.address?.full ? 
                              `${(order.delivery as any).address.full}${(order.delivery as any).address.district ? ', ' + (order.delivery as any).address.district : ''}${(order.delivery as any).address.city ? ', ' + (order.delivery as any).address.city : ''}` : 
                              'N/A'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', textAlign: 'left', paddingLeft: '8px' }}>
                        {order.delivery?.type === 'delivery' ? '🚚 Giao hàng' : 
                         order.delivery?.type === 'pickup' ? '🏪 Lấy tại quầy' : 
                         '🍽️ Tại bàn'}
                      </div>
                      <div style={{ fontWeight: '600', color: '#16a34a' }}>
                        {order.pricing?.total?.toLocaleString() || 0}đ
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        <div style={{ 
                          maxHeight: '36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.2'
                        }}>
                          {(order as any)?.notes?.customer || 
                           (order as any)?.notes?.kitchen || 
                           (order as any)?.notes?.delivery || 
                           'Không có ghi chú'}
                        </div>
                      </div>
                      <div>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                          backgroundColor: 
                            order.status === 'completed' ? '#f0fdf4' :
                            order.status === 'delivered' ? '#f0fdf4' :
                            order.status === 'picked_up' ? '#ecfdf5' :
                            order.status === 'ready' ? '#ecfdf5' :
                            order.status === 'confirmed' ? '#eff6ff' :
                            order.status === 'preparing' ? '#fef3c7' :
                            order.status === 'cancelled' ? '#fef2f2' :
                            '#f8fafc',
                          color:
                            order.status === 'completed' ? '#166534' :
                            order.status === 'delivered' ? '#166534' :
                            order.status === 'picked_up' ? '#15803d' :
                            order.status === 'ready' ? '#15803d' :
                            order.status === 'confirmed' ? '#1e40af' :
                            order.status === 'preparing' ? '#92400e' :
                            order.status === 'cancelled' ? '#991b1b' :
                            '#64748b'
                        }}>
                          {
                            order.status === 'pending' ? 'Chờ xử lý' :
                            order.status === 'confirmed' ? 'Đã xác nhận' :
                            order.status === 'preparing' ? 'Đang chuẩn bị' :
                            order.status === 'ready' ? 'Sẵn sàng' :
                            order.status === 'picked_up' ? 'Đã lấy hàng' :
                            order.status === 'delivered' ? 'Đã giao' :
                            order.status === 'completed' ? 'Hoàn thành' :
                            order.status === 'cancelled' ? 'Đã hủy' :
                            order.status
                          }
                        </span>
                      </div>
                      <div>
                        {updatingOrderId === order._id ? (
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#666',
                            textAlign: 'center',
                            padding: '6px'
                          }}>
                            🔄 Đang cập nhật...
                          </div>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            style={{
                              padding: '4px 6px',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontSize: '10px',
                              width: '100%'
                            }}
                          >
                          <option value="pending">Chờ xử lý</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="preparing">Đang chuẩn bị</option>
                          <option value="ready">Sẵn sàng</option>
                          <option value="delivered">Đã giao</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '20px',
                gap: '8px'
              }}>
                <button 
                  onClick={() => loadOrdersList(ordersPagination.current - 1)}
                  disabled={!ordersPagination.hasPrev}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    backgroundColor: ordersPagination.hasPrev ? 'white' : '#f5f5f5',
                    cursor: ordersPagination.hasPrev ? 'pointer' : 'not-allowed',
                    fontSize: '12px'
                  }}
                >
                  ‹ Trước
                </button>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Trang {ordersPagination.current} / {ordersPagination.total}
                </span>
                <button 
                  onClick={() => loadOrdersList(ordersPagination.current + 1)}
                  disabled={!ordersPagination.hasNext}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    backgroundColor: ordersPagination.hasNext ? 'white' : '#f5f5f5',
                    cursor: ordersPagination.hasNext ? 'pointer' : 'not-allowed',
                    fontSize: '12px'
                  }}
                >
                  Sau ›
                </button>
              </div>
            </div>
          )}

          {orderActiveTab === 'analytics' && (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Báo cáo & Thống kê</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Biểu đồ doanh thu, báo cáo chi tiết sẽ hiển thị ở đây.
              </p>
            </div>
          )}

          {orderActiveTab === 'menu' && (
            <MenuManagement />
          )}
        </div>


      </div>
    );
  };

  const renderPlaceholder = (title: string, icon: string, description: string) => (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h2>
      <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '24px' }}>{description}</p>
      <button style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 24px',
        cursor: 'pointer',
        fontWeight: '600'
      }}>
        Đang phát triển...
      </button>
    </div>
  );

  // Real-time updates via Socket.io - Added after all functions are defined
  useEffect(() => {
    // Listen for admin order events
    const adminOrderNotifications = notifications.filter(n => 
      n.type === 'admin_order_created' || 
      n.type === 'order_status_updated' ||
      n.type === 'new_order'
    );

    // Auto-refresh dashboard when new orders come
    if (adminOrderNotifications.length > 0) {
      const latestNotification = adminOrderNotifications[adminOrderNotifications.length - 1];
      if (latestNotification.timestamp && 
          Date.now() - latestNotification.timestamp.getTime() < 5000) { // Only if within 5 seconds
        console.log('🔔 Admin: Auto-refreshing due to new order:', latestNotification);
        
        // Use setTimeout to avoid dependency issues and ensure functions exist
        setTimeout(() => {
          try {
            loadOrderDashboard();
            if (orderActiveTab === 'orders') {
              loadOrdersList(1);
            }
          } catch (error) {
            console.error('Error in real-time refresh:', error);
          }
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
              🏢 Quản trị nhà hàng
            </h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
              Dashboard quản lý tổng hợp
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Employee Info */}
            {employeeInfo && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '8px'
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    👤 {employeeInfo.fullName}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {employeeInfo.role === 'admin' ? '🔧 Quản trị viên' :
                     employeeInfo.role === 'manager' ? '👔 Quản lý' :
                     employeeInfo.role === 'waiter' ? '🍽️ Phục vụ' :
                     employeeInfo.role === 'chef' ? '👨‍🍳 Đầu bếp' :
                     employeeInfo.role === 'cashier' ? '💰 Thu ngân' :
                     employeeInfo.role === 'receptionist' ? '📞 Lễ tân' : employeeInfo.role}
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', opacity: 0.9 }}>
                {new Date().toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.2)'}
              >
                🚪 Đăng xuất
              </button>
              
              <button 
                onClick={() => navigate('/')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.2)'}
              >
                🏠 Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { key: 'overview', label: '📊 Tổng quan', icon: '📊' },
            { key: 'reservations', label: '📝 Đặt bàn', icon: '📝' },
            { key: 'tables', label: '🪑 Quản lý bàn', icon: '🪑' },
            { key: 'inventory', label: '📦 Nguyên liệu', icon: '📦' },
            { key: 'orders', label: '🍽️ Đặt món', icon: '🍽️' },
            { key: 'staff', label: '👥 Nhân sự', icon: '👥' },
            { key: 'shifts', label: '📅 Phân ca', icon: '📅' },
            { key: 'statistics', label: '📈 Thống kê', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              style={{
                background: activeTab === tab.key ? '#667eea' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#6b7280',
                border: 'none',
                padding: '16px 24px',
                cursor: 'pointer',
                fontWeight: '600',
                borderBottom: activeTab === tab.key ? '3px solid #667eea' : '3px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}
        
        {error && (
          <div style={{
            padding: '16px',
            margin: '24px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'reservations' && renderReservations()}
            {activeTab === 'tables' && renderTableManagement()}
            {activeTab === 'inventory' && <AdminInventoryManagement />}
            {activeTab === 'orders' && renderOrderManagement()}
            {activeTab === 'staff' && <StaffManagement />}
            {activeTab === 'shifts' && <ShiftManagement />}
            {activeTab === 'statistics' && renderPlaceholder(
              'Thống kê báo cáo', 
              '📈', 
              'Doanh thu, khách hàng, món ăn bán chạy, xu hướng kinh doanh'
            )}
          </>
        )}
      </div>

      {/* Modal tạo bàn mới */}
      {showCreateTableModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '480px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>➕ Tạo bàn mới</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Số bàn *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: B01, VIP-A, T12..."
                  value={tableFormData.tableNumber}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Sức chứa *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableFormData.capacity}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Vị trí
                </label>
                <select
                  value={tableFormData.location}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, location: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="indoor">Trong nhà</option>
                  <option value="outdoor">Ngoài trời</option>
                  <option value="private">Phòng riêng</option>
                  <option value="vip">VIP</option>
                  <option value="terrace">Sân thượng</option>
                  <option value="garden">Vườn</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Tiện nghi
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '200px', overflow: 'auto' }}>
                  {[
                    { key: 'wifi', label: '📶 WiFi' },
                    { key: 'outlet', label: '🔌 Ổ cắm' },
                    { key: 'air_conditioned', label: '❄️ Điều hòa' },
                    { key: 'window_view', label: '🌅 View cửa sổ' },
                    { key: 'private_room', label: '🚪 Phòng riêng' },
                    { key: 'wheelchair_accessible', label: '♿ Xe lăn' },
                    { key: 'near_entrance', label: '🚪 Gần lối vào' },
                    { key: 'quiet_area', label: '🤫 Khu yên tĩnh' },
                    { key: 'smoking_allowed', label: '🚬 Cho phép hút thuốc' },
                    { key: 'pet_friendly', label: '🐕 Thân thiện thú cưng' },
                    { key: 'outdoor_seating', label: '🌿 Chỗ ngồi ngoài trời' },
                    { key: 'romantic_lighting', label: '💡 Ánh sáng lãng mạn' },
                    { key: 'family_friendly', label: '👨‍👩‍👧‍👦 Thân thiện gia đình' }
                  ].map(feature => (
                    <label key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={tableFormData.features.includes(feature.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTableFormData(prev => ({ ...prev, features: [...prev.features, feature.key] }));
                          } else {
                            setTableFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== feature.key) }));
                          }
                        }}
                      />
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Mô tả
                </label>
                <textarea
                  value={tableFormData.description}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả đặc điểm, vị trí đặc biệt của bàn..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Giá mặc định (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tableFormData.pricing.basePrice}
                  onChange={(e) => setTableFormData(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, basePrice: parseInt(e.target.value) || 0 }
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateTableModal(false);
                  setTableFormData({
                    tableNumber: '',
                    capacity: 4,
                    location: 'indoor',
                    features: [],
                    description: '',
                    pricing: { basePrice: 0 }
                  });
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateTable}
                disabled={creatingTable || !tableFormData.tableNumber.trim() || !tableFormData.capacity}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: (creatingTable || !tableFormData.tableNumber || !tableFormData.capacity) ? '#d1d5db' : '#10b981',
                  color: 'white',
                  cursor: (creatingTable || !tableFormData.tableNumber || !tableFormData.capacity) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {creatingTable ? '⏳ Đang tạo...' : '✅ Tạo bàn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa bàn */}
      {showEditTableModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '480px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>✏️ Chỉnh sửa bàn {editingTable?.tableNumber}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Số bàn *
                </label>
                <input
                  type="text"
                  value={tableFormData.tableNumber}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Sức chứa *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableFormData.capacity}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Vị trí
                </label>
                <select
                  value={tableFormData.location}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, location: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="indoor">Trong nhà</option>
                  <option value="outdoor">Ngoài trời</option>
                  <option value="private">Phòng riêng</option>
                  <option value="vip">VIP</option>
                  <option value="terrace">Sân thượng</option>
                  <option value="garden">Vườn</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Tiện nghi
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { key: 'air_conditioned', label: '❄️ Điều hòa' },
                    { key: 'window_view', label: '🌅 View cửa sổ' },
                    { key: 'private_room', label: '🚪 Phòng riêng' },
                    { key: 'wheelchair_accessible', label: '♿ Xe lăn' },
                    { key: 'near_entrance', label: '🚪 Gần lối vào' },
                    { key: 'quiet_area', label: '🤫 Khu yên tĩnh' },
                    { key: 'smoking_allowed', label: '🚬 Cho phép hút thuốc' },
                    { key: 'pet_friendly', label: '🐕 Thân thiện thú cưng' },
                    { key: 'outdoor_seating', label: '🪑 Chỗ ngồi ngoài trời' },
                    { key: 'romantic_lighting', label: '💡 Ánh sáng lãng mạn' },
                    { key: 'wifi', label: '📶 WiFi' },
                    { key: 'family_friendly', label: '👨‍👩‍👧‍👦 Thân thiện gia đình' }
                  ].map(feature => (
                    <label key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={tableFormData.features.includes(feature.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTableFormData(prev => ({ ...prev, features: [...prev.features, feature.key] }));
                          } else {
                            setTableFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== feature.key) }));
                          }
                        }}
                      />
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Mô tả
                </label>
                <textarea
                  value={tableFormData.description}
                  onChange={(e) => setTableFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả chi tiết về bàn..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                  Giá mặc định (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tableFormData.pricing.basePrice}
                  onChange={(e) => setTableFormData(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, basePrice: parseInt(e.target.value) || 0 }
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditTableModal(false);
                  setEditingTable(null);
                  setTableFormData({
                    tableNumber: '',
                    capacity: 4,
                    location: 'indoor',
                    features: [],
                    description: '',
                    pricing: { basePrice: 0 }
                  });
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateTable}
                disabled={updatingTable || !tableFormData.tableNumber.trim() || !tableFormData.capacity}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: (updatingTable || !tableFormData.tableNumber.trim() || !tableFormData.capacity) ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  cursor: (updatingTable || !tableFormData.tableNumber.trim() || !tableFormData.capacity) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {updatingTable ? '⏳ Đang cập nhật...' : '✅ Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
