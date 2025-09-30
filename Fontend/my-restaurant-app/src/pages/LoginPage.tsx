import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    showPassword: false
  });

  const [localError, setLocalError] = useState<string | null>(null);

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
    setLocalError(null);
    
    try {
      await login(formData.email, formData.password);
      // Redirect to home page after successful login
      navigate('/');
    } catch (err) {
      // Error is handled by AuthContext, but we can show local error too
      setLocalError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header />
      
      {/* Breadcrumb */}
      <div className="container" style={{ padding: '1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
        <a href="/" style={{ color: '#0f766e', textDecoration: 'none' }}>Trang chủ</a>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span>Đăng nhập</span>
      </div>

      {/* Main Content */}
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ 
          maxWidth: '400px', 
          margin: '0 auto',
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '0.5rem',
            color: '#1f2937'
          }}>
            Xin chào,
          </h1>
          
          <p style={{
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#6b7280'
          }}>
            Đăng nhập hoặc <a href="/register" style={{ color: '#0f766e', textDecoration: 'none' }}>Tạo tài khoản</a>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Error Display */}
            {(error || localError) && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {error || localError}
              </div>
            )}

            {/* Email Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email của bạn"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <input
                type={formData.showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  paddingRight: '3rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {formData.showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <a 
                href="/forgot-password" 
                style={{ 
                  color: '#0f766e', 
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                background: isLoading ? '#9ca3af' : '#0f766e',
                color: 'white',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = '#0d9488')}
              onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = '#0f766e')}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Social Login */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Đăng nhập/Đăng ký với phương thức khác
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <img 
                  src="https://developers.google.com/identity/images/g-logo.png" 
                  alt="Google" 
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Google</span>
              </button>
              
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: '#1877f2',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#166fe5'}
                onMouseOut={(e) => e.currentTarget.style.background = '#1877f2'}
              >
                <span style={{ fontSize: '1rem' }}>📘</span>
                <span style={{ fontSize: '0.875rem' }}>Facebook</span>
              </button>
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <a 
                href="/register" 
                style={{
                  color: '#0f766e',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                ĐĂNG KÝ
              </a>
            </div>
            
            {/* Employee Login Link */}
            <div style={{ 
              marginTop: '2rem', 
              textAlign: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.875rem', 
                margin: '0 0 0.5rem 0' 
              }}>
                Bạn là nhân viên?
              </p>
              <a 
                href="/employee-login" 
                style={{
                  color: '#7c3aed',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                👨‍💼 Đăng nhập nhân viên
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;
