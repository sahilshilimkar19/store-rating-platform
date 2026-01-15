import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* User Routes */}
          <Route
            path="/stores"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Store Owner Routes */}
          <Route
            path="/store-owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['store_owner']}>
                <StoreOwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Error Pages */}
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="card text-center max-w-md">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
                  <p className="text-xl text-gray-600 mb-6">Unauthorized Access</p>
                  <p className="text-gray-500 mb-6">
                    You don't have permission to access this page.
                  </p>
                  <a href="/login" className="btn-primary">
                    Go to Login
                  </a>
                </div>
              </div>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;