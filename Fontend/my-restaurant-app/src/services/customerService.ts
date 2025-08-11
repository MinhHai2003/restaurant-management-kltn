// Order Service API base URL
const ORDER_API_BASE_URL = 'http://localhost:5005/api/orders';

export type Order = {
  _id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  pricing: {
    subtotal?: number;
    tax?: number;
    deliveryFee?: number;
    discount?: number;
    loyaltyDiscount?: number;
    total: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    customizations?: string;
    notes?: string;
  }>;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  payment?: {
    method?: string;
    status?: string;
    transactionId?: string;
    paidAt?: string;
  };
  delivery?: {
    address?: {
      full?: string;
      district?: string;
      city?: string;
      coordinates?: {
        lat?: number;
        lng?: number;
      };
    };
    estimatedTime?: number;
    type?: string;
    fee?: number;
    driverId?: string;
    instructions?: string;
    pickupInfo?: any;
  };
  notes?: {
    customer?: string;
    kitchen?: string;
    delivery?: string;
    internal?: string;
  };
};

// Lấy danh sách đơn hàng của user
async function getOrders(): Promise<{ success: boolean; data?: Order[]; error?: string }> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${ORDER_API_BASE_URL}?limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get orders');
    }
    // API trả về result.data.orders
    return { success: true, data: result.data.orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get orders',
    };
  }
}
// Customer Service for API calls
const API_BASE_URL = 'http://localhost:5002/api/customers';

export type Address = {
  _id: string;
  label: string;
  address: string;
  district?: string;
  city?: string;
  phone?: string;
  isDefault?: boolean;
}

class CustomerService {
  getOrders = getOrders;
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Get all addresses of the current customer
  async getAddresses(): Promise<{ success: boolean; data?: Address[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get addresses');
      }
      return { success: true, data: result.data.addresses };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get addresses',
      };
    }
  }

  // Add a new address for the current customer
  async addAddress(addressData: Omit<Address, '_id'>): Promise<{ success: boolean; data?: Address; error?: string }> {
    try {
      console.log('🚀 Gửi request thêm địa chỉ:', addressData);
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(addressData),
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);
      
      // Read response as text first to debug
      const responseText = await response.text();
      console.log('📥 Raw response text:', responseText);
      
      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, responseText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`
        };
      }
      
      // Parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📥 Parsed response:', result);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return {
          success: false,
          error: `Invalid JSON response: ${responseText}`
        };
      }
      
      if (!result.success) {
        console.error('❌ API returned success: false');
        return {
          success: false,
          error: result.message || 'API returned success: false'
        };
      }
      
      // API trả về { data: { address: ... } }
      const address = result.data?.address;
      if (!address) {
        console.error('❌ No address data in response');
        console.error('❌ Full result:', JSON.stringify(result, null, 2));
        return {
          success: false,
          error: 'No address data in response'
        };
      }
      
      console.log('✅ Address thêm thành công:', address);
      return { success: true, data: address };
    } catch (error) {
      console.error('❌ Lỗi trong customerService.addAddress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add address',
      };
    }
  }

  // Get customer information
  async getCustomerInfo(): Promise<{ success: boolean; data?: { name: string }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
      return { success: true, data: { name: result.data.name } };
    } catch (error) {
      console.error('❌ Lỗi trong customerService.getCustomerInfo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get customer info',
      };
    }
  }
}

export const customerService = new CustomerService();
