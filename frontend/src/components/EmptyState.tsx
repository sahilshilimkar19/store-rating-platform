import type { ReactNode } from 'react';

/**
 * Shown when a list/table has no data. Provide either a single `message`, or a
 * `title` + `subtitle` for a richer, more contextual empty state.
 */
export function EmptyState({
  message = 'No data found',
  title,
  subtitle,
  action,
}: {
  message?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <svg
        width="56"
        height="56"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="12"
          y="16"
          width="40"
          height="32"
          rx="4"
          stroke="#E5E7EB"
          strokeWidth="2.5"
        />
        <path
          d="M12 38h12l3 5h10l3-5h12"
          stroke="#6B7280"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M24 25h16M24 31h10"
          stroke="#E5E7EB"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {title ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {subtitle ? (
            <p className="text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{message}</p>
      )}
      {action}
    </div>
  );
}
