import React, { useState, useEffect } from 'react';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier' | 'receptionist';
  department: 'kitchen' | 'service' | 'cashier' | 'management' | 'reception';
  phone?: string;
  address?: string;
  salary?: number;
  isActive: boolean;
  hireDate: string;
  lastLogin?: string;
  createdAt: string;
}

const StaffManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const roleLabels = {
    admin: '🔧 Quản trị viên',
    manager: '👔 Quản lý',
    waiter: '🍽️ Nhân viên phục vụ',
    chef: '👨‍🍳 Đầu bếp',
    cashier: '💰 Thu ngân',
    receptionist: '📞 Lễ tân'
  };

  const departmentLabels = {
    kitchen: '🍳 Bếp',
    service: '🍽️ Phục vụ',
    cashier: '💰 Thu ngân',
    management: '👔 Quản lý',
    reception: '📞 Lễ tân'
  };

  // Lấy danh sách nhân viên
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch('http://localhost:5001/api/auth/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data.employees || []);
      } else {
        setError('Không thể tải danh sách nhân viên');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật thông tin nhân viên
  const updateEmployee = async (employeeId: string, updateData: Partial<Employee>) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`http://localhost:5001/api/auth/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchEmployees(); // Reload danh sách
        setShowEditModal(false);
        setEditingEmployee(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Không thể cập nhật thông tin nhân viên');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Error updating employee:', err);
    }
  };

  // Toggle trạng thái active/inactive
  const toggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    if (confirm(`Bạn có chắc muốn ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản này?`)) {
      await updateEmployee(employeeId, { isActive: !currentStatus });
    }
  };

  // Xóa nhân viên
  const deleteEmployee = async (employeeId: string, employeeName: string) => {
    if (confirm(`Bạn có chắc muốn xóa nhân viên "${employeeName}"? Hành động này không thể hoàn tác!`)) {
      try {
        const token = localStorage.getItem('employeeToken');
        const response = await fetch(`http://localhost:5001/api/auth/employees/${employeeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          await fetchEmployees();
        } else {
          setError('Không thể xóa nhân viên');
        }
      } catch (err) {
        setError('Lỗi kết nối server');
        console.error('Error deleting employee:', err);
      }
    }
  };

  // Mở modal chỉnh sửa
  const openEditModal = (employee: Employee) => {
    setEditingEmployee({ ...employee });
    setShowEditModal(true);
  };

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Format lương
  const formatSalary = (salary?: number) => {
    if (!salary) return 'Chưa cập nhật';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(salary);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div>🔄 Đang tải danh sách nhân viên...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            👥 Quản lý nhân sự
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Tổng số nhân viên: {employees.length}
          </p>
        </div>
        
        <button
          onClick={() => window.open('/employee-register', '_blank')}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Thêm nhân viên mới
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Danh sách nhân viên */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 120px 100px 120px 80px 100px 120px',
          gap: '16px',
          padding: '16px 20px',
          background: '#f8fafc',
          fontWeight: '600',
          fontSize: '14px',
          color: '#374151',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <span>Nhân viên</span>
          <span>Vai trò</span>
          <span>Phòng ban</span>
          <span>Trạng thái</span>
          <span>Lương</span>
          <span>Ngày vào</span>
          <span>Hoạt động</span>
          <span>Hành động</span>
        </div>

        {/* Employee rows */}
        {employees.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#6b7280' 
          }}>
            📋 Chưa có nhân viên nào trong hệ thống
          </div>
        ) : (
          employees.map((employee) => (
            <div
              key={employee._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 100px 120px 80px 100px 120px',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6',
                alignItems: 'center',
                fontSize: '14px',
                opacity: employee.isActive ? 1 : 0.6
              }}
            >
              {/* Thông tin nhân viên */}
              <div>
                <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                  {employee.name}
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>
                  📧 {employee.email}
                </div>
                {employee.phone && (
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    📱 {employee.phone}
                  </div>
                )}
              </div>

              {/* Vai trò */}
              <span style={{ 
                color: employee.role === 'admin' ? '#dc2626' : '#059669',
                fontWeight: '600'
              }}>
                {roleLabels[employee.role]}
              </span>

              {/* Phòng ban */}
              <span style={{ color: '#4b5563' }}>
                {departmentLabels[employee.department]}
              </span>

              {/* Trạng thái */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                background: employee.isActive ? '#d1fae5' : '#fee2e2',
                color: employee.isActive ? '#065f46' : '#dc2626'
              }}>
                {employee.isActive ? '✅ Hoạt động' : '❌ Tạm ngưng'}
              </span>

              {/* Lương */}
              <span style={{ color: '#059669', fontWeight: '600', fontSize: '12px' }}>
                {formatSalary(employee.salary)}
              </span>

              {/* Ngày vào làm */}
              <span style={{ color: '#6b7280', fontSize: '12px' }}>
                {formatDate(employee.hireDate || employee.createdAt)}
              </span>

              {/* Lần đăng nhập cuối */}
              <span style={{ color: '#6b7280', fontSize: '12px' }}>
                {employee.lastLogin ? formatDate(employee.lastLogin) : 'Chưa đăng nhập'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditModal(employee)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  title="Chỉnh sửa"
                >
                  ✏️
                </button>
                
                <button
                  onClick={() => toggleEmployeeStatus(employee._id, employee.isActive)}
                  style={{
                    background: employee.isActive ? '#f59e0b' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  title={employee.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                >
                  {employee.isActive ? '🚫' : '✅'}
                </button>

                <button
                  onClick={() => deleteEmployee(employee._id, employee.name)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  title="Xóa nhân viên"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              ✏️ Chỉnh sửa nhân viên: {editingEmployee.name}
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              updateEmployee(editingEmployee._id, {
                role: editingEmployee.role,
                department: editingEmployee.department,
                salary: editingEmployee.salary,
                isActive: editingEmployee.isActive
              });
            }}>
              {/* Vai trò */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Vai trò *
                </label>
                <select
                  value={editingEmployee.role}
                  onChange={(e) => setEditingEmployee({
                    ...editingEmployee,
                    role: e.target.value as Employee['role']
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Phòng ban */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Phòng ban *
                </label>
                <select
                  value={editingEmployee.department}
                  onChange={(e) => setEditingEmployee({
                    ...editingEmployee,
                    department: e.target.value as Employee['department']
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {Object.entries(departmentLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Lương */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Lương (VNĐ)
                </label>
                <input
                  type="number"
                  value={editingEmployee.salary || ''}
                  onChange={(e) => setEditingEmployee({
                    ...editingEmployee,
                    salary: e.target.value ? Number(e.target.value) : undefined
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="10000000"
                />
              </div>

              {/* Trạng thái */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingEmployee.isActive}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      isActive: e.target.checked
                    })}
                  />
                  <span style={{ fontWeight: '600' }}>Tài khoản đang hoạt động</span>
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmployee(null);
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💾 Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;