import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import './auth.css';

const validationFields = ['name', 'email', 'phone', 'password', 'confirmPassword'] as const;
type FieldName = typeof validationFields[number];

interface RegisterFormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

type FieldErrors = Record<FieldName, string>;

const nameRegex = /^[A-Za-zÀ-ỹ\s]{2,50}$/u;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^0[0-9]{9}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  
  const [formData, setFormData] = useState<RegisterFormState>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    showPassword: false,
    showConfirmPassword: false
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const isValidatableField = (field: string): field is FieldName =>
    validationFields.some(validField => validField === field);

  const getFieldError = (
    fieldName: FieldName,
    value: string,
    data: RegisterFormState = formData
  ): string => {
    switch (fieldName) {
      case 'name': {
        const trimmed = value.trim();
        if (!trimmed) return 'Vui lòng nhập họ và tên.';
        if (!nameRegex.test(trimmed)) {
          return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng (2-50 ký tự).';
        }
        return '';
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) return 'Vui lòng nhập email.';
        if (!emailRegex.test(trimmed.toLowerCase())) {
          return 'Email không hợp lệ. Ví dụ: ten@domain.com';
        }
        return '';
      }
      case 'phone': {
        const trimmed = value.trim();
        if (!trimmed) return 'Vui lòng nhập số điện thoại.';
        if (!phoneRegex.test(trimmed)) {
          return 'Số điện thoại phải bắt đầu bằng số 0 và đủ 10 chữ số.';
        }
        return '';
      }
      case 'password':
        if (!value) return 'Vui lòng nhập mật khẩu.';
        if (!passwordRegex.test(value)) {
          return 'Mật khẩu phải có tối thiểu 6 ký tự, gồm chữ và số.';
        }
        return '';
      case 'confirmPassword':
        if (!value) return 'Vui lòng nhập lại mật khẩu.';
        if (value !== data.password) {
          return 'Mật khẩu xác nhận không khớp.';
        }
        return '';
      default:
        return '';
    }
  };

  const updateFieldError = (
    fieldName: FieldName,
    value: string,
    data: RegisterFormState = formData
  ) => {
    const errorMessage = getFieldError(fieldName, value, data);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
    return errorMessage;
  };

  const validateForm = (data: RegisterFormState = formData) => {
    const newErrors = validationFields.reduce<FieldErrors>((acc, field) => {
      acc[field] = getFieldError(field, data[field], data);
      return acc;
    }, {} as FieldErrors);

    setFieldErrors(newErrors);
    return Object.values(newErrors).every(message => message === '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let newValue: string | boolean = type === 'checkbox' ? checked : value;

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      newValue = digitsOnly.slice(0, 10);
    }

    if (name === 'name' && typeof newValue === 'string') {
      newValue = newValue.replace(/\s+/g, ' ');
    }

    const updatedData = {
      ...formData,
      [name]: newValue
    } as RegisterFormState;

    setFormData(updatedData);

    if (isValidatableField(name)) {
      updateFieldError(name, updatedData[name], updatedData);
      if (name === 'password' && updatedData.confirmPassword) {
        updateFieldError('confirmPassword', updatedData.confirmPassword, updatedData);
      }
    }

    if (localError) {
      setLocalError(null);
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setFormData(prev => ({
      ...prev,
      [field === 'password' ? 'showPassword' : 'showConfirmPassword']: 
        !prev[field === 'password' ? 'showPassword' : 'showConfirmPassword']
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    const isFormValid = validateForm();
    if (!isFormValid) {
      setLocalError('Vui lòng kiểm tra lại các thông tin bên dưới.');
      return;
    }

    if (!formData.acceptTerms) {
      setLocalError('Vui lòng đồng ý với điều khoản sử dụng!');
      return;
    }
    
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password
      });
      // Redirect to home page after successful registration
      navigate('/');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header />
      
      {/* Breadcrumb */}
      <div className="container" style={{ padding: '1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
        <a href="/" style={{ color: '#0f766e', textDecoration: 'none' }}>Trang chủ</a>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span>Đăng ký</span>
      </div>

      {/* Main Content */}
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ 
          maxWidth: '500px', 
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
            marginBottom: '2rem',
            color: '#1f2937'
          }}>
            Tạo tài khoản
          </h1>

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

            {/* Full Name Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Họ và tên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nhập họ và tên đầy đủ"
                required
                maxLength={50}
                pattern="[A-Za-zÀ-ỹ ]{2,50}"
                title="Chỉ nhập chữ cái và khoảng trắng, từ 2 đến 50 ký tự"
                autoComplete="name"
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
              {fieldErrors.name && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ email"
                required
                maxLength={100}
                autoComplete="email"
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
              {fieldErrors.email && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
                required
                pattern="0[0-9]{9}"
                inputMode="numeric"
                title="Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số"
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
              {fieldErrors.phone && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={formData.showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                  onClick={() => togglePasswordVisibility('password')}
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
              {fieldErrors.password && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={formData.showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Nhập lại mật khẩu"
                  required
                  autoComplete="new-password"
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
                  onClick={() => togglePasswordVisibility('confirmPassword')}
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
                  {formData.showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  required
                  style={{ marginTop: '0.25rem' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.4' }}>
                  Tôi đồng ý với{' '}
                  <a href="/terms" style={{ color: '#0f766e', textDecoration: 'none' }}>
                    Điều khoản sử dụng
                  </a>
                  {' '}và{' '}
                  <a href="/privacy" style={{ color: '#0f766e', textDecoration: 'none' }}>
                    Chính sách bảo mật
                  </a>
                  {' '}của Hải sản Biển Đông
                </span>
              </label>
            </div>

            {/* Register Button */}
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
                  Đang đăng ký...
                </>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Đã có tài khoản?{' '}
              <a 
                href="/login" 
                style={{
                  color: '#0f766e',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;
