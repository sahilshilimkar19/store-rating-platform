/**
 * Formats an ISO timestamp as a short relative phrase ("just now", "5 minutes
 * ago", "3 days ago"). Pure JS, no dependencies. Falls back to a localized date
 * for anything older than ~4 weeks.
 */
export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (Number.isNaN(seconds)) return '';
  if (seconds < 0) return 'just now';

  const units: [limit: number, secs: number, label: string][] = [
    [60, 1, 'second'],
    [3600, 60, 'minute'],
    [86400, 3600, 'hour'],
    [604800, 86400, 'day'],
    [2419200, 604800, 'week'],
  ];

  if (seconds < 10) return 'just now';

  for (const [limit, secs, label] of units) {
    if (seconds < limit) {
      const value = Math.floor(seconds / secs);
      return `${value} ${label}${value === 1 ? '' : 's'} ago`;
    }
  }

  return date.toLocaleDateString();
}

/** Full, human-readable timestamp for use in a tooltip / title attribute. */
export function formatAbsoluteTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}
