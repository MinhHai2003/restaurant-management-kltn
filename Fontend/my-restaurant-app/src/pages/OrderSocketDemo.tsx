import React, { useState } from 'react';
import OrderingSystem from '../components/customer/OrderingSystem';
import KitchenDashboard from '../components/kitchen/KitchenDashboard';
import OrderNotifications from '../components/OrderNotifications';

type ViewMode = 'customer' | 'kitchen' | 'admin';

const OrderSocketDemo: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('customer');

  const handleLogin = (role: string) => {
    // Simulate login with different tokens
    const tokens = {
      customer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjoiNjczYzRlZGY4ZTY5ODU1OGNkNjUwMmMwIiwiaWF0IjoxNzMyODA2ODQ1LCJleHAiOjE3MzI4OTMyNDV9.demo', // Mock token
      chef: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzNjNGVkZjhlNjk4NTU4Y2Q2NTAyYzEiLCJyb2xlIjoiY2hlZiIsImlhdCI6MTczMjgwNjg0NSwiZXhwIjoxNzMyODkzMjQ1fQ.demo',
      admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzNjNGVkZjhlNjk4NTU4Y2Q2NTAyYzIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzI4MDY4NDUsImV4cCI6MTczMjg5MzI0NX0.demo'
    };

    if (role === 'customer') {
      localStorage.setItem('customerToken', tokens.customer);
      localStorage.removeItem('employeeToken');
    } else {
      localStorage.setItem('employeeToken', tokens[role as keyof typeof tokens]);
      localStorage.removeItem('customerToken');
    }

    // Reload to reconnect socket
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('employeeToken');
    window.location.reload();
  };

  const currentToken = localStorage.getItem('customerToken') || localStorage.getItem('employeeToken');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              🚀 Socket.io Order Demo
            </h1>
            
            {/* Login/Logout */}
            <div className="flex items-center space-x-4">
              {!currentToken ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLogin('customer')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    👤 Đăng nhập Khách hàng
                  </button>
                  <button
                    onClick={() => handleLogin('chef')}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    👨‍🍳 Đăng nhập Bếp
                  </button>
                  <button
                    onClick={() => handleLogin('admin')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    👔 Đăng nhập Admin
                  </button>
                </div>
              ) : (
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  🚪 Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setViewMode('customer')}
            className={`px-6 py-2 rounded-lg font-medium ${
              viewMode === 'customer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👤 Khách hàng - Đặt món
          </button>
          <button
            onClick={() => setViewMode('kitchen')}
            className={`px-6 py-2 rounded-lg font-medium ${
              viewMode === 'kitchen'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👨‍🍳 Bếp - Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4">
        {!currentToken ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Chào mừng đến với Demo Socket.io</h2>
              <p className="text-gray-600 mb-6">
                Hệ thống đặt món real-time sử dụng Socket.io để thông báo ngay lập tức
              </p>
              
              <div className="space-y-4 text-left">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">👤 Khách hàng</h3>
                  <p className="text-sm text-gray-600">
                    - Đặt món và nhận thông báo xác nhận ngay lập tức<br/>
                    - Cập nhật real-time khi thêm món vào giỏ hàng
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold">👨‍🍳 Nhân viên bếp</h3>
                  <p className="text-sm text-gray-600">
                    - Nhận thông báo đơn hàng mới ngay lập tức<br/>
                    - Cập nhật trạng thái món ăn real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'customer' && <OrderingSystem />}
            {viewMode === 'kitchen' && <KitchenDashboard />}
          </>
        )}
      </div>

      {/* Instructions */}
      {currentToken && (
        <div className="fixed bottom-4 left-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="font-semibold mb-2">📋 Hướng dẫn test:</h3>
          <ul className="text-sm space-y-1">
            <li>1️⃣ Mở 2 tab: 1 tab Khách hàng, 1 tab Bếp</li>
            <li>2️⃣ Đặt món ở tab Khách hàng</li>
            <li>3️⃣ Xem thông báo real-time ở tab Bếp</li>
            <li>4️⃣ Kiểm tra notifications góc phải</li>
          </ul>
        </div>
      )}

      {/* Global Notifications */}
      <OrderNotifications />
    </div>
  );
};

export default OrderSocketDemo;