// API Configuration - Centralized API URLs
// IMPORTANT: Vite chỉ inline env vars khi truy cập TRỰC TIẾP như import.meta.env.VITE_XXX
// KHÔNG thể dùng dynamic property access vì Vite sẽ không tìm thấy và fallback về default
export const API_CONFIG = {
  // Auth Service (port 5000/5001)
  AUTH_API: import.meta.env.VITE_AUTH_API || 'http://localhost:5000/api',
  
  // Customer Service (port 5002)
  CUSTOMER_API: import.meta.env.VITE_CUSTOMER_API || 'http://localhost:5002/api',
  
  // Menu Service (port 5003)
  MENU_API: import.meta.env.VITE_MENU_API || 'http://localhost:5003/api',
  
  // Inventory Service (port 5004)
  INVENTORY_API: import.meta.env.VITE_INVENTORY_API || 'http://localhost:5004/api',
  
  // Order Service (port 5005)
  ORDER_API: import.meta.env.VITE_ORDER_API || 'http://localhost:5005/api',
  
  // Table Service (port 5006)
  TABLE_API: import.meta.env.VITE_TABLE_API || 'http://localhost:5006/api',
  
  // Socket URLs
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  ORDER_SOCKET_URL: import.meta.env.VITE_ORDER_SOCKET_URL || 'http://localhost:5005',
  TABLE_SOCKET_URL: import.meta.env.VITE_TABLE_SOCKET_URL || 'http://localhost:5006',
} as const;

// Debug: Log để kiểm tra env vars đã được load đúng chưa
console.log('🔧 [API_CONFIG] Loaded configuration:', {
  AUTH_API: API_CONFIG.AUTH_API,
  MENU_API: API_CONFIG.MENU_API,
  INVENTORY_API: API_CONFIG.INVENTORY_API,
  ORDER_API: API_CONFIG.ORDER_API,
  TABLE_API: API_CONFIG.TABLE_API,
});

