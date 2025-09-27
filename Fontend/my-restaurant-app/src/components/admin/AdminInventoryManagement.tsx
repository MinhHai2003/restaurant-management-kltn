import React, { useState, useEffect } from 'react';
import AdminInventoryService, { 
  type InventoryItem, 
  type InventoryStats, 
  type PaginatedInventoryResponse,
  type InventoryReport
} from '../../services/adminInventoryService';
import { InventoryModal, type InventoryFormData } from './InventoryModal';
import AdminAuthHelper from '../../utils/AdminAuthHelper';

// Modal cho cập nhật số lượng
const QuantityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (operation: string, quantity: number, note: string) => void;
  item?: InventoryItem;
}> = ({ isOpen, onClose, onSave, item }) => {
  const [operation, setOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(operation, quantity, note);
    setQuantity(0);
    setNote('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
          🔄 Cập nhật số lượng: {item.name}
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
          Số lượng hiện tại: <strong>{item.quantity} {item.unit}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Thao tác
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as 'add' | 'subtract' | 'set')}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="add">➕ Nhập hàng (cộng thêm)</option>
              <option value="subtract">➖ Xuất hàng (trừ bớt)</option>
              <option value="set">🔄 Đặt số lượng cụ thể</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Số lượng ({item.unit})
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              min="0"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú về thao tác này..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminInventoryManagement: React.FC = () => {
  // States chính
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    lastUpdated: ''
  });
  
  const [inventoryData, setInventoryData] = useState<PaginatedInventoryResponse>({
    items: [],
    pagination: {
      current: 1,
      total: 1,
      count: 0,
      totalItems: 0
    },
    filter: {}
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
  
  // Report state
  const [reportData, setReportData] = useState<InventoryReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Load initial data
  useEffect(() => {
    // Tự động thiết lập token admin cho development
    if (process.env.NODE_ENV === 'development') {
      AdminAuthHelper.setDemoAdminToken();
    }
    
    AdminInventoryService.requireAuth(); // Kiểm tra quyền admin
    const initData = async () => {
      setLoading(true);
      try {
        const params = {
          page: 1,
          limit: 20,
          sortBy: 'updated_at',
          sortOrder: 'desc' as const
        };

        const [statsResult, inventoryResult] = await Promise.all([
          AdminInventoryService.getInventoryStats(),
          AdminInventoryService.getInventories(params)
        ]);
        
        setStats(statsResult);
        setInventoryData(inventoryResult);
        setStats(statsResult);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu';
        setError(errorMessage);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        const params = {
          page: currentPage,
          limit: 20,
          ...(searchTerm && { search: searchTerm }),
          ...(filterStatus && { status: filterStatus }),
          ...(filterSupplier && { supplier: filterSupplier }),
          sortBy,
          sortOrder
        };

        const result = await AdminInventoryService.getInventories(params);
        setInventoryData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải danh sách nguyên liệu';
        setError(errorMessage);
      }
    };
    loadData();
  }, [currentPage, searchTerm, filterStatus, filterSupplier, sortBy, sortOrder]);

  const reloadAllData = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterSupplier && { supplier: filterSupplier }),
        sortBy,
        sortOrder
      };

      const [statsResult, inventoryResult] = await Promise.all([
        AdminInventoryService.getInventoryStats(),
        AdminInventoryService.getInventories(params)
      ]);
      
      setStats(statsResult);
      setInventoryData(inventoryResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleCreateInventory = async (data: InventoryFormData) => {
    try {
      setLoading(true);
      await AdminInventoryService.createInventory(data);
      setShowCreateModal(false);
      await reloadAllData(); // Reload all data
      alert('Tạo nguyên liệu thành công!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tạo nguyên liệu';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (data: InventoryFormData) => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      await AdminInventoryService.updateInventory(selectedItem._id, data);
      setShowEditModal(false);
      setSelectedItem(undefined);
      await reloadAllData();
      alert('Cập nhật nguyên liệu thành công!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi cập nhật nguyên liệu';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInventory = async (item: InventoryItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nguyên liệu "${item.name}"?`)) return;
    
    try {
      setLoading(true);
      await AdminInventoryService.deleteInventory(item._id);
      await reloadAllData();
      alert('Xóa nguyên liệu thành công!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi xóa nguyên liệu';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (operation: string, quantity: number, note: string) => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      await AdminInventoryService.updateQuantity(selectedItem._id, {
        operation: operation as 'add' | 'subtract' | 'set',
        quantity,
        note
      });
      await reloadAllData();
      alert('Cập nhật số lượng thành công!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi cập nhật số lượng';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Report functions
  const generateReport = async (type: 'summary' | 'low-stock' | 'high-value' | 'by-supplier') => {
    try {
      setLoading(true);
      const report = await AdminInventoryService.getReport(type);
      setReportData(report);
      setShowReportModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tạo báo cáo';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'in-stock':
        return { bg: '#d1fae5', color: '#059669', label: 'Còn hàng', icon: '✅' };
      case 'low-stock':
        return { bg: '#fef3c7', color: '#d97706', label: 'Sắp hết', icon: '⚠️' };
      case 'out-of-stock':
        return { bg: '#fee2e2', color: '#dc2626', label: 'Hết hàng', icon: '❌' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', label: status, icon: '❓' };
    }
  };

  const getItemIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cá') || lowerName.includes('tôm') || lowerName.includes('mực')) return '🦐';
    if (lowerName.includes('rau') || lowerName.includes('củ')) return '🥬';
    if (lowerName.includes('gia vị') || lowerName.includes('nước mắm')) return '🧂';
    if (lowerName.includes('thịt')) return '🥩';
    if (lowerName.includes('nước')) return '🥤';
    return '📦';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header với thống kê */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            🏪 Quản trị nguyên liệu
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => generateReport('low-stock')}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ⚠️ Hàng sắp hết
            </button>
            <button
              onClick={() => generateReport('by-supplier')}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              📊 Báo cáo NCC
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
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
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.totalItems}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Tổng mặt hàng</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.inStock}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Còn hàng</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.lowStock}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Sắp hết</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.outOfStock}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Hết hàng</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              {AdminInventoryService.formatPrice(stats.totalValue)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Tổng giá trị</div>
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
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'end'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
            🔍 Tìm kiếm
          </label>
          <input
            type="text"
            placeholder="Tên nguyên liệu..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
            📊 Trạng thái
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">Tất cả</option>
            <option value="in-stock">Còn hàng</option>
            <option value="low-stock">Sắp hết</option>
            <option value="out-of-stock">Hết hàng</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
            🏪 Nhà cung cấp
          </label>
          <input
            type="text"
            placeholder="Tên nhà cung cấp..."
            value={filterSupplier}
            onChange={(e) => {
              setFilterSupplier(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
            🔄 Sắp xếp
          </label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="updated_at-desc">Mới cập nhật</option>
            <option value="name-asc">Tên A-Z</option>
            <option value="name-desc">Tên Z-A</option>
            <option value="price-desc">Giá cao</option>
            <option value="price-asc">Giá thấp</option>
            <option value="quantity-desc">Số lượng nhiều</option>
            <option value="quantity-asc">Số lượng ít</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          ⚠️ {error}
        </div>
      )}

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
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : inventoryData.items.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>
              {searchTerm || filterStatus || filterSupplier 
                ? 'Không tìm thấy kết quả phù hợp' 
                : 'Chưa có nguyên liệu nào'
              }
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {searchTerm || filterStatus || filterSupplier 
                ? 'Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Bấm "Thêm nguyên liệu" để tạo nguyên liệu đầu tiên'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 2fr 100px 100px 150px 200px 120px 180px',
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
              <span>Đơn giá</span>
              <span>Thành tiền</span>
              <span>Nhà cung cấp</span>
              <span>Trạng thái</span>
              <span style={{ textAlign: 'center' }}>Hành động</span>
            </div>

            {/* Table Body */}
            {inventoryData.items.map(item => {
              const statusInfo = getStatusInfo(item.status);
              const totalValue = item.quantity * item.price;

              return (
                <div key={item._id} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 2fr 100px 100px 150px 200px 120px 180px',
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
                    {item.quantity} {item.unit}
                  </div>

                  <div style={{ fontWeight: '600', color: '#374151' }}>
                    {AdminInventoryService.formatPrice(item.price)}
                  </div>

                  <div style={{ fontWeight: '600', color: '#1f2937' }}>
                    {AdminInventoryService.formatPrice(totalValue)}
                  </div>

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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </span>

                  <div style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowEditModal(true);
                      }}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        minWidth: '32px'
                      }}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowQuantityModal(true);
                      }}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        minWidth: '32px'
                      }}
                      title="Cập nhật số lượng"
                    >
                      🔄
                    </button>

                    <button
                      onClick={() => handleDeleteInventory(item)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        minWidth: '32px'
                      }}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {inventoryData.pagination.total > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '20px'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              background: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
              color: currentPage === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Trước
          </button>

          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Trang {inventoryData.pagination.current} / {inventoryData.pagination.total}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(inventoryData.pagination.total, currentPage + 1))}
            disabled={currentPage === inventoryData.pagination.total}
            style={{
              background: currentPage === inventoryData.pagination.total ? '#f3f4f6' : '#3b82f6',
              color: currentPage === inventoryData.pagination.total ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: currentPage === inventoryData.pagination.total ? 'not-allowed' : 'pointer'
            }}
          >
            Sau →
          </button>
        </div>
      )}

      {/* Warning for low stock */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          color: '#92400e'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>Cảnh báo tồn kho</span>
          </div>
          <div style={{ fontSize: '14px' }}>
            {stats.outOfStock > 0 && `Có ${stats.outOfStock} mặt hàng đã hết hàng`}
            {stats.outOfStock > 0 && stats.lowStock > 0 && ' và '}
            {stats.lowStock > 0 && `${stats.lowStock} mặt hàng sắp hết`}.
            <br />Vui lòng nhập hàng kịp thời để đảm bảo hoạt động nhà hàng.
          </div>
        </div>
      )}

      {/* Modals */}
      <InventoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateInventory}
        title="➕ Tạo nguyên liệu mới"
      />

      <InventoryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(undefined);
        }}
        onSave={handleUpdateInventory}
        item={selectedItem}
        title="✏️ Chỉnh sửa nguyên liệu"
      />

      <QuantityModal
        isOpen={showQuantityModal}
        onClose={() => {
          setShowQuantityModal(false);
          setSelectedItem(undefined);
        }}
        onSave={handleUpdateQuantity}
        item={selectedItem}
      />

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                📊 {reportData.message}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: '14px' }}>
              {reportData.type === 'low-stock' && reportData.items && (
                <div>
                  {reportData.items.map(item => (
                    <div key={item._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#fef3c7',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <span>{getItemIcon(item.name)} {item.name}</span>
                      <span>
                        {item.quantity} {item.unit} - 
                        <span style={{
                          color: item.status === 'out-of-stock' ? '#dc2626' : '#d97706',
                          fontWeight: '600',
                          marginLeft: '4px'
                        }}>
                          {getStatusInfo(item.status).label}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {reportData.type === 'by-supplier' && reportData.suppliers && (
                <div>
                  {reportData.suppliers.map((supplier, index) => (
                    <div key={index} style={{
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0' }}>
                        🏪 {supplier._id || 'Chưa có thông tin NCC'}
                      </h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>
                        Số mặt hàng: {supplier.itemCount} | 
                        Tổng giá trị: {AdminInventoryService.formatPrice(supplier.totalValue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryManagement;