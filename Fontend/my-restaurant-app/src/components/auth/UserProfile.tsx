import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile" style={{
      position: 'relative',
      display: 'inline-block'
    }}>
      {/* User Avatar/Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        background: '#f9fafb',
        borderRadius: '0.5rem',
        cursor: 'pointer'
      }}>
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
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span style={{
          fontSize: '0.875rem',
          color: '#374151',
          fontWeight: '500'
        }}>
          {user.name}
        </span>
      </div>

      {/* Dropdown Menu */}
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
        zIndex: 50,
        display: 'none'
      }}
      className="user-dropdown">
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            {user.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            {user.email}
          </p>
        </div>
        
        <div style={{ padding: '0.5rem' }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#374151'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            Thông tin cá nhân
          </button>
          
          <button
            onClick={() => navigate('/orders')}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#374151'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            Đơn hàng của tôi
          </button>
          
          <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#dc2626'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
