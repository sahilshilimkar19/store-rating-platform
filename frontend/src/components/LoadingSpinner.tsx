/** Centered SVG spinner for async states. */
export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-2 py-10"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        className="animate-spin text-indigo-600"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="56"
          className="animate-dash"
        />
      </svg>
      {label ? (
        <span className="text-sm text-gray-500">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}
