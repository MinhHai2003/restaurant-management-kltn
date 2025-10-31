import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AccountLayout from '../../components/account/AccountLayout';

interface Address {
  _id: string;
  label: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

interface FormData {
  label: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

const AddressesPage: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<FormData>({
    label: 'Nhà',
    address: '',
    district: '',
    city: '',
    phone: '',
    isDefault: false
  });

  // Fetch addresses from API
  const fetchAddresses = useCallback(async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${(import.meta as any).env?.VITE_CUSTOMER_API || 'http://localhost:5002/api'}/customers/addresses`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Addresses response:', result);
      
      if (result.success && result.data && result.data.addresses) {
        setAddresses(result.data.addresses);
      } else {
        console.error('Invalid response format:', result);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = `${(import.meta as any).env?.VITE_CUSTOMER_API || 'http://localhost:5002/api'}/customers/addresses`;
      const url = editingAddress 
        ? `${baseUrl}/${editingAddress._id}`
        : baseUrl;
      
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchAddresses();
        resetForm();
        alert(editingAddress ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!');
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra khi lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit address
  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      district: address.district,
      city: address.city,
      phone: address.phone,
      isDefault: address.isDefault
    });
    setShowForm(true);
  };

  // Handle delete address
  const handleDelete = async (addressId: string) => {
    if (!user?._id || !confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${(import.meta as any).env?.VITE_CUSTOMER_API || 'http://localhost:5002/api'}/customers/addresses/${addressId}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchAddresses();
        alert('Xóa địa chỉ thành công!');
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Có lỗi xảy ra khi xóa địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  // Handle set default address  
  const handleSetDefault = async (addressId: string) => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${(import.meta as any).env?.VITE_CUSTOMER_API || 'http://localhost:5002/api'}/customers/addresses/${addressId}/default`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchAddresses();
        alert('Đặt địa chỉ mặc định thành công!');
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Set default error:', error);
      alert('Có lỗi xảy ra khi đặt địa chỉ mặc định');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      label: 'Nhà',
      address: '',
      district: '',
      city: '',
      phone: '',
      isDefault: false
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  return (
    <AccountLayout activeTab="addresses">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {showForm ? (
          <>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '32px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div>
                <h1 style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Cập nhật địa chỉ'}
                </h1>
              </div>
              <button
                onClick={resetForm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  color: '#6b7280',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f9fafb';
                }}
              >
                ← Quay lại
              </button>
            </div>

            {/* Form Content */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Address Type Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                      Loại địa chỉ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, label: 'Nhà'})}
                        style={{
                          padding: '16px',
                          border: formData.label === 'Nhà' ? '2px solid #ea580c' : '1px solid #d1d5db',
                          borderRadius: '8px',
                          textAlign: 'left',
                          backgroundColor: formData.label === 'Nhà' ? '#fff7ed' : 'white',
                          color: formData.label === 'Nhà' ? '#c2410c' : '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (formData.label !== 'Nhà') {
                            (e.target as HTMLButtonElement).style.borderColor = '#9ca3af';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (formData.label !== 'Nhà') {
                            (e.target as HTMLButtonElement).style.borderColor = '#d1d5db';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>🏠</span>
                          <div>
                            <div style={{ fontWeight: '500' }}>Nhà riêng</div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>Địa chỉ nhà ở</div>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, label: 'Văn phòng'})}
                        style={{
                          padding: '16px',
                          border: formData.label === 'Văn phòng' ? '2px solid #ea580c' : '1px solid #d1d5db',
                          borderRadius: '8px',
                          textAlign: 'left',
                          backgroundColor: formData.label === 'Văn phòng' ? '#fff7ed' : 'white',
                          color: formData.label === 'Văn phòng' ? '#c2410c' : '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (formData.label !== 'Văn phòng') {
                            (e.target as HTMLButtonElement).style.borderColor = '#9ca3af';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (formData.label !== 'Văn phòng') {
                            (e.target as HTMLButtonElement).style.borderColor = '#d1d5db';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>🏢</span>
                          <div>
                            <div style={{ fontWeight: '500' }}>Văn phòng</div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>Địa chỉ công ty</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#ea580c';
                        (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#d1d5db';
                        (e.target as HTMLInputElement).style.boxShadow = 'none';
                      }}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>

                  {/* Location Selection */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Tỉnh/Thành phố <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: 'white',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLSelectElement).style.borderColor = '#ea580c';
                          (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLSelectElement).style.borderColor = '#d1d5db';
                          (e.target as HTMLSelectElement).style.boxShadow = 'none';
                        }}
                        required
                      >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Nha Trang">Nha Trang</option>
                        <option value="Hạ Long">Hạ Long</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Quận/Huyện <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: 'white',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLSelectElement).style.borderColor = '#ea580c';
                          (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLSelectElement).style.borderColor = '#d1d5db';
                          (e.target as HTMLSelectElement).style.boxShadow = 'none';
                        }}
                        required
                      >
                        <option value="">Chọn Quận/Huyện</option>
                        <option value="Quận 1">Quận 1</option>
                        <option value="Quận 2">Quận 2</option>
                        <option value="Quận 3">Quận 3</option>
                        <option value="Quận 4">Quận 4</option>
                        <option value="Quận 5">Quận 5</option>
                        <option value="Quận 6">Quận 6</option>
                        <option value="Quận 7">Quận 7</option>
                        <option value="Quận 8">Quận 8</option>
                        <option value="Quận 9">Quận 9</option>
                        <option value="Quận 10">Quận 10</option>
                        <option value="Quận 11">Quận 11</option>
                        <option value="Quận 12">Quận 12</option>
                        <option value="Thủ Đức">Thủ Đức</option>
                        <option value="Bình Thạnh">Bình Thạnh</option>
                        <option value="Tân Bình">Tân Bình</option>
                        <option value="Tân Phú">Tân Phú</option>
                        <option value="Phú Nhuận">Phú Nhuận</option>
                        <option value="Gò Vấp">Gò Vấp</option>
                        <option value="Bình Tân">Bình Tân</option>
                      </select>
                    </div>
                  </div>

                  {/* Detailed Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Địa chỉ cụ thể <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#ea580c';
                        (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#d1d5db';
                        (e.target as HTMLInputElement).style.boxShadow = 'none';
                      }}
                      placeholder="Ví dụ: Số 123 Đường ABC, Phường XYZ"
                      required
                    />
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                      Hãy cung cấp thông tin chi tiết để shipper dễ dàng tìm thấy bạn
                    </p>
                  </div>

                  {/* Default Address Setting */}
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                    <input
                      type="checkbox"
                      name="isDefault"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      style={{ width: '16px', height: '16px', accentColor: '#ea580c', borderRadius: '4px' }}
                    />
                    <label htmlFor="isDefault" style={{ marginLeft: '12px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Đặt làm địa chỉ giao hàng mặc định
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div style={{ display: 'flex', gap: '16px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        color: '#374151',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        backgroundColor: '#ea580c',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#c2410c';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#ea580c';
                        }
                      }}
                    >
                      {loading ? 'Đang lưu...' : (editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '32px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div>
                <h1 style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  Sổ địa chỉ
                </h1>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Quản lý địa chỉ giao hàng
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: '#ea580c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#c2410c';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#ea580c';
                }}
              >
                + Thêm địa chỉ mới
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px',
                fontSize: '16px',
                color: '#6b7280'
              }}>                
                Đang tải...
              </div>
            ) : addresses.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '300px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #d1d5db'
              }}>                
                <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>Chưa có địa chỉ nào</h3>                 
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>Thêm địa chỉ đầu tiên để bắt đầu đặt hàng</p>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ea580c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  + Thêm địa chỉ mới
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {addresses.map((address) => (
                  <div 
                    key={address._id} 
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '2px solid #f3f4f6',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#ea580c';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#f3f4f6';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        {/* Header với labels */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: address.label === 'Nhà' ? '#eff6ff' : '#faf5ff',
                            color: address.label === 'Nhà' ? '#1e40af' : '#7c3aed',
                            border: `1px solid ${address.label === 'Nhà' ? '#bfdbfe' : '#e9d5ff'}`
                          }}>
                            <span style={{ fontSize: '16px' }}>
                              {address.label === 'Nhà' ? '🏠' : '🏢'}
                            </span>
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              border: '1px solid #bbf7d0'
                            }}>
                              ✓ Mặc định
                            </span>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>📞</span>
                            <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{address.phone}</span>
                          </div>
                        </div>

                        {/* Address */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>📍</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                                {address.address}
                              </p>
                              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                                {address.district}, {address.city}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address._id)}
                            disabled={loading}
                            style={{
                              color: '#ea580c',
                              fontSize: '14px',
                              fontWeight: '500',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #fed7aa',
                              backgroundColor: 'white',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.5 : 1,
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              if (!loading) {
                                (e.target as HTMLButtonElement).style.backgroundColor = '#fff7ed';
                                (e.target as HTMLButtonElement).style.color = '#c2410c';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!loading) {
                                (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                                (e.target as HTMLButtonElement).style.color = '#ea580c';
                              }
                            }}
                          >
                            Đặt mặc định
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(address)}
                          disabled={loading}
                          style={{
                            color: '#2563eb',
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe',
                            backgroundColor: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = '#eff6ff';
                              (e.target as HTMLButtonElement).style.color = '#1d4ed8';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                              (e.target as HTMLButtonElement).style.color = '#2563eb';
                            }
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(address._id)}
                          disabled={loading}
                          style={{
                            color: '#dc2626',
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            backgroundColor: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = '#fef2f2';
                              (e.target as HTMLButtonElement).style.color = '#b91c1c';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                              (e.target as HTMLButtonElement).style.color = '#dc2626';
                            }
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
};

export default AddressesPage;
