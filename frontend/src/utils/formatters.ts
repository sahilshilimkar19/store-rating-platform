import type { Role } from '../types';

/** Human-readable label for a role enum value. */
export function formatRole(role: Role): string {
  switch (role) {
    case 'admin':
      return 'System Administrator';
    case 'store_owner':
      return 'Store Owner';
    case 'normal':
    default:
      return 'Normal User';
  }
}

/** Formats a rating value for display, or a fallback when there are none. */
export function formatRating(value: number | null | undefined): string {
  return value == null ? 'No ratings yet' : value.toFixed(1);
}

/** Formats an ISO timestamp / Date into a locale string. */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString();
}
