import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getUser, isLoggedIn } from './auth';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDashboard from './pages/MerchantDashboard';
import ProductCreate from './pages/ProductCreate';
import PublicProduct from './pages/PublicProduct';
import PublicStore from './pages/PublicStore';
import Report from './pages/Report';
import AdminDashboard from './pages/AdminDashboard';
import AttackerView from './pages/AttackerView';
import Navbar from './components/Navbar';

function RequireAuth({ children, role }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (role) {
    const user = getUser();
    if (user?.role !== role) return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/merchant" element={<RequireAuth role="merchant"><MerchantDashboard /></RequireAuth>} />
          <Route path="/merchant/products/new" element={<RequireAuth role="merchant"><ProductCreate /></RequireAuth>} />
          <Route path="/store/:id" element={<PublicStore />} />
          <Route path="/product/:id" element={<PublicProduct />} />
          <Route path="/product/:id/report" element={<Report />} />
          <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
          <Route path="/demo/attacker" element={<AttackerView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
