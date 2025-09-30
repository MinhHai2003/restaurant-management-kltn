import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: string;
  zone?: string;
  status: string;
  features?: string[];
  description?: string;
  images?: { url: string; alt?: string }[];
  pricing?: { 
    basePrice?: number;
    peakHourMultiplier?: number;
    weekendMultiplier?: number;
  };
  amenities?: {
    name: string;
    description: string;
    free: boolean;
  }[];
}

interface ReservationFormData {
  tableId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  occasion: string;
  specialRequests: string;
}

const DatBanPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states - Trạng thái form
  const [formData, setFormData] = useState<ReservationFormData>({
    tableId: '',
    reservationDate: '',
    startTime: '18:00',
    endTime: '20:00',
    partySize: 2,
    occasion: 'other',
    specialRequests: ''
  });
  
  // Search/Filter states - Trạng thái tìm kiếm/lọc
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    status: '',
    features: [] as string[],
    minCapacity: 1,
    maxCapacity: 20,
    showAvailableOnly: false
  });
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [sortBy, setSortBy] = useState<'tableNumber' | 'capacity' | 'location' | 'price'>('tableNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Constants
  const LOCATIONS = [
    { value: 'indoor', label: 'Trong nhà 🏠' },
    { value: 'outdoor', label: 'Ngoài trời 🌳' },
    { value: 'private', label: 'Phòng riêng 🚪' },
    { value: 'vip', label: 'VIP ⭐' },
    { value: 'terrace', label: 'Sân thượng 🏢' },
    { value: 'garden', label: 'Sân vườn 🌺' },
  ];

  const OCCASIONS = [
    { value: 'birthday', label: 'Sinh nhật 🎂' },
    { value: 'anniversary', label: 'Kỷ niệm 💕' },
    { value: 'business', label: 'Công việc 💼' },
    { value: 'date', label: 'Hẹn hò 💘' },
    { value: 'family', label: 'Gia đình 👨‍👩‍👧‍👦' },
    { value: 'other', label: 'Khác 📝' },
  ];

  const FEATURES = [
    { value: 'air_conditioned', label: 'Điều hòa ❄️' },
    { value: 'window_view', label: 'View cửa sổ 🪟' },
    { value: 'private_room', label: 'Phòng riêng 🚪' },
    { value: 'wheelchair_accessible', label: 'Tiện nghi khuyết tật ♿' },
    { value: 'near_entrance', label: 'Gần lối vào 🚪' },
    { value: 'quiet_area', label: 'Khu vực yên tĩnh 🔇' },
    { value: 'smoking_allowed', label: 'Cho phép hút thuốc 🚬' },
    { value: 'pet_friendly', label: 'Chấp nhận thú cưng 🐕' },
  ];

  const STATUS_OPTIONS = [
    { value: 'available', label: 'Còn trống ✅' },
    { value: 'occupied', label: 'Đang sử dụng 🔴' },
    { value: 'reserved', label: 'Đã đặt trước 📝' },
    { value: 'maintenance', label: 'Bảo trì 🔧' },
    { value: 'cleaning', label: 'Đang dọn 🧹' },
  ];

  const TIME_SLOTS = [
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const navigate = useNavigate();

  // Initialize form with today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, reservationDate: today }));
    loadInitialTables();
  }, []);

  // Load all tables initially
  const loadInitialTables = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5006/api/tables?limit=100');
      const data = await res.json();
      if (data.success) {
        setTables(data.data.tables);
      } else {
        setError(data.message || 'Không thể tải danh sách bàn');
      }
    } catch {
      setError('Lỗi khi tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  // Search tables with filters
  const searchTables = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = 'http://localhost:5006/api/tables';
      const params = new URLSearchParams();

      // Determine which endpoint to use based on search criteria
      const hasTimeSearch = formData.reservationDate && formData.startTime && formData.endTime && formData.partySize;
      const hasStatusFilter = searchFilters.status && searchFilters.status !== 'available';
      
      // If searching by time AND status is available (or no status filter), use search endpoint
      // If searching by time BUT status is NOT available, use regular endpoint for filtering
      if (hasTimeSearch && !hasStatusFilter) {
        endpoint = 'http://localhost:5006/api/tables/search';
        params.append('date', formData.reservationDate);
        params.append('startTime', formData.startTime);
        params.append('endTime', formData.endTime);
        params.append('partySize', formData.partySize.toString());
      }

      // Add search filters
      params.append('limit', '100'); // Ensure we get all tables
      if (searchFilters.location) params.append('location', searchFilters.location);
      if (searchFilters.status) params.append('status', searchFilters.status);
      if (searchFilters.features.length > 0) params.append('features', searchFilters.features.join(','));
      if (searchFilters.minCapacity > 1) params.append('capacity', searchFilters.minCapacity.toString());
      if (searchFilters.showAvailableOnly && !endpoint.includes('/tables/search')) {
        params.append('status', 'available');
      }

      const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Sort tables
        const sortedTables = [...data.data.tables].sort((a: Table, b: Table) => {
          let aValue: string | number, bValue: string | number;
          switch (sortBy) {
            case 'capacity':
              aValue = a.capacity;
              bValue = b.capacity;
              break;
            case 'location':
              aValue = a.location;
              bValue = b.location;
              break;
            case 'price':
              aValue = a.pricing?.basePrice || 0;
              bValue = b.pricing?.basePrice || 0;
              break;
            default: // tableNumber
              aValue = parseInt(a.tableNumber);
              bValue = parseInt(b.tableNumber);
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        setTables(sortedTables);
      } else {
        setError(data.message || 'Không thể tải danh sách bàn');
      }
    } catch {
      setError('Lỗi khi tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  // Open reservation modal
  const openReservationModal = (table: Table) => {
    setSelectedTable(table);
    setFormData(prev => ({ ...prev, tableId: table._id }));
    setShowReservationModal(true);
  };

  // Create reservation
  const createReservation = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập để đặt bàn');
        navigate('/login');
        return;
      }

      const reservationData = {
        tableId: formData.tableId,
        reservationDate: formData.reservationDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        partySize: formData.partySize,
        occasion: formData.occasion,
        specialRequests: formData.specialRequests.trim() || undefined
      };

      const res = await fetch('http://localhost:5006/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reservationData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Đặt bàn thành công! Mã đặt bàn: ${data.data.reservation.reservationNumber}`);
        setShowReservationModal(false);
        setSelectedTable(null);
        setFormData(prev => ({ 
          ...prev, 
          tableId: '', 
          specialRequests: '', 
          occasion: 'other' 
        }));
        searchTables(); // Reload tables
      } else {
        setError(data.message || 'Đặt bàn thất bại');
      }
    } catch {
      setError('Lỗi khi đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated price for a table
  const calculateEstimatedPrice = (table: Table): number => {
    if (!table.pricing?.basePrice) return 0;
    
    let price = table.pricing.basePrice;
    const date = new Date(formData.reservationDate);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const hour = parseInt(formData.startTime.split(':')[0]);
    const isPeakHour = hour >= 18 && hour <= 21;

    if (isWeekend && table.pricing.weekendMultiplier) {
      price *= table.pricing.weekendMultiplier;
    }
    if (isPeakHour && table.pricing.peakHourMultiplier) {
      price *= table.pricing.peakHourMultiplier;
    }

    return Math.round(price);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: '#dcfce7', color: '#16a34a', text: 'Còn trống' };
      case 'occupied': return { bg: '#fee2e2', color: '#dc2626', text: 'Đang sử dụng' };
      case 'reserved': return { bg: '#fef3c7', color: '#d97706', text: 'Đã đặt trước' };
      case 'maintenance': return { bg: '#f3f4f6', color: '#64748b', text: 'Bảo trì' };
      case 'cleaning': return { bg: '#e0e7ff', color: '#3730a3', text: 'Đang dọn' };
      default: return { bg: '#f3f4f6', color: '#64748b', text: status };
    }
  };

  // Get location label
  const getLocationLabel = (location: string) => {
    const found = LOCATIONS.find(l => l.value === location);
    return found ? found.label : location;
  };

  // Get feature label
  const getFeatureLabel = (feature: string) => {
    const found = FEATURES.find(f => f.value === feature);
    return found ? found.label : feature;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header />
      <main style={{ padding: '40px 0', minHeight: '70vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '12px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '2px'
            }}>
              🍽️ ĐẶT BÀN NHÀ HÀNG
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '18px',
              fontWeight: '500'
            }}>
              Trải nghiệm ẩm thực tuyệt vời với dịch vụ đặt bàn chuyên nghiệp
            </p>
          </div>

          {/* Search Form */}
          <div style={{ 
            background: 'rgba(255,255,255,0.95)', 
            borderRadius: '20px', 
            padding: '32px', 
            marginBottom: '32px', 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1e293b', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              📅 Thông tin đặt bàn
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              alignItems: 'end',
              marginBottom: '24px'
            }}>
              {/* Date */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  📅 Ngày đặt bàn:
                </label>
                <input 
                  type="date" 
                  value={formData.reservationDate} 
                  onChange={e => setFormData(prev => ({ ...prev, reservationDate: e.target.value }))}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }} 
                />
              </div>

              {/* Start Time */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  🕐 Giờ bắt đầu:
                </label>
                <select
                  value={formData.startTime}
                  onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '16px'
                  }}
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  🕒 Giờ kết thúc:
                </label>
                <select
                  value={formData.endTime}
                  onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '16px'
                  }}
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Party Size */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  👥 Số người:
                </label>
                <input 
                  type="number" 
                  min={1} 
                  max={20} 
                  value={formData.partySize} 
                  onChange={e => setFormData(prev => ({ ...prev, partySize: Number(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '16px'
                  }} 
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                style={{ 
                  background: showFilters ? '#dc2626' : '#6366f1',
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔍 {showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'}
              </button>
              
              <button 
                onClick={searchTables}
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 32px', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  fontSize: '18px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? '⏳ Đang tìm...' : '🔎 Tìm bàn phù hợp'}
              </button>

              <button 
                onClick={loadInitialTables}
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 28px', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📋 Xem tất cả bàn
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div style={{ 
                marginTop: '28px',
                padding: '24px',
                background: 'rgba(248, 250, 252, 0.8)',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#374151', 
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  ⚙️ Bộ lọc nâng cao
                </h4>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                  gap: '20px'
                }}>
                  {/* Location Filter */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      📍 Vị trí:
                    </label>
                    <select
                      value={searchFilters.location}
                      onChange={e => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                      style={{ 
                        width: '100%',
                        padding: '10px 14px', 
                        borderRadius: '10px', 
                        border: '1px solid #d1d5db',
                        fontSize: '15px'
                      }}
                    >
                      <option value="">Tất cả vị trí</option>
                      {LOCATIONS.map(loc => (
                        <option key={loc.value} value={loc.value}>{loc.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      📊 Trạng thái:
                    </label>
                    <select
                      value={searchFilters.status}
                      onChange={e => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                      style={{ 
                        width: '100%',
                        padding: '10px 14px', 
                        borderRadius: '10px', 
                        border: '1px solid #d1d5db',
                        fontSize: '15px'
                      }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Capacity Range */}
                 
                </div>

                {/* Features Filter */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '12px' 
                  }}>
                    ✨ Tiện ích yêu cầu:
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '12px'
                  }}>
                    {FEATURES.map(feature => (
                      <label key={feature.value} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: searchFilters.features.includes(feature.value) ? '#dbeafe' : 'transparent',
                        border: searchFilters.features.includes(feature.value) ? '1px solid #3b82f6' : '1px solid transparent'
                      }}>
                        <input
                          type="checkbox"
                          checked={searchFilters.features.includes(feature.value)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSearchFilters(prev => ({ 
                                ...prev, 
                                features: [...prev.features, feature.value]
                              }));
                            } else {
                              setSearchFilters(prev => ({ 
                                ...prev, 
                                features: prev.features.filter(f => f !== feature.value)
                              }));
                            }
                          }}
                          style={{ transform: 'scale(1.2)' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Show Available Only */}
                <div style={{ 
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    <input
                      type="checkbox"
                      checked={searchFilters.showAvailableOnly}
                      onChange={e => setSearchFilters(prev => ({ ...prev, showAvailableOnly: e.target.checked }))}
                      style={{ transform: 'scale(1.3)' }}
                    />
                    🟢 Chỉ hiển thị bàn còn trống
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Search Info */}
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)', 
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '24px',
            fontSize: '14px',
            color: '#1e40af'
          }}>
            ℹ️ <strong>Hướng dẫn tìm kiếm:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>🔎 <strong>"Tìm bàn phù hợp"</strong>: Tìm theo ngày giờ cụ thể → chỉ hiện bàn còn trống khả dụng</li>
              <li>📋 <strong>"Xem tất cả bàn"</strong>: Xem tất cả bàn → có thể lọc theo trạng thái (đang sử dụng, bảo trì, v.v.)</li>
              <li>⚠️ <strong>Lưu ý:</strong> Khi tìm kiếm theo thời gian + trạng thái khác "còn trống", hệ thống sẽ ưu tiên lọc theo trạng thái</li>
            </ul>
          </div>

          {/* Sorting Controls */}
          <div style={{ 
            background: 'rgba(255,255,255,0.9)', 
            borderRadius: '16px', 
            padding: '20px', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontWeight: '600', color: '#374151' }}>📊 Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'tableNumber' | 'capacity' | 'location' | 'price')}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              >
                <option value="tableNumber">Số bàn</option>
                <option value="capacity">Sức chứa</option>
                <option value="location">Vị trí</option>
                <option value="price">Giá</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
              </button>
            </div>

            <div style={{ 
              color: '#6b7280', 
              fontSize: '14px', 
              fontWeight: '500'
            }}>
              🔢 Tìm thấy {tables.length} bàn
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              color: '#dc2626', 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              color: '#16a34a', 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              ✅ {success}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              color: 'white', 
              fontSize: '20px', 
              margin: '40px 0',
              fontWeight: '600'
            }}>
              ⏳ Đang tải danh sách bàn...
            </div>
          )}

          {/* Tables Grid */}
          {!loading && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
              gap: '24px' 
            }}>
              {tables.length === 0 ? (
                <div style={{ 
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '20px',
                  fontWeight: '500',
                  padding: '60px 20px'
                }}>
                  😔 Không tìm thấy bàn phù hợp với yêu cầu của bạn
                </div>
              ) : (
                tables.map(table => {
                  const statusInfo = getStatusColor(table.status);
                  const estimatedPrice = calculateEstimatedPrice(table);
                  
                  return (
                    <div 
                      key={table._id} 
                      style={{ 
                        background: 'rgba(255,255,255,0.95)', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Table Header */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '16px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontWeight: '800', 
                            fontSize: '24px', 
                            color: '#1e40af',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            🍽️ Bàn {table.tableNumber}
                          </span>
                          <span style={{ 
                            background: '#dbeafe', 
                            color: '#1e40af', 
                            borderRadius: '12px', 
                            padding: '4px 12px', 
                            fontSize: '14px', 
                            fontWeight: '600'
                          }}>
                            👥 {table.capacity} người
                          </span>
                        </div>
                        
                        <span style={{ 
                          background: statusInfo.bg, 
                          color: statusInfo.color, 
                          borderRadius: '12px', 
                          padding: '4px 12px', 
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {statusInfo.text}
                        </span>
                      </div>

                      {/* Location */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        marginBottom: '16px' 
                      }}>
                        <span style={{ 
                          background: '#e0f2fe', 
                          color: '#0369a1', 
                          borderRadius: '10px', 
                          padding: '4px 10px', 
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {getLocationLabel(table.location)}
                        </span>
                      </div>

                      {/* Table Image */}
                      {table.images && table.images.length > 0 && (
                        <img 
                          src={table.images[0].url} 
                          alt={table.images[0].alt || 'Ảnh bàn'} 
                          style={{ 
                            width: '100%', 
                            height: '180px', 
                            objectFit: 'cover', 
                            borderRadius: '16px', 
                            marginBottom: '16px',
                            border: '2px solid rgba(255,255,255,0.8)'
                          }} 
                        />
                      )}

                      {/* Description */}
                      <div style={{ 
                        marginBottom: '16px', 
                        color: '#4b5563', 
                        fontSize: '15px',
                        lineHeight: '1.5',
                        fontWeight: '400'
                      }}>
                        {table.description || (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                            Chưa có mô tả chi tiết
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      {table.features && table.features.length > 0 && (
                        <div style={{ 
                          marginBottom: '16px', 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '8px'
                        }}>
                          {table.features.map(feature => (
                            <span 
                              key={feature} 
                              style={{ 
                                background: '#f0f9ff', 
                                color: '#0284c7', 
                                borderRadius: '8px', 
                                padding: '4px 8px', 
                                fontSize: '12px',
                                fontWeight: '500',
                                border: '1px solid #e0f2fe'
                              }}
                            >
                              {getFeatureLabel(feature)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Amenities */}
                      {table.amenities && table.amenities.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: '#374151', 
                            marginBottom: '8px'
                          }}>
                            🎁 Tiện ích đi kèm:
                          </h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {table.amenities.map((amenity, index) => (
                              <span 
                                key={index}
                                style={{ 
                                  background: amenity.free ? '#d1fae5' : '#fee2e2', 
                                  color: amenity.free ? '#065f46' : '#991b1b', 
                                  borderRadius: '6px', 
                                  padding: '2px 6px', 
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}
                              >
                                {amenity.free ? '🆓' : '💰'} {amenity.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price & Book Button */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                        paddingTop: '16px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <div style={{ 
                            fontWeight: '700', 
                            color: '#dc2626', 
                            fontSize: '20px'
                          }}>
                            {estimatedPrice > 0 ? `${estimatedPrice.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                          </div>
                          {estimatedPrice > (table.pricing?.basePrice || 0) && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6b7280',
                              textDecoration: 'line-through'
                            }}>
                              Giá gốc: {(table.pricing?.basePrice || 0).toLocaleString('vi-VN')}đ
                            </div>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => openReservationModal(table)}
                          disabled={table.status !== 'available'}
                          style={{ 
                            background: table.status === 'available' 
                              ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                              : '#9ca3af',
                            color: 'white', 
                            border: 'none', 
                            padding: '12px 24px', 
                            borderRadius: '12px', 
                            fontWeight: '700', 
                            fontSize: '16px',
                            cursor: table.status === 'available' ? 'pointer' : 'not-allowed',
                            boxShadow: table.status === 'available' 
                              ? '0 4px 12px rgba(34, 197, 94, 0.3)' 
                              : 'none',
                            transition: 'all 0.2s',
                            opacity: table.status === 'available' ? 1 : 0.6
                          }}
                        >
                          {table.status === 'available' ? '🎉 Đặt ngay' : '❌ Không khả dụng'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Reservation Modal */}
          {showReservationModal && selectedTable && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#1e293b',
                    margin: 0
                  }}>
                    🎉 Đặt bàn số {selectedTable.tableNumber}
                  </h3>
                  <button
                    onClick={() => {
                      setShowReservationModal(false);
                      setSelectedTable(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <p><strong>📅 Ngày:</strong> {new Date(formData.reservationDate).toLocaleDateString('vi-VN')}</p>
                    <p><strong>🕐 Thời gian:</strong> {formData.startTime} - {formData.endTime}</p>
                    <p><strong>👥 Số người:</strong> {formData.partySize}</p>
                    <p><strong>💰 Giá ước tính:</strong> {calculateEstimatedPrice(selectedTable).toLocaleString('vi-VN')}đ</p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      🎈 Dịp đặc biệt:
                    </label>
                    <select
                      value={formData.occasion}
                      onChange={e => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                      style={{ 
                        width: '100%',
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        border: '2px solid #e5e7eb',
                        fontSize: '16px'
                      }}
                    >
                      {OCCASIONS.map(occasion => (
                        <option key={occasion.value} value={occasion.value}>{occasion.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      📝 Yêu cầu đặc biệt:
                    </label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={e => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="VD: Cần ghế em bé, không gian yên tĩnh, trang trí sinh nhật..."
                      rows={4}
                      style={{ 
                        width: '100%',
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        resize: 'vertical',
                        minHeight: '100px'
                      }}
                    />
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => {
                        setShowReservationModal(false);
                        setSelectedTable(null);
                      }}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={createReservation}
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 32px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {loading ? '⏳ Đang đặt...' : '🎉 Xác nhận đặt bàn'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DatBanPage;
