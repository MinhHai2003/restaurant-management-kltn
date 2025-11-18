// API Configuration - Centralized API URLs
// IMPORTANT: Vite chỉ inline env vars khi truy cập TRỰC TIẾP như import.meta.env.VITE_XXX
// KHÔNG thể dùng dynamic property access vì Vite sẽ không tìm thấy và fallback về default

// Helper to get socket URL from API URL (remove /api suffix)
const getSocketUrl = (apiUrl: string, defaultPort: number): string => {
  if (!apiUrl) return '';
  
  // Make a copy to avoid mutating
  let url = String(apiUrl);
  
  // Remove /api or /api/ suffix (case insensitive, multiple times to be safe)
  url = url.replace(/\/api\/?$/i, '');
  url = url.replace(/\/api\/?$/i, ''); // Do it twice to catch any edge cases
  
  // Remove trailing slash
  url = url.replace(/\/+$/, '');
  
  // Final check - if still contains /api, remove everything after it
  const apiIndex = url.toLowerCase().indexOf('/api');
  if (apiIndex !== -1) {
    url = url.substring(0, apiIndex);
    url = url.replace(/\/+$/, '');
  }
  
  return url;
};

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
  // SOCKET_URL: Auth service socket (for employee notifications)
  // If VITE_SOCKET_URL is not set, derive from AUTH_API (remove /api suffix)
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 
    getSocketUrl(import.meta.env.VITE_AUTH_API || 'http://localhost:5000/api', 5000),
  ORDER_SOCKET_URL: import.meta.env.VITE_ORDER_SOCKET_URL || 
    getSocketUrl(import.meta.env.VITE_ORDER_API || 'http://localhost:5005/api', 5005),
  TABLE_SOCKET_URL: import.meta.env.VITE_TABLE_SOCKET_URL || 
    getSocketUrl(import.meta.env.VITE_TABLE_API || 'http://localhost:5006/api', 5006),
  // Customer Chat Socket URL
  // Always derive from CUSTOMER_API to ensure consistency
  CHAT_SOCKET_URL: (() => {
    const envSocketUrl = import.meta.env.VITE_CHAT_SOCKET_URL;
    const envCustomerApi = import.meta.env.VITE_CUSTOMER_API || 'http://localhost:5002/api';
    
    // If VITE_CHAT_SOCKET_URL is set, use it but ensure no /api suffix
    if (envSocketUrl) {
      return getSocketUrl(envSocketUrl, 5002);
    }
    
    // Otherwise derive from CUSTOMER_API
    return getSocketUrl(envCustomerApi, 5002);
  })(),
} as const;

// Debug: Log để kiểm tra env vars đã được load đúng chưa
console.log('🔧 [API_CONFIG] Loaded configuration:', {
  AUTH_API: API_CONFIG.AUTH_API,
  CUSTOMER_API: API_CONFIG.CUSTOMER_API,
  MENU_API: API_CONFIG.MENU_API,
  INVENTORY_API: API_CONFIG.INVENTORY_API,
  ORDER_API: API_CONFIG.ORDER_API,
  TABLE_API: API_CONFIG.TABLE_API,
  SOCKET_URL: API_CONFIG.SOCKET_URL,
  ORDER_SOCKET_URL: API_CONFIG.ORDER_SOCKET_URL,
  TABLE_SOCKET_URL: API_CONFIG.TABLE_SOCKET_URL,
  CHAT_SOCKET_URL: API_CONFIG.CHAT_SOCKET_URL,
});

// Debug: Log raw env vars for CHAT_SOCKET_URL
console.log('🔧 [API_CONFIG] Raw env vars:', {
  VITE_CHAT_SOCKET_URL: import.meta.env.VITE_CHAT_SOCKET_URL,
  VITE_CUSTOMER_API: import.meta.env.VITE_CUSTOMER_API,
  'CHAT_SOCKET_URL (computed)': API_CONFIG.CHAT_SOCKET_URL,
  'CUSTOMER_API (computed)': API_CONFIG.CUSTOMER_API,
});

// Warn if using localhost in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  if (API_CONFIG.SOCKET_URL.includes('localhost')) {
    console.error('⚠️ [API_CONFIG] SOCKET_URL is using localhost in production!', API_CONFIG.SOCKET_URL);
  }
  if (API_CONFIG.ORDER_SOCKET_URL.includes('localhost')) {
    console.error('⚠️ [API_CONFIG] ORDER_SOCKET_URL is using localhost in production!', API_CONFIG.ORDER_SOCKET_URL);
  }
  if (API_CONFIG.TABLE_SOCKET_URL.includes('localhost')) {
    console.error('⚠️ [API_CONFIG] TABLE_SOCKET_URL is using localhost in production!', API_CONFIG.TABLE_SOCKET_URL);
  }
  if (API_CONFIG.CHAT_SOCKET_URL.includes('localhost')) {
    console.error('⚠️ [API_CONFIG] CHAT_SOCKET_URL is using localhost in production!', API_CONFIG.CHAT_SOCKET_URL);
  }
  if (API_CONFIG.CUSTOMER_API.includes('localhost')) {
    console.error('⚠️ [API_CONFIG] CUSTOMER_API is using localhost in production!', API_CONFIG.CUSTOMER_API);
  }
}

