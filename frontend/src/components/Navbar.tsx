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

/** Role-aware sticky top navigation with identity + logout. */
export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const links = user ? LINKS[user.role] : [];

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex h-full items-center gap-6">
          <span className="whitespace-nowrap font-semibold text-gray-900">
            Store Rating Platform
          </span>
          <nav
            aria-label="Primary"
            className="flex h-full items-stretch gap-1 overflow-x-auto"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `inline-flex items-center whitespace-nowrap px-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 shadow-[inset_0_-2px_0_#4F46E5]'
                      : 'text-gray-500 hover:text-gray-900'
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
            <span className="hidden whitespace-nowrap text-gray-500 sm:inline">
              {user.name} · {formatRole(user.role)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="h-8 whitespace-nowrap rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
