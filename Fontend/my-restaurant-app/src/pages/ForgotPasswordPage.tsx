import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { API_CONFIG } from '../config/api';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle OTP input (6 separate inputs)
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Step 1: Request OTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP qua email.');
        setStep(2);
        setResendCooldown(60);
      } else {
        setError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số OTP');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (data.success && data.data?.resetToken) {
        setResetToken(data.data.resetToken);
        setStep(3);
      } else {
        setError(data.message || 'Mã OTP không đúng hoặc đã hết hạn.');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword, resetToken }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Mật khẩu đã được đặt lại thành công! Đang chuyển đến trang đăng nhập...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError(null);
    setOtp(['', '', '', '', '', '']);

    try {
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
        setResendCooldown(60);
      } else {
        setError(data.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header />
      
      {/* Breadcrumb */}
      <div className="container" style={{ padding: '1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
        <a href="/" style={{ color: '#0f766e', textDecoration: 'none' }}>Trang chủ</a>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <a href="/login" style={{ color: '#0f766e', textDecoration: 'none' }}>Đăng nhập</a>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span>Quên mật khẩu</span>
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
            marginBottom: '0.5rem',
            color: '#1f2937'
          }}>
            Đặt lại mật khẩu
          </h1>
          
          {/* Progress Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            position: 'relative'
          }}>
            <div style={{
              flex: 1,
              textAlign: 'center',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step >= 1 ? '#0f766e' : '#d1d5db',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem',
                fontWeight: 'bold'
              }}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div style={{ fontSize: '0.75rem', color: step >= 1 ? '#0f766e' : '#9ca3af' }}>
                Nhập email
              </div>
            </div>
            <div style={{
              flex: 1,
              textAlign: 'center',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step >= 2 ? '#0f766e' : '#d1d5db',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem',
                fontWeight: 'bold'
              }}>
                {step > 2 ? '✓' : '2'}
              </div>
              <div style={{ fontSize: '0.75rem', color: step >= 2 ? '#0f766e' : '#9ca3af' }}>
                Nhập OTP
              </div>
            </div>
            <div style={{
              flex: 1,
              textAlign: 'center',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step >= 3 ? '#0f766e' : '#d1d5db',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem',
                fontWeight: 'bold'
              }}>
                3
              </div>
              <div style={{ fontSize: '0.75rem', color: step >= 3 ? '#0f766e' : '#9ca3af' }}>
                Mật khẩu mới
              </div>
            </div>
            {/* Progress line */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              height: '2px',
              background: '#e5e7eb',
              zIndex: 1
            }}>
              <div style={{
                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
                height: '100%',
                background: '#0f766e',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#d1fae5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {success}
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleRequestReset}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Email của bạn
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

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
                  marginBottom: '1rem'
                }}
                onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = '#0d9488')}
                onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = '#0f766e')}
              >
                {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'center'
                }}>
                  Nhập mã OTP 6 số đã được gửi đến email của bạn
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center'
                }}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      style={{
                        width: '50px',
                        height: '60px',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#9ca3af' : '#0f766e',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    textDecoration: 'underline'
                  }}
                >
                  {resendCooldown > 0 
                    ? `Gửi lại mã sau ${resendCooldown}s` 
                    : 'Gửi lại mã OTP'}
                </button>
              </div>

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
                  marginBottom: '1rem'
                }}
                onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = '#0d9488')}
                onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = '#0f766e')}
              >
                {isLoading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Mật khẩu mới
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    paddingRight: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '2rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    paddingRight: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '2rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

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
                  marginBottom: '1rem'
                }}
                onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = '#0d9488')}
                onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = '#0f766e')}
              >
                {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <a 
              href="/login" 
              style={{
                color: '#0f766e',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              ← Quay lại đăng nhập
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;

