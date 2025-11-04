import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
// import 'public/fonts/NotoSans-Regular.js'; // Nếu đã có font jsPDF unicode, nạp ở đây
// Hàm sinh PDF từ dữ liệu đơn hàng sẽ nằm trong component
import { customerService, type Order as ApiOrder } from '../../services/customerService';
import AccountLayout from '../../components/account/AccountLayout';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import OrderRatingModal from '../../components/OrderRatingModal';
import reviewService from '../../services/reviewService';
import type { ReviewData } from '../../services/reviewService';

interface Order extends ApiOrder {
  itemRatings?: {
    isRated: boolean;
    ratedAt?: string;
    reviewIds?: string[];
  };
}


const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'confirmed': return '#3b82f6';
    case 'preparing': return '#8b5cf6';
    case 'ready': return '#10b981';
    case 'delivered': return '#059669';
    case 'completed': return '#6b7280';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Chờ xử lý';
    case 'confirmed': return 'Đã xác nhận';
    case 'preparing': return 'Đang chuẩn bị';
    case 'ready': return 'Sẵn sàng';
    case 'delivered': return 'Đã hoàn thành';
    case 'completed': return 'Hoàn thành';
    case 'cancelled': return 'Đã hủy';
    default: return 'Không xác định';
  }
};


const OrdersPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Socket.io for real-time order updates
  const { socket, isConnected } = useOrderSocket();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);

  const handleViewPdf = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
    setTimeout(() => {
      const element = document.getElementById('invoice-html');
      if (element) {
        html2pdf().set({
          margin: 10,
          filename: `HoaDon_${order.orderNumber}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
      }
    }, 300);
  };

  const handleRateOrder = (order: Order) => {
    setRatingOrder(order);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (reviews: ReviewData[]) => {
    if (!ratingOrder) return;

    try {
      const result = await reviewService.submitOrderReview(ratingOrder.orderNumber, reviews);
      if (result.success) {
        // Update order status to show it's been rated
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === ratingOrder._id 
              ? { ...order, itemRatings: { isRated: true, ratedAt: new Date().toISOString() } }
              : order
          )
        );
        setShowRatingModal(false);
        setRatingOrder(null);
      } else {
        throw new Error(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      throw error;
    }
  };

  const canRateOrder = (order: Order) => {
    return order.status === 'delivered' && !order.itemRatings?.isRated;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      const res = await customerService.getOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error || 'Không thể tải danh sách đơn hàng');
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  // Listen to Socket.io events for real-time order updates
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🔌 OrdersPage: Setting up Socket.io event listeners for customer...');

      const handleOrderStatusUpdate = (data: { orderId: string; status?: string; newStatus?: string; order?: Order; orderNumber?: string; message?: string }) => {
        console.log('🔄 Customer OrdersPage: Order status updated via Socket.io:', data);
        
        // Priority: newStatus > order.status > status
        const newStatus = data.newStatus || data.order?.status || data.status;
        
        if (!newStatus) {
          console.warn('⚠️ Customer OrdersPage: No status found in socket event:', data);
          return;
        }
        
        console.log(`📢 Customer OrdersPage: Order ${data.orderId} status changed to: ${newStatus}`);
        
        // Update specific order status in the list - ưu tiên dùng order object nếu có
        setOrders(prevOrders => {
          return prevOrders.map(order => {
            if (order._id === data.orderId) {
              // Nếu có full order object, dùng nó; nếu không chỉ update status
              return data.order ? { ...data.order, status: newStatus } : { ...order, status: newStatus };
            }
            return order;
          });
        });

        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('Cập nhật đơn hàng!', {
            body: data.message || `Đơn hàng ${data.orderNumber || data.orderId} đã được cập nhật: ${newStatus}`,
            icon: '/vite.svg'
          });
        }
      };

      const handleNewOrder = (data: { orderNumber: string; status: string; [key: string]: unknown }) => {
        console.log('🆕 Customer OrdersPage: New order created via Socket.io:', data);
        // Refresh orders list when new order is created
        const fetchOrders = async () => {
          const res = await customerService.getOrders();
          if (res.success && res.data) {
            setOrders(res.data);
          }
        };
        fetchOrders();
      };

      // Register event listeners
      socket.on('order_status_updated', handleOrderStatusUpdate);
      socket.on('customer_order_status_updated', handleOrderStatusUpdate);
      socket.on('order_created', handleNewOrder);

      // Cleanup listeners
      return () => {
        console.log('🔌 OrdersPage: Cleaning up Socket.io event listeners...');
        socket.off('order_status_updated', handleOrderStatusUpdate);
        socket.off('customer_order_status_updated', handleOrderStatusUpdate);
        socket.off('order_created', handleNewOrder);
      };
    }
  }, [socket, isConnected]);

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    return order.status === activeFilter;
  });

  const filters = [
    { id: 'all', label: 'Tất cả', count: orders.length },
    { id: 'pending', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'pending').length },
    { id: 'delivered', label: 'Đã hoàn thành', count: orders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', label: 'Đã hủy', count: orders.filter(o => o.status === 'cancelled').length }
  ];

  return (
    <AccountLayout activeTab="orders">
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            Quản lý đơn hàng
          </h2>
          
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
            Đặt hàng mới
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

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
            Đang tải danh sách đơn hàng...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Chưa có đơn hàng nào
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              Bạn chưa có đơn hàng nào trong danh mục này
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  background: 'white'
                }}
              >
                {/* Order Header */}
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
                      Đơn hàng #{order.orderNumber}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Đặt ngày: {order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : ''}
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
                        background: getStatusColor(order.status)
                      }}
                    >
                      {getStatusText(order.status)}
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      marginTop: '0.5rem'
                    }}>
                      {order.pricing?.total?.toLocaleString('vi-VN') || 0}đ
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.75rem'
                  }}>
                    Món ăn đã đặt:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {order.items?.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f9fafb',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {item.name}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginLeft: '0.5rem'
                          }}>
                            x{item.quantity}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {item.price?.toLocaleString('vi-VN') || 0}đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                {order.delivery?.address?.full && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.375rem'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '0.25rem'
                      }}>
                        Địa chỉ giao hàng:
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                        {order.delivery.address.full}
                      </div>
                    </div>
                    {order.delivery.estimatedTime && (
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          Thời gian giao hàng dự kiến:
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                          {order.delivery.estimatedTime} phút
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1rem',
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
                    onClick={() => handleViewPdf(order)}
                  >
                    Xem chi tiết
                  </button>
                  
                  {/* Rating Button */}
                  {canRateOrder(order) ? (
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#f59e0b',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: 'white',
                        fontWeight: '500'
                      }}
                      onClick={() => handleRateOrder(order)}
                    >
                      ⭐ Đánh giá
                    </button>
                  ) : order.itemRatings?.isRated ? (
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: 'white',
                        fontWeight: '500'
                      }}
                    >
                      ✅ Đã đánh giá
                    </span>
                  ) : order.status !== 'delivered' ? (
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#6b7280',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: 'white',
                        fontWeight: '500'
                      }}
                    >
                      ⏳ Chờ hoàn thành
                    </span>
                  ) : null}
      {/* Modal hóa đơn HTML để xuất PDF */}
      {showInvoice && selectedOrder && (
        <div style={{ display: 'none' }}>
          <div id="invoice-html" style={{ fontFamily: 'Noto Sans, Arial, sans-serif', color: '#222', width: 700, padding: 24 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 16 }}>HÓA ĐƠN ĐƠN HÀNG #{selectedOrder.orderNumber}</h2>
            <div><b>Ngày đặt:</b> {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString('vi-VN') : ''}</div>
            <div><b>Trạng thái đơn hàng:</b> {getStatusText(selectedOrder.status)}</div>
            <div><b>Tên khách:</b> {selectedOrder.customerInfo?.name || '-'}</div>
            <div><b>SĐT:</b> {selectedOrder.customerInfo?.phone || '-'}</div>
            <div><b>Email:</b> {selectedOrder.customerInfo?.email || '-'}</div>
            <div><b>Phương thức thanh toán:</b> {selectedOrder.payment?.method || '-'}</div>
            <div><b>Trạng thái thanh toán:</b> {selectedOrder.payment?.status || '-'}</div>
            <div><b>Ghi chú khách:</b> {selectedOrder.notes?.customer || '-'}</div>
            {selectedOrder.delivery?.address?.full && (
              <div><b>Địa chỉ giao hàng:</b> {selectedOrder.delivery.address.full}</div>
            )}
            {selectedOrder.delivery?.estimatedTime && (
              <div><b>Thời gian giao dự kiến:</b> {selectedOrder.delivery.estimatedTime} phút</div>
            )}
            <div><b>Phí giao hàng:</b> {selectedOrder.pricing?.deliveryFee?.toLocaleString('vi-VN') || 0}đ</div>
            <div><b>Giảm giá:</b> {selectedOrder.pricing?.discount?.toLocaleString('vi-VN') || 0}đ</div>
            <div><b>Tổng tiền:</b> <span style={{fontSize: '1.2em', fontWeight: 700}}>{selectedOrder.pricing?.total?.toLocaleString('vi-VN') || 0}đ</span></div>
            <hr />
            <div><b>Danh sách món:</b></div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ border: '1px solid #e5e7eb', padding: 6 }}>#</th>
                  <th style={{ border: '1px solid #e5e7eb', padding: 6 }}>Tên món</th>
                  <th style={{ border: '1px solid #e5e7eb', padding: 6 }}>SL</th>
                  <th style={{ border: '1px solid #e5e7eb', padding: 6 }}>Đơn giá</th>
                  <th style={{ border: '1px solid #e5e7eb', padding: 6 }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>{item.name}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>{item.price?.toLocaleString('vi-VN') || 0}đ</td>
                    <td style={{ border: '1px solid #e5e7eb', padding: 6 }}>{(item.price * item.quantity)?.toLocaleString('vi-VN') || 0}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr />
            <div style={{ textAlign: 'center', marginTop: 24, fontWeight: 600 }}>Cảm ơn quý khách đã sử dụng dịch vụ!</div>
          </div>
        </div>
      )}
                  
                  {order.status === 'delivered' && (
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
                  
                  {(order.status === 'pending' || order.status === 'confirmed') && (
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
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <OrderRatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setRatingOrder(null);
        }}
        order={ratingOrder}
        onSubmit={handleSubmitRating}
      />
    </AccountLayout>
  );
};

export default OrdersPage;
