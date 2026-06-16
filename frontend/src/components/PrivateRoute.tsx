import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { ForbiddenPage } from '../pages/ForbiddenPage';

interface PrivateRouteProps {
  children: ReactNode;
  /** If provided, the user's role must be in this list to view the route. */
  allowedRoles?: Role[];
}

/**
 * Guards a route by authentication and (optionally) role:
 * - not logged in        -> /login
 * - logged in, wrong role -> a 403 page (with a link back to their dashboard)
 */
export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
