interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MenuCategory {
  _id: string;
  name: string;
  description: string;
  image?: string;
  items: MenuItem[];
}

interface MenuResponse {
  success: boolean;
  data?: {
    items: MenuItem[];
    categories?: MenuCategory[];
    total?: number;
    pagination?: {
      current: number;
      pages: number;
      total: number;
    };
  };
  error?: string;
  message?: string;
}

class MenuService {
  private baseURL = 'http://localhost:5003/api';

  // Get all menu items
  async getMenuItems(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<MenuResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${this.baseURL}/menu${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('🍽️ [MENU SERVICE] Fetching menu items from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [MENU SERVICE] Menu items fetched successfully:', data);

      // API trả về array trực tiếp, không có wrapper
      const items = Array.isArray(data) ? data : (data.data?.menuItems || data.data?.items || []);

      return {
        success: true,
        data: {
          items: items,
          categories: data.data?.categories || [],
          total: Array.isArray(data) ? data.length : (data.data?.total || 0),
          pagination: data.data?.pagination
        }
      };
    } catch (error) {
      console.error('❌ [MENU SERVICE] Error fetching menu items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch menu items'
      };
    }
  }

  // Get menu item by ID
  async getMenuItem(id: string): Promise<MenuResponse> {
    try {
      console.log('🍽️ [MENU SERVICE] Fetching menu item:', id);

      const response = await fetch(`${this.baseURL}/menu/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [MENU SERVICE] Menu item fetched successfully:', data);

      return {
        success: true,
        data: {
          items: [data.data?.menuItem || data.data]
        }
      };
    } catch (error) {
      console.error('❌ [MENU SERVICE] Error fetching menu item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch menu item'
      };
    }
  }

  // Get menu categories
  async getCategories(): Promise<MenuResponse> {
    try {
      console.log('🍽️ [MENU SERVICE] Fetching menu categories');

      const response = await fetch(`${this.baseURL}/menu/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [MENU SERVICE] Categories fetched successfully:', data);

      return {
        success: true,
        data: {
          categories: data.data?.categories || [],
          items: []
        }
      };
    } catch (error) {
      console.error('❌ [MENU SERVICE] Error fetching categories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      };
    }
  }

  // Search menu items
  async searchMenuItems(query: string, filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    allergens?: string[];
    dietary?: string[];
  }): Promise<MenuResponse> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.allergens) params.append('allergens', filters.allergens.join(','));
      if (filters?.dietary) params.append('dietary', filters.dietary.join(','));

      console.log('🔍 [MENU SERVICE] Searching menu items:', query, filters);

      const response = await fetch(`${this.baseURL}/menu/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [MENU SERVICE] Search completed:', data);

      return {
        success: true,
        data: {
          items: data.data?.results || data.data?.items || [],
          total: data.data?.total || 0
        }
      };
    } catch (error) {
      console.error('❌ [MENU SERVICE] Error searching menu items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search menu items'
      };
    }
  }

  // Get featured items
  async getFeaturedItems(): Promise<MenuResponse> {
    try {
      console.log('⭐ [MENU SERVICE] Fetching featured items');

      const response = await fetch(`${this.baseURL}/menu/featured`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [MENU SERVICE] Featured items fetched:', data);

      return {
        success: true,
        data: {
          items: data.data?.featured || data.data?.items || []
        }
      };
    } catch (error) {
      console.error('❌ [MENU SERVICE] Error fetching featured items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch featured items'
      };
    }
  }

  // Check item availability
  async checkAvailability(itemIds: string[]): Promise<{
    success: boolean;
    data?: { [key: string]: boolean };
    error?: string;
  }> {
    try {
      console.log('✅ [MENU SERVICE] Checking availability for items:', itemIds);

      const response = await fetch(`${this.baseURL}/menu/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [MENU SERVICE] Availability checked:', data);

      return {
        success: true,
        data: data.data?.availability || {}
      };
    } catch (error) {
      console.error('❌ [MENU SERVICE] Error checking availability:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check availability'
      };
    }
  }

  // Validate order items (for checkout)
  async validateOrderItems(items: Array<{
    menuItemId: string;
    quantity: number;
    customizations?: string;
    notes?: string;
  }>): Promise<{
    success: boolean;
    data?: {
      items: Array<MenuItem & { quantity: number }>;
      total: number;
      unavailableItems?: string[];
    };
    error?: string;
  }> {
    try {
      console.log('🔍 [MENU SERVICE] Validating order items:', items);

      const response = await fetch(`${this.baseURL}/menu/validate-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [MENU SERVICE] Order items validated:', data);

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('❌ [MENU SERVICE] Error validating order items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate order items'
      };
    }
  }
}

// Export singleton instance
export const menuService = new MenuService();
export default menuService;

// Export types
export type { MenuItem, MenuCategory, MenuResponse };