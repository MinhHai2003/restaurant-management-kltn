import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';

interface CustomerProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  loyaltyPoints: number;
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalOrders: number;
  totalSpent: number;
}

interface AccountLayoutProps {
  children: ReactNode;
  activeTab: 'profile' | 'orders' | 'reservations' | 'addresses' | 'logout';
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ children, activeTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);

  // Fetch customer profile on mount
  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5002/api/customers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCustomer(result.data.customer);
        }
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
    }
  };

  const getMembershipLabel = (level: string) => {
    switch (level) {
      case 'bronze': return 'ĐỒNG';
      case 'silver': return 'BẠC';
      case 'gold': return 'VÀNG';
      case 'platinum': return 'BẠCH KIM';
      default: return 'ĐỒNG';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'profile', label: 'Thông tin tài khoản', icon: '👤', path: '/profile' },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: '📦', path: '/profile/orders' },
    { id: 'reservations', label: 'Lịch sử đặt bàn', icon: '🍽️', path: '/profile/reservations' },
    { id: 'recommendations', label: 'Gợi ý cho bạn', icon: '⭐', path: '/profile/recommendations' },
    { id: 'addresses', label: 'Sổ địa chỉ', icon: '📍', path: '/profile/addresses' },
    { id: 'logout', label: 'Đăng xuất', icon: '🚪', path: '/logout' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '2rem 0'
    }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0,
                marginBottom: '0.25rem'
              }}>
                Xin chào, {user?.name}!
              </h1>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '1rem'
              }}>
                Quản lý thông tin tài khoản và đơn hàng của bạn
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          {/* Sidebar Menu */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            height: 'fit-content',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              Tài khoản của tôi
            </h3>
            
            <nav>
              {menuItems.map((item) => {
                if (item.id === 'logout') {
                  return (
                    <button
                      key={item.id}
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        marginBottom: '0.5rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        color: '#dc2626',
                        background: 'transparent',
                        border: '1px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                }
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      marginBottom: '0.5rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: activeTab === item.id ? '#0ea5e9' : '#4b5563',
                      background: activeTab === item.id ? '#f0f9ff' : 'transparent',
                      border: activeTab === item.id ? '1px solid #bae6fd' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      fontSize: '0.875rem',
                      fontWeight: activeTab === item.id ? '600' : '500'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Info */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Thành viên từ
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                {customer ? getMembershipLabel(customer.membershipLevel) : 'ĐỒNG'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
                {customer?.loyaltyPoints || 0} điểm tích lũy
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: '600px'
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
