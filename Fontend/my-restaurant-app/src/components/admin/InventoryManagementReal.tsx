import React, { useState, useEffect } from 'react';

interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  note?: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Load data from real API
  useEffect(() => {
    setLoading(true);
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      const res = await fetch('http://localhost:5004/api/inventory');
      const data = await res.json();
      
      // API returns array directly
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error('Unexpected API response format:', data);
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      // Fallback to empty array on error
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'in-stock':
        return { 
          bg: '#d1fae5', 
          color: '#059669', 
          label: 'Còn hàng', 
          icon: '✅' 
        };
      case 'low-stock':
        return { 
          bg: '#fef3c7', 
          color: '#d97706', 
          label: 'Sắp hết', 
          icon: '⚠️' 
        };
      case 'out-of-stock':
        return { 
          bg: '#fee2e2', 
          color: '#dc2626', 
          label: 'Hết hàng', 
          icon: '❌' 
        };
      default:
        return { 
          bg: '#f3f4f6', 
          color: '#6b7280', 
          label: status, 
          icon: '❓' 
        };
    }
  };

  const getItemIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tôm') || lowerName.includes('cua') || lowerName.includes('cá')) return '🦐';
    if (lowerName.includes('rau') || lowerName.includes('củ')) return '🥬';
    if (lowerName.includes('gia vị') || lowerName.includes('nước mắm')) return '🧂';
    if (lowerName.includes('thịt')) return '🥩';
    if (lowerName.includes('đồ uống') || lowerName.includes('nước')) return '🥤';
    return '📦';
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const lowStockCount = items.filter(item => item.status === 'low-stock').length;
  const outOfStockCount = items.filter(item => item.status === 'out-of-stock').length;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Stats */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            📦 Quản lý nguyên liệu
          </h2>
          <button
            onClick={() => alert('Chức năng thêm nguyên liệu đang phát triển')}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Thêm nguyên liệu
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{items.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Tổng mặt hàng</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{lowStockCount}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Sắp hết hàng</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{outOfStockCount}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Hết hàng</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm nguyên liệu hoặc nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '150px'
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="in-stock">✅ Còn hàng</option>
          <option value="low-stock">⚠️ Sắp hết</option>
          <option value="out-of-stock">❌ Hết hàng</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p>Đang tải dữ liệu nguyên liệu...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Chưa có nguyên liệu nào</h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Hãy kiểm tra kết nối API hoặc thêm dữ liệu vào hệ thống
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 2fr 100px 1fr 1.5fr 120px 120px',
              gap: '16px',
              padding: '16px 20px',
              background: '#f8fafc',
              fontWeight: '600',
              fontSize: '14px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <span></span>
              <span>Tên nguyên liệu</span>
              <span>Số lượng</span>
              <span>Đơn vị</span>
              <span>Nhà cung cấp</span>
              <span>Trạng thái</span>
              <span>Hành động</span>
            </div>

            {/* Table Body */}
            {filteredItems.map(item => {
              const statusInfo = getStatusInfo(item.status);
              return (
                <div key={item._id} style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 2fr 100px 1fr 1.5fr 120px 120px',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center',
                  fontSize: '14px'
                }}>
                  <span style={{ fontSize: '24px', textAlign: 'center' }}>
                    {getItemIcon(item.name)}
                  </span>
                  
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {item.name}
                    </div>
                    {item.note && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {item.note}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    fontWeight: '600', 
                    textAlign: 'center',
                    color: item.quantity === 0 ? '#dc2626' : '#059669'
                  }}>
                    {item.quantity}
                  </div>
                  
                  <span style={{ color: '#6b7280' }}>{item.unit}</span>
                  
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {item.supplier || 'Chưa có thông tin'}
                  </div>
                  
                  <span style={{
                    background: statusInfo.bg,
                    color: statusInfo.color,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </span>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => alert(`Chỉnh sửa ${item.name}`)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => alert(`Nhập hàng cho ${item.name}`)}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Nhập hàng"
                    >
                      📦
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Alert for critical items */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          color: '#92400e'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>
            ⚠️ Cảnh báo tồn kho
          </div>
          <div style={{ fontSize: '14px' }}>
            {outOfStockCount > 0 && `Có ${outOfStockCount} mặt hàng hết hàng`}
            {outOfStockCount > 0 && lowStockCount > 0 && ' và '}
            {lowStockCount > 0 && `${lowStockCount} mặt hàng sắp hết`}. 
            Vui lòng bổ sung kịp thời để không ảnh hưởng đến hoạt động nhà hàng.
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
