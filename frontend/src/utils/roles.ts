import type { Role } from '../types';

/** The landing route each role is sent to after login. */
export function dashboardPath(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'store_owner':
      return '/owner/dashboard';
    case 'normal':
    default:
      return '/stores';
  }
}
