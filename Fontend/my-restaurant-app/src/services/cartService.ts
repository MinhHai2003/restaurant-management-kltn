// Cart Service for API calls with Session-based Guest Support
import { API_CONFIG } from '../config/api';

const API_BASE_URL = `${API_CONFIG.ORDER_API}/cart`;

interface CartItem {
  _id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customizations?: string;
  notes?: string;
  subtotal: number;
}

interface CartSummary {
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  loyaltyDiscount?: number;
  couponDiscount?: number;
  tax: number;
  total: number;
}

interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  appliedDiscount: number;
}

interface Cart {
  _id: string;
  customerId: string;
  items: CartItem[];
  summary: CartSummary;
  appliedCoupon?: AppliedCoupon;
  delivery: {
    type: string;
    estimatedTime: number;
    fee: number;
  };
}

interface AddToCartData {
  menuItemId: string;
  quantity: number;
  customizations?: string;
  notes?: string;
}

interface CartResponse {
  cart: Cart;
  addedItem?: {
    name: string;
    quantity: number;
    price: number;
  };
}

class CartService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private getSessionId(): string {
    return getSessionId(); // Use the exported utility function
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    const sessionId = this.getSessionId();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Session-ID': sessionId, // Always include session ID for guest support
    };
  }

  // Get current cart
  async getCart(): Promise<{ success: boolean; data?: { cart: Cart }; error?: string }> {
    try {
      console.log('🛒 [CART SERVICE] Getting cart from:', API_BASE_URL);
      const headers = this.getAuthHeaders();
      console.log('🛒 [CART SERVICE] Headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      
      console.log('🛒 [CART SERVICE] Raw API response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get cart');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('🛒 [CART SERVICE] Get cart error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get cart' 
      };
    }
  }

  // Add item to cart
  async addToCart(data: AddToCartData): Promise<{ success: boolean; data?: CartResponse; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add item to cart');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Add to cart error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add item to cart' 
      };
    }
  }

  // Update cart item quantity
  async updateCartItem(itemId: string, quantity: number): Promise<{ success: boolean; data?: { cart: Cart }; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update cart item');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Update cart item error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update cart item' 
      };
    }
  }

  // Remove item from cart
  async removeFromCart(itemId: string): Promise<{ success: boolean; data?: { cart: Cart }; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove item from cart');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Remove from cart error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove item from cart' 
      };
    }
  }

  // Get cart summary (for header badge)
  async getCartSummary(): Promise<{ success: boolean; data?: { summary: CartSummary; itemCount: number }; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/summary`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get cart summary');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Get cart summary error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get cart summary' 
      };
    }
  }

  // Clear cart
  async clearCart(): Promise<{ success: boolean; data?: { cart: Cart }; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/clear`, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to clear cart');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Clear cart error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear cart' 
      };
    }
  }

  // Apply coupon
  async applyCoupon(couponCode: string): Promise<{ success: boolean; data?: { cart: Cart; appliedDiscount: number }; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/coupon`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ couponCode }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to apply coupon');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Apply coupon error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to apply coupon' 
      };
    }
  }

  // Format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  // Guest checkout
  async guestCheckout(checkoutData: {
    guestInfo: {
      name: string;
      email: string;
      phone: string;
      address?: {
        full: string;
        district?: string;
        city?: string;
      };
    };
    payment: {
      method: string;
    };
    delivery: {
      type: string;
      estimatedTime: number;
    };
    notes?: {
      customer?: string;
      kitchen?: string;
    };
  }): Promise<{ success: boolean; data?: { order: any }; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const orderApiUrl = API_CONFIG.ORDER_API;
      const response = await fetch(`${orderApiUrl}/orders/guest-checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Guest checkout failed');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Guest checkout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to checkout' 
      };
    }
  }

  // Check if user is authenticated (always true now with session fallback)
  isAuthenticated(): boolean {
    return true; // Always true since we have session fallback
  }
}

// Utility function to get session ID (can be used by other services)
export function getSessionId(): string {
  let sessionId = localStorage.getItem('guestSessionId');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guestSessionId', sessionId);
    console.log('🆔 [SESSION] Generated new session ID:', sessionId);
  }
  return sessionId;
}

// Export singleton instance
export const cartService = new CartService();
export type { Cart, CartItem, CartSummary, AddToCartData, AppliedCoupon };