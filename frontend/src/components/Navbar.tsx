import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { formatRole } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

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
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setConfirmLogout(false);
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const links = user ? LINKS[user.role] : [];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center whitespace-nowrap px-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-indigo-600 shadow-[inset_0_-2px_0_#4F46E5]'
        : 'text-gray-500 hover:text-gray-900'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex h-full items-center gap-6">
          {/* Hamburger toggle (mobile only) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 sm:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="M5 5l14 14M19 5L5 19" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
          <span className="whitespace-nowrap font-semibold text-gray-900">
            Store Rating Platform
          </span>
          <nav
            aria-label="Primary"
            className="hidden h-full items-stretch gap-1 overflow-x-auto sm:flex"
          >
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
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
            onClick={() => setConfirmLogout(true)}
            className="h-8 whitespace-nowrap rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen ? (
        <nav
          aria-label="Primary mobile"
          className="border-t border-gray-200 bg-white px-4 py-2 sm:hidden"
        >
          {user ? (
            <p className="px-2 py-2 text-xs text-gray-500">
              {user.name} · {formatRole(user.role)}
            </p>
          ) : null}
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      ) : null}

      <ConfirmModal
        open={confirmLogout}
        title="Log out?"
        message="You'll need to sign in again to continue."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        onConfirm={handleLogout}
        onClose={() => setConfirmLogout(false)}
      />
    </header>
  );
}
