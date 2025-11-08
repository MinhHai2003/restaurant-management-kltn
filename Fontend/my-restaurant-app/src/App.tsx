import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import HomePage from './pages/HomePage'
import DatBanPage from './pages/DatBanPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EmployeeLoginPage from './pages/EmployeeLoginPage' // Employee login with Socket.io
import EmployeeRegisterPage from './pages/EmployeeRegisterPage'
import StoreSystem from './pages/StoreSystem'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ProfilePage from './pages/account/ProfilePage'
import OrdersPage from './pages/account/OrdersPage'
import ReservationsPage from './pages/account/ReservationsPage'
import AddressesPage from './pages/account/AddressesPage'
import RecommendationsPage from './pages/account/RecommendationsPage'
import AdminDashboard from './pages/AdminDashboard'
import OrderSocketDemo from './pages/OrderSocketDemo'
import TableMenuPage from './pages/TableMenuPage'
import TableQRGenerator from './pages/TableQRGenerator'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedEmployeeRoute from './components/ProtectedEmployeeRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            
            {/* Employee Authentication Routes */}
            <Route path="/employee-login" element={<EmployeeLoginPage />} />
            <Route path="/employee-register" element={<EmployeeRegisterPage />} />
            <Route path="/nhan-vien/dang-nhap" element={<EmployeeLoginPage />} />
            <Route path="/nhan-vien/dang-ky" element={<EmployeeRegisterPage />} />
            
            <Route path="/he-thong-cua-hang" element={<StoreSystem />} />
            <Route path="/cua-hang" element={<StoreSystem />} />
            <Route path="/store-system" element={<StoreSystem />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/gio-hang" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/thanh-toan" element={<CheckoutPage />} />
            <Route path="/dat-ban" element={<DatBanPage />} />
            {/* Category routes */}
            <Route path="/menu/:slug" element={<CategoryPage />} />
            <Route path="/sp/:slug/all" element={<CategoryPage />} />
            <Route path="/sp/group/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* Socket.io Order Demo */}
            <Route path="/order-socket-demo" element={<OrderSocketDemo />} />
            <Route path="/socket-demo" element={<OrderSocketDemo />} />
            
            {/* Table Ordering Route */}
            <Route path="/table/:tableNumber" element={<TableMenuPage />} />
            
            {/* QR Generator for Admin */}
            <Route path="/admin/qr-generator" element={<TableQRGenerator />} />
            
            {/* Menu-Inventory Integration Test */}
            
            {/* Admin Routes - Protected for Employees */}
            <Route path="/admin" element={
              <ProtectedEmployeeRoute>
                <AdminDashboard />
              </ProtectedEmployeeRoute>
            } />
            <Route path="/quan-tri" element={
              <ProtectedEmployeeRoute>
                <AdminDashboard />
              </ProtectedEmployeeRoute>
            } />
            <Route path="/AdminDashboard" element={
              <ProtectedEmployeeRoute>
                <AdminDashboard />
              </ProtectedEmployeeRoute>
            } />
            
            {/* Account Routes - Protected */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/profile/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/reservations" element={
              <ProtectedRoute>
                <ReservationsPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/addresses" element={
              <ProtectedRoute>
                <AddressesPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/recommendations" element={
              <ProtectedRoute>
                <RecommendationsPage />
              </ProtectedRoute>
            } />
          </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
