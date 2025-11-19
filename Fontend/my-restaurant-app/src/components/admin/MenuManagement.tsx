import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/api';

interface Ingredient {
  name: string;
  quantity: string | number;
  unit: string;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  imageAlt?: string;
  ingredients?: Ingredient[];
  createdAt?: string;
  updatedAt?: string;
}

interface MenuFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: File | null;
  ingredients: Ingredient[];
}

interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  quantity: number;
  category: string;
}

const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    image: null,
    ingredients: []
  });

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'com-chien', label: 'Cơm chiên' },
    { value: 'pho', label: 'Phở' },
    { value: 'hai-san', label: 'Hải sản' },
    { value: 'thit-nuong', label: 'Thịt nướng' },
    { value: 'lau', label: 'Lẩu' },
    { value: 'goi-cuon', label: 'Gỏi cuốn' },
    { value: 'banh-mi', label: 'Bánh mì' },
    { value: 'banh-xeo', label: 'Bánh xèo' },
    { value: 'do-uong', label: 'Đồ uống' },
    { value: 'trang-mieng', label: 'Tráng miệng' },
    { value: 'khac', label: 'Khác' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      await fetchMenuItems();
      await fetchInventoryItems();
    };
    fetchData();
  }, []);

  // Debug inventory items
  useEffect(() => {
    console.log('🔍 Current inventory items count:', inventoryItems.length);
    console.log('📋 Inventory items:', inventoryItems);
  }, [inventoryItems]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.MENU_API}/menu`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      } else {
        throw new Error('Failed to fetch menu items');
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      alert('Lỗi khi tải danh sách món ăn');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      console.log(`🔄 Fetching inventory from ${API_CONFIG.INVENTORY_API}/inventory`);
      const response = await fetch(`${API_CONFIG.INVENTORY_API}/inventory`);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Inventory data:', data);
        setInventoryItems(data);
      } else {
        console.warn('❌ Could not fetch inventory items, status:', response.status);
        // Fallback to default ingredients if inventory service not available
        setInventoryItems(getDefaultIngredients());
      }
    } catch (error) {
      console.error('❌ Inventory service error:', error);
      // Fallback to default ingredients
      setInventoryItems(getDefaultIngredients());
    }
  };

  // Fallback ingredients nếu inventory service không available
  const getDefaultIngredients = () => [
    { _id: '1', name: 'Cá Lăng Đang Bơi', unit: 'kg', quantity: 100, category: 'thịt-cá' },
    { _id: '2', name: 'Cá Tra Phi Lê', unit: 'kg', quantity: 50, category: 'thịt-cá' },
    { _id: '3', name: 'Cá Chép Tươi', unit: 'kg', quantity: 80, category: 'thịt-cá' },
    { _id: '4', name: 'Tôm Sú Tươi', unit: 'kg', quantity: 80, category: 'thịt-cá' },
    { _id: '5', name: 'Mực Ống Tươi', unit: 'kg', quantity: 30, category: 'thịt-cá' },
    { _id: '6', name: 'Cua Biển', unit: 'kg', quantity: 20, category: 'thịt-cá' },
    { _id: '7', name: 'Thịt Bò Tái', unit: 'kg', quantity: 40, category: 'thịt-cá' },
    { _id: '8', name: 'Thịt Gà', unit: 'kg', quantity: 35, category: 'thịt-cá' },
    { _id: '9', name: 'Thịt Ba Chỉ', unit: 'kg', quantity: 25, category: 'thịt-cá' },
    { _id: '10', name: 'Sườn Heo', unit: 'kg', quantity: 30, category: 'thịt-cá' },
    { _id: '11', name: 'Hành Tây', unit: 'kg', quantity: 100, category: 'rau-củ-quả' },
    { _id: '12', name: 'Hành Lá', unit: 'kg', quantity: 30, category: 'rau-củ-quả' },
    { _id: '13', name: 'Cà Chua', unit: 'kg', quantity: 50, category: 'rau-củ-quả' },
    { _id: '14', name: 'Cà Rốt', unit: 'kg', quantity: 40, category: 'rau-củ-quả' },
    { _id: '15', name: 'Khoai Tây', unit: 'kg', quantity: 60, category: 'rau-củ-quả' },
    { _id: '16', name: 'Thơm', unit: 'kg', quantity: 40, category: 'rau-củ-quả' },
    { _id: '17', name: 'Dưa Leo', unit: 'kg', quantity: 30, category: 'rau-củ-quả' },
    { _id: '18', name: 'Ngò Gai', unit: 'kg', quantity: 10, category: 'rau-củ-quả' },
    { _id: '19', name: 'Giá Đỗ', unit: 'kg', quantity: 20, category: 'rau-củ-quả' },
    { _id: '20', name: 'Xà Lách', unit: 'kg', quantity: 15, category: 'rau-củ-quả' },
    { _id: '21', name: 'Đậu Bắp', unit: 'kg', quantity: 25, category: 'rau-củ-quả' },
    { _id: '22', name: 'Dầu Ăn', unit: 'lít', quantity: 50, category: 'gia-vị' },
    { _id: '23', name: 'Nước Mắm', unit: 'lít', quantity: 30, category: 'gia-vị' },
    { _id: '24', name: 'Muối Biển', unit: 'kg', quantity: 30, category: 'gia-vị' },
    { _id: '25', name: 'Tỏi', unit: 'kg', quantity: 25, category: 'gia-vị' },
    { _id: '26', name: 'Ớt', unit: 'kg', quantity: 15, category: 'gia-vị' },
    { _id: '27', name: 'Sả', unit: 'kg', quantity: 10, category: 'gia-vị' },
    { _id: '28', name: 'Bánh Mì', unit: 'cái', quantity: 500, category: 'bánh-mì' },
    { _id: '29', name: 'Bánh Phở', unit: 'kg', quantity: 100, category: 'bánh-mì' },
    { _id: '30', name: 'Bánh Tráng', unit: 'kg', quantity: 50, category: 'bánh-mì' },
    { _id: '31', name: 'Bún Tươi', unit: 'kg', quantity: 30, category: 'bánh-mì' },
    { _id: '32', name: 'Cơm Tấm', unit: 'kg', quantity: 200, category: 'bánh-mì' },
    { _id: '33', name: 'Bột Bánh Xèo', unit: 'kg', quantity: 50, category: 'bánh-mì' },
    { _id: '34', name: 'Trứng Gà', unit: 'cái', quantity: 1000, category: 'thịt-cá' },
    { _id: '35', name: 'Đậu Phụ', unit: 'kg', quantity: 20, category: 'rau-củ-quả' }
  ];

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'kg' }]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Convert string quantities to numbers before sending
      const processedIngredients = formData.ingredients.map(ingredient => ({
        ...ingredient,
        quantity: typeof ingredient.quantity === 'string' ? 
          (ingredient.quantity === '' ? 0 : parseFloat(ingredient.quantity) || 0) : 
          ingredient.quantity
      }));
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('available', formData.available.toString());
      formDataToSend.append('ingredients', JSON.stringify(processedIngredients));
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = editingItem 
        ? `${API_CONFIG.MENU_API}/menu/${editingItem._id}`
        : `${API_CONFIG.MENU_API}/menu`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      if (response.ok) {
        await fetchMenuItems();
        setShowAddForm(false);
        setEditingItem(null);
        setFormData({
          name: '',
          description: '',
          price: 0,
          category: '',
          available: true,
          image: null,
          ingredients: []
        });
        alert(editingItem ? 'Cập nhật món ăn thành công!' : 'Thêm món ăn thành công!');
      } else {
        throw new Error('Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Lỗi khi lưu món ăn');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image: null,
      ingredients: item.ingredients || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.MENU_API}/menu/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchMenuItems();
        alert('Xóa món ăn thành công!');
      } else {
        throw new Error('Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Lỗi khi xóa món ăn');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', item.name);
      formData.append('description', item.description);
      formData.append('price', item.price.toString());
      formData.append('category', item.category);
      formData.append('available', (!item.available).toString());

      const response = await fetch(`${API_CONFIG.MENU_API}/menu/${item._id}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        await fetchMenuItems();
      } else {
        throw new Error('Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Lỗi khi cập nhật trạng thái món ăn');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

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
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            🍽️ Quản lý Menu
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
            Thêm, sửa, xóa và quản lý món ăn trong nhà hàng
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingItem(null);
            setFormData({
              name: '',
              description: '',
              price: 0,
              category: '',
              available: true,
              image: null,
              ingredients: []
            });
          }}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          ➕ Thêm món mới
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white'
          }}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 'bold' }}>
              {editingItem ? '✏️ Sửa món ăn' : '➕ Thêm món mới'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Tên món ăn *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Giá (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="Nhập giá món ăn"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Danh mục *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.slice(1).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipe Ingredients Section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: '500' }}>
                    Nguyên liệu công thức
                  </label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    + Thêm nguyên liệu
                  </button>
                </div>
                
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '8px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <select
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      style={{
                        flex: '2',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {inventoryItems.map(item => (
                        <option key={item._id} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      placeholder="Số lượng"
                      value={ingredient.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateIngredient(index, 'quantity', value);
                      }}
                      step="any"
                      min="0"
                      style={{
                        flex: '1',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                    
                    <select
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      style={{
                        flex: '1',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="kg">kg</option>
                      <option value="lít">lít</option>
                      <option value="cái">cái</option>
                      <option value="hộp">hộp</option>
                    </select>
                    
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      style={{
                        padding: '8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        minWidth: '32px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {formData.ingredients.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#64748b',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để bắt đầu.
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Hình ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  />
                  <span style={{ fontWeight: '500' }}>Có sẵn để phục vụ</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Đang lưu...' : (editingItem ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {loading && filteredItems.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p>Đang tải danh sách món ăn...</p>
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
            <p>Không tìm thấy món ăn nào</p>
          </div>
        )}

        {filteredItems.map((item) => (
          <div
            key={item._id}
            style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            {/* Image */}
            <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt || item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}>
                  🍽️
                </div>
              )}
              
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: item.available ? '#22c55e' : '#ef4444',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {item.available ? '✅ Có sẵn' : '❌ Hết món'}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                {item.name}
              </h3>
              
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#64748b',
                lineHeight: '1.5'
              }}>
                {item.description || 'Không có mô tả'}
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}>
                  {formatPrice(item.price)}
                </span>
                <span style={{
                  fontSize: '12px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {categories.find(cat => cat.value === item.category)?.label || item.category}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(item)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => toggleAvailability(item)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: item.available ? '#f59e0b' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {item.available ? '🚫 Ẩn' : '✅ Hiện'}
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  style={{
                    padding: '8px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;