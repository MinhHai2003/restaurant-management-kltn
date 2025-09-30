// Employee Authentication Helper - Sử dụng auth-service thật
export const AdminAuthHelper = {
  // Đăng nhập nhân viên thật qua auth-service
  login: async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const { user, accessToken } = data.data;
        
        // Chỉ allow admin, manager, waiter, chef, cashier login
        if (!['admin', 'manager', 'waiter', 'chef', 'cashier', 'delivery', 'receptionist'].includes(user.role)) {
          throw new Error('Không có quyền truy cập hệ thống');
        }

        // Lưu token và thông tin user
        localStorage.setItem('employeeToken', accessToken);
        localStorage.setItem('employeeData', JSON.stringify(user));
        
        console.log('✅ Đăng nhập nhân viên thành công:', user.name, '- Role:', user.role);
        return { success: true, user, token: accessToken };
      } else {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      console.error('❌ Lỗi đăng nhập:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Xóa token admin
  logout: () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('authToken');
    console.log('🔓 Đã đăng xuất nhân viên');
  },

  // Kiểm tra token hiện tại
  checkCurrentToken: () => {
    const token = localStorage.getItem('employeeToken');
    const employeeData = localStorage.getItem('employeeData');
    
    if (token && employeeData) {
      try {
        const user = JSON.parse(employeeData);
        console.log('✅ Có token nhân viên:', user.name, '- Role:', user.role);
        return { hasToken: true, user };
      } catch {
        console.log('❌ Token không hợp lệ');
        return { hasToken: false };
      }
    } else {
      console.log('❌ Không có token nhân viên');
      return { hasToken: false };
    }
  },

  // Validate token với server
  validateToken: async () => {
    const token = localStorage.getItem('employeeToken');
    if (!token) return { valid: false };

    try {
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, user: data.data };
      } else {
        // Token expired hoặc invalid
        AdminAuthHelper.logout();
        return { valid: false };
      }
    } catch (error) {
      console.error('❌ Lỗi validate token:', error);
      return { valid: false };
    }
  }
};

export default AdminAuthHelper;