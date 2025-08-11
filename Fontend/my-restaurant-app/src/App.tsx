import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import HomePage from './pages/HomePage'
import DatBanPage from './pages/DatBanPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StoreSystem from './pages/StoreSystem'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ProfilePage from './pages/account/ProfilePage'
import OrdersPage from './pages/account/OrdersPage'
import ReservationsPage from './pages/account/ReservationsPage'
import AddressesPage from './pages/account/AddressesPage'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/he-thong-cua-hang" element={<StoreSystem />} />
            <Route path="/cua-hang" element={<StoreSystem />} />
            <Route path="/store-system" element={<StoreSystem />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/gio-hang" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/thanh-toan" element={<CheckoutPage />} />
            <Route path="/dat-ban" element={<DatBanPage />} />
            
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
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
