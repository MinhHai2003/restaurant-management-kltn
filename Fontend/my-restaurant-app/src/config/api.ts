// API Configuration - Centralized API URLs
const getEnvVar = (key: string, defaultValue: string): string => {
  return (import.meta as any).env?.[key] || defaultValue;
};

export const API_CONFIG = {
  // Auth Service (port 5000/5001)
  AUTH_API: getEnvVar('VITE_AUTH_API', 'http://localhost:5000/api'),
  
  // Customer Service (port 5002)
  CUSTOMER_API: getEnvVar('VITE_CUSTOMER_API', 'http://localhost:5002/api'),
  
  // Menu Service (port 5003)
  MENU_API: getEnvVar('VITE_MENU_API', 'http://localhost:5003/api'),
  
  // Inventory Service (port 5004)
  INVENTORY_API: getEnvVar('VITE_INVENTORY_API', 'http://localhost:5004/api'),
  
  // Order Service (port 5005)
  ORDER_API: getEnvVar('VITE_ORDER_API', 'http://localhost:5005/api'),
  
  // Table Service (port 5006)
  TABLE_API: getEnvVar('VITE_TABLE_API', 'http://localhost:5006/api'),
  
  // Socket URLs
  SOCKET_URL: getEnvVar('VITE_SOCKET_URL', 'http://localhost:5000'),
  ORDER_SOCKET_URL: getEnvVar('VITE_ORDER_SOCKET_URL', 'http://localhost:5005'),
  TABLE_SOCKET_URL: getEnvVar('VITE_TABLE_SOCKET_URL', 'http://localhost:5006'),
} as const;

