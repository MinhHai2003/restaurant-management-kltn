import React, { useState, useEffect } from 'react';
import AccountLayout from '../../components/account/AccountLayout';
import { useTableSocket } from '../../hooks/useTableSocket';
import { useAuth } from '../../hooks/useAuth';
import { API_CONFIG } from '../../config/api';

interface Reservation {
  id: string;
  reservationNumber: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  restaurantBranch: string;
  specialRequests?: string;
  customerNote?: string;
}

const ReservationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const { socket, isConnected } = useTableSocket();

  // Debug logs
  useEffect(() => {
    console.log('🔍 [RESERVATIONS] Socket status changed:', { socket: !!socket, isConnected });
  }, [socket, isConnected]);

  // Fetch reservations from backend
  useEffect(() => {
    if (!user) return;
    const fetchReservations = async () => {
      try {
        // Get user token for authentication
        const token = localStorage.getItem('token');
        const apiUrl = `${API_CONFIG.TABLE_API}/reservations`;
        const res = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (data.success && data.data && data.data.reservations) {
          // Map backend data to Reservation type
          const mapped = data.data.reservations.map((r: unknown) => {
            const reservation = r as any; // Type assertion for now
            return {
              id: reservation._id,
              reservationNumber: reservation.reservationNumber,
              date: reservation.reservationDate.split('T')[0],
              time: reservation.timeSlot.startTime + ' - ' + reservation.timeSlot.endTime,
              guests: reservation.partySize,
              status: reservation.status,
              restaurantBranch: reservation.tableInfo?.branch || 'Main Branch',
              specialRequests: reservation.specialRequests,
              customerNote: reservation.customerNote
            };
          });
          setReservations(mapped);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
      }
    };
    fetchReservations();
  }, [user]);

  // Socket realtime update
  useEffect(() => {
    if (!socket || !user) return;
    const handleReservationUpdate = (data: unknown) => {
      // Optionally refetch or update local state
      // For demo, just refetch
      console.log('🔄 [SOCKET] Reservation update:', data);
      // You can optimize by updating only the changed reservation
      // For now, refetch all
      const token = localStorage.getItem('token');
      const apiUrl = `${API_CONFIG.TABLE_API}/reservations`;
      fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.reservations) {
            const mapped = data.data.reservations.map((r: unknown) => {
              const reservation = r as any; // Type assertion for now
              return {
                id: reservation._id,
                reservationNumber: reservation.reservationNumber,
                date: reservation.reservationDate.split('T')[0],
                time: reservation.timeSlot.startTime + ' - ' + reservation.timeSlot.endTime,
                guests: reservation.partySize,
                status: reservation.status,
                restaurantBranch: reservation.tableInfo?.branch || 'Main Branch',
                specialRequests: reservation.specialRequests,
                customerNote: reservation.customerNote
              };
            });
            setReservations(mapped);
          }
        })
        .catch(err => console.error('Error refetching reservations:', err));
    };
    socket.on('reservation_created', handleReservationUpdate);
    socket.on('reservation_status_updated', handleReservationUpdate);
    return () => {
      socket.off('reservation_created', handleReservationUpdate);
      socket.off('reservation_status_updated', handleReservationUpdate);
    };
  }, [socket, user]);

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return '#d97706';
      case 'confirmed': return '#3b82f6';
      case 'seated': return '#2563eb';
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      case 'no-show': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'seated': return 'Đã nhận bàn';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'no-show': return 'Không đến';
      default: return status;
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'upcoming') return ['pending', 'confirmed', 'seated'].includes(reservation.status);
    if (activeFilter === 'completed') return reservation.status === 'completed';
    if (activeFilter === 'cancelled') return ['cancelled', 'no-show'].includes(reservation.status);
    return true;
  });

  const filters = [
    { id: 'all', label: 'Tất cả', count: reservations.length },
    { id: 'upcoming', label: 'Sắp tới', count: reservations.filter(r => ['pending', 'confirmed', 'seated'].includes(r.status)).length },
    { id: 'completed', label: 'Đã hoàn thành', count: reservations.filter(r => r.status === 'completed').length },
    { id: 'cancelled', label: 'Đã hủy', count: reservations.filter(r => ['cancelled', 'no-show'].includes(r.status)).length }
  ];

  return (
    <AccountLayout activeTab="reservations">
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              📋 Lịch sử đặt bàn
            </h2>
            {/* Socket status indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              color: isConnected ? '#059669' : '#dc2626'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#ef4444'
              }}></div>
              {isConnected ? 'Real-time ON' : 'Disconnected'}
            </div>
          </div>
          
          <button
            style={{
              padding: '0.5rem 1rem',
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Đặt bàn mới
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
              style={{
                padding: '0.75rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeFilter === filter.id ? '2px solid #0ea5e9' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: activeFilter === filter.id ? '#0ea5e9' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Chưa có lịch đặt bàn nào
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              Bạn chưa có lịch đặt bàn nào trong danh mục này
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  background: 'white'
                }}
              >
                {/* Reservation Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>
                      Đặt bàn #{reservation.reservationNumber}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {reservation.restaurantBranch}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'white',
                        background: getStatusColor(reservation.status)
                      }}
                    >
                      {getStatusText(reservation.status)}
                    </div>
                  </div>
                </div>

                {/* Reservation Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      letterSpacing: '0.05em'
                    }}>
                      Ngày & Giờ
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      {new Date(reservation.date).toLocaleDateString('vi-VN')}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#475569'
                    }}>
                      {reservation.time}
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      letterSpacing: '0.05em'
                    }}>
                      Số khách
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      👥 {reservation.guests}
                    </div>
                  </div>

                  {reservation.specialRequests && (
                    <div style={{
                      padding: '1rem',
                      background: '#fefce8',
                      borderRadius: '0.375rem',
                      border: '1px solid #fde047',
                      gridColumn: 'span 2'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#a16207',
                        marginBottom: '0.25rem',
                        textTransform: 'uppercase',
                        fontWeight: '600',
                        letterSpacing: '0.05em'
                      }}>
                        Yêu cầu đặc biệt
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#713f12'
                      }}>
                        {reservation.specialRequests}
                      </div>
                    </div>
                  )}

                  {reservation.customerNote && (
                    <div style={{
                      padding: '1rem',
                      background: '#f0f9ff',
                      borderRadius: '0.375rem',
                      border: '1px solid #7dd3fc',
                      gridColumn: 'span 2'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#0369a1',
                        marginBottom: '0.25rem',
                        textTransform: 'uppercase',
                        fontWeight: '600',
                        letterSpacing: '0.05em'
                      }}>
                        Ghi chú
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#0c4a6e'
                      }}>
                        {reservation.customerNote}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reservation Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <button
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'none',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}
                  >
                    Xem chi tiết
                  </button>
                  
                  {reservation.status === 'completed' && (
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Đặt lại
                    </button>
                  )}
                  
                  {reservation.status === 'confirmed' && (
                    <>
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Hủy đặt bàn
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default ReservationsPage;
