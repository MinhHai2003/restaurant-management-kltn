// Cart Service for API calls
const API_BASE_URL = 'http://localhost:5005/api/cart';

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
  private getSessionId(): string {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', sessionId);
      console.log('🆔 [SESSION] Generated new session ID:', sessionId);
    }
    return sessionId;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  // Auto login with guest account if user not logged in
  private async ensureAuthentication(): Promise<string | null> {
    const userToken = this.getAuthToken();
    
    // If user has their own token, use it
    if (userToken) {
      return userToken;
    }

    // If no user token, use guest account
    if (!this.guestToken) {
      try {
        console.log('🤖 [GUEST AUTH] Auto-logging in with guest account...');
        
        const response = await fetch('http://localhost:5002/api/customers/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'nguoidung@gmail.com',
            password: '602057Aa'
          }),
        });

        const result = await response.json();
        
        if (response.ok && result.success && result.data?.accessToken) {
          this.guestToken = result.data.accessToken;
          console.log('🤖 [GUEST AUTH] Guest login successful, token:', result.data.accessToken.substring(0, 20) + '...');
          return this.guestToken;
        } else {
          console.error('🤖 [GUEST AUTH] Guest login failed:', result.message || 'Unknown error');
          console.error('🤖 [GUEST AUTH] Response:', result);
          return null;
        }
      } catch (error) {
        console.error('🤖 [GUEST AUTH] Guest login error:', error);
        return null;
      }
    }

    return this.guestToken;
  }

  private async getAuthHeaders() {
    const token = await this.ensureAuthentication();
    console.log('🔐 [AUTH HEADERS] Using token:', token ? 'Token exists' : 'No token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Get current cart
  async getCart(): Promise<{ success: boolean; data?: { cart: Cart }; error?: string }> {
    try {
      console.log('🛒 [CART SERVICE] Getting cart from:', API_BASE_URL);
      const headers = await this.getAuthHeaders();
      console.log('🛒 [CART SERVICE] Auth headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      
      console.log('🛒 [CART SERVICE] Raw API response:', result);
      console.log('🛒 [CART SERVICE] Cart summary from API:', result?.data?.cart?.summary);
      
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
      const headers = await this.getAuthHeaders();
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
      const headers = await this.getAuthHeaders();
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
      const headers = await this.getAuthHeaders();
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
      const headers = await this.getAuthHeaders();
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
      const headers = await this.getAuthHeaders();
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
      const headers = await this.getAuthHeaders();
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

  // Check if user is authenticated (always true now with guest fallback)
  isAuthenticated(): boolean {
    return true; // Always true since we have guest fallback
  }
}

// Export singleton instance
export const cartService = new CartService();
export type { Cart, CartItem, CartSummary, AddToCartData, AppliedCoupon };