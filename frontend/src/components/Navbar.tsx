import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { formatRole } from '../utils/formatters';

interface NavItem {
  to: string;
  label: string;
}

/** Section links per role — drives the role-aware navigation. */
const LINKS: Record<Role, NavItem[]> = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/stores', label: 'Stores' },
  ],
  normal: [
    { to: '/stores', label: 'Stores' },
    { to: '/profile', label: 'Change Password' },
  ],
  store_owner: [
    { to: '/owner/dashboard', label: 'Dashboard' },
    { to: '/owner/change-password', label: 'Change Password' },
  ],
};

/** Role-aware top navigation bar with identity + logout. */
export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const links = user ? LINKS[user.role] : [];

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-gray-900">Store Rating Platform</span>
          <nav className="flex gap-5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <span className="hidden text-gray-600 sm:inline">
              {user.name} · {formatRole(user.role)}
            </span>
          ) : null}
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
