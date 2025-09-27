import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminInventoryManagement from '../components/admin/AdminInventoryManagement';

interface ApiReservation {
  _id: string;
  reservationNumber: string;
  customerName?: string;
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

type TabType = 'overview' | 'reservations' | 'tables' | 'inventory' | 'staff' | 'statistics' | 'orders';

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
  
  const navigate = useNavigate();

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
  }, []);

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
          gridTemplateColumns: '150px 100px 120px 150px 100px 150px 120px 200px 120px',
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
                gridTemplateColumns: '150px 100px 120px 150px 100px 150px 120px 200px 120px',
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>
              {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <button 
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              🏠 Về trang chủ
            </button>
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
            {activeTab === 'orders' && renderPlaceholder(
              'Quản lý đặt món', 
              '🍽️', 
              'Xem đơn hàng, xác nhận đặt món, quản lý menu'
            )}
            {activeTab === 'staff' && renderPlaceholder(
              'Quản lý nhân sự', 
              '👥', 
              'Quản lý nhân viên, phân ca, chấm công, lương thưởng'
            )}
            {activeTab === 'statistics' && renderPlaceholder(
              'Thống kê báo cáo', 
              '📈', 
              'Doanh thu, khách hàng, món ăn bán chạy, xu hướng kinh doanh'
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
