import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { AdminUsersPage } from './pages/admin/UsersPage';
import { AdminUserDetailPage } from './pages/admin/UserDetailPage';
import { AdminStoresPage } from './pages/admin/StoresPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OwnerDashboardPage } from './pages/owner/DashboardPage';
import { StoresPage } from './pages/user/StoresPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { dashboardPath } from './utils/roles';

/** Sends "/" (and unknown routes) to the right place based on auth state. */
function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected, role-scoped */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminUserDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/stores"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminStoresPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/stores"
            element={
              <PrivateRoute allowedRoles={['normal']}>
                <StoresPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute allowedRoles={['normal']}>
                <ChangePasswordPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <PrivateRoute allowedRoles={['store_owner']}>
                <OwnerDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/change-password"
            element={
              <PrivateRoute allowedRoles={['store_owner']}>
                <ChangePasswordPage />
              </PrivateRoute>
            }
          />

          {/* Fallbacks */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
