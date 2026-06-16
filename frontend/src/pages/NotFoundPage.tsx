import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardPath } from '../utils/roles';

export function NotFoundPage() {
  const { isAuthenticated, user } = useAuth();
  const home = isAuthenticated && user ? dashboardPath(user.role) : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-card">
        <p className="text-5xl font-bold text-indigo-600">404</p>
        <h1 className="mt-3 text-lg font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to={home}
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {isAuthenticated ? 'Back to dashboard' : 'Go to sign in'}
        </Link>
      </div>
    </div>
  );
}
