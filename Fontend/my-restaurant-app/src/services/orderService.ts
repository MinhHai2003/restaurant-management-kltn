import { getSessionId } from './cartService';

const ORDER_API_BASE = 'http://localhost:5005/api/orders';

interface OrderData {
  items: any[];
  delivery: any;
  payment: any;
  notes?: any;
  coupon?: any;
  customerInfo?: any;
  frontendPricing?: any;
}

interface CreateOrderResponse {
  success: boolean;
  order?: any;
  message?: string;
  error?: string;
}

class OrderService {
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Check for authentication token first
    const token = localStorage.getItem('token'); // Use 'token' key like CheckoutPage
    console.log('🔑 [OrderService] Token found:', !!token);
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 [OrderService] Using token authentication');
    } else {
      // If no token, use session ID for guest users
      const sessionId = getSessionId();
      console.log('🆔 [OrderService] Session ID:', sessionId);
      
      if (sessionId) {
        headers['X-Session-ID'] = sessionId;
        console.log('🆔 [OrderService] Using session authentication');
      } else {
        console.warn('⚠️ [OrderService] No token or session ID available');
      }
    }

    console.log('📤 [OrderService] Final headers:', headers);
    return headers;
  }

  async createOrder(orderData: OrderData): Promise<CreateOrderResponse> {
    try {
      console.log('📤 Creating order with data:', orderData);
      console.log('📤 Using headers:', this.getHeaders());

      const response = await fetch(ORDER_API_BASE, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Order creation failed:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Order created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  async getOrders(): Promise<any[]> {
    try {
      const response = await fetch(ORDER_API_BASE, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.orders || [];
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${ORDER_API_BASE}/${orderId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.order;
    } catch (error) {
      console.error('❌ Error fetching order:', error);
      throw error;
    }
  }

  async trackOrder(orderNumber: string): Promise<any> {
    try {
      const response = await fetch(`${ORDER_API_BASE}/track/${orderNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.order;
    } catch (error) {
      console.error('❌ Error tracking order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      const response = await fetch(`${ORDER_API_BASE}/${orderId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error canceling order:', error);
      throw error;
    }
  }

  async rateOrder(orderNumber: string, rating: any): Promise<void> {
    try {
      const response = await fetch(`${ORDER_API_BASE}/${orderNumber}/rate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(rating),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error rating order:', error);
      throw error;
    }
  }

  async reorder(orderNumber: string): Promise<any> {
    try {
      const response = await fetch(`${ORDER_API_BASE}/${orderNumber}/reorder`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error reordering:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
export default orderService;