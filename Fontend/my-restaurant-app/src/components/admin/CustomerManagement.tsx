import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/api';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  loyaltyPoints?: number;
  membershipLevel?: string;
  totalOrders?: number;
  totalSpent?: number;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

interface PromotionCode {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrder?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  description?: string;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Promotion code form state
  const [promoCode, setPromoCode] = useState<PromotionCode>({
    code: '',
    discount: 10,
    discountType: 'percentage',
    minOrder: 0,
    maxDiscount: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: ''
  });
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data?.customers || []);
      } else {
        setError('Không thể tải danh sách khách hàng');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Generate promotion code
  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPromoCode(prev => ({ ...prev, code }));
  };

  // Send email to customer
  const handleSendEmail = async () => {
    if (!selectedCustomer || !emailSubject || !emailBody) {
      alert('Vui lòng điền đầy đủ thông tin email');
      return;
    }

    try {
      setSendingEmail(true);
      const token = localStorage.getItem('employeeToken');
      
      // Call backend API to send email
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/${selectedCustomer._id}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: selectedCustomer.email,
          subject: emailSubject,
          body: emailBody,
          customerName: selectedCustomer.name
        })
      });

      if (response.ok) {
        alert('Email đã được gửi thành công!');
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
        setSelectedCustomer(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Lỗi khi gửi email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Lỗi khi gửi email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Create promotion code for customer
  const handleCreatePromoCode = async () => {
    if (!selectedCustomer || !promoCode.code) {
      alert('Vui lòng tạo mã khuyến mãi trước');
      return;
    }

    try {
      setCreatingPromo(true);
      const token = localStorage.getItem('employeeToken');
      
      // Call backend API to create promotion code
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/${selectedCustomer._id}/promotion-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...promoCode,
          customerId: selectedCustomer._id,
          customerEmail: selectedCustomer.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Mã khuyến mãi ${promoCode.code} đã được tạo thành công!`);
        
        // Optionally send email with promotion code
        if (data.data?.sendEmail) {
          alert('Email chứa mã khuyến mãi đã được gửi đến khách hàng!');
        }
        
        setShowPromoModal(false);
        setPromoCode({
          code: '',
          discount: 10,
          discountType: 'percentage',
          minOrder: 0,
          maxDiscount: 0,
          validFrom: new Date().toISOString().split('T')[0],
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: ''
        });
        setSelectedCustomer(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Lỗi khi tạo mã khuyến mãi');
      }
    } catch (err) {
      console.error('Error creating promotion code:', err);
      alert('Lỗi khi tạo mã khuyến mãi');
    } finally {
      setCreatingPromo(false);
    }
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <p>Đang tải danh sách khách hàng...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            👤 Quản lý khách hàng
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Tổng số khách hàng: {customers.length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên, email, số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Customers Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 200px 150px 120px 120px 120px 150px 200px',
          gap: '12px',
          padding: '16px 20px',
          background: '#f8fafc',
          fontWeight: '600',
          fontSize: '14px',
          color: '#374151',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <span>Tên khách hàng</span>
          <span>Email</span>
          <span>Số điện thoại</span>
          <span>Điểm tích lũy</span>
          <span>Hạng thành viên</span>
          <span>Tổng đơn</span>
          <span>Tổng chi tiêu</span>
          <span>Hành động</span>
        </div>

        {/* Table Rows */}
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            {searchTerm ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div
              key={customer._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 200px 150px 120px 120px 120px 150px 200px',
                gap: '12px',
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6',
                alignItems: 'center',
                fontSize: '14px'
              }}
            >
              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                {customer.name}
              </span>
              <span style={{ color: '#4b5563' }}>{customer.email}</span>
              <span style={{ color: '#4b5563' }}>{customer.phone || 'N/A'}</span>
              <span style={{ color: '#059669', fontWeight: '600' }}>
                {customer.loyaltyPoints || 0}
              </span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: customer.membershipLevel === 'gold' ? '#fef3c7' :
                           customer.membershipLevel === 'silver' ? '#e5e7eb' : '#f3f4f6',
                color: customer.membershipLevel === 'gold' ? '#92400e' :
                       customer.membershipLevel === 'silver' ? '#374151' : '#6b7280',
                textAlign: 'center'
              }}>
                {customer.membershipLevel === 'gold' ? '🥇 Vàng' :
                 customer.membershipLevel === 'silver' ? '🥈 Bạc' : '🥉 Đồng'}
              </span>
              <span style={{ textAlign: 'center', color: '#4b5563' }}>
                {customer.totalOrders || 0}
              </span>
              <span style={{ color: '#059669', fontWeight: '600' }}>
                {formatCurrency(customer.totalSpent || 0)}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowEmailModal(true);
                  }}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  title="Gửi email"
                >
                  📧 Email
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    generatePromoCode();
                    setShowPromoModal(true);
                  }}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  title="Tạo mã khuyến mãi"
                >
                  🎁 Mã KM
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Email Modal */}
      {showEmailModal && selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              📧 Gửi email cho {selectedCustomer.name}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Đến:
              </label>
              <input
                type="email"
                value={selectedCustomer.email}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#f9fafb'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Tiêu đề *
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="VD: Thông báo khuyến mãi đặc biệt"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Nội dung *
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Nhập nội dung email..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailSubject('');
                  setEmailBody('');
                  setSelectedCustomer(null);
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailSubject || !emailBody || sendingEmail}
                style={{
                  background: (!emailSubject || !emailBody || sendingEmail) ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!emailSubject || !emailBody || sendingEmail) ? 'not-allowed' : 'pointer'
                }}
              >
                {sendingEmail ? '⏳ Đang gửi...' : '📧 Gửi email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Promotion Code Modal */}
      {showPromoModal && selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              🎁 Tạo mã khuyến mãi cho {selectedCustomer.name}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Mã khuyến mãi *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={promoCode.code}
                  onChange={(e) => setPromoCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="VD: PROMO2024"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    letterSpacing: '2px'
                  }}
                />
                <button
                  onClick={generatePromoCode}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🎲 Tạo ngẫu nhiên
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Loại giảm giá *
                </label>
                <select
                  value={promoCode.discountType}
                  onChange={(e) => setPromoCode(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (VNĐ)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Giá trị giảm *
                </label>
                <input
                  type="number"
                  value={promoCode.discount}
                  onChange={(e) => setPromoCode(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max={promoCode.discountType === 'percentage' ? 100 : undefined}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Đơn tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  value={promoCode.minOrder}
                  onChange={(e) => setPromoCode(prev => ({ ...prev, minOrder: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {promoCode.discountType === 'percentage' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={promoCode.maxDiscount}
                    onChange={(e) => setPromoCode(prev => ({ ...prev, maxDiscount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={promoCode.validFrom}
                  onChange={(e) => setPromoCode(prev => ({ ...prev, validFrom: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={promoCode.validTo}
                  onChange={(e) => setPromoCode(prev => ({ ...prev, validTo: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Mô tả
              </label>
              <textarea
                value={promoCode.description}
                onChange={(e) => setPromoCode(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về mã khuyến mãi..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPromoModal(false);
                  setPromoCode({
                    code: '',
                    discount: 10,
                    discountType: 'percentage',
                    minOrder: 0,
                    maxDiscount: 0,
                    validFrom: new Date().toISOString().split('T')[0],
                    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    description: ''
                  });
                  setSelectedCustomer(null);
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePromoCode}
                disabled={!promoCode.code || creatingPromo}
                style={{
                  background: (!promoCode.code || creatingPromo) ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!promoCode.code || creatingPromo) ? 'not-allowed' : 'pointer'
                }}
              >
                {creatingPromo ? '⏳ Đang tạo...' : '🎁 Tạo mã khuyến mãi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;

