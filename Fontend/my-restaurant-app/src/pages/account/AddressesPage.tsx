import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AccountLayout from '../../components/account/AccountLayout';

interface Address {
  _id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  isDefault: boolean;
}

const API_BASE_URL = 'http://localhost:5002/api';

const AddressesPage: React.FC = () => {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    recipientName: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    isDefault: false,
  });

  // Fetch addresses from API
  const fetchAddresses = useCallback(async () => {
    if (!token) {
      console.log('No token available for fetching addresses');
      return;
    }
    
    console.log('Fetching addresses...');
    
    try {
      setLoading(true);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/customers/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Fetch addresses response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Full API response:', result);
        const customer = result.data?.customer || result.customer || result;
        console.log('Customer data:', customer);
        console.log('Addresses:', customer.addresses);
        console.log('Addresses length:', customer.addresses ? customer.addresses.length : 'undefined');
        console.log('Setting addresses to state:', customer.addresses || []);
        setAddresses(customer.addresses || []);
      } else {
        console.error('Failed to fetch addresses, status:', response.status);
        const errorData = await response.json();
        console.error('Error data:', errorData);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout or aborted');
      } else {
        console.error('Error fetching addresses:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      console.error('No token available');
      return;
    }
    
    console.log('Submitting form data:', formData);
    
    try {
      setLoading(true);
      
      if (editingAddress) {
        // Update existing address
        console.log('Updating address:', editingAddress._id);
        const response = await fetch(`${API_BASE_URL}/customers/addresses/${editingAddress._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        console.log('Update response status:', response.status);
        
        if (response.ok) {
          console.log('Address updated successfully');
          await fetchAddresses(); // Refresh addresses
        } else {
          const error = await response.json();
          console.error('Update error:', error);
          alert(`Lỗi cập nhật địa chỉ: ${error.message}`);
        }
      } else {
        // Add new address
        console.log('Adding new address');
        const response = await fetch(`${API_BASE_URL}/customers/addresses`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        console.log('Add response status:', response.status);
        
        if (response.ok) {
          console.log('Address added successfully');
          await fetchAddresses(); // Refresh addresses
        } else {
          const error = await response.json();
          console.error('Add error:', error);
          alert(`Lỗi thêm địa chỉ: ${error.message}`);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Có lỗi xảy ra khi lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      recipientName: '',
      phone: '',
      address: '',
      district: '',
      city: '',
      isDefault: false
    });
    setShowAddForm(false);
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      address: address.address,
      district: address.district,
      city: address.city,
      isDefault: address.isDefault
    });
    setShowAddForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!token) return;
    
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/customers/addresses/${addressId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          await fetchAddresses(); // Refresh addresses
        } else {
          const error = await response.json();
          alert(`Lỗi xóa địa chỉ: ${error.message}`);
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Có lỗi xảy ra khi xóa địa chỉ');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await fetchAddresses(); // Refresh addresses
      } else {
        const error = await response.json();
        alert(`Lỗi đặt địa chỉ mặc định: ${error.message}`);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Có lỗi xảy ra khi đặt địa chỉ mặc định');
    } finally {
      setLoading(false);
    }
  };

  if (loading && addresses.length === 0) {
    return (
      <AccountLayout activeTab="addresses">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout activeTab="addresses">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📍 Sổ địa chỉ</h1>
                <p className="text-gray-600">Quản lý địa chỉ giao hàng của bạn một cách dễ dàng</p>
              </div>
            </div>
          </div>

          {/* Address List */}
          <div className="space-y-6">
            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">📍 Chưa có địa chỉ nào</h3>
                <p className="text-gray-600 mb-8 text-lg">Thêm địa chỉ đầu tiên để bắt đầu đặt hàng dễ dàng hơn</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="group relative bg-white border-2 border-blue-500 text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span>Thêm địa chỉ đầu tiên</span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {addresses.map((address, index) => (
                  <div
                    key={address._id}
                    className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${
                      address.isDefault 
                        ? 'border-green-400 bg-gradient-to-br from-green-50 via-white to-emerald-50' 
                        : 'border-gray-200 hover:border-blue-400 bg-gradient-to-br from-white to-gray-50'
                    }`}
                  >
                    {/* Corner decoration for default address */}
                    {address.isDefault && (
                      <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18l-5.708-5.708a1 1 0 01-.292-.707V9a1 1 0 01.293-.707L10 2.586l5.707 5.707A1 1 0 0116 9v2.585a1 1 0 01-.293.707L10 18z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="p-8">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm ${
                              address.isDefault 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300' 
                                : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-300'
                            }`}>
                              <span className="mr-2">🏷️</span>
                              {address.label}
                            </div>
                            {address.isDefault && (
                              <div className="flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border border-orange-300 font-bold text-xs">
                                <span className="mr-1">⭐</span>
                                Địa chỉ mặc định
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-lg">
                              #{index + 1}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold">👤</span>
                              </div>
                              <h3 className="font-bold text-xl text-gray-900">{address.recipientName}</h3>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-bold">📱</span>
                              </div>
                              <p className="text-gray-700 text-lg font-medium">{address.phone}</p>
                            </div>
                            
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-1">
                                <span className="text-red-600 font-bold">📍</span>
                              </div>
                              <p className="text-gray-700 text-lg leading-relaxed">
                                {address.address}, {address.district}, {address.city}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 ml-8">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefault(address._id)}
                              disabled={loading}
                              className="group relative bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-6 py-3 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50 shadow-lg transform hover:scale-105 min-w-[140px]"
                            >
                              <div className="flex items-center gap-2">
                                <span>⭐</span>
                                <span>Đặt mặc định</span>
                              </div>
                              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            </button>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(address)}
                              disabled={loading}
                              className="group relative bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg transform hover:scale-105"
                              title="Chỉnh sửa địa chỉ"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleDelete(address._id)}
                              disabled={loading}
                              className="group relative bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg transform hover:scale-105"
                              title="Xóa địa chỉ"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom border decoration */}
                    <div className={`h-2 rounded-b-2xl ${
                      address.isDefault 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                        : 'bg-gradient-to-r from-gray-300 to-gray-400'
                    }`}></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Address Button at bottom */}
          {addresses.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowAddForm(true)}
                disabled={loading}
                className="group relative bg-white border-2 border-blue-500 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm font-medium"
              >
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span>Thêm địa chỉ mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAddress ? '✏️ Cập nhật địa chỉ' : '🆕 Thêm địa chỉ mới'}
                </h2>
                <button
                  onClick={resetForm}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Address Label */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Loại địa chỉ *
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, label: 'Nhà'})}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                          formData.label === 'Nhà' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        🏠 Nhà
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, label: 'Văn phòng'})}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                          formData.label === 'Văn phòng' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        🏢 Văn phòng
                      </button>
                    </div>
                  </div>

                  {/* Location Selects */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Tỉnh/Thành phố *
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        required
                      >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Quận/Huyện *
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        required
                      >
                        <option value="">Chọn Quận/Huyện</option>
                        <option value="Quận 1">Quận 1</option>
                        <option value="Quận 2">Quận 2</option>
                        <option value="Quận 3">Quận 3</option>
                        <option value="Quận 7">Quận 7</option>
                        <option value="Quận 9">Quận 9</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Phường/Xã
                      </label>
                      <select
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="">Chọn Phường/Xã</option>
                      </select>
                    </div>
                  </div>

                  {/* Address Detail */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Địa chỉ nhà *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Nhập địa chỉ nhà"
                      required
                    />
                  </div>

                  {/* Recipient Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Đặt tên gọi nhớ *
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Đặt tên gọi nhớ"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>

                  {/* Default Address Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Đặt làm địa chỉ mặc định</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {loading ? '⏳ Đang lưu...' : 'Thêm địa chỉ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default AddressesPage;
