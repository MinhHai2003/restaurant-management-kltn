import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminInventoryManagement from '../components/admin/AdminInventoryManagement';
import StaffManagement from '../components/admin/StaffManagement';
import ShiftManagement from '../components/admin/ShiftManagement';
import MenuManagement from '../components/admin/MenuManagement';
import CustomerManagement from '../components/admin/CustomerManagement';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { useTableSocket } from '../hooks/useTableSocket';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_CONFIG } from '../config/api';

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
  createdAt?: string;
}

type TabType = 'overview' | 'reservations' | 'tables' | 'inventory' | 'staff' | 'shifts' | 'statistics' | 'orders' | 'customers';

interface StatisticsData {
  revenue: {
    daily: Array<{ date: string; revenue: number }>;
    weekly: Array<{ week: string; revenue: number }>;
    monthly: Array<{ month: string; revenue: number }>;
  };
  topDishes: {
    daily: Array<{ name: string; orders: number }>;
    weekly: Array<{ name: string; orders: number }>;
    monthly: Array<{ name: string; orders: number }>;
  };
  reservationStats: {
    daily: {
      totalReservations: number;
      completedReservations: number;
      cancelledReservations: number;
      avgPartySize: number;
    };
    weekly: {
      totalReservations: number;
      completedReservations: number;
      cancelledReservations: number;
      avgPartySize: number;
    };
    monthly: {
      totalReservations: number;
      completedReservations: number;
      cancelledReservations: number;
      avgPartySize: number;
    };
  };
  tableUtilization: {
    daily: Array<{ hour: string; utilization: number }>;
    weekly: Array<{ hour: string; utilization: number }>;
    monthly: Array<{ hour: string; utilization: number }>;
  };
  orderStats: {
    daily: {
      totalOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      avgOrderTime: number;
    };
    weekly: {
      totalOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      avgOrderTime: number;
    };
    monthly: {
      totalOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      avgOrderTime: number;
    };
  };
  peakHours: {
    daily: Array<{ hour: string; orders: number }>;
    weekly: Array<{ hour: string; orders: number }>;
    monthly: Array<{ hour: string; orders: number }>;
  };
}

interface Stats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  totalReservations: number;
  pendingReservations: number;
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
  createdAt?: string;
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


interface Order {
  _id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  delivery: {
    type: 'pickup' | 'delivery' | 'dine_in';
    address?: {
      full?: string;
      district?: string;
      city?: string;
    };
  };
  diningInfo?: {
    tableInfo?: {
      tableNumber: string;
      tableId?: string;
      location?: string;
    };
    serviceType?: string;
  };
  pricing: {
    total: number;
  };
  status: string;
  createdAt: string;
  payment?: {
    method?: 'cash' | 'transfer' | 'banking';
    status?: string;
  };
  notes?: {
    customer?: string;
    kitchen?: string;
    delivery?: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats>({
    totalTables: 0,
    availableTables: 0,
    occupiedTables: 0,
    reservedTables: 0,
    totalReservations: 0,
    pendingReservations: 0
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

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time order stats state
  const [realTimeOrderStats, setRealTimeOrderStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    avgOrders: 0,
    pendingOrders: 0
  });

  // Statistics states
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsPeriod, setStatisticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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

    // Set up real-time clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set up real-time order stats update
    const orderStatsInterval = setInterval(() => {
      if (ordersList.length > 0) {
        const pendingCount = ordersList.filter(order => 
          order.status === 'pending' || 
          order.status === 'ordered' || 
          order.status === 'confirmed'
        ).length;
        
        setRealTimeOrderStats(prev => ({
          ...prev,
          pendingOrders: pendingCount
        }));
      }
    }, 2000); // Cập nhật mỗi 2 giây

    return () => {
      clearInterval(clockInterval);
      clearInterval(orderStatsInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load orders list when switching to orders tab
  useEffect(() => {
    if (orderActiveTab === 'orders' && serviceStatus.orderService) {
      loadOrdersList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderActiveTab, serviceStatus.orderService]);

  // Update order stats when ordersList changes
  useEffect(() => {
    if (ordersList.length > 0) {
      // Đếm tất cả đơn hàng cần xử lý (pending, ordered, confirmed)
      const pendingOrdersCount = ordersList.filter(order => 
        order.status === 'pending' || 
        order.status === 'ordered' || 
        order.status === 'confirmed'
      ).length;
      
      // Cập nhật cả orderStats và realTimeOrderStats
      setOrderStats(prev => ({
        ...prev,
        pendingOrders: pendingOrdersCount
      }));
      
      setRealTimeOrderStats(prev => ({
        ...prev,
        pendingOrders: pendingOrdersCount
      }));
      
      console.log('📊 Updated pending orders count:', pendingOrdersCount);
    }
  }, [ordersList]);

  // Listen to Socket.io events for real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🔌 AdminDashboard: Setting up Socket.io event listeners...');

      const handleOrderStatusUpdate = (data: { orderId: string; status?: string; newStatus?: string; order?: Order;[key: string]: unknown }) => {
        console.log('🔄 AdminDashboard: Order status updated via Socket.io:', data);
        
        // Priority: newStatus > order.status > status > fallback to pending
        const validStatus = (data.newStatus || (data.order?.status) || data.status || 'pending') as string;
        const statusDisplay = {
          'pending': 'Chờ xử lý',
          'confirmed': 'Đã xác nhận', 
          'preparing': 'Đang chuẩn bị',
          'ready': 'Sẵn sàng',
          'delivered': 'Đã giao hàng',
          'completed': 'Hoàn thành',
          'cancelled': 'Đã hủy'
        };
        
        console.log(`📢 Order ${data.orderId} status changed to: ${statusDisplay[validStatus as keyof typeof statusDisplay] || validStatus}`);
        
        // Cập nhật trực tiếp trong ordersList - ưu tiên dùng order object nếu có
        setOrdersList(prevOrders => 
          prevOrders.map(order => {
            if (order._id === data.orderId) {
              // Nếu có full order object, dùng nó; nếu không chỉ update status
              return data.order ? { ...data.order, status: validStatus } : { ...order, status: validStatus };
            }
            return order;
          })
        );
        
        // Refresh dashboard stats
        loadOrderDashboard();
        if (orderActiveTab === 'orders') {
          loadOrdersList(ordersPagination.current);
        }
      };

      const handleNewOrder = (data: { orderNumber?: string;[key: string]: unknown }) => {
        console.log('🆕 AdminDashboard: New order received via Socket.io:', data);
        // Reload orders list để cập nhật dữ liệu mới
        loadOrdersList(ordersPagination.current);
        // Refresh dashboard stats
        loadOrderDashboard();
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
    // Debug: Log API config values
    console.log('🔍 [SERVICE CHECK] API_CONFIG values:', {
      ORDER_API: API_CONFIG.ORDER_API,
      MENU_API: API_CONFIG.MENU_API,
      INVENTORY_API: API_CONFIG.INVENTORY_API,
    });

    const services = [
      { name: 'orderService', url: `${API_CONFIG.ORDER_API.replace('/api', '')}/health` },
      { name: 'menuService', url: `${API_CONFIG.MENU_API}/menu` }, // Menu service không có /health
      { name: 'inventoryService', url: `${API_CONFIG.INVENTORY_API}/inventory` } // Inventory service không có /health
    ];

    // Debug: Log service URLs
    console.log('🔍 [SERVICE CHECK] Checking URLs:', services.map(s => ({ name: s.name, url: s.url })));

    const statusChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await fetch(service.url);
          return { name: service.name, status: response.ok };
        } catch (error) {
          console.error(`❌ [SERVICE CHECK] Failed to check ${service.name} at ${service.url}:`, error);
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
      const response = await fetch(`${API_CONFIG.ORDER_API}/admin/orders/dashboard`);
      if (response.ok) {
        const data = await response.json();
        console.log('Order dashboard data:', data);

        if (data.success) {
          // Tính pending orders từ danh sách đơn hàng thực tế
          const pendingOrdersCount = ordersList.filter(order => 
            order.status === 'pending' || 
            order.status === 'ordered' || 
            order.status === 'confirmed'
          ).length;
          
          const newStats = {
            todayOrders: data.data.today?.totalOrders || 0,
            todayRevenue: data.data.today?.totalRevenue || 0,
            avgOrders: Math.round(data.data.week?.totalOrders / 7) || 0,
            pendingOrders: pendingOrdersCount
          };
          
          setOrderStats(newStats);
          setRealTimeOrderStats(newStats);
        }
      }
    } catch (error) {
      console.error('Error loading order dashboard:', error);
    }
  };

  // Load statistics data
  const loadStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.ORDER_API}/admin/statistics`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load statistics');
      }
      
      const data = await response.json();
      console.log('📊 Statistics loaded:', data);
      console.log('📊 Statistics data structure:', data.data);
      console.log('📊 Top dishes data:', data.data?.topDishes);
      setStatisticsData(data.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Hiển thị thông báo lỗi thay vì dữ liệu mẫu
      setStatisticsData(null);
      alert('Không thể tải dữ liệu thống kê từ server. Vui lòng thử lại sau.');
    } finally {
      setStatisticsLoading(false);
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

      const response = await fetch(`${API_CONFIG.ORDER_API}/admin/orders?${queryParams}`);
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
      const response = await fetch(`${API_CONFIG.ORDER_API}/admin/orders/${orderId}/status`, {
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
          // Sử dụng dữ liệu từ server response nếu có, nếu không thì chỉ update status và giữ nguyên payment method
          if (data.data && data.data.order) {
            // Server đã trả về order đã được update, dùng dữ liệu đó
            setOrdersList(prevOrders =>
              prevOrders.map((order: Order) => {
                if (order._id === orderId) {
                  // Đảm bảo giữ nguyên payment method ban đầu nếu server trả về sai
                  const originalPaymentMethod = order.payment?.method;
                  const updatedOrder = { ...order, ...data.data.order };
                  
                  // Đảm bảo payment method không bị thay đổi
                  if (originalPaymentMethod && updatedOrder.payment) {
                    updatedOrder.payment.method = originalPaymentMethod;
                  }
                  
                  return updatedOrder;
                }
                return order;
              })
            );
          } else {
            // Fallback: chỉ update status, giữ nguyên payment method
            setOrdersList(prevOrders =>
              prevOrders.map((order: Order) => {
                if (order._id === orderId) {
                  const updatedOrder = { ...order, status: newStatus };
                  // Nếu trạng thái đơn hàng là "completed" hoặc "delivered", chỉ cập nhật payment status, GIỮ NGUYÊN payment method
                  if ((newStatus === 'completed' || newStatus === 'delivered') && order.payment?.status !== 'paid') {
                    updatedOrder.payment = {
                      ...order.payment,
                      // GIỮ NGUYÊN payment method ban đầu, không thay đổi
                      method: order.payment?.method || 'cash',
                      status: 'paid'
                    };
                    console.log(`✅ Auto-updated payment status to 'paid' (method: ${updatedOrder.payment.method}) for ${newStatus} order ${order.orderNumber}`);
                  }
                  return updatedOrder;
                }
                return order;
              })
            );
          }

          // Cập nhật pending orders count
          const updatedOrdersList = ordersList.map((order: Order) => {
            if (order._id === orderId) {
              return { ...order, status: newStatus };
            }
            return order;
          });
          const pendingCount = updatedOrdersList.filter(order => 
            order.status === 'pending' || 
            order.status === 'ordered' || 
            order.status === 'confirmed'
          ).length;
          setOrderStats(prev => ({
            ...prev,
            pendingOrders: pendingCount
          }));

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
      const res = await fetch(`${API_CONFIG.TABLE_API}/tables/stats`);
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
      const res = await fetch(`${API_CONFIG.TABLE_API}/tables?limit=100`);
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
      const res = await fetch(`${API_CONFIG.TABLE_API}/reservations/admin/all?limit=100`);
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
            specialRequests: res.specialRequests || 'Không có yêu cầu đặc biệt',
            createdAt: res.createdAt
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

      const response = await fetch(`${API_CONFIG.TABLE_API}/tables`, {
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

      await response.json();

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
      alert('❌ Lỗi tạo bàn: ' + (error as Error).message);
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
      const response = await fetch(`${API_CONFIG.TABLE_API}/tables/${tableId}`, {
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
      const response = await fetch(`${API_CONFIG.TABLE_API}/tables/${editingTable._id}`, {
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
      const res = await fetch(`${API_CONFIG.TABLE_API}/tables/admin/reset-maintenance`, {
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
      const res = await fetch(`${API_CONFIG.TABLE_API}/reservations/admin/${reservationId}/status`, {
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
      const res = await fetch(`${API_CONFIG.TABLE_API}/tables/${tableId}/status`, {
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

  const renderOverview = () => {
    // Tính toán các chỉ số bổ sung
    const tableUtilizationRate = stats.totalTables > 0 ? Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0;
    
    // Tính tỷ lệ hủy dựa trên số đặt bàn có status = 'cancelled'
    const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
    const cancellationRate = stats.totalReservations > 0 ? Math.round((cancelledReservations / stats.totalReservations) * 100) : 0;

    return (
      <div style={{ padding: '24px' }}>
        {/* Welcome Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          marginBottom: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
                👋 Chào mừng trở lại, {employeeInfo?.fullName || 'Admin'}!
              </h2>
              <p style={{ margin: '0', fontSize: '16px', opacity: 0.9 }}>
                {currentTime.toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} - {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Tổng số bàn */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '80px', opacity: 0.1 }}>🪑</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Tổng số bàn</h3>
              <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>{stats.totalTables}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                Trống: {stats.availableTables} | Đang dùng: {stats.occupiedTables}
              </p>
              <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
                Tỷ lệ sử dụng: {tableUtilizationRate}%
              </div>
            </div>
          </div>

          {/* Đặt bàn hôm nay */}
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '80px', opacity: 0.1 }}>📝</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Tổng đặt bàn </h3>
              <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>{stats.totalReservations}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                Đã hủy: {cancelledReservations}
              </p>
              <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
                Tỷ lệ hủy: {cancellationRate}%
              </div>
            </div>
          </div>


          {/* Cần xử lý */}
          <div style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '80px', opacity: 0.1 }}>⚠️</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Cần xử lý</h3>
              <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>{stats.pendingReservations}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                Đặt bàn chờ xác nhận
              </p>
              <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
                {stats.pendingReservations > 0 ? 'Cần xử lý ngay' : 'Tất cả đã xử lý'}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              🕐 Hoạt động gần đây
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Recent Activities - Combined and Sorted */}
            {(() => {
              // Tạo danh sách hoạt động kết hợp từ reservations và orders
              const activities: Array<{
                id: string;
                type: 'reservation' | 'order';
                timestamp: Date;
                data: any;
              }> = [];

              // Thêm reservations với thời gian tạo thực tế
              reservations.forEach((reservation) => {
                // Sử dụng createdAt nếu có, nếu không thì dùng thời gian đặt bàn
                const timestamp = reservation.createdAt ? 
                  new Date(reservation.createdAt) : 
                  new Date(reservation.reservationDate + 'T' + reservation.timeSlot.startTime);
                
                activities.push({
                  id: reservation._id,
                  type: 'reservation',
                  timestamp: timestamp,
                  data: reservation
                });
              });

              // Thêm orders với thời gian tạo thực tế
              ordersList.forEach((order) => {
                activities.push({
                  id: order._id,
                  type: 'order',
                  timestamp: new Date(order.createdAt),
                  data: order
                });
              });

              // Sắp xếp theo thời gian mới nhất (giảm dần)
              activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

              // Hiển thị 5 hoạt động gần đây nhất
              return activities.slice(0, 5).map((activity) => {
                if (activity.type === 'reservation') {
                  const reservation = activity.data;
                  return (
                    <div key={activity.id} style={{
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: getStatusColor(reservation.status).bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {reservation.status === 'pending' ? '⏳' : 
                         reservation.status === 'confirmed' ? '✅' : 
                         reservation.status === 'seated' ? '🪑' : '🎉'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          {reservation.customerName} đã đặt bàn {reservation.tableNumber}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {new Date(reservation.reservationDate).toLocaleDateString('vi-VN')} - {reservation.timeSlot.startTime} | 
                          {reservation.partySize} người | {getStatusColor(reservation.status).label}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {activity.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                } else {
                  const order = activity.data;
                  return (
                    <div key={activity.id} style={{
                      padding: '16px',
                      background: '#f0f9ff',
                      borderRadius: '12px',
                      border: '1px solid #bae6fd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        🍽️
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          Đơn hàng {order.orderNumber} - {order.customerInfo?.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {order.pricing?.total?.toLocaleString('vi-VN')}đ | 
                          {order.delivery?.type === 'dine_in' ? 'Tại bàn' : 
                           order.delivery?.type === 'delivery' ? 'Giao hàng' : 'Lấy tại quầy'} | 
                          {order.status === 'pending' ? 'Chờ xử lý' : 
                           order.status === 'confirmed' ? 'Đã xác nhận' : 
                           order.status === 'preparing' ? 'Đang chuẩn bị' : 'Hoàn thành'}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {activity.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                }
              });
            })()}

            {/* Placeholder activities if no recent data */}
            {reservations.length === 0 && ordersList.length === 0 && (
              <>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
                  📝 Chưa có hoạt động gần đây
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
                  🍽️ Hệ thống đang chờ dữ liệu...
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

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
        </div>

        {/* Sub Tabs */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', padding: '0 24px' }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard' },
              { key: 'orders', label: '📋 Danh sách đơn hàng' },
              { key: 'menu', label: '🍽️ Quản lý Menu' }
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
                    {notifications.slice(-3).reverse().map((notification, index) => {
                      // Xử lý thông báo để hiển thị rõ ràng hơn
                      let displayMessage = notification.message;
                      if (notification.message && notification.message.includes('undefined')) {
                        displayMessage = 'Trạng thái đơn hàng đã được cập nhật';
                      }
                      
                      return (
                        <div key={`notification-${notification.timestamp || Date.now()}-${index}`} style={{
                          fontSize: '12px',
                          color: '#713f12',
                          padding: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '4px'
                        }}>
                          <strong>{displayMessage}</strong>
                          {notification.timestamp && (
                            <div style={{ fontSize: '10px', color: '#a16207', marginTop: '4px' }}>
                              {notification.timestamp.toLocaleTimeString('vi-VN')}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                    {serviceStatus.orderService ? realTimeOrderStats.todayOrders : '0'}
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
                    {serviceStatus.orderService ? `${realTimeOrderStats.todayRevenue.toLocaleString()}đ` : '0đ'}
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
                    {serviceStatus.orderService ? realTimeOrderStats.avgOrders : '0'}
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
                    {serviceStatus.orderService ? realTimeOrderStats.pendingOrders : '0'}
                  </div>
                </div>
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
                  gridTemplateColumns: '1fr 1.2fr 1.3fr 0.7fr 0.8fr 1fr 0.9fr 0.9fr 1.1fr 1fr 0.8fr',
                  gap: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666'
                }}>
                  <div>Mã đơn</div>
                  <div>Khách hàng</div>
                  <div>Địa chỉ & SĐT</div>
                  <div>Bàn số</div>
                  <div>Loại</div>
                  <div>Tổng tiền</div>
                  <div>Phương thức TT</div>
                  <div>Trạng thái TT</div>
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
                        gridTemplateColumns: '1fr 1.2fr 1.3fr 0.7fr 0.8fr 1fr 0.9fr 0.9fr 1.1fr 1fr 0.8fr',
                        gap: '10px',
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
                            {order.delivery.address?.full ?
                              `${order.delivery.address.full}${order.delivery.address.district ? ', ' + order.delivery.address.district : ''}${order.delivery.address.city ? ', ' + order.delivery.address.city : ''}` :
                              'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Table Number Column */}
                      <div style={{ fontSize: '11px', textAlign: 'center', fontWeight: '600' }}>
                        {order.delivery?.type === 'dine_in' && order.diningInfo?.tableInfo?.tableNumber ? (
                          <span style={{
                            background: '#ffeaa7',
                            color: '#e17055',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            🍽️ {order.diningInfo.tableInfo.tableNumber}
                          </span>
                        ) : order.delivery?.type === 'delivery' ? (
                          <span style={{ color: '#666', fontSize: '10px' }}>Giao hàng</span>
                        ) : order.delivery?.type === 'pickup' ? (
                          <span style={{ color: '#666', fontSize: '10px' }}>Lấy tại quầy</span>
                        ) : (
                          <span style={{ color: '#ccc', fontSize: '10px' }}>-</span>
                        )}
                      </div>

                      <div style={{ fontSize: '11px', textAlign: 'left', paddingLeft: '8px' }}>
                        {order.delivery?.type === 'delivery' ? '🚚 Giao hàng' :
                          order.delivery?.type === 'pickup' ? '🏪 Lấy tại quầy' :
                            order.delivery?.type === 'dine_in' ? '🍽️ Tại bàn' :
                              '🍽️ Tại bàn'}
                      </div>
                      <div style={{ fontWeight: '600', color: '#16a34a' }}>
                        {order.pricing?.total?.toLocaleString() || 0}đ
                      </div>
                      <div style={{ fontSize: '11px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontWeight: '500',
                          fontSize: '10px',
                          backgroundColor:
                            order.payment?.method === 'cash' ? '#fef3c7' :
                              (order.payment?.method === 'transfer' || order.payment?.method === 'banking') ? '#dbeafe' :
                                '#f3f4f6',
                          color:
                            order.payment?.method === 'cash' ? '#92400e' :
                              (order.payment?.method === 'transfer' || order.payment?.method === 'banking') ? '#1e40af' :
                                '#374151'
                        }}>
                          {(() => {
                            const paymentMethod = order.payment?.method;
                            if (paymentMethod === 'cash') return '💵 Tiền mặt';
                            if (paymentMethod === 'transfer' || paymentMethod === 'banking') return '🏦 Chuyển khoản';
                            // Nếu không có hoặc là 'none' → Chưa thanh toán
                            if (!paymentMethod || paymentMethod === 'none') return '⏳ Chưa thanh toán';
                            // Dự phòng theo định dạng mã đơn
                            if (order.orderNumber?.startsWith('ORD-')) return '🏦 Chuyển khoản';
                            return '⏳ Chưa thanh toán';
                          })()}
                        </span>
                      </div>
                      <div>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: '500',
                          fontSize: '10px',
                          backgroundColor:
                            order.payment?.status === 'paid' ? '#dcfce7' :
                              order.payment?.status === 'pending' ? '#fef3c7' :
                                order.payment?.status === 'awaiting_payment' ? '#dbeafe' :
                                  '#f3f4f6',
                          color:
                            order.payment?.status === 'paid' ? '#166534' :
                              order.payment?.status === 'pending' ? '#92400e' :
                                order.payment?.status === 'awaiting_payment' ? '#1e40af' :
                                  '#374151'
                        }}>
                          {(() => {
                            const paymentStatus = order.payment?.status;
                            if (paymentStatus === 'paid') return '✅ Đã thanh toán';
                            if (paymentStatus === 'pending') return '⏳ Chờ thanh toán';
                            if (paymentStatus === 'awaiting_payment') return '🔄 Chờ xác nhận';
                            return '❓ Chưa xác định';
                          })()}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        <div style={{
                          maxHeight: '36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.2'
                        }}>
                          {order.notes?.customer ||
                            order.notes?.kitchen ||
                            order.notes?.delivery ||
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
                                      order.status === 'delivered' ? 'Đã hoàn thành' :
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
                            <option value="delivered">Đã hoàn thành</option>
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

  // Render Statistics with real data
  const renderStatistics = () => {
    if (statisticsLoading) {
      return (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      );
    }

    if (!statisticsData) {
      return (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <p>Không có dữ liệu thống kê từ server</p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
            Vui lòng kiểm tra kết nối server và thử lại
          </p>
          <button 
            onClick={loadStatistics}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            🔄 Tải lại dữ liệu
          </button>
        </div>
      );
    }

    const currentRevenueData = statisticsData.revenue?.[statisticsPeriod] || [];
    
    // Debug revenue data
    console.log('📊 Current period:', statisticsPeriod);
    console.log('📊 Available revenue data:', {
      daily: statisticsData.revenue?.daily?.length || 0,
      weekly: statisticsData.revenue?.weekly?.length || 0,
      monthly: statisticsData.revenue?.monthly?.length || 0
    });
    console.log('📊 Current revenue data for', statisticsPeriod, ':', currentRevenueData);
    console.log('📊 Full revenue data structure:', statisticsData.revenue);
    
    // Debug table utilization data
    console.log('📊 Table utilization data:', statisticsData.tableUtilization);
    console.log('📊 Current table utilization for', statisticsPeriod, ':', statisticsData.tableUtilization?.[statisticsPeriod]);
    
    // Debug: Show sample data values
    if (statisticsData.tableUtilization?.[statisticsPeriod]) {
      const sampleData = statisticsData.tableUtilization[statisticsPeriod].slice(0, 3);
      console.log('📊 Sample table utilization values:', sampleData);
    }
    
    // Debug topDishes data
    console.log('📊 Top dishes for chart:', statisticsData.topDishes);
    console.log('📊 Current period top dishes:', statisticsData.topDishes?.[statisticsPeriod]);
    console.log('📊 Using fallback data:', !statisticsData.topDishes?.[statisticsPeriod] || statisticsData.topDishes[statisticsPeriod].length === 0);
    if (statisticsData.topDishes?.[statisticsPeriod]) {
      console.log('📊 Top dishes orders for', statisticsPeriod, ':', statisticsData.topDishes[statisticsPeriod].map((d: any) => ({ name: d.name, orders: d.orders })));
    }
    
    // Debug peakHours data
    console.log('📊 Peak hours for chart:', statisticsData.peakHours);
    console.log('📊 Current period peak hours:', statisticsData.peakHours?.[statisticsPeriod]);
    if (statisticsData.peakHours?.[statisticsPeriod]) {
      console.log('📊 Peak hours for', statisticsPeriod, ':', statisticsData.peakHours[statisticsPeriod].map((h: any) => ({ hour: h.hour, orders: h.orders })));
    }
    
    // Calculate max value for XAxis based on current period
    const chartData = statisticsData.topDishes?.[statisticsPeriod] || [];
    const maxOrders = chartData.length > 0 ? Math.max(...chartData.map((d: any) => d.orders)) : 0;
    const xAxisMax = Math.max(20, maxOrders + 5); // At least 20, or max + 5
    console.log('📊 XAxis max value for', statisticsPeriod, ':', xAxisMax);

    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            📊 Thống kê & Báo cáo
          </h2>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Phân tích dữ liệu kinh doanh nhà hàng hải sản
          </p>
        </div>

        {/* Period Selector */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setStatisticsPeriod(period)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: statisticsPeriod === period 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : '#f3f4f6',
                  color: statisticsPeriod === period ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {period === 'daily' ? 'Hàng ngày' : period === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            💰 Doanh thu theo thời gian
          </h3>
          <div style={{ height: '300px', width: '100%', minHeight: '300px', minWidth: '400px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={400}>
              <AreaChart data={currentRevenueData} key={statisticsPeriod}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={statisticsPeriod === 'daily' ? 'date' : statisticsPeriod === 'weekly' ? 'week' : 'month'} 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#667eea"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dishes Chart */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            🦀 Món ăn bán chạy
          </h3>
          
          <div style={{ height: '400px', width: '100%', minHeight: '400px', minWidth: '400px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={400}>
              <BarChart 
                key={statisticsPeriod}
                data={statisticsData.topDishes?.[statisticsPeriod] || [
                  { name: 'Cơm Chiên Hải Sản', orders: 25, revenue: 1360000 },
                  { name: 'Cơm Chiên Dương Châu', orders: 18, revenue: 390000 },
                  { name: 'Phở Bò Tái', orders: 15, revenue: 165000 },
                  { name: 'Nước Cam Tươi', orders: 12, revenue: 40000 },
                  { name: 'Tôm Nướng Muối Ớt', orders: 10, revenue: 360000 },
                  { name: 'Sườn Nướng BBQ', orders: 8, revenue: 150000 },
                  { name: 'Lẩu Cá Khoai', orders: 6, revenue: 350000 }
                ]} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={12}
                  height={100}
                  interval={0}
                />
                <YAxis 
                  type="number" 
                  stroke="#6b7280" 
                  fontSize={12}
                  domain={[0, xAxisMax]}
                  tickCount={Math.min(10, Math.ceil(xAxisMax / 2))}
                  tickFormatter={(value) => value.toString()}
                  allowDecimals={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} đơn`, 'Số lượng']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#667eea" 
                  radius={[0, 4, 4, 0]}
                  maxBarSize={80}
                  minPointSize={5}
                  stroke="#4f46e5"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Customer Stats */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
              🪑 Thống kê đặt bàn
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Tổng đặt bàn:</span>
                <span style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  {(statisticsData.reservationStats?.[statisticsPeriod]?.totalReservations || 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Đã hoàn thành:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                  {(statisticsData.reservationStats?.[statisticsPeriod]?.completedReservations || 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Đã hủy:</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
                  {(statisticsData.reservationStats?.[statisticsPeriod]?.cancelledReservations || 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Số người TB:</span>
                <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                  {(statisticsData.reservationStats?.[statisticsPeriod]?.avgPartySize || 0).toLocaleString('vi-VN')} người
                </span>
              </div>
            </div>
          </div>

          {/* Order Stats */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
              📋 Thống kê đơn hàng
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Tổng đơn hàng:</span>
                <span style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  {(statisticsData.orderStats?.[statisticsPeriod]?.totalOrders || 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Đã hoàn thành:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                  {(statisticsData.orderStats?.[statisticsPeriod]?.completedOrders || 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Đã hủy:</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
                  {(statisticsData.orderStats?.[statisticsPeriod]?.cancelledOrders || 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Thời gian xử lý TB:</span>
                <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                  {statisticsData.orderStats?.[statisticsPeriod]?.avgOrderTime || 0} phút
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Utilization Chart */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            🪑 Số bàn được đặt theo thời gian
          </h3>
          <div style={{ height: '300px', width: '100%', minHeight: '300px', minWidth: '400px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={400}>
              <LineChart data={statisticsData.tableUtilization?.[statisticsPeriod] || []} key={statisticsPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#6b7280" 
                  fontSize={12} 
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => `${value} bàn`}
                  label={{ value: 'Số bàn', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} bàn`, 'Số bàn được đặt']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#667eea', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            ⏰ Giờ cao điểm
          </h3>
          <div style={{ height: '300px', width: '100%', minHeight: '300px', minWidth: '400px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={400}>
              <BarChart 
                key={statisticsPeriod}
                data={statisticsData.peakHours?.[statisticsPeriod] || []}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => `${value} đơn`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} đơn`, 'Số đơn hàng']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="orders" fill="#764ba2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Load statistics when statistics or overview tab is active
  useEffect(() => {
    if ((activeTab === 'statistics' || activeTab === 'overview') && !statisticsData) {
      loadStatistics();
    }
  }, [activeTab, statisticsData]);

  // Log when period changes to debug chart updates
  useEffect(() => {
    if (statisticsData) {
      console.log('📊 Period changed to:', statisticsPeriod);
      console.log('📊 Revenue data for new period:', statisticsData.revenue?.[statisticsPeriod]);
    }
  }, [statisticsPeriod, statisticsData]);

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
            // Reload orders list trước để có dữ liệu mới nhất
            loadOrdersList(ordersPagination.current);
            // Sau đó refresh dashboard stats
            loadOrderDashboard();
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
          {(() => {
            const employeeInfo = getEmployeeInfo();
            const userRole = employeeInfo?.role;
            const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
            
            const allTabs = [
              { key: 'overview', label: '📊 Tổng quan', icon: '📊', restricted: false },
              { key: 'reservations', label: '📝 Đặt bàn', icon: '📝', restricted: false },
              { key: 'tables', label: '🪑 Quản lý bàn', icon: '🪑', restricted: false },
              { key: 'inventory', label: '📦 Nguyên liệu', icon: '📦', restricted: true },
              { key: 'orders', label: '🍽️ Đặt món', icon: '🍽️', restricted: false },
              { key: 'customers', label: '👤 Khách hàng', icon: '👤', restricted: true },
              { key: 'staff', label: '👥 Nhân sự', icon: '👥', restricted: true },
              { key: 'shifts', label: '📅 Phân ca', icon: '📅', restricted: true },
              { key: 'statistics', label: '📈 Thống kê', icon: '📈', restricted: true }
            ];
            
            // Filter tabs based on role
            const visibleTabs = allTabs.filter(tab => !tab.restricted || isAdminOrManager);
            
            return visibleTabs.map(tab => (
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
            ));
          })()}
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

        {!loading && !error && (() => {
          const employeeInfo = getEmployeeInfo();
          const userRole = employeeInfo?.role;
          const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
          
          // Redirect to overview if user tries to access restricted tabs
          const restrictedTabs = ['inventory', 'staff', 'shifts', 'statistics', 'customers'];
          if (restrictedTabs.includes(activeTab) && !isAdminOrManager) {
            // Redirect to overview if not admin/manager
            if (activeTab !== 'overview') {
              setTimeout(() => setActiveTab('overview'), 0);
            }
            return (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
                  Không có quyền truy cập
                </h3>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                  Chỉ quản trị viên và quản lý mới có thể truy cập chức năng này.
                </p>
              </div>
            );
          }
          
          return (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'reservations' && renderReservations()}
              {activeTab === 'tables' && renderTableManagement()}
              {activeTab === 'inventory' && isAdminOrManager && <AdminInventoryManagement />}
              {activeTab === 'orders' && renderOrderManagement()}
              {activeTab === 'customers' && isAdminOrManager && <CustomerManagement />}
              {activeTab === 'staff' && isAdminOrManager && <StaffManagement />}
              {activeTab === 'shifts' && isAdminOrManager && <ShiftManagement />}
              {activeTab === 'statistics' && isAdminOrManager && renderStatistics()}
            </>
          );
        })()}
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
