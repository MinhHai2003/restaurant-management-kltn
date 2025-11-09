import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';
import { getSessionId } from '../services/cartService';
import { useTableSocket } from '../hooks/useTableSocket';
import QRPayment from '../components/QRPayment';
import { API_CONFIG } from '../config/api';



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
  phoneNumber: string;
  // Guest user info (for non-authenticated users)
  guestName?: string;
  guestEmail?: string;
}

const DatBanPage: React.FC = () => {
  const { user } = useAuth();
  
  // Socket connection for real-time updates
  // Use table socket for real-time updates
  const { isConnected } = useTableSocket();
  
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
    specialRequests: '',
    phoneNumber: '',
    guestName: '',
    guestEmail: ''
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
  
  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [reservationData, _setReservationData] = useState<any>(null);
  const [totalAmount, _setTotalAmount] = useState(0);
  
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
    { value: 'wifi', label: 'WiFi 📶' },
    { value: 'outlet', label: 'Ổ cắm điện 🔌' },
    { value: 'air_conditioned', label: 'Điều hòa ❄️' },
    { value: 'window_view', label: 'View cửa sổ 🪟' },
    { value: 'private_room', label: 'Phòng riêng 🚪' },
    { value: 'wheelchair_accessible', label: 'Tiện nghi khuyết tật ♿' },
    { value: 'near_entrance', label: 'Gần lối vào 🚪' },
    { value: 'quiet_area', label: 'Khu vực yên tĩnh 🔇' },
    { value: 'smoking_allowed', label: 'Cho phép hút thuốc 🚬' },
    { value: 'pet_friendly', label: 'Chấp nhận thú cưng 🐕' },
    { value: 'outdoor_seating', label: 'Chỗ ngồi ngoài trời 🌳' },
    { value: 'romantic_lighting', label: 'Ánh sáng lãng mạn 💝' },
    { value: 'family_friendly', label: 'Thân thiện gia đình 👨‍👩‍👧‍👦' }
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



  // Initialize form with today's date and auto-fill user info if logged in
  useEffect(() => {
    console.log('🚀 [INIT] Initializing DatBanPage...');
    console.log('👤 [INIT] User state:', user);
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 [INIT] Today date:', today);
    
    setFormData(prev => {
      const newFormData = { 
        ...prev, 
        reservationDate: today,
        phoneNumber: user?.phone || prev.phoneNumber, // Auto-fill phone number if user is logged in
        guestName: user?.name || prev.guestName, // Auto-fill name if user is logged in
        guestEmail: user?.email || prev.guestEmail // Auto-fill email if user is logged in
      };
      console.log('📋 [INIT] Updated form data:', newFormData);
      return newFormData;
    });
    
    console.log('🔄 [INIT] Loading initial tables...');
    loadInitialTables();
  }, [user]); // Add user as dependency





  // Load all tables initially
  const loadInitialTables = async () => {
    console.log('📋 [TABLES] Loading initial tables...');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_CONFIG.TABLE_API}/tables?limit=100`);
      console.log('📥 [TABLES] API response status:', res.status);
      
      const data = await res.json();
      console.log('📥 [TABLES] API response data:', data);
      
      if (data.success) {
        console.log('✅ [TABLES] Tables loaded successfully:', data.data.tables.length, 'tables');
        setTables(data.data.tables);
      } else {
        console.log('❌ [TABLES] Failed to load tables:', data.message);
        setError(data.message || 'Không thể tải danh sách bàn');
      }
    } catch (error) {
      console.error('💥 [TABLES] Exception loading tables:', error);
      setError('Lỗi khi tải danh sách bàn');
    } finally {
      setLoading(false);
      console.log('🏁 [TABLES] Table loading completed');
    }
  };

  // Search tables with filters
  const searchTables = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = `${API_CONFIG.TABLE_API}/tables`;
      const params = new URLSearchParams();

      // Determine which endpoint to use based on search criteria
      const hasTimeSearch = formData.reservationDate && formData.startTime && formData.endTime && formData.partySize;
      const hasStatusFilter = searchFilters.status && searchFilters.status !== 'available';
      
      // If searching by time AND status is available (or no status filter), use search endpoint
      // If searching by time BUT status is NOT available, use regular endpoint for filtering
      if (hasTimeSearch && !hasStatusFilter) {
        endpoint = `${API_CONFIG.TABLE_API}/tables/search`;
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
    console.log('🎯 [MODAL] Opening reservation modal for table:', table.tableNumber);
    console.log('🪑 [MODAL] Table details:', table);
    
    setSelectedTable(table);
    setFormData(prev => {
      const updated = { ...prev, tableId: table._id };
      console.log('📋 [MODAL] Updated form data with table ID:', updated);
      return updated;
    });
    setShowReservationModal(true);
    console.log('✅ [MODAL] Reservation modal opened');
  };

  // Create reservation
  const createReservation = async () => {
    console.log('🎯 [RESERVATION] Starting reservation creation...');
    console.log('👤 [RESERVATION] User state:', user ? 'Authenticated' : 'Guest');
    console.log('📋 [RESERVATION] Form data:', formData);
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Validate phone number
      if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
        console.log('❌ [VALIDATION] Phone number missing');
        setError('Vui lòng nhập số điện thoại');
        setLoading(false);
        return;
      }

      // Updated phone number validation (Vietnamese format - support both 10 and 11 digits)
      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8,9})$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        console.log('❌ [VALIDATION] Phone number invalid:', formData.phoneNumber);
        setError('Số điện thoại không hợp lệ (VD: 0912345678 hoặc 03430985081)');
        setLoading(false);
        return;
      }

      console.log('✅ [VALIDATION] Phone number valid:', formData.phoneNumber);

      // For guest users, validate required fields
      if (!user) {
        console.log('🔍 [VALIDATION] Validating guest user fields...');
        if (!formData.guestName || formData.guestName.trim() === '') {
          console.log('❌ [VALIDATION] Guest name missing');
          setError('Vui lòng nhập họ tên');
          setLoading(false);
          return;
        }
        if (!formData.guestEmail || formData.guestEmail.trim() === '') {
          console.log('❌ [VALIDATION] Guest email missing');
          setError('Vui lòng nhập email');
          setLoading(false);
          return;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.guestEmail.trim())) {
          console.log('❌ [VALIDATION] Guest email invalid:', formData.guestEmail);
          setError('Email không hợp lệ');
          setLoading(false);
          return;
        }
        console.log('✅ [VALIDATION] Guest fields validated successfully');
      }

      // Prepare headers and reservation data
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const reservationData: Record<string, unknown> = {
        tableId: formData.tableId,
        reservationDate: formData.reservationDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        partySize: formData.partySize,
        occasion: formData.occasion,
        specialRequests: formData.specialRequests.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim()
      };

      // Handle authentication
      const token = localStorage.getItem('token');
      if (token && user) {
        // Authenticated user
        console.log('🔐 [AUTH] Using authenticated user with token');
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Guest user - use session ID and include guest info
        console.log('👤 [AUTH] Using guest user with session');
        const sessionId = getSessionId();
        console.log('🆔 [SESSION] Session ID:', sessionId);
        if (sessionId) {
          headers['X-Session-ID'] = sessionId;
        }
        reservationData.guestInfo = {
          name: formData.guestName!.trim(),
          email: formData.guestEmail!.trim(),
          phone: formData.phoneNumber.trim()
        };
        console.log('📝 [GUEST] Guest info added to reservation:', reservationData.guestInfo);
      }

      console.log('📤 [API] Sending reservation request...');
      console.log('🔗 [API] Headers:', headers);
      console.log('📋 [API] Reservation data:', reservationData);

      const res = await fetch(`${API_CONFIG.TABLE_API}/reservations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reservationData),
      });

      console.log('📥 [API] Response status:', res.status);
      
      const data = await res.json();
      console.log('📥 [API] Response data:', data);
      
      if (res.ok && data.success) {
        console.log('✅ [SUCCESS] Reservation created successfully');
        console.log('🚀 [SOCKET] Should receive real-time update shortly...');
        
        setSuccess(`Đặt bàn thành công! Mã đặt bàn: ${data.data.reservation.reservationNumber}`);
        setShowReservationModal(false);
        setSelectedTable(null);
        
        // Reset form but keep user info if logged in
        setFormData(prev => ({ 
          ...prev, 
          tableId: '', 
          specialRequests: '', 
          occasion: 'other',
          phoneNumber: user?.phone || '',
          guestName: user?.name || '',
          guestEmail: user?.email || ''
        }));
        console.log('🔄 [REFRESH] Reloading tables...');
        searchTables(); // Reload tables
      } else {
        console.log('❌ [ERROR] Reservation failed:', data.message);
        setError(data.message || 'Đặt bàn thất bại');
      }
    } catch (error) {
      console.error('💥 [ERROR] Exception during reservation:', error);
      setError('Lỗi khi đặt bàn');
    } finally {
      setLoading(false);
      console.log('🏁 [RESERVATION] Reservation process completed');
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

  // Get status color - Use darker colors for better contrast
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: '#dcfce7', color: '#15803d', text: 'Còn trống' }; // Darker green
      case 'occupied': return { bg: '#fee2e2', color: '#b91c1c', text: 'Đang sử dụng' }; // Darker red
      case 'reserved': return { bg: '#fef3c7', color: '#b45309', text: 'Đã đặt trước' }; // Darker orange
      case 'maintenance': return { bg: '#f3f4f6', color: '#475569', text: 'Bảo trì' }; // Darker gray
      case 'cleaning': return { bg: '#e0e7ff', color: '#1e3a8a', text: 'Đang dọn' }; // Darker blue
      default: return { bg: '#f3f4f6', color: '#475569', text: status }; // Darker gray
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
            {/* Socket connection status */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              fontSize: '14px',
              opacity: 0.8
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#ef4444'
              }}></div>
            </div>
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
          }}
          className="datban-search-form"
          >
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1e293b', 
              marginBottom: '24px',
              textAlign: 'center'
            }} className="datban-form-title">
              📅 Thông tin đặt bàn
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              alignItems: 'end',
              marginBottom: '24px'
            }}
            className="datban-search-inputs"
            >
              {/* Date */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }} className="datban-input-label">
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
                }} className="datban-input-label">
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
                }} className="datban-input-label">
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
                }} className="datban-input-label">
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="datban-sort-controls">
              <span style={{ fontWeight: '600', color: '#374151' }} className="datban-sort-label">📊 Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'tableNumber' | 'capacity' | 'location' | 'price')}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  color: '#374151',
                  background: 'white'
                }}
                className="datban-sort-select"
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
                  fontWeight: '600',
                  color: '#1f2937'
                }}
                className="datban-sort-button"
              >
                {sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
              </button>
            </div>

            <div style={{ 
              color: '#374151', 
              fontSize: '14px', 
              fontWeight: '600'
            }} className="datban-results-count">
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
            }}
            className="datban-tables-grid"
            >
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
                      className="datban-table-card"
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
                          }} className="datban-table-number">
                            🍽️ Bàn {table.tableNumber}
                          </span>
                          <span style={{ 
                            background: '#dbeafe', 
                            color: '#1e40af', 
                            borderRadius: '12px', 
                            padding: '4px 12px', 
                            fontSize: '14px', 
                            fontWeight: '600'
                          }} className="datban-capacity-tag">
                            👥 {table.capacity} người
                          </span>
                        </div>
                        
                        <span style={{ 
                          background: statusInfo.bg, 
                          color: statusInfo.color, 
                          borderRadius: '12px', 
                          padding: '4px 12px', 
                          fontSize: '13px',
                          fontWeight: '700'
                        }} className="datban-status-badge">
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
                          color: '#0c4a6e', 
                          borderRadius: '10px', 
                          padding: '4px 10px', 
                          fontSize: '14px',
                          fontWeight: '600'
                        }} className="datban-location-tag">
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
                      }} className="datban-table-description">
                        {table.description || (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }} className="datban-no-description">
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
                                color: '#0c4a6e', 
                                borderRadius: '8px', 
                                padding: '4px 8px', 
                                fontSize: '12px',
                                fontWeight: '600',
                                border: '1px solid #bae6fd'
                              }}
                              className="datban-feature-tag"
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
                        <div className="datban-price-section">
                          <div style={{ 
                            fontWeight: '700', 
                            color: '#dc2626', 
                            fontSize: '20px'
                          }} className="datban-price">
                            {estimatedPrice > 0 ? `${estimatedPrice.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                          </div>
                          {estimatedPrice > (table.pricing?.basePrice || 0) && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6b7280',
                              textDecoration: 'line-through'
                            }} className="datban-original-price">
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
            }}
            className="datban-modal-overlay"
            >
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              className="datban-modal-content"
              >
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

                  {/* Guest Information Fields (only show for non-authenticated users) */}
                  {!user && (
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          display: 'block', 
                          fontWeight: '600', 
                          color: '#374151', 
                          marginBottom: '8px' 
                        }}>
                          👤 Họ và tên: *
                        </label>
                        <input
                          type="text"
                          value={formData.guestName || ''}
                          onChange={e => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                          placeholder="Nhập họ và tên"
                          required
                          style={{ 
                            width: '100%',
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            border: '2px solid #e5e7eb',
                            fontSize: '16px'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          display: 'block', 
                          fontWeight: '600', 
                          color: '#374151', 
                          marginBottom: '8px' 
                        }}>
                          📧 Email: *
                        </label>
                        <input
                          type="email"
                          value={formData.guestEmail || ''}
                          onChange={e => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                          placeholder="Nhập địa chỉ email"
                          required
                          style={{ 
                            width: '100%',
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            border: '2px solid #e5e7eb',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </>
                  )}

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
                      � Số điện thoại: *
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="VD: 0912345678"
                      required
                      style={{ 
                        width: '100%',
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        border: '2px solid #e5e7eb',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      �📝 Yêu cầu đặc biệt:
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
