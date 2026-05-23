import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getUser, isLoggedIn } from './auth';
import { ThemeProvider } from './context/ThemeContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDashboard from './pages/MerchantDashboard';
import ProductCreate from './pages/ProductCreate';
import PublicProduct from './pages/PublicProduct';
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

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
const pageTransition = { duration: 0.18, ease: 'easeOut' };

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/merchant" element={<RequireAuth role="merchant"><MerchantDashboard /></RequireAuth>} />
          <Route path="/merchant/products/new" element={<RequireAuth role="merchant"><ProductCreate /></RequireAuth>} />
          <Route path="/product/:id" element={<PublicProduct />} />
          <Route path="/product/:id/report" element={<Report />} />
          <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
          <Route path="/demo/attacker" element={<AttackerView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-zinc-950">
          <Navbar />
          <AnimatedRoutes />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
