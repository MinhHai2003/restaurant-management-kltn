import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { API_CONFIG } from '../config/api';
import StaffNotifications from '../components/StaffNotifications';

const EmployeeLoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Socket.io integration for real-time notifications
  const { isConnected } = useOrderSocket();
  
  // Get user role from stored data (if any)
  const employeeData = localStorage.getItem('employeeData');
  const userRole = employeeData ? JSON.parse(employeeData).role : 'staff';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    showPassword: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setFormData(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Tạm thời sử dụng đăng nhập demo cho đến khi auth-service hoạt động
      if (formData.email === 'loivinh759@gmail.com' && formData.password === '123456') {
        // Tạo user demo
        const demoUser = {
          _id: 'demo-admin-id',
          name: 'Admin Demo',
          email: 'loivinh759@gmail.com',
          role: 'admin',
          isActive: true
        };
        
        const demoToken = 'demo-admin-token-' + Date.now();
        
        // Lưu vào localStorage
        localStorage.setItem('employeeToken', demoToken);
        localStorage.setItem('employeeData', JSON.stringify(demoUser));
        
        console.log('✅ Demo login successful:', demoUser.name, '- Role:', demoUser.role);
        
        // Hiển thị thông báo thành công
        alert(`Chào mừng ${demoUser.name}! Đăng nhập demo thành công.`);
        
        // Chuyển hướng đến AdminDashboard
        navigate('/admin');
        setIsLoading(false);
        return;
      }

      // Thử đăng nhập qua auth-service (nếu hoạt động)
      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Lưu token vào localStorage
        localStorage.setItem('employeeToken', data.data.accessToken);
        localStorage.setItem('employeeRefreshToken', data.data.refreshToken);
        localStorage.setItem('employeeData', JSON.stringify(data.data.user));
        
        // Hiển thị thông báo thành công
        alert(`Chào mừng ${data.data.user.name}! Đăng nhập thành công.`);
        
        // Chuyển hướng đến AdminDashboard
        navigate('/admin');
      } else {
        setError(data.message || 'Email hoặc mật khẩu không đúng');
      }
    } catch (err) {
      console.error('Auth service error, trying demo login...');
      
      // Fallback: Demo login cho dev
      if (formData.email === 'loivinh759@gmail.com' && formData.password === '123456') {
        const demoUser = {
          _id: 'demo-admin-id',
          name: 'Admin Demo',
          email: 'loivinh759@gmail.com',
          role: 'admin',
          isActive: true
        };
        
        const demoToken = 'demo-admin-token-' + Date.now();
        
        localStorage.setItem('employeeToken', demoToken);
        localStorage.setItem('employeeData', JSON.stringify(demoUser));
        
        console.log('✅ Fallback demo login successful');
        alert(`Chào mừng ${demoUser.name}! Đăng nhập demo thành công.`);
        navigate('/admin');
      } else {
        setError('Lỗi kết nối server. Demo: loivinh759@gmail.com / 123456');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Staff Notifications Component */}
      <StaffNotifications 
        userRole={userRole}
        maxNotifications={3}
        showConnectionStatus={true}
      />

      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px 30px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍💼</div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            Đăng nhập Nhân viên
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
            Truy cập hệ thống quản lý nhà hàng
          </p>
          {/* Socket Connection Status */}
          <div style={{
            marginTop: '12px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: isConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {isConnected ? '🟢 Socket kết nối' : '🔴 Socket ngắt kết nối'}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '40px 30px' }}>
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Nhập email của bạn"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                🔒 Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={formData.showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nhập mật khẩu"
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  {formData.showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                background: isLoading 
                  ? '#d1d5db' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '16px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '24px'
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? '🔄 Đang đăng nhập...' : '🚀 Đăng nhập'}
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center', fontSize: '14px' }}>
            <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
              Chưa có tài khoản nhân viên?
            </p>
            <button
              onClick={() => navigate('/employee-register')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              📝 Đăng ký tại đây
            </button>
          </div>

          {/* Back to customer login */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ← Quay lại đăng nhập khách hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginPage;