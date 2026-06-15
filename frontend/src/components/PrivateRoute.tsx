import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { dashboardPath } from '../utils/roles';

interface PrivateRouteProps {
  children: ReactNode;
  /** If provided, the user's role must be in this list to view the route. */
  allowedRoles?: Role[];
}

/**
 * Guards a route by authentication and (optionally) role:
 * - not logged in        -> /login
 * - logged in, wrong role -> their own dashboard
 */
export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
