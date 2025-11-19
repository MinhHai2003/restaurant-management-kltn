// Admin Inventory Service - Tích hợp với backend admin API
import { API_CONFIG } from '../config/api';

export interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number; // ✅ Thêm trường giá
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  minimumStock?: number;
  note?: string;
  supplier: string; // ✅ Required
  category: string; // ✅ Required
  created_at: string;
  updated_at: string;
}

export interface InventoryStats {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  lastUpdated: string;
}

export interface PaginatedInventoryResponse {
  items: InventoryItem[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalItems: number;
  };
  filter: any;
}

export interface InventoryReport {
  type: string;
  message: string;
  items?: InventoryItem[];
  suppliers?: any[];
  summary?: any[];
  count?: number;
  generatedAt?: string;
}

const BASE_URL = `${API_CONFIG.INVENTORY_API}/admin/inventory`;

// Helper function to get admin token (giả sử token lưu trong localStorage)
const getAuthHeaders = () => {
  // Priority: employeeToken (from employee login) > adminToken > authToken
  const token = localStorage.getItem('employeeToken') || localStorage.getItem('adminToken') || localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export class AdminInventoryService {
  
  // 📊 Lấy thống kê dashboard
  static async getInventoryStats(): Promise<InventoryStats> {
    try {
      const response = await fetch(`${BASE_URL}/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }

  // 📋 Lấy danh sách inventory với phân trang và filter
  static async getInventories(params?: {
    page?: number;
    limit?: number;
    status?: string;
    supplier?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedInventoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.supplier) queryParams.append('supplier', params.supplier);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${BASE_URL}?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching inventories:', error);
      throw error;
    }
  }

  // ➕ Tạo nguyên liệu mới
  static async createInventory(inventoryData: {
    name: string;
    quantity: number;
    unit: string;
    price: number;
    status?: string;
    supplier: string; // ✅ Required
    category: string; // ✅ Required  
    note?: string;
  }): Promise<InventoryItem> {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(inventoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.item;
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  // ✏️ Cập nhật nguyên liệu
  static async updateInventory(id: string, inventoryData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(inventoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.item;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  // 🗑️ Xóa nguyên liệu
  static async deleteInventory(id: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  }

  // 🔄 Cập nhật số lượng (nhập/xuất kho)
  static async updateQuantity(id: string, quantityData: {
    quantity: number;
    operation: 'add' | 'subtract' | 'set';
    note?: string;
  }): Promise<InventoryItem> {
    try {
      const response = await fetch(`${BASE_URL}/${id}/quantity`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(quantityData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.item;
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  }

  // 📊 Lấy báo cáo
  static async getReport(type?: 'summary' | 'low-stock' | 'high-value' | 'by-supplier'): Promise<InventoryReport> {
    try {
      const url = `${BASE_URL}/report${type ? `?type=${type}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  // 🔍 Format giá tiền VND
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  // 📅 Format ngày tháng
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ⚠️ Kiểm tra token hợp lệ
  static isAuthenticated(): boolean {
    // Priority: employeeToken (from employee login) > adminToken > authToken
    const employeeToken = localStorage.getItem('employeeToken');
    const adminToken = localStorage.getItem('adminToken');
    const authToken = localStorage.getItem('authToken');
    const token = employeeToken || adminToken || authToken;
    
    console.log('🔐 [AdminInventoryService] Auth check:', {
      employeeToken: employeeToken ? 'EXISTS' : 'NULL',
      adminToken: adminToken ? 'EXISTS' : 'NULL',
      authToken: authToken ? 'EXISTS' : 'NULL',
      hasToken: !!token
    });
    
    return !!token;
  }

  // 🔒 Redirect nếu không có quyền
  static requireAuth(): void {
    if (!this.isAuthenticated()) {
      console.error('❌ [AdminInventoryService] Authentication failed - no token found');
      alert('Bạn cần đăng nhập với quyền admin để truy cập chức năng này!');
      // Redirect to employee login instead of customer login
      window.location.href = '/employee-login';
    } else {
      console.log('✅ [AdminInventoryService] Authentication successful');
    }
  }
}

export default AdminInventoryService;