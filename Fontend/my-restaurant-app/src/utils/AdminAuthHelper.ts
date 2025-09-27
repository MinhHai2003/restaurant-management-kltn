// Utility để thiết lập token admin cho testing
export const AdminAuthHelper = {
  // Tạo token admin giả cho testing (chỉ dùng trong development)
  setDemoAdminToken: () => {
    // Token giả với payload { role: "admin", id: "admin-001" }
    // Trong thực tế, token này sẽ được tạo từ backend sau khi đăng nhập thành công
    const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpZCI6ImFkbWluLTAwMSIsImlhdCI6MTcwNjI2ODAwMCwiZXhwIjoxNzA2MzU0NDAwfQ.demo-token-for-testing';
    localStorage.setItem('adminToken', demoToken);
    localStorage.setItem('authToken', demoToken); // Backup key
    console.log('🔐 Demo admin token đã được thiết lập!');
  },

  // Xóa token admin
  clearAdminToken: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('authToken');
    console.log('🔓 Admin token đã được xóa!');
  },

  // Kiểm tra token hiện tại
  checkCurrentToken: () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    if (token) {
      console.log('✅ Có token admin:', token.substring(0, 50) + '...');
      return true;
    } else {
      console.log('❌ Không có token admin');
      return false;
    }
  }
};

// Auto-setup token admin khi trong development mode
if (process.env.NODE_ENV === 'development') {
  // Tự động thiết lập token admin nếu chưa có
  if (!localStorage.getItem('adminToken') && !localStorage.getItem('authToken')) {
    AdminAuthHelper.setDemoAdminToken();
  }
}

export default AdminAuthHelper;