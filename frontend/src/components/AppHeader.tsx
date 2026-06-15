import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatRole } from '../utils/formatters';

/** Top bar shown on authenticated pages: identity + logout. */
export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <h1 className="text-lg font-semibold text-gray-900">
        Store Rating Platform
      </h1>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <span className="text-gray-600">
            {user.name} · {formatRole(user.role)}
          </span>
        ) : null}
        <button
          onClick={handleLogout}
          className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
