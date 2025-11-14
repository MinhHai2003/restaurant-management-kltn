import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AccountLayout from '../../components/account/AccountLayout';
import { API_CONFIG } from '../../config/api';

interface CustomerProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  loyaltyPoints: number;
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  preferences?: {
    dietaryRestrictions?: string[];
    spiceLevel?: 'mild' | 'medium' | 'hot' | 'very_hot';
  };
  allowNotifications: boolean;
  allowPromotions: boolean;
}

interface FormData {
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  allowNotifications: boolean;
  allowPromotions: boolean;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    allowNotifications: true,
    allowPromotions: true
  });

  // Load customer profile on mount
  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const apiUrl = `${API_CONFIG.CUSTOMER_API}/customers/profile`;
      console.log('🔍 [PROFILE] Fetching from:', apiUrl);
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const result = await response.json();
      if (result.success) {
        const customerData = result.data.customer;
        setCustomer(customerData);
        
        // Update form data
        setFormData({
          name: customerData.name || '',
          phone: customerData.phone || '',
          dateOfBirth: customerData.dateOfBirth ? customerData.dateOfBirth.split('T')[0] : '',
          gender: customerData.gender || '',
          allowNotifications: customerData.allowNotifications ?? true,
          allowPromotions: customerData.allowPromotions ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Validate phone number - only 10 digits
    if (name === 'phone') {
      const phoneRegex = /^[0-9]{0,10}$/;
      if (!phoneRegex.test(value)) {
        return; // Don't update if invalid
      }
    }
    
    // Validate name - only Vietnamese letters and spaces
    if (name === 'name') {
      const nameRegex = /^[a-zA-ZÀ-ỹ\s]{0,100}$/;
      if (!nameRegex.test(value)) {
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    // Validate name
    if (formData.name.trim().length < 2) {
      alert('Họ và tên phải có ít nhất 2 ký tự!');
      return;
    }
    
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(formData.name.trim())) {
      alert('Họ và tên chỉ được chứa chữ cái và khoảng trắng!');
      return;
    }
    
    // Validate phone - must be exactly 10 digits starting with 0
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        alert('Số điện thoại không hợp lệ! Phải bắt đầu bằng số 0 và có đúng 10 chữ số (VD: 0912345678).');
        return;
      }
    }
    
    // Validate date of birth - must be before today and age 13-120
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      
      // Check if date is in the future
      if (birthDate >= today) {
        alert('Ngày sinh phải trước ngày hôm nay!');
        return;
      }
      
      // Check age range
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (actualAge < 13 || actualAge > 120) {
        alert('Ngày sinh không hợp lệ! Tuổi phải từ 13 đến 120.');
        return;
      }
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const apiUrl = `${API_CONFIG.CUSTOMER_API}/customers/profile`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      if (result.success) {
        setCustomer(result.data.customer);
        setIsEditing(false);
        alert('Cập nhật thông tin thành công!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      default: return '#cd7f32';
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

  if (loading) {
    return (
      <AccountLayout activeTab="profile">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '1rem',
          color: '#6b7280'
        }}>
          Đang tải thông tin...
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout activeTab="profile">
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
            Thông tin tài khoản
          </h2>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={saving}
            style={{
              padding: '0.5rem 1rem',
              background: isEditing ? '#ef4444' : '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Đang lưu...' : isEditing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem'
        }}>
          {/* Personal Information */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1.5rem'
            }}>
              Thông tin cá nhân
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nhập họ và tên (chỉ chữ cái)"
                      required
                      minLength={2}
                      maxLength={100}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: '#111827',
                        fontWeight: '500'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Chỉ được nhập chữ cái và khoảng trắng (2-100 ký tự)
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.375rem',
                    color: '#1f2937',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {customer?.name || 'Chưa cập nhật'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f3f4f6',
                  borderRadius: '0.375rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  border: '1px solid #e5e7eb'
                }}>
                  {customer?.email || user?.email}
                  <span style={{
                    fontSize: '0.75rem',
                    marginLeft: '0.5rem',
                    color: '#9ca3af'
                  }}>
                    (không thể thay đổi)
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Số điện thoại
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại (VD: 0912345678)"
                      pattern="^0[0-9]{9}$"
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: '#111827',
                        fontWeight: '500'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Bắt đầu bằng số 0, có đúng 10 chữ số
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.375rem',
                    color: '#1f2937',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {customer?.phone || 'Chưa cập nhật'}
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ngày sinh
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: '#111827',
                        fontWeight: '500'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Phải từ 13 tuổi trở lên và trước ngày hôm nay
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.375rem',
                    color: '#1f2937',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {formData.dateOfBirth || 'Chưa cập nhật'}
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Giới tính
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.375rem',
                    color: '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    {formData.gender === 'male' ? 'Nam' : 
                     formData.gender === 'female' ? 'Nữ' : 
                     formData.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Notification Preferences */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#374151',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <input
                      type="checkbox"
                      name="allowNotifications"
                      checked={formData.allowNotifications}
                      onChange={handleInputChange}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Nhận thông báo về đơn hàng
                  </label>
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#374151',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <input
                      type="checkbox"
                      name="allowPromotions"
                      checked={formData.allowPromotions}
                      onChange={handleInputChange}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Nhận thông báo khuyến mãi
                  </label>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 2rem',
                    background: saving ? '#9ca3af' : '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>

          {/* Account Statistics */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1.5rem'
            }}>
              Thống kê tài khoản
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Membership Level */}
              <div style={{
                padding: '1.5rem',
                background: `linear-gradient(135deg, ${getMembershipColor(customer?.membershipLevel || 'bronze')} 0%, ${getMembershipColor(customer?.membershipLevel || 'bronze')}aa 100%)`,
                borderRadius: '0.75rem',
                color: 'white'
              }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                  Hạng thành viên
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {getMembershipLabel(customer?.membershipLevel || 'bronze')}
                </div>
              </div>

              {/* Loyalty Points */}
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderRadius: '0.75rem',
                color: 'white'
              }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                  Điểm tích lũy
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {customer?.loyaltyPoints || 0} điểm
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  Hoạt động gần đây
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng đơn hàng</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{customer?.totalOrders || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lần đặt bàn gần nhất</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      {customer?.lastOrderDate 
                        ? new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')
                        : 'Chưa có'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng chi tiêu</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      {formatCurrency(customer?.totalSpent || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};

export default ProfilePage;
