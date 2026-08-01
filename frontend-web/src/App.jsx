import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useCart } from './context/CartContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart ? useCart() : { cart: [] };

  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">EShop</Link>
      <nav className="flex gap-4 items-center">
        <Link to="/cart" className="hover:underline">Giỏ hàng</Link>
        {user ? (
          <div className="flex gap-4 items-center">
            <Link to="/profile" className="hover:underline text-yellow-300">
              <span dangerouslySetInnerHTML={{ __html: `Chào, ${user.name}` }} />
            </Link>
            <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">Thoát</button>
          </div>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Đăng nhập</Link>
            <Link to="/register" className="hover:underline">Đăng ký</Link>
          </>
        )}
      </nav>
    </header>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow p-4 container mx-auto max-w-5xl">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
              </Routes>
            </main>
            <footer className="bg-gray-800 text-white text-center p-4 mt-8">
              &copy; 2026 EShop SUT. Dành cho mục đích kiểm thử.
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
