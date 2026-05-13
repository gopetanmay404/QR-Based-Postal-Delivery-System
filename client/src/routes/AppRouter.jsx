import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PostmanLoginPage from '../pages/auth/PostmanLoginPage';

// Dashboard pages
import UserDashboard from '../pages/user/UserDashboard';
import PostmanDashboard from '../pages/postman/PostmanDashboard';
import DeliveryNavigation from '../pages/postman/DeliveryNavigation';
import AdminDashboard from '../pages/admin/AdminDashboard';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRouter() {
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'POSTMAN': return '/postman';
      default: return '/dashboard';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/postman-login" element={<PostmanLoginPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'POSTMAN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* User routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['USER']}>
              <UserDashboard />
            </ProtectedRoute>
          } />

          {/* Postman routes */}
          <Route path="/postman" element={
            <ProtectedRoute allowedRoles={['POSTMAN']}>
              <PostmanDashboard />
            </ProtectedRoute>
          } />
          <Route path="/postman/navigate/:deliveryId" element={
            <ProtectedRoute allowedRoles={['POSTMAN']}>
              <DeliveryNavigation />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
