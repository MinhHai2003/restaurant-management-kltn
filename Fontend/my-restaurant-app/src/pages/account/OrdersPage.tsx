import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
// import 'public/fonts/NotoSans-Regular.js'; // Nếu đã có font jsPDF unicode, nạp ở đây
// Hàm sinh PDF từ dữ liệu đơn hàng sẽ nằm trong component
import { customerService, type Order as ApiOrder } from '../../services/customerService';
import AccountLayout from '../../components/account/AccountLayout';

type Order = ApiOrder;


const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'confirmed': return '#3b82f6';
    case 'preparing': return '#8b5cf6';
    case 'ready': return '#10b981';
    case 'delivered': return '#059669';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'confirmed': return 'Đã xác nhận';
    case 'preparing': return 'Đang chuẩn bị';
    case 'ready': return 'Sẵn sàng giao';
    case 'delivered': return 'Đã giao';
    case 'cancelled': return 'Đã hủy';
    default: return 'Không xác định';
  }
};


const OrdersPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

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

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    return order.status === activeFilter;
  });

  const filters = [
    { id: 'all', label: 'Tất cả', count: orders.length },
    { id: 'pending', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'pending').length },
    { id: 'delivered', label: 'Đã giao', count: orders.filter(o => o.status === 'delivered').length },
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
    </AccountLayout>
  );
};

export default OrdersPage;
