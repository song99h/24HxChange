import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar          from './components/Navbar';
import Home            from './pages/Home';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import ProductDetails  from './pages/ProductDetails';
import EditProduct     from './pages/EditProduct';
import SavedItems      from './pages/SavedItems';
import MyAccount       from './pages/MyAccount';
import ChatSeller      from './pages/ChatSeller';
import BecomeSeller    from './components/BecomeSeller';
import VendorDashboard from './components/VendorDashboard';
import AdminDashboard  from './pages/AdminDashboard';
import MyOrders        from './pages/MyOrders';
import AddProduct      from './pages/AddProduct';
import NotFound        from './pages/NotFound';
import Loader          from './components/Loader';

// ── Protected Route ───────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const [savedItems, setSavedItems] = useState([]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar savedItems={savedItems} />
      <Routes>
        {/* ── Public ── */}
        <Route path="/"            element={<Home savedItems={savedItems} setSavedItems={setSavedItems} />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/signup"      element={<Signup />} />

        {/* ── Logged-in users ── */}
        <Route path="/saved"         element={<ProtectedRoute><SavedItems savedItems={savedItems} setSavedItems={setSavedItems} /></ProtectedRoute>} />
        <Route path="/my-account"    element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
        <Route path="/my-orders"     element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/chat"          element={<ProtectedRoute><ChatSeller /></ProtectedRoute>} />
        <Route path="/become-seller" element={<ProtectedRoute><BecomeSeller /></ProtectedRoute>} />

        {/* ── Vendor / Admin ── */}
        <Route path="/vendor-dashboard" element={<ProtectedRoute roles={['vendor','admin']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/add-product"      element={<ProtectedRoute roles={['vendor','admin']}><AddProduct /></ProtectedRoute>} />
        <Route path="/edit-product/:id" element={<ProtectedRoute roles={['vendor','admin']}><EditProduct /></ProtectedRoute>} />

        {/* ── Admin only ── */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
