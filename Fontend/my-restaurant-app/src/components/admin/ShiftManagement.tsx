import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/api';
import { useSocket } from '../../hooks/useSocket';
import SocketStatus from '../common/SocketStatus';

interface Shift {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  date: string;
  department: 'kitchen' | 'service' | 'cashier' | 'management' | 'reception';
  requiredStaff: number;
  assignedStaff: Employee[] | string[]; // Can be populated Employee objects or just IDs
  status: 'draft' | 'published' | 'completed';
  createdBy: string | Employee;
  createdAt: string;
  notes?: string;
  totalHours?: number;
  duration?: number;
  isFullyStaffed?: boolean;
  remainingSlots?: number;
}

interface Employee {
  _id: string;
  name?: string;
  fullName?: string;
  email: string;
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier' | 'receptionist';
  department: 'kitchen' | 'service' | 'cashier' | 'management' | 'reception';
  isActive: boolean;
}

const ShiftManagement: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  
  const { connected, emit, on, off } = useSocket('employee');
  
  const [newShift, setNewShift] = useState<{
    name: string;
    startTime: string;
    endTime: string;
    date: string;
    department: 'kitchen' | 'service' | 'cashier' | 'management' | 'reception';
    requiredStaff: number;
  }>({
    name: '',
    startTime: '',
    endTime: '',
    date: '',
    department: 'service',
    requiredStaff: 1
  });

  const departmentLabels = {
    kitchen: '🍳 Bếp',
    service: '🍽️ Phục vụ',
    cashier: '💰 Thu ngân',
    management: '👔 Quản lý',
    reception: '📞 Lễ tân'
  };

  const statusLabels = {
    draft: '📝 Nháp',
    published: '📢 Đã xuất bản',
    completed: '✅ Hoàn thành'
  };

  // Lấy danh sách ca làm việc
  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/shifts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Shifts data from API:', data.data); // Debug log
        setShifts(data.data || []);
      } else {
        console.log('Shifts API error:', response.status, response.statusText);
        setError('Không thể tải danh sách ca làm việc');
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
      // Use mock data on error
      setShifts([]);
    }
  };

  // Lấy danh sách nhân viên
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Employees data from API:', data.data); // Debug log
        setEmployees(data.data.employees || []);
      } else {
        console.log('Employees API error:', response.status, response.statusText);
        setError('Không thể tải danh sách nhân viên');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tạo ca làm việc mới
  const createShift = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/shifts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newShift)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add the new shift to the list
          setShifts([...shifts, data.data]);
          setShowCreateModal(false);
          setNewShift({
            name: '',
            startTime: '',
            endTime: '',
            date: '',
            department: 'service',
            requiredStaff: 1
          });
        } else {
          setError(data.message || 'Lỗi khi tạo ca làm việc');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Lỗi khi tạo ca làm việc');
      }
    } catch (err) {
      setError('Lỗi khi tạo ca làm việc');
      console.error('Error creating shift:', err);
    }
  };

  // Phân công nhân viên vào ca
  const assignEmployeeToShift = async (shiftId: string, employeeId: string) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/shifts/${shiftId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the shift in local state
          const updatedShifts = shifts.map(shift => {
            if (shift._id === shiftId) {
              return data.data;
            }
            return shift;
          });
          setShifts(updatedShifts);
          
          // Emit Socket.io event for real-time updates
          if (connected && emit) {
            emit('shift_assignment_completed', {
              shiftId,
              employeeId,
              shift: data.data
            });
          }
          
          console.log('🔄 Assignment completed, refreshing...');
          setTimeout(() => {
            fetchEmployees();
          }, 100);
        } else {
          setError(data.message || 'Lỗi khi phân công nhân viên');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Lỗi khi phân công nhân viên');
      }
    } catch (err) {
      setError('Lỗi khi phân công nhân viên');
      console.error('Error assigning employee:', err);
    }
  };

  // Bỏ phân công nhân viên
  const unassignEmployeeFromShift = async (shiftId: string, employeeId: string) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/shifts/${shiftId}/unassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the shift in local state
          const updatedShifts = shifts.map(shift => {
            if (shift._id === shiftId) {
              return data.data;
            }
            return shift;
          });
          setShifts(updatedShifts);
          
          // Emit Socket.io event for real-time updates
          if (connected && emit) {
            emit('shift_unassignment_completed', {
              shiftId,
              employeeId,
              shift: data.data
            });
          }
          
          console.log('🔄 Refreshing employees after unassignment...');
          setTimeout(() => {
            fetchEmployees();
          }, 100);
        } else {
          setError(data.message || 'Lỗi khi bỏ phân công nhân viên');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Lỗi khi bỏ phân công nhân viên');
      }
    } catch (err) {
      setError('Lỗi khi bỏ phân công nhân viên');
      console.error('Error unassigning employee:', err);
    }
  };

  // Cập nhật trạng thái ca làm việc
  const updateShiftStatus = async (shiftId: string, status: Shift['status']) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.AUTH_API}/auth/shifts/${shiftId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the shift in local state
          const updatedShifts = shifts.map(shift => {
            if (shift._id === shiftId) {
              return data.data;
            }
            return shift;
          });
          setShifts(updatedShifts);
        } else {
          setError(data.message || 'Lỗi khi cập nhật trạng thái ca làm việc');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Lỗi khi cập nhật trạng thái ca làm việc');
      }
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái ca làm việc');
      console.error('Error updating shift status:', err);
    }
  };

  // Xóa ca làm việc
  const deleteShift = async (shiftId: string) => {
    if (confirm('Bạn có chắc muốn xóa ca làm việc này?')) {
      try {
        const token = localStorage.getItem('employeeToken');
        const response = await fetch(`${API_CONFIG.AUTH_API}/auth/shifts/${shiftId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Remove the shift from local state
            setShifts(shifts.filter(shift => shift._id !== shiftId));
          } else {
            setError(data.message || 'Lỗi khi xóa ca làm việc');
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Lỗi khi xóa ca làm việc');
        }
      } catch (err) {
        setError('Lỗi khi xóa ca làm việc');
        console.error('Error deleting shift:', err);
      }
    }
  };

  // Lấy tên nhân viên theo ID hoặc object
  const getEmployeeId = (employee: string | Employee): string => {
    return typeof employee === 'string' ? employee : employee._id;
  };

  const getEmployeeName = (employee: string | Employee): string => {
    if (typeof employee === 'string') {
      // Nếu là string (ObjectId), tìm trong danh sách employees
      const emp = employees.find(e => e._id === employee);
      return emp?.name || emp?.fullName || employee; // Fallback to ID if not found
    }
    // Nếu là object Employee (populated từ backend)
    return employee.name || employee.fullName || 'Không tìm thấy';
  };

  // Lọc nhân viên theo phòng ban
  const getAvailableEmployees = (department: string) => {
    return employees.filter(emp => 
      emp.department === department && 
      emp.isActive &&
      !selectedShift?.assignedStaff.some(assigned => 
        typeof assigned === 'string' ? assigned === emp._id : assigned._id === emp._id
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (time: string) => {
    return time;
  };

  useEffect(() => {
    const handleShiftAssignmentUpdate = (data: unknown) => {
      console.log('🔄 Received shift_assignment_update:', data);
      
      const assignmentData = data as { 
        shift: Shift; 
        assignedEmployee?: string;
        unassignedEmployee?: string;
        message: string; 
        timestamp: string; 
      };
      
      // Cập nhật shifts để phản ánh việc assignment/unassignment
      setShifts(prev => prev.map(shift => 
        shift._id === assignmentData.shift._id ? assignmentData.shift : shift
      ));
      
      // Cập nhật selectedShift nếu đang mở modal phân công
      if (selectedShift && selectedShift._id === assignmentData.shift._id) {
        setSelectedShift(assignmentData.shift);
      }
      
      console.log('🔄 Refreshing employees after assignment/unassignment...');
      setTimeout(() => {
        fetchEmployees();
      }, 100);
    };

    if (connected) {
      console.log('🔌 Socket connected, setting up listeners');
      on('shift_assignment_update', handleShiftAssignmentUpdate);

      return () => {
        console.log('🔌 Cleaning up socket listeners');
        off('shift_assignment_update', handleShiftAssignmentUpdate);
      };
    }
  }, [connected, selectedShift]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchShifts();
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
        <div>🔄 Đang tải dữ liệu phân ca...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <SocketStatus />
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            📅 Quản lý phân ca
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Tổng số ca làm việc: {shifts.length}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
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
          ➕ Tạo ca mới
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

      {/* Danh sách ca làm việc */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 100px 120px 120px 100px 120px 150px 120px 150px',
          gap: '12px',
          padding: '16px 20px',
          background: '#f8fafc',
          fontWeight: '600',
          fontSize: '14px',
          color: '#374151',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <span>Ca làm việc</span>
          <span>Ngày</span>
          <span>Giờ bắt đầu</span>
          <span>Giờ kết thúc</span>
          <span>Phòng ban</span>
          <span>Cần/Có</span>
          <span>Nhân viên</span>
          <span>Trạng thái</span>
          <span>Hành động</span>
        </div>

        {/* Shift rows */}
        {shifts.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#6b7280' 
          }}>
            📅 Chưa có ca làm việc nào được tạo
          </div>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 100px 120px 120px 100px 120px 150px 120px 150px',
                gap: '12px',
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6',
                alignItems: 'center',
                fontSize: '14px'
              }}
            >
              {/* Tên ca */}
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                {shift.name}
              </div>

              {/* Ngày */}
              <span style={{ color: '#4b5563' }}>
                {formatDate(shift.date)}
              </span>

              {/* Giờ bắt đầu */}
              <span style={{ color: '#059669', fontWeight: '600' }}>
                {formatTime(shift.startTime)}
              </span>

              {/* Giờ kết thúc */}
              <span style={{ color: '#dc2626', fontWeight: '600' }}>
                {formatTime(shift.endTime)}
              </span>

              {/* Phòng ban */}
              <span style={{ color: '#4b5563' }}>
                {departmentLabels[shift.department]}
              </span>

              {/* Cần/Có nhân viên */}
              <span style={{
                color: shift.assignedStaff.length >= shift.requiredStaff ? '#059669' : '#dc2626',
                fontWeight: '600'
              }}>
                {shift.assignedStaff.length}/{shift.requiredStaff}
              </span>

              {/* Danh sách nhân viên */}
              <div style={{ fontSize: '12px' }}>
                {shift.assignedStaff.length === 0 ? (
                  <span style={{ color: '#6b7280' }}>Chưa phân công</span>
                ) : (
                  shift.assignedStaff.slice(0, 2).map((emp) => {
                    const empId = getEmployeeId(emp);
                    const empName = getEmployeeName(emp);
                    return (
                      <div key={empId} style={{ color: '#4b5563' }}>
                        👤 {empName}
                      </div>
                    );
                  })
                )}
                {shift.assignedStaff.length > 2 && (
                  <div style={{ color: '#6b7280' }}>
                    +{shift.assignedStaff.length - 2} khác
                  </div>
                )}
              </div>

              {/* Trạng thái */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                background: shift.status === 'completed' ? '#d1fae5' : 
                           shift.status === 'published' ? '#dbeafe' : '#f3f4f6',
                color: shift.status === 'completed' ? '#065f46' : 
                       shift.status === 'published' ? '#1e40af' : '#4b5563'
              }}>
                {statusLabels[shift.status]}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setSelectedShift(shift);
                    setShowAssignModal(true);
                  }}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  title="Phân công"
                >
                  👥
                </button>
                
                {shift.status === 'draft' && (
                  <button
                    onClick={() => updateShiftStatus(shift._id, 'published')}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                    title="Xuất bản"
                  >
                    📢
                  </button>
                )}

                {shift.status === 'published' && (
                  <button
                    onClick={() => updateShiftStatus(shift._id, 'completed')}
                    style={{
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                    title="Hoàn thành"
                  >
                    ✅
                  </button>
                )}

                <button
                  onClick={() => deleteShift(shift._id)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  title="Xóa"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Shift Modal */}
      {showCreateModal && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              ➕ Tạo ca làm việc mới
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Tên ca làm việc *
              </label>
              <input
                type="text"
                value={newShift.name}
                onChange={(e) => setNewShift({...newShift, name: e.target.value})}
                placeholder="VD: Ca sáng, Ca chiều, Ca đêm..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Ngày *
                </label>
                <input
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({...newShift, date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Phòng ban *
                </label>
                <select
                  value={newShift.department}
                  onChange={(e) => setNewShift({...newShift, department: e.target.value as Shift['department']})}
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Giờ bắt đầu *
                </label>
                <input
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Giờ kết thúc *
                </label>
                <input
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Số nhân viên cần *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newShift.requiredStaff}
                  onChange={(e) => setNewShift({...newShift, requiredStaff: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewShift({
                    name: '',
                    startTime: '',
                    endTime: '',
                    date: '',
                    department: 'service',
                    requiredStaff: 1
                  });
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
                onClick={createShift}
                disabled={!newShift.name || !newShift.date || !newShift.startTime || !newShift.endTime}
                style={{
                  background: newShift.name && newShift.date && newShift.startTime && newShift.endTime
                    ? '#6b7280'
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: newShift.name && newShift.date && newShift.startTime && newShift.endTime
                    ? 'pointer'
                    : 'not-allowed',
                  letterSpacing: '0.3px'
                }}
              >
                💾 Tạo ca làm việc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && selectedShift && (
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
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              👥 Phân công nhân viên: {selectedShift.name}
            </h3>

            <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                📅 {formatDate(selectedShift.date)} | 
                🕐 {formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)} | 
                {departmentLabels[selectedShift.department]} | 
                Cần: {selectedShift.requiredStaff} người
              </p>
            </div>

            {/* Nhân viên đã được phân công */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                ✅ Nhân viên đã được phân công ({selectedShift.assignedStaff.length})
              </h4>
              {selectedShift.assignedStaff.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Chưa có nhân viên nào được phân công</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedShift.assignedStaff.map(emp => {
                    const empId = getEmployeeId(emp);
                    const empName = getEmployeeName(emp);
                    return (
                      <div key={empId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#d1fae5',
                        borderRadius: '6px'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          👤 {empName}
                        </span>
                        <button
                          onClick={() => unassignEmployeeFromShift(selectedShift._id, empId)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Bỏ phân công
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nhân viên có thể phân công */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                👥 Nhân viên có thể phân công ({getAvailableEmployees(selectedShift.department).length})
              </h4>
              {getAvailableEmployees(selectedShift.department).length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Không có nhân viên nào có thể phân công cho phòng ban này
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {getAvailableEmployees(selectedShift.department).map(employee => (
                    <div key={employee._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f3f4f6',
                      borderRadius: '6px'
                    }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          👤 {employee.name}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                          ({employee.email})
                        </span>
                      </div>
                      <button
                        onClick={() => assignEmployeeToShift(selectedShift._id, employee._id)}
                        disabled={selectedShift.assignedStaff.length >= selectedShift.requiredStaff}
                        style={{
                          background: selectedShift.assignedStaff.length >= selectedShift.requiredStaff
                            ? '#d1d5db' : '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: selectedShift.assignedStaff.length >= selectedShift.requiredStaff
                            ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Phân công
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedShift(null);
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
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;