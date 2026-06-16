import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardPath } from '../utils/roles';

export function ForbiddenPage() {
  const { isAuthenticated, user } = useAuth();
  const home = isAuthenticated && user ? dashboardPath(user.role) : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-card">
        <p className="text-5xl font-bold text-amber-500">403</p>
        <h1 className="mt-3 text-lg font-semibold text-gray-900">Access denied</h1>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to view this page with your current role.
        </p>
        <Link
          to={home}
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to your dashboard
        </Link>
      </div>
    </div>
  );
}
