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
          padding: '0.6rem 0.8rem',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.2)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          setIsOpen(true);
          e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.95rem',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          {user.name.split(' ').slice(-1)[0].charAt(0).toUpperCase()}
        </div>
        <span style={{
          fontSize: '0.9rem',
          color: 'white',
          fontWeight: '600'
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
          marginTop: '0.5rem',
          background: 'white',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          minWidth: '220px',
          zIndex: 9999,
          overflow: 'hidden'
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
  padding: '0.75rem 1rem',
  background: 'none',
  border: 'none',
  borderRadius: '0',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#374151',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  borderBottom: '1px solid #f3f4f6'
};

export default UserProfile;
