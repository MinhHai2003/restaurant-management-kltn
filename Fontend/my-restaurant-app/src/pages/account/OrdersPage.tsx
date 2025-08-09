import React, { useState } from 'react';
import AccountLayout from '../../components/account/AccountLayout';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  deliveryAddress?: string;
  estimatedTime?: string;
}

const OrdersPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');

  // Mock data - sẽ được thay thế bằng API call
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'DH2024001',
      date: '2024-08-10',
      status: 'delivered',
      total: 850000,
      items: [
        { name: 'Tôm hùm nướng phô mai', quantity: 1, price: 650000 },
        { name: 'Cua rang me', quantity: 1, price: 200000 }
      ],
      deliveryAddress: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
      estimatedTime: '45 phút'
    },
    {
      id: '2',
      orderNumber: 'DH2024002',
      date: '2024-08-08',
      status: 'preparing',
      total: 420000,
      items: [
        { name: 'Cá lăng nướng lá chuối', quantity: 1, price: 320000 },
        { name: 'Canh chua cá bớp', quantity: 1, price: 100000 }
      ],
      deliveryAddress: '456 Lê Văn Việt, Quận 9, TP.HCM',
      estimatedTime: '30 phút'
    }
  ];

  const getStatusColor = (status: Order['status']) => {
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

  const getStatusText = (status: Order['status']) => {
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
        {filteredOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#6b7280'
          }}>
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
                key={order.id}
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
                      Đặt ngày: {new Date(order.date).toLocaleDateString('vi-VN')}
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
                      {order.total.toLocaleString('vi-VN')}đ
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
                    {order.items.map((item, index) => (
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
                          {item.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                {order.deliveryAddress && (
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
                        {order.deliveryAddress}
                      </div>
                    </div>
                    
                    {order.estimatedTime && (
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          Thời gian giao hàng dự kiến:
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                          {order.estimatedTime}
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
                  >
                    Xem chi tiết
                  </button>
                  
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
