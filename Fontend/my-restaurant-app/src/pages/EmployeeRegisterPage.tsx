import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';

const EmployeeRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'waiter',
    department: 'service',
    salary: '',
    address: '',
    acceptTerms: false,
    showPassword: false,
    showConfirmPassword: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Regex patterns
  const regexPatterns = {
    // Tên: chỉ chữ cái (có dấu) và khoảng trắng
    name: /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/,
    // Email: format chuẩn email
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    // Số điện thoại Việt Nam: +84, 84, hoặc 0 + đầu số 3/5/7/8/9 + 8 số
    phone: /^(\+84|84|0)(3|5|7|8|9)([0-9]{8})$/,
    // Mật khẩu: ít nhất 6 ký tự, có chữ hoa, chữ thường, số (ký tự đặc biệt không bắt buộc)
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
    // Lương: chỉ số nguyên dương
    salary: /^[0-9]+$/,
    // Địa chỉ: chữ, số, dấu câu thông thường
    address: /^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s\/,.-]+$/
  };

  const roles = [
    { value: 'waiter', label: '🍽️ Nhân viên phục vụ' },
    { value: 'chef', label: '👨‍🍳 Đầu bếp' },
    { value: 'cashier', label: '💰 Thu ngân' },
    { value: 'receptionist', label: '📞 Lễ tân' },
    { value: 'manager', label: '👔 Quản lý' },
    { value: 'admin', label: '🔧 Quản trị viên' }
  ];

  const departments = [
    { value: 'service', label: '🍽️ Phục vụ' },
    { value: 'kitchen', label: '🍳 Bếp' },
    { value: 'cashier', label: '💰 Thu ngân' },
    { value: 'reception', label: '📞 Lễ tân' },
    { value: 'management', label: '👔 Quản lý' }
  ];

  // Validate individual field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) {
          return 'Họ tên là bắt buộc';
        }
        if (value.trim().length < 2 || value.trim().length > 50) {
          return 'Họ tên phải có từ 2-50 ký tự';
        }
        if (!regexPatterns.name.test(value.trim())) {
          return 'Họ tên chỉ được chứa chữ cái và dấu cách';
        }
        return '';
      
      case 'email':
        if (!value.trim()) {
          return 'Email là bắt buộc';
        }
        if (!regexPatterns.email.test(value.trim())) {
          return 'Email không hợp lệ (VD: example@email.com)';
        }
        return '';
      
      case 'phone':
        if (value.trim() && !regexPatterns.phone.test(value.replace(/\s/g, ''))) {
          return 'Số điện thoại không hợp lệ (VD: 0123456789 hoặc +84912345678)';
        }
        return '';
      
      case 'password':
        if (!value) {
          return 'Mật khẩu là bắt buộc';
        }
        if (value.length < 6) {
          return 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        if (!regexPatterns.password.test(value)) {
          return 'Mật khẩu phải chứa: ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
        }
        return '';
      
      case 'confirmPassword':
        if (!value) {
          return 'Vui lòng xác nhận mật khẩu';
        }
        if (value !== formData.password) {
          return 'Mật khẩu xác nhận không khớp';
        }
        return '';
      
      case 'salary':
        if (value.trim() && !regexPatterns.salary.test(value.trim())) {
          return 'Lương phải là số nguyên dương';
        }
        if (value.trim() && (parseInt(value.trim()) < 0 || parseInt(value.trim()) > 1000000000)) {
          return 'Lương phải từ 0 đến 1.000.000.000 VNĐ';
        }
        return '';
      
      case 'address':
        if (value.trim() && value.trim().length > 200) {
          return 'Địa chỉ không được vượt quá 200 ký tự';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Real-time validation
      const error = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
      
      // Clear general error when user starts typing
      if (error && error !== '') {
        setError(null);
      }
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
    setError(null);
    setFieldErrors({});

    // Validate all fields
    const errors: Record<string, string> = {};
    
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validateField('email', formData.email);
    if (emailError) errors.email = emailError;
    
    if (formData.phone) {
      const phoneError = validateField('phone', formData.phone);
      if (phoneError) errors.phone = phoneError;
    }
    
    const passwordError = validateField('password', formData.password);
    if (passwordError) errors.password = passwordError;
    
    const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    
    if (formData.salary) {
      const salaryError = validateField('salary', formData.salary);
      if (salaryError) errors.salary = salaryError;
    }
    
    if (formData.address) {
      const addressError = validateField('address', formData.address);
      if (addressError) errors.address = addressError;
    }
    
    if (!formData.acceptTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng!');
      return;
    }

    // If there are field errors, show them
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      setError(firstError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        salary: formData.salary ? parseInt(formData.salary) : undefined,
        address: formData.address
      };

      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (data.success) {
        // Hiển thị thông báo thành công
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        
        // Chuyển hướng đến trang đăng nhập nhân viên
        navigate('/employee-login');
      } else {
        setError(data.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối đến server');
      console.error('Employee register error:', err);
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
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '500px'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px 30px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍💼</div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            Đăng ký Nhân viên
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
            Tạo tài khoản để truy cập hệ thống
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                👤 Họ và tên *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: fieldErrors.name ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Nhập họ và tên (chỉ chữ cái)"
              />
              {fieldErrors.name && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {fieldErrors.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                📧 Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: fieldErrors.email ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Nhập email (VD: example@email.com)"
              />
              {fieldErrors.email && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                📱 Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: fieldErrors.phone ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                placeholder="0123456789 hoặc +84912345678"
              />
              {fieldErrors.phone && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {fieldErrors.phone}
                </div>
              )}
            </div>

            {/* Role & Department - 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Vai trò *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Phòng ban *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {departments.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Salary - full width */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                💰 Lương (VNĐ)
              </label>
              <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                  max="1000000000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: fieldErrors.salary ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="10000000 (VNĐ)"
                />
              {fieldErrors.salary && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {fieldErrors.salary}
                </div>
              )}
            </div>

            {/* Address */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                🏠 Địa chỉ
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: fieldErrors.address ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Nhập địa chỉ (tối đa 200 ký tự)"
              />
              {fieldErrors.address && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {fieldErrors.address}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                🔒 Mật khẩu *
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
                    padding: '12px 40px 12px 12px',
                    border: fieldErrors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Tối thiểu 6 ký tự: chữ hoa, chữ thường và số"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {formData.showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                🔒 Xác nhận mật khẩu *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={formData.showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    border: fieldErrors.confirmPassword ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {formData.showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {fieldErrors.confirmPassword}
                </div>
              )}
            </div>

            {/* Accept Terms */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  style={{
                    marginRight: '8px',
                    transform: 'scale(1.2)'
                  }}
                />
                Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
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
                padding: '14px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {isLoading ? '🔄 Đang đăng ký...' : '✨ Tạo tài khoản'}
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center', fontSize: '14px' }}>
            <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
              Đã có tài khoản nhân viên?
            </p>
            <button
              onClick={() => navigate('/employee-login')}
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
              🔑 Đăng nhập tại đây
            </button>
          </div>

          {/* Back to customer login */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px',
            paddingTop: '20px',
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

export default EmployeeRegisterPage;