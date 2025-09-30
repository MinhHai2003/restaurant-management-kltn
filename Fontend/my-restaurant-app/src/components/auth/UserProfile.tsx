import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div 
      className="user-profile" 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseLeave={() => setIsOpen(false)} // khi rời toàn bộ vùng thì ẩn menu
    >
      {/* User Avatar/Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setIsOpen(true)} // hover vào thì mở menu
      >
        <div style={{
          width: '32px',
          height: '32px',
          background: '#0f766e',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          {user.name.split(' ').slice(-1)[0].charAt(0).toUpperCase()}
        </div>
        <span style={{
          fontSize: '0.875rem',
          color: '#374151',
          fontWeight: '500'
        }}>
          {user.name.split(' ').slice(-1)[0]}
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '0.25rem',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          minWidth: '200px',
          zIndex: 50
        }}>
          <div style={{ padding: '0.5rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/profile')}
              style={menuButtonStyle}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              Tài khoản của tôi
            </button>
            <button
              onClick={() => navigate('/profile/orders')}
              style={menuButtonStyle}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              Quản lý đơn hàng
            </button>
            <button
              onClick={() => navigate('/profile/reservations')}
              style={menuButtonStyle}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              Quản lý đặt bàn
            </button>
            <button
              onClick={() => navigate('/profile/addresses')}
              style={menuButtonStyle}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              Danh sách địa chỉ
            </button>
            <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <button
              onClick={handleLogout}
              style={{ ...menuButtonStyle, color: '#dc2626' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const menuButtonStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'center',
  padding: '0.5rem',
  background: 'none',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: '#374151'
};

export default UserProfile;
