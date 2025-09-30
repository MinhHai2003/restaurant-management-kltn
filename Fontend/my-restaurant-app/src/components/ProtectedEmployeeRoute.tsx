import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ProtectedEmployeeRouteProps {
  children: ReactNode;
  requiredRole?: string[];
}

const ProtectedEmployeeRoute: React.FC<ProtectedEmployeeRouteProps> = ({ 
  children, 
  requiredRole = [] 
}) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const token = localStorage.getItem('employeeToken');
  
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.log('❌ No employee token found');
        setIsValidating(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        // Tạm thời chỉ kiểm tra localStorage cho đến khi auth-service hoạt động
        const employeeData = localStorage.getItem('employeeData');
        if (employeeData) {
          const user = JSON.parse(employeeData);
          console.log('✅ Using cached employee data:', user.name, '- Role:', user.role);
          
          // Kiểm tra role
          const allowedRoles = ['admin', 'manager', 'waiter', 'chef', 'cashier', 'delivery', 'receptionist'];
          if (!allowedRoles.includes(user.role)) {
            console.log('❌ Role not allowed:', user.role);
            setIsAuthenticated(false);
            setIsValidating(false);
            return;
          }
          
          setIsAuthenticated(true);
          
          // Kiểm tra quyền truy cập cụ thể
          if (requiredRole.length > 0) {
            setHasPermission(requiredRole.includes(user.role));
          } else {
            setHasPermission(true);
          }
          setIsValidating(false);
          return;
        }

        console.log('🔍 ProtectedEmployeeRoute: Validating token with server...');
        // Validate token với server (fallback)
        const response = await fetch('http://localhost:5001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('📡 Profile API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          const user = data.data;
          
          console.log('✅ User authenticated:', user.name, '- Role:', user.role);
          
          // Kiểm tra role
          const allowedRoles = ['admin', 'manager', 'waiter', 'chef', 'cashier', 'delivery', 'receptionist'];
          if (!allowedRoles.includes(user.role)) {
            console.log('❌ Role not allowed:', user.role);
            setIsAuthenticated(false);
            setIsValidating(false);
            return;
          }
          
          setIsAuthenticated(true);
          
          // Kiểm tra quyền truy cập cụ thể
          if (requiredRole.length > 0) {
            setHasPermission(requiredRole.includes(user.role));
          } else {
            setHasPermission(true);
          }
        } else {
          console.log('❌ Token validation failed, status:', response.status);
          // Token expired hoặc invalid
          localStorage.removeItem('employeeToken');
          localStorage.removeItem('employeeData');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Auth service not available, using localStorage fallback');
        
        // Fallback: Sử dụng localStorage nếu auth-service không hoạt động
        const employeeData = localStorage.getItem('employeeData');
        if (employeeData) {
          try {
            const user = JSON.parse(employeeData);
            console.log('✅ Fallback: Using cached employee data:', user.name, '- Role:', user.role);
            
            const allowedRoles = ['admin', 'manager', 'waiter', 'chef', 'cashier', 'delivery', 'receptionist'];
            if (allowedRoles.includes(user.role)) {
              setIsAuthenticated(true);
              setHasPermission(true);
            } else {
              setIsAuthenticated(false);
            }
          } catch (parseError) {
            console.error('❌ Error parsing employee data:', parseError);
            localStorage.removeItem('employeeToken');
            localStorage.removeItem('employeeData');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
      
      setIsValidating(false);
    };

    validateToken();
  }, [token, requiredRole]);
  
  // Loading state
  if (isValidating) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Đang xác thực quyền truy cập...
          </p>
        </div>
      </div>
    );
  }
  
  // Kiểm tra có token và đã xác thực không
  if (!isAuthenticated) {
    return <Navigate to="/employee-login" replace />;
  }
  
  // Kiểm tra quyền truy cập
  if (!hasPermission) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
          <h2 style={{ 
            color: '#dc2626', 
            marginBottom: '12px',
            fontSize: '24px'
          }}>
            Không có quyền truy cập
          </h2>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '24px',
            fontSize: '16px'
          }}>
            Bạn không có quyền truy cập vào trang này.
          </p>
          <button
            onClick={() => window.location.href = '/employee-login'}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            → Đăng nhập lại
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default ProtectedEmployeeRoute;