import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StoreSystem from './pages/StoreSystem'
import './App.css'

function App() {
  return (
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
      </Routes>
    </Router>
  )
}

export default App
