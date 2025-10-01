import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { cartService } from '../services/cartService';

interface CartContextType {
  cartCount: number;
  updateCartCount: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = async () => {
    try {
      if (!cartService.isAuthenticated()) {
        setCartCount(0);
        return;
      }

      const result = await cartService.getCartSummary();
      if (result.success && result.data) {
        setCartCount(result.data.itemCount || 0);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Failed to update cart count:', error);
      setCartCount(0);
    }
  };

  const refreshCart = async () => {
    await updateCartCount();
  };

  // Load cart count on component mount
  useEffect(() => {
    updateCartCount();

    // Listen for cart updates from socket
    const handleCartUpdate = (event: CustomEvent) => {
      console.log('🛒 CartContext received socket update:', event.detail);
      // Update cart count immediately
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, []);

  // Check auth status periodically to update cart count
  useEffect(() => {
    const interval = setInterval(() => {
      updateCartCount();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const value: CartContextType = {
    cartCount,
    updateCartCount,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
